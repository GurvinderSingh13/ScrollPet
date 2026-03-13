import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
}

async function fetchUser(): Promise<AuthUser | null> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const meta = user.user_metadata || {};

  return {
    id: user.id,
    username: meta.username || meta.display_name || user.email || "",
    email: user.email || "",
    displayName: meta.display_name || meta.username || null,
  };
}

async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["supabase-auth-user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["supabase-auth-user"], null);
      window.location.href = "/login";
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
