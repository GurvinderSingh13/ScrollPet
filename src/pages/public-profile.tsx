import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostCard from "@/components/PostCard";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { PawPrint, FileText, Dog, Cat, Bird } from "lucide-react";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileBioCard from "@/components/profile/ProfileBioCard";
import ProfileTabs from "@/components/profile/ProfileTabs";

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"posts" | "pets" | "gallery">("posts");

  // Fetch User Profile
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch their Pets
  const { data: pets = [], isLoading: loadingPets } = useQuery({
    queryKey: ["user_pets", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch their Posts
  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ["user_posts", userId],
    queryFn: async () => {
      const { data: fetchedPosts, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      if (!fetchedPosts || fetchedPosts.length === 0) return [];

      const userIds = Array.from(new Set(fetchedPosts.map((p: any) => p.user_id).filter(Boolean)));
      let authors: any[] = [];
      
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, username, display_name, profile_image_url")
          .in("id", userIds);
          
        if (usersError) {
          console.error("Supabase Feed Fetch Users Error:", usersError);
        } else if (usersData) {
          authors = usersData;
        }
      }

      return fetchedPosts.map((post: any) => ({
        ...post,
        users: authors.find(a => a.id === post.user_id) || null
      }));
    },
    enabled: !!userId,
  });

  // Fetch Followers & Following
  const { data: followersData } = useQuery({
    queryKey: ["followers", userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("followers")
        .select("*", { count: 'exact', head: true })
        .eq("following_id", userId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });

  const { data: followingData } = useQuery({
    queryKey: ["following", userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("followers")
        .select("*", { count: 'exact', head: true })
        .eq("follower_id", userId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });

  // Check if following
  const { data: isFollowing } = useQuery({
    queryKey: ["is_following", userId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return false;
      const { count, error } = await supabase
        .from("followers")
        .select("*", { count: 'exact', head: true })
        .eq("follower_id", currentUser.id)
        .eq("following_id", userId);
      if (error) throw error;
      return count ? count > 0 : false;
    },
    enabled: !!userId && !!currentUser,
  });

  // Follow/Unfollow Mutation
  const followMutation = useMutation({
    mutationFn: async (currentlyFollowing: boolean) => {
      if (!currentUser) throw new Error("Must be logged in to follow");
      
      if (currentlyFollowing) {
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("followers")
          .insert({ follower_id: currentUser.id, following_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
      queryClient.invalidateQueries({ queryKey: ["is_following", userId, currentUser?.id] });
    },
    onError: (error: any) => {
      toast({ description: error.message || "Failed to toggle follow status.", variant: "destructive" });
    }
  });

  const handleFollowToggle = () => {
    if (!currentUser) {
      toast({ description: "Please log in to follow users." });
      return;
    }
    followMutation.mutate(!!isFollowing);
  };

  const handleRestrictedAction = (e: React.MouseEvent) => {
    if (!currentUser) {
      toast({ description: "Please log in to perform this action." });
      return false;
    }
    return true;
  };

  const handleMessage = () => {
    if (!currentUser) {
      toast({ description: "Please log in to send a message." });
      setLocation('/login');
      return;
    }
    sessionStorage.setItem("teleport_dm_user_id", user.id);
    sessionStorage.setItem("teleport_dm_user_name", user.display_name || user.username || "User");
    setLocation('/chat-interface');
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="animate-spin h-10 w-10 border-4 border-[#007699] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f8] p-4 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">404</h1>
        <p className="text-lg font-semibold text-gray-700 mb-6">User not found</p>
        <Link href="/">
          <button className="bg-[#007699] text-white px-6 py-2.5 rounded-xl font-semibold shadow-md hover:bg-[#005a75] transition-all cursor-pointer">
            Return Home
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-0 md:pt-20 bg-[#f0f4f8] pb-20 font-sans">
      <ProfileHeader 
        user={user}
        stats={{
          pets: pets.length,
          followers: followersData || 0,
          following: followingData || 0
        }}
        isOwnProfile={false}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
        onMessage={handleMessage}
      />

      <div className="container mx-auto max-w-3xl px-4 mt-6 space-y-6">
        <ProfileBioCard user={user} />
        
        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="pt-2">
          {activeTab === "posts" ? (
            <div>
              {loadingPosts ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin h-6 w-6 border-4 border-[#007699] border-t-transparent rounded-full" />
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-10 text-center px-4">
                  <FileText className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-sm font-semibold text-gray-600">No posts shared yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post: any) => (
                    <PostCard 
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      isReadOnlyMode={true}
                      handleRestrictedAction={handleRestrictedAction}
                      handleEditClick={() => {}}
                      handleDeletePost={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {loadingPets ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin h-6 w-6 border-4 border-[#007699] border-t-transparent rounded-full" />
                </div>
              ) : pets.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-10 text-center px-4">
                  <PawPrint className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-sm font-semibold text-gray-600">No pets registered yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                  {pets.map((pet: any) => (
                    <div key={pet.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`/pet/${pet.id}`)}>
                      <div className="h-28 relative overflow-hidden bg-gradient-to-br from-blue-50 to-orange-50">
                        {pet.image_url ? (
                          <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {pet.type === "dog" ? <Dog className="h-10 w-10 text-gray-300" /> :
                             pet.type === "cat" ? <Cat className="h-10 w-10 text-gray-300" /> :
                             pet.type === "bird" ? <Bird className="h-10 w-10 text-gray-300" /> :
                             <PawPrint className="h-10 w-10 text-gray-300" />}
                          </div>
                        )}
                      </div>
                      <div className="p-3 text-center">
                        <p className="font-bold text-gray-900 truncate leading-tight">{pet.name}</p>
                        <p className="text-xs text-gray-500 capitalize truncate mt-0.5">{pet.type} {pet.breed ? `• ${pet.breed}` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}