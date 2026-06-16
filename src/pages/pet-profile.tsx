import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Pet } from "@shared/schema";
import { 
  Loader2, 
  ArrowLeft, 
  Grid3X3, 
  FileText,
  PlusCircle,
  Image as ImageIcon,
  Video as VideoIcon
} from "lucide-react";

import ProfileHeader from "@/components/profile/ProfileHeader";
import { PetMediaUploader } from "@/components/profile/PetMediaUploader";
import EditPetModal from "@/components/profile/EditPetModal";

export default function PetProfilePage() {
  const { petId } = useParams<{ petId: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isEditPetOpen, setIsEditPetOpen] = useState(false);
  
  // Media Viewer state
  const [selectedMedia, setSelectedMedia] = useState<{
    id: string;
    media_url: string;
    media_type: string;
    caption?: string | null;
  } | null>(null);

  const { data: pet, isLoading: isPetLoading } = useQuery({
    queryKey: ["pet", petId],
    queryFn: async () => {
      if (!petId) return null;
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("id", petId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!petId,
  });

  const { data: owner } = useQuery({
    queryKey: ["user", pet?.user_id],
    queryFn: async () => {
      if (!pet?.user_id) return null;
      const { data, error } = await supabase
        .from("users")
        .select("id, display_name, username")
        .eq("id", pet.user_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!pet?.user_id,
  });

  const { data: petMedia, isLoading: isPetMediaLoading, refetch: refetchGallery } = useQuery({
    queryKey: ["pet_media", petId],
    queryFn: async () => {
      if (!petId) return [];
      const { data, error } = await supabase
        .from("pet_media")
        .select("*")
        .eq("pet_id", petId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!petId,
  });


  const { data: followerCount, refetch: refetchFollowerCount } = useQuery({
    queryKey: ["pet_followers_count", petId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("pet_followers")
        .select("*", { count: "exact", head: true })
        .eq("pet_id", petId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!petId,
  });

  const { data: isFollowing, refetch: refetchIsFollowing } = useQuery({
    queryKey: ["pet_following", petId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from("pet_followers")
        .select("pet_id")
        .eq("pet_id", petId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user?.id && !!petId,
  });

  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async (currentlyFollowing: boolean) => {
      if (!isAuthenticated) throw new Error("Please log in to follow.");
      
      if (currentlyFollowing) {
        await supabase
          .from("pet_followers")
          .delete()
          .eq("pet_id", petId)
          .eq("user_id", user?.id);
      } else {
        await supabase
          .from("pet_followers")
          .insert({ pet_id: petId, user_id: user?.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet_following", petId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["pet_followers_count", petId] });
      refetchIsFollowing();
      refetchFollowerCount();
    },
    onError: (err: any) => {
      toast({ description: err.message || "Failed to update follow", variant: "destructive" });
    }
  });

  const handleToggleFollow = () => {
    if (!isAuthenticated) {
      toast({ description: "Please log in to follow." });
      return;
    }
    followMutation.mutate(!!isFollowing);
  };

  const handleMessageOwner = () => {
    if (!isAuthenticated) {
      toast({ description: "Please log in to message." });
      return;
    }
    if (owner?.id) {
      sessionStorage.setItem("teleport_dm_user_id", owner.id);
      sessionStorage.setItem("teleport_dm_user_name", owner.display_name || owner.username || "User");
      setLocation(`/chat/${owner.id}`);
    }
  };

  if (isPetLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="animate-spin h-10 w-10 border-4 border-[#007699] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f8] gap-4">
        <p className="text-gray-600 font-medium">Pet not found.</p>
        <Button onClick={() => setLocation("/")}>← Back to Home</Button>
      </div>
    );
  }

  const isOwner = user?.id === pet.user_id;

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-20 pt-0 md:pt-20 font-sans">
      <ProfileHeader 
        user={pet}
        ownerInfo={owner || undefined}
        stats={{
          followers: followerCount || 0,
        }}
        isOwnProfile={isOwner}
        isFollowing={isFollowing}
        onFollowToggle={handleToggleFollow}
        onMessage={handleMessageOwner}
        onEditClick={() => setIsEditPetOpen(true)}
        onPostMedia={() => setIsUploaderOpen(true)}
      />

      <div className="container mx-auto max-w-3xl px-4 mt-6 space-y-6">
        
        {/* Simple Bio Card for Pet */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 text-sm">
          <h3 className="font-semibold text-gray-900 mb-3 text-base">About {pet.name}</h3>
          <div className="grid grid-cols-2 gap-4">
            {pet.breed && (
              <div><span className="text-gray-500">Breed:</span> <span className="font-medium text-gray-900">{pet.breed}</span></div>
            )}
            {pet.type && (
              <div><span className="text-gray-500">Type:</span> <span className="font-medium text-gray-900 capitalize">{pet.type}</span></div>
            )}
            {pet.gender && (
              <div><span className="text-gray-500">Gender:</span> <span className="font-medium text-gray-900 capitalize">{pet.gender}</span></div>
            )}
            {pet.location && (
              <div><span className="text-gray-500">Location:</span> <span className="font-medium text-gray-900">{pet.location}</span></div>
            )}
          </div>
          
          {/* Render Pet Statuses if any are true */}
          {(pet.status_mating || pet.status_pups_sell || pet.status_pups_adoption || pet.status_for_sell || pet.status_for_adoption || pet.status_lost || pet.status_dead) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-gray-500 block mb-2 font-medium">Pet Status:</span>
              <div className="flex flex-wrap gap-2">
                {pet.status_mating && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-700 border border-pink-200">Available for Mating</span>}
                {pet.status_pups_sell && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">Pups for Sale</span>}
                {pet.status_pups_adoption && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">Pups for Adoption</span>}
                {pet.status_for_sell && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">For Sale</span>}
                {pet.status_for_adoption && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 border border-teal-200">For Adoption</span>}
                {pet.status_lost && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">Lost</span>}
                {pet.status_dead && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">Dead</span>}
              </div>
            </div>
          )}
        </div>
        
        
        <div className="pt-2">
          {isPetMediaLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin h-6 w-6 border-4 border-[#007699] border-t-transparent rounded-full" />
            </div>
          ) : !petMedia || petMedia.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-10 text-center px-4">
              <Grid3X3 className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-600 mb-4">Gallery is empty.</p>
              {isOwner && (
                <button 
                  onClick={() => setIsUploaderOpen(true)} 
                  className="rounded-xl px-5 py-2 text-sm bg-[#007699] text-white hover:bg-[#005a75] shadow-md transition-all cursor-pointer font-semibold"
                >
                  Post New Media
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 md:gap-2">
              {petMedia.map((media: any) => (
                <div 
                  key={media.id} 
                  className="relative aspect-square cursor-pointer group bg-gray-100"
                  onClick={() => setSelectedMedia(media)}
                >
                  {media.media_type === "video" ? (
                    <>
                      <video src={media.media_url} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white backdrop-blur-sm">
                        <VideoIcon className="w-4 h-4" />
                      </div>
                    </>
                  ) : (
                    <img src={media.media_url} className="w-full h-full object-cover" alt="Gallery item" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditPetModal
        isOpen={isEditPetOpen}
        onClose={() => setIsEditPetOpen(false)}
        pet={pet}
      />

      <PetMediaUploader 
        isOpen={isUploaderOpen} 
        onClose={() => setIsUploaderOpen(false)} 
        petId={petId} 
        onSuccess={refetchGallery}
      />

      {/* Media Viewer Modal */}
      <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none shadow-2xl h-[90vh] flex flex-col">
          <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
            {selectedMedia?.media_type === "video" ? (
              <video
                src={selectedMedia.media_url}
                className="max-h-full max-w-full object-contain"
                controls
                autoPlay
              />
            ) : selectedMedia?.media_url ? (
              <img
                src={selectedMedia.media_url}
                className="max-h-full max-w-full object-contain"
                alt="Selected media"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
