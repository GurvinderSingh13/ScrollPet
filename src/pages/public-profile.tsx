import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostCard from "@/components/PostCard";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, PawPrint, FileText, Dog, Cat, Bird, Activity, Phone, Calendar, MessageCircle, User } from "lucide-react";

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();

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

  // Fetch their Posts (2-step manual fetch to avoid Foreign Key errors)
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

      const feedData = fetchedPosts.map((post: any) => ({
        ...post,
        users: authors.find(a => a.id === post.user_id) || null
      }));

      return feedData;
    },
    enabled: !!userId,
  });

  // Handlers for PostCard
  const handleRestrictedAction = (e: React.MouseEvent) => {
    if (!currentUser) {
      toast({ description: "Please log in to perform this action." });
      return false;
    }
    return true;
  };

  const handleEditClick = (post: any) => {
    // Only the post owner can edit their posts
  };

  const handleDeletePost = (postId: string) => {
    // Only the post owner can delete their posts
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

  const formatJoinedDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `Joined ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    } catch {
      return "Unknown";
    }
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
    <div className="min-h-screen pt-16 bg-[#f0f4f8] pb-20 font-sans">
      {/* Header */}
      <header className="fixed w-full top-0 z-[100] border-b border-gray-200 shadow-sm bg-white/90 backdrop-blur-md h-16 flex items-center px-4">
        <button 
          onClick={() => window.history.length > 1 ? window.history.back() : setLocation("/")} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Profile</h1>
      </header>

      {/* Hero Banner & Info */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="h-32 md:h-40 bg-gradient-to-r from-[#007699] to-[#FF6600]" />
        <div className="container mx-auto px-4 max-w-3xl relative flex flex-col items-center -mt-16 pb-6">
          <div className="h-28 w-28 md:h-32 md:w-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-xl mb-3">
            <img 
              src={user.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center">
            {user.display_name || user.username || "Guest User"}
          </h2>
          <p className="text-gray-500 text-sm">@{user.username || "username"}</p>
          
          <div className="flex flex-wrap items-center justify-center gap-3 mt-5 w-full px-4">
            <button
              onClick={handleMessage}
              className="flex-1 min-w-[140px] max-w-[200px] flex items-center justify-center gap-2 bg-[#007699] hover:bg-[#005a75] text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" /> Message
            </button>
            {user.phone && (
              <a
                href={`https://wa.me/${user.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] max-w-[200px] flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm"
              >
                <MessageCircle className="w-5 h-5" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Stats Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm py-5 md:py-4 mb-6">
        <div className="container mx-auto px-4 max-w-4xl grid grid-cols-2 gap-y-6 md:flex md:flex-row md:items-center md:justify-around md:gap-2 md:divide-x md:divide-gray-100">
          
          {/* Pet Count */}
          <div className="flex flex-col items-center justify-center w-full">
            <div className="flex items-center text-gray-500 mb-1">
              <PawPrint className="w-4 h-4 mr-1.5" /> <span className="text-xs uppercase font-bold tracking-wider">Pets</span>
            </div>
            <span className="font-semibold text-gray-900 text-center">{pets.length} {pets.length === 1 ? 'Pet' : 'Pets'}</span>
          </div>

          {/* Location */}
          <div className="flex flex-col items-center justify-center w-full">
            <div className="flex items-center text-gray-500 mb-1">
              <MapPin className="w-4 h-4 mr-1.5" /> <span className="text-xs uppercase font-bold tracking-wider">Location</span>
            </div>
            <span className="font-semibold text-gray-900 text-center truncate w-full px-2">
              {[user.city, user.state, user.country].filter(Boolean).join(", ") || "Unknown"}
            </span>
          </div>

          {/* Phone */}
          <div className="flex flex-col items-center justify-center w-full">
            <div className="flex items-center text-gray-500 mb-1">
              <Phone className="w-4 h-4 mr-1.5" /> <span className="text-xs uppercase font-bold tracking-wider">Phone</span>
            </div>
            <span className="font-semibold text-gray-900 text-center truncate w-full px-2">
              {user.phone || "Not provided"}
            </span>
          </div>

          {/* Joined Date */}
          <div className="flex flex-col items-center justify-center w-full">
            <div className="flex items-center text-gray-500 mb-1">
              <Calendar className="w-4 h-4 mr-1.5" /> <span className="text-xs uppercase font-bold tracking-wider">Joined</span>
            </div>
            <span className="font-semibold text-gray-900 text-center truncate w-full px-2">
              {user.created_at ? formatJoinedDate(user.created_at) : "Unknown"}
            </span>
          </div>

        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 space-y-8">
        
        {/* About Me Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <h3 className="font-extrabold text-xl mb-3 flex items-center gap-2 text-gray-900">
            <User className="w-5 h-5 text-[#007699]" /> About Me
          </h3>
          {user.bio ? (
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
          ) : (
            <p className="text-gray-500 italic text-sm">
              This user hasn't added a bio yet. They are busy taking care of their pets!
            </p>
          )}
        </div>

        {/* Pets Section */}
        <div>
          <h3 className="font-extrabold text-xl mb-4 flex items-center gap-2 text-gray-900">
            <PawPrint className="w-5 h-5 text-[#FF6600]" /> Registered Pets
            <span className="ml-2 text-xs font-bold uppercase text-gray-400 bg-gray-200 px-2.5 py-0.5 rounded-lg">
              {pets.length}
            </span>
          </h3>
          
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
                <div key={pet.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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

        {/* Posts Section */}
        <div>
          <h3 className="font-extrabold text-xl mb-4 flex items-center gap-2 text-gray-900">
            <FileText className="w-5 h-5 text-[#007699]" /> Recent Posts
            <span className="ml-2 text-xs font-bold uppercase text-gray-400 bg-gray-200 px-2.5 py-0.5 rounded-lg">
              {posts.length}
            </span>
          </h3>
          
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
                  isReadOnlyMode={false}
                  handleRestrictedAction={handleRestrictedAction}
                  handleEditClick={handleEditClick}
                  handleDeletePost={handleDeletePost}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}