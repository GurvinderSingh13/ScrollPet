import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Country, State } from "country-state-city";

export default function GlobalLocationDetector() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch only necessary profile fields to check for missing location
  const { data: dbUser } = useQuery({
    queryKey: ["global-user-location-check", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("users")
        .select("country, state")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching user profile for location check:", error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id && isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    // Only proceed if authenticated and we have the profile data, and country is missing
    if (!isAuthenticated || !user?.id || !dbUser) return;

    if (!dbUser.country || dbUser.country.trim() === "") {
      const detectAndSaveLocation = async () => {
        try {
          console.log("GlobalLocationDetector: Missing location detected. Attempting auto-detection...");
          
          const res = await fetch("https://ipapi.co/json/");
          if (!res.ok) throw new Error("Failed to fetch location from IP");
          
          const data = await res.json();
          const detectedCountryName = data.country_name;
          const detectedRegion = data.region; // This is often the state name/label

          if (!detectedCountryName) {
            console.warn("GlobalLocationDetector: IP API returned no country name.");
            return;
          }

          // Map to country-state-city library to get standardized names/codes
          const allCountries = Country.getAllCountries();
          const matchedCountry = allCountries.find(
            (c) => c.name.toLowerCase() === detectedCountryName.toLowerCase()
          );

          if (!matchedCountry) {
            console.warn(`GlobalLocationDetector: Could not map detected country "${detectedCountryName}" to library.`);
            return;
          }

          let matchedStateName = "";
          if (detectedRegion) {
            const statesOfCountry = State.getStatesOfCountry(matchedCountry.isoCode);
            const matchedState = statesOfCountry.find(
              (s) => s.name.toLowerCase() === detectedRegion.toLowerCase() || 
                     s.isoCode.toLowerCase() === detectedRegion.toLowerCase()
            );
            if (matchedState) {
              matchedStateName = matchedState.name;
            }
          }

          console.log(`GlobalLocationDetector: Detected ${matchedCountry.name}, ${matchedStateName || "Unknown State"}. Updating profile...`);

          // Update Supabase directly
          const { error: updateError } = await supabase
            .from("users")
            .update({
              country: matchedCountry.name,
              state: matchedStateName,
            })
            .eq("id", user.id);

          if (updateError) throw updateError;

          console.log("GlobalLocationDetector: Profile updated successfully.");

          // Invalidate queries so the UI (like ChatInterface) refreshes immediately
          queryClient.invalidateQueries({ queryKey: ["global-user-location-check", user.id] });
          queryClient.invalidateQueries({ queryKey: ["db-user-chat", user.id] });
          queryClient.invalidateQueries({ queryKey: ["db-user", user.id] });
          queryClient.invalidateQueries({ queryKey: ["user-profile"] });

          
        } catch (err) {
          console.error("GlobalLocationDetector: Auto-detect/Update failed:", err);
        }
      };

      detectAndSaveLocation();
    }
  }, [isAuthenticated, dbUser, user?.id, queryClient]);

  return null; // This component doesn't render any UI
}
