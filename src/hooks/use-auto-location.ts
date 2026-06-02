import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { AuthUser } from "./use-auth";

export function useAutoLocation(currentUser: AuthUser | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    async function fetchAndSetLocation() {
      if (!currentUser || currentUser.country) {
        return; // User not logged in, or country is already set
      }

      try {
        const response = await fetch("https://get.geojs.io/v1/ip/geo.json");
        if (!response.ok) {
          throw new Error("Failed to fetch location from geojs");
        }
        
        const data = await response.json();
        const countryName = data.country;

        if (countryName) {
          const { error } = await supabase
            .from("users")
            .update({ country: countryName })
            .eq("id", currentUser.id);

          if (error) {
            console.error("useAutoLocation: Error updating user country in Supabase", error);
            return;
          }

          // Force state refresh so UI updates with new country
          queryClient.invalidateQueries({ queryKey: ["supabase-auth-user"] });
        }
      } catch (error) {
        console.error("useAutoLocation: Error during geo location fetch", error);
      }
    }

    fetchAndSetLocation();
  }, [currentUser, queryClient]);
}
