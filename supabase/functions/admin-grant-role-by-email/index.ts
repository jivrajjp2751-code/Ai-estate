import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Role = "admin" | "editor" | "viewer";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing backend env vars", {
        hasUrl: Boolean(SUPABASE_URL),
        hasAnon: Boolean(SUPABASE_ANON_KEY),
        hasService: Boolean(SUPABASE_SERVICE_ROLE_KEY),
      });
      return jsonResponse({ error: "Service configuration error" }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: userData, error: userError } = await authedClient.auth.getUser();
    if (userError || !userData.user) {
      console.error("auth.getUser failed", userError);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: isAdmin, error: roleCheckError } = await authedClient.rpc(
      "has_profile_role",
      {
        _user_id: userData.user.id,
        _role: "admin",
      }
    );

    if (roleCheckError) {
      console.error("role check failed", roleCheckError);
      return jsonResponse({ error: "Failed to validate permissions" }, 500);
    }

    if (!isAdmin) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "")
      .trim()
      .toLowerCase();
    const role = String(body?.role ?? "").trim() as Role;

    if (!email || !email.includes("@")) {
      return jsonResponse({ error: "A valid email is required" }, 400);
    }

    if (!(["admin", "editor", "viewer"] as const).includes(role)) {
      return jsonResponse({ error: "Invalid role" }, 400);
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Prefer resolving via profiles table first (fast path)
    const { data: profileByEmail, error: profileLookupError } = await serviceClient
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (profileLookupError) {
      console.error("profile lookup failed", profileLookupError);
      return jsonResponse({ error: "Failed to lookup user" }, 500);
    }

    let targetUserId: string | null = profileByEmail?.user_id ?? null;

    // Fallback: resolve via Auth users list
    if (!targetUserId) {
      const { data: usersData, error: usersError } = await serviceClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (usersError) {
        console.error("listUsers failed", usersError);
        return jsonResponse({ error: "Failed to lookup user" }, 500);
      }

      const found = usersData.users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (!found) {
        return jsonResponse({ error: "User not found. Ask them to sign up (or sign in once) first." }, 404);
      }

      targetUserId = found.id;
    }

    const { data: updatedProfile, error: upsertError } = await serviceClient
      .from("profiles")
      .upsert(
        {
          user_id: targetUserId,
          email,
          role,
        },
        { onConflict: "user_id" }
      )
      .select("*")
      .single();

    if (upsertError) {
      console.error("profiles upsert failed", upsertError);
      return jsonResponse({ error: "Failed to update role" }, 500);
    }

    console.log("Role granted", { email, role, targetUserId });
    return jsonResponse({ profile: updatedProfile });
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    return jsonResponse({ error: "An unexpected error occurred" }, 500);
  }
});
