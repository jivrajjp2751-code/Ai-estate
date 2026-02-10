import { useState, useEffect } from "react";

interface User {
  id: string;
  email?: string;
  role?: string;
}

type UserRole = "admin" | "editor" | "viewer" | null;

export const useUserRole = (user: User | null) => {
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    // The user object from our MongoDB auth already contains the role
    // No need for a separate API call
    if (user.role) {
      setRole(user.role as UserRole);
    } else {
      // Fallback: try to get role from stored user data
      try {
        const userStr = localStorage.getItem('ai_estate_mongo_user');
        if (userStr) {
          const stored = JSON.parse(userStr);
          setRole((stored.role as UserRole) || null);
        } else {
          setRole(null);
        }
      } catch {
        setRole(null);
      }
    }
    setIsLoading(false);
  }, [user]);

  const isAdminOrEditor = role === "admin" || role === "editor";

  return { role, isLoading, isAdminOrEditor };
};
