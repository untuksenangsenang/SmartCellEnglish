"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useNetworkStatus } from "./useNetworkStatus";

export interface UserProfile {
  id: string;
  email: string;
  role?: string;
  name?: string;
}

const CACHE_KEY = "cached_user_profile";

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isOnline = useNetworkStatus();
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const fetchAuth = async () => {
      try {
        if (!isOnline) {
          // Jika offline, baca dari localStorage
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached && isMounted) {
            setUser(JSON.parse(cached));
            setLoading(false);
          } else if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // Jika online, ambil dari Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          if (isMounted) {
            setUser(null);
            setLoading(false);
            localStorage.removeItem(CACHE_KEY);
          }
          return;
        }

        const authUser = session.user;

        // Ambil profil tambahan dari public.profiles jika ada
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, name")
          .eq("id", authUser.id)
          .single();

        const userProfile: UserProfile = {
          id: authUser.id,
          email: authUser.email || "",
          role: profile?.role,
          name: profile?.name,
        };

        if (isMounted) {
          setUser(userProfile);
          setLoading(false);
          // Simpan ke localStorage untuk fallback offline
          localStorage.setItem(CACHE_KEY, JSON.stringify(userProfile));
        }

      } catch (error) {
        console.error("useAuth error:", error);
        // Fallback jika fetch error
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached && isMounted) {
          setUser(JSON.parse(cached));
        }
        if (isMounted) setLoading(false);
      }
    };

    fetchAuth();

    // Listener realtime auth (hanya berfungsi baik saat online)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user && isOnline) {
        fetchAuth(); // Re-fetch profile to update cache
      } else if (!session) {
        setUser(null);
        localStorage.removeItem(CACHE_KEY);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, isOnline]);

  return { user, loading };
}
