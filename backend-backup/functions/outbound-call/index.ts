// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Language configurations
const languageConfig = {
  english: {
    greeting: "Hello",
    name: "",
    firstMessageTemplate: (clientName: string) => {
      // Simplified opening: Ask for verification first
      return `Hello, am I speaking with ${clientName}?`;
    },
    promptTemplate: (clientName: string, preferredArea: string | null, budget: string | null) => `
You are Purva, a senior property consultant at AI Real Estate. You are an **Indian woman** making an outbound call.

## CRITICAL INSTRUCTIONS (MUST FOLLOW)
- **SLOW & STEADY**: Speak SLOWLY and CALMLY. Do not rush.
- **LISTEN FIRST**: You must listen to the client. Do not interrupt.
- **SHORT RESPONSES**: Keep your responses SHORT (max 1-2 sentences). Do not give long monologues.
- **WAIT FOR ANSWERS**: Ask ONE question and WAIT.
- **Accent & Style**: Speak in **Indian English**. Use phrases like "Actually", "Basically", "I will surely help you", "Do the needful" contextually if needed, but keep it professional.
- **Politeness**: Use "Ji" even in English (e.g., "${clientName} Ji"). It shows respect.
- **Gender**: You are female. Use a soft, professional, feminine tone.
- **Goal**: Verify if you are talking to the correct person. If yes, introduce yourself and the company. Then discuss property requirements and schedule a visit.

## YOUR IDENTITY
- Name: Purva
- Gender: Female
- Company: AI Real Estate
- Role: Senior Property Consultant
- Style: Warm, helpful, polite Indian professional.

## CLIENT INFORMATION
- Client Name: ${clientName}
- Preferred Location: ${preferredArea || "To be discussed"}
- Budget Range: ${budget || "Flexible"}

## CONVERSATION FLOW

### 1. Verification (First Step)
You start by asking: "Hello, am I speaking with ${clientName}?"

**If they say YES:**
"Great. ${clientName} Ji, this is Purva calling from **AI Real Estate**."
"You recently visited our website **AIRealEstate.com** and showed interest in a property."
"I noticed you were looking for a property in ${preferredArea || "our area"}. Is this a good time to discuss?"

**If they say NO / WRONG NUMBER:**
"Oh, I apologize for the mistake. Have a great day." (End call)

### 2. Understanding Requirements
- "Right, I understand you are looking for a property in ${preferredArea || "prime locations"}."
- "What sort of budget do you have in mind? Flexible?"
- Mention locations: Mumbai, Pune, Nashik, Nagpur, Lonavala, Alibaug, Panchgani.

### 3. SCHEDULING VISIT (MAIN GOAL)
- "See ${clientName} Ji, I would strongly suggest a site visit. Seeing is believing, right?"
- "When are you usually free? Weekends work best for you?"
- "How about this Saturday morning? I can arrange the visit for you."

### 4. WHEN APPOINTMENT IS CONFIRMED
**Call the 'schedule_appointment' function immediately.**

### 5. Closing
"Thank you so much ${clientName} Ji. I have confirmed your appointment. I will send the details."
"Have a great day ahead!"

### Handling Objectives
- **Busy**: "No issue at all. When should I call you back? Evening time?"
- **Not Interested**: "I understand. If you change your mind, we are always here for you. Have a nice day."

Remember: Sound like a polite Indian lady. Warm and welcoming.
    `,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPI_API_KEY = Deno.env.get("VAPI_API_KEY");
    const VAPI_PHONE_NUMBER_ID = Deno.env.get("VAPI_PHONE_NUMBER_ID");
    const VAPI_ASSISTANT_ID = Deno.env.get("VAPI_ASSISTANT_ID");

    if (!VAPI_API_KEY || !VAPI_PHONE_NUMBER_ID || !VAPI_ASSISTANT_ID) {
      console.error("Missing VAPI configuration");
      return new Response(
        JSON.stringify({ error: "VAPI configuration is incomplete" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Always default to English
    const { inquiryId, phoneNumber, customerName, preferredArea, budget } = await req.json();
    const language = "english";

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number for international calling
    let formattedPhone = phoneNumber.replace(/\s+/g, "").replace(/-/g, "");
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+91" + formattedPhone.replace(/^0+/, "");
    }

    const clientName = customerName || "Sir/Madam";

    // Get language-specific configuration
    const langConfig = languageConfig.english;
    const firstMessage = langConfig.firstMessageTemplate(clientName);
    const agentPrompt = langConfig.promptTemplate(clientName, preferredArea, budget);

    console.log(`Initiating VAPI outbound call to ${formattedPhone} (English Only)`);

    // VAPI Outbound Call API with Indian female voice
    const response = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumberId: VAPI_PHONE_NUMBER_ID,
        customer: {
          number: formattedPhone,
          name: clientName,
        },
        assistantId: VAPI_ASSISTANT_ID,
        assistantOverrides: {
          firstMessage: firstMessage,
          // Aggressive interruption - Stop IMMEDIATELY
          // Reduced sensitivity to background noise
          stopSpeakingPlan: {
            numWords: 0,
            voiceSeconds: 0.5, // Increased from 0.1 to 0.5 to prevent self-interruption
            backoffSeconds: 1,
          },
          model: {
            provider: "openai",
            model: "gpt-4o-mini", // Faster model for lower latency
            messages: [
              {
                role: "system",
                content: agentPrompt,
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "schedule_appointment",
                  description: "Schedule a property site visit appointment with the customer",
                  parameters: {
                    type: "object",
                    properties: {
                      customerName: {
                        type: "string",
                        description: "Customer's name",
                      },
                      date: {
                        type: "string",
                        description: "Appointment date in YYYY-MM-DD format (e.g., '2024-01-20')",
                      },
                      time: {
                        type: "string",
                        description: "Appointment time (e.g., '10:00 AM')",
                      },
                      location: {
                        type: "string",
                        description: "Property location for the visit",
                      },
                      notes: {
                        type: "string",
                        description: "Any additional notes from the conversation",
                      },
                    },
                    required: ["date", "time"],
                  },
                },
              },
            ],
          },
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en",
            smartFormat: true,
            endpointing: 500, // Increased from 200 to 500 to allow natural pauses
          },
          voice: {
            provider: "11labs",
            // "Aaliyah" - professional Indian female voice
            voiceId: "aUTn6mevnrM9pqtesisb",
            model: "eleven_multilingual_v2",
            stability: 0.8, // Stable, steady tone
            similarityBoost: 0.5,
          },
          metadata: {
            inquiryId: inquiryId,
            customerName: clientName,
            preferredArea: preferredArea || "Not specified",
            budget: budget || "Not specified",
            language: language,
          },
        },
      }),
    });

    const responseText = await response.text();
    console.log("VAPI response:", response.status, responseText);

    if (!response.ok) {
      console.error("VAPI API error:", response.status, responseText);
      return new Response(
        JSON.stringify({
          error: "Failed to initiate call",
          details: responseText,
          status: response.status
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Call initiated successfully",
        callId: data.id,
        language: language,
        data
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in outbound-call function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
