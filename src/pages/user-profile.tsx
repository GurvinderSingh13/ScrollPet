import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { PlusCircle, PawPrint, FileText, Dog, Cat, Bird } from "lucide-react";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileBioCard from "@/components/profile/ProfileBioCard";
import ProfileTabs from "@/components/profile/ProfileTabs";
import EditProfileModal from "@/components/profile/EditProfileModal";
import ProfileForm from "@/components/Profile";
import PostCard from "@/components/PostCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function UserProfile() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"posts" | "pets" | "gallery">("posts");
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);

  const { data: dbUser, isLoading: loadingUser } = useQuery({
    queryKey: ["db-user", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: pets = [], isLoading: loadingPets } = useQuery({
    queryKey: ["pets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ["user_posts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: fetchedPosts, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
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
    enabled: !!user?.id,
  });

  const { data: followersData } = useQuery({
    queryKey: ["followers", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("followers")
        .select("*", { count: 'exact', head: true })
        .eq("following_id", user.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const { data: followingData } = useQuery({
    queryKey: ["following", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("followers")
        .select("*", { count: 'exact', head: true })
        .eq("follower_id", user.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const handleRestrictedAction = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      toast({ description: "Please log in to perform this action." });
      return false;
    }
    return true;
  };

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  if (loadingUser && !dbUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="animate-spin h-10 w-10 border-4 border-[#007699] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!dbUser && !loadingUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f8] p-4 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">404</h1>
        <p className="text-lg font-semibold text-gray-700 mb-6">User not found</p>
        <button onClick={() => setLocation("/")} className="bg-[#007699] text-white px-6 py-2.5 rounded-xl font-semibold shadow-md hover:bg-[#005a75] transition-all cursor-pointer">
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-20 pt-0 md:pt-20 font-sans">
      <ProfileHeader 
        user={dbUser}
        stats={{
          pets: pets.length,
          followers: followersData || 0,
          following: followingData || 0
        }}
        isOwnProfile={true}
        onEditClick={() => setIsEditProfileModalOpen(true)}
        onLogout={handleLogout}
      />

      <div className="container mx-auto max-w-3xl px-4 mt-6 space-y-6">
        <ProfileBioCard user={dbUser} />
        
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
                      currentUser={user}
                      isReadOnlyMode={false}
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
              <div className="flex justify-end mb-4">
                <button onClick={() => setIsAddPetModalOpen(true)} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm bg-[#007699] text-white hover:bg-[#005a75] shadow-md transition-all cursor-pointer font-semibold">
                  <PlusCircle className="h-4 w-4" /> Add Pet
                </button>
              </div>

              {loadingPets ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin h-6 w-6 border-4 border-[#007699] border-t-transparent rounded-full" />
                </div>
              ) : pets.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-10 text-center px-4">
                  <PawPrint className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-sm font-semibold text-gray-600 mb-4">No pets registered yet.</p>
                  <button onClick={() => setIsAddPetModalOpen(true)} className="rounded-xl px-5 py-2 text-sm bg-[#007699] text-white hover:bg-[#005a75] shadow-md transition-all cursor-pointer font-semibold">
                    Register a Pet
                  </button>
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

      <Dialog open={isAddPetModalOpen} onOpenChange={setIsAddPetModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-transparent border-none shadow-none">
          <ProfileForm onClose={() => setIsAddPetModalOpen(false)} />
        </DialogContent>
      </Dialog>

      <EditProfileModal 
        isOpen={isEditProfileModalOpen} 
        onClose={() => setIsEditProfileModalOpen(false)}
        user={user}
        dbUser={dbUser}
        onLogout={handleLogout}
      />
    </div>
  );
}
