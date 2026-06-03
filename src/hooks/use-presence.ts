import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { safeLocalStorage } from "@/lib/safe-storage";

export function usePresence() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      const now = Date.now();
      const lastUpdate = safeLocalStorage.getItem("last_presence_update");
      
      // Throttle to 5 minutes (300,000 ms)
      if (lastUpdate && now - parseInt(lastUpdate, 10) < 300000) {
        return;
      }

      try {
        const { error } = await supabase
          .from("users")
          .update({ last_seen: new Date().toISOString() })
          .eq("id", user.id);

        if (!error) {
          safeLocalStorage.setItem("last_presence_update", now.toString());
        }
      } catch (error) {
        console.error("Failed to update presence:", error);
      }
    };

    updatePresence();
  }, [user]);
}
