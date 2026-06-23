import { User, MessageCircle, UserPlus, Check, Menu, MapPin, Phone, Calendar, ArrowLeft, PawPrint } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseUTCDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface ProfileHeaderProps {
  user: any; // User or Pet
  ownerInfo?: { id: string; display_name: string; username: string };
  stats: {
    pets?: number; // Only for users
    posts?: number; // Only for pets
    followers: number;
    following?: number; // Optional for pets
  };
  isOwnProfile: boolean;
  isFollowing?: boolean;
  showBackButtonAlways?: boolean;
  onFollowToggle?: () => void;
  onEditClick?: () => void;
  onLogout?: () => void;
  onMessage?: () => void;
  onPostMedia?: () => void;
}

export default function ProfileHeader({
  user,
  ownerInfo,
  stats,
  isOwnProfile,
  isFollowing = false,
  showBackButtonAlways = false,
  onFollowToggle,
  onEditClick,
  onMessage,
  onPostMedia,
}: ProfileHeaderProps) {
  const [, setLocation] = useLocation();

  const formatJoinedDate = (dateStr: string) => {
    try {
      const date = parseUTCDate(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return "Unknown";
    }
  };

  const locationString = [user?.city, user?.state, user?.country].filter(Boolean).join(", ") || "Unknown";

  const handleShareProfile = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast({ description: "Profile URL copied to clipboard!" });
    } catch (err) {
      toast({ description: "Failed to copy URL", variant: "destructive" });
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      {/* ── DEDICATED HEADER ROW ── */}
      <div className="w-full px-4 py-3 flex justify-between items-center border-b border-gray-100">
        <div>
          {(!isOwnProfile || showBackButtonAlways) ? (
            <button 
              onClick={() => window.history.length > 1 ? window.history.back() : setLocation("/")}
              className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-10 h-10" />
          )}
        </div>

        <div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                <Menu className="w-6 h-6" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-4 rounded-xl shadow-lg border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Profile Details</h4>
              <div className="space-y-4">
                {ownerInfo && (
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-[#007699] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Owner</p>
                      <p 
                        className="text-sm font-medium text-[#007699] cursor-pointer hover:underline"
                        onClick={() => setLocation(`/profile/${ownerInfo.id}`)}
                      >
                        {ownerInfo.display_name || ownerInfo.username}
                      </p>
                    </div>
                  </div>
                )}
                {ownerInfo && user?.breed && (
                  <div className="flex items-start gap-3">
                    <PawPrint className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Breed</p>
                      <p className="text-sm font-medium text-gray-900">{user.breed}</p>
                    </div>
                  </div>
                )}
                {ownerInfo && user?.gender && (
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Gender</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{user.gender}</p>
                    </div>
                  </div>
                )}
                {ownerInfo && user?.dob && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Birthday</p>
                      <p className="text-sm font-medium text-gray-900">{user.dob}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Location</p>
                    <p className="text-sm font-medium text-gray-900">{locationString}</p>
                  </div>
                </div>
                {!ownerInfo && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{user?.phone || "Not provided"}</p>
                    </div>
                  </div>
                )}
                {!ownerInfo && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Joined</p>
                      <p className="text-sm font-medium text-gray-900">{user?.created_at ? formatJoinedDate(user.created_at) : "Unknown"}</p>
                    </div>
                  </div>
                )}
                {isOwnProfile && ownerInfo && (
                  <div className="flex flex-col gap-3 border-t border-gray-100 pt-3">
                    <button onClick={onEditClick} className="text-sm font-semibold text-[#007699] hover:underline cursor-pointer text-left">
                      Edit Pet Profile
                    </button>
                    <button onClick={handleShareProfile} className="text-sm font-semibold text-gray-700 hover:underline cursor-pointer text-left">
                      Share Profile
                    </button>
                  </div>
                )}
                {!isOwnProfile && (
                  <div className="flex flex-col gap-3 border-t border-gray-100 pt-3">
                    <button onClick={handleShareProfile} className="text-sm font-semibold text-gray-700 hover:underline cursor-pointer text-left">
                      Share Profile
                    </button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ── PROFILE DETAILS SECTION ── */}
      <div className="container mx-auto px-4 max-w-3xl pt-6 pb-6">
        {/* The Top Section Grid */}
        <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] md:grid-cols-[120px_1fr] gap-4 sm:gap-6 md:gap-8">
          {/* Left Column: Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
              {user?.profile_image_url || user?.avatar_url || user?.image_url ? (
                <img src={user.profile_image_url || user.avatar_url || user.image_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : user?.id ? (
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300" />
              )}
            </div>
          </div>

          {/* Right Column: Info & Actions */}
          <div className="flex flex-col gap-3 justify-center">
            {/* Row 1: Username/Handle & Display Name */}
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-2">
              {ownerInfo ? (
                <>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight leading-snug truncate">
                    {user?.name || "Pet"}
                  </h2>
                  <span className="text-sm sm:text-base font-medium text-gray-500 truncate">
                    @{user?.handle || "pet"}
                  </span>
                </>
              ) : (
                <>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight leading-snug truncate">
                    {user?.username ? `@${user.username}` : user?.handle ? `@${user.handle}` : "username"}
                  </h2>
                  <span className="text-sm sm:text-base font-medium text-gray-500 truncate">
                    {user?.display_name || user?.name || user?.username || "Guest User"}
                    {user?.breed && ` • ${user.breed}`}
                  </span>
                </>
              )}
            </div>

            {/* Owner Info Link (for Pet Profiles) */}
            {ownerInfo && (
              <div className="text-sm">
                <span className="text-gray-500">Owned by: </span>
                <span 
                  onClick={() => setLocation(`/profile/${ownerInfo.id}`)}
                  className="font-semibold text-[#007699] hover:underline cursor-pointer"
                >
                  {ownerInfo.display_name || ownerInfo.username}
                </span>
              </div>
            )}

            {/* Row 2: Horizontal Stats */}
            <div className="flex items-center gap-4 sm:gap-6 text-sm">
              {stats.pets !== undefined && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 cursor-pointer">
                  <span className="font-bold text-gray-900 text-sm sm:text-base">{stats.pets}</span>
                  <span className="text-gray-600 text-[13px] sm:text-sm">pets</span>
                </div>
              )}
              {stats.posts !== undefined && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 cursor-pointer">
                  <span className="font-bold text-gray-900 text-sm sm:text-base">{stats.posts}</span>
                  <span className="text-gray-600 text-[13px] sm:text-sm">posts</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 cursor-pointer">
                <span className="font-bold text-gray-900 text-sm sm:text-base">{stats.followers}</span>
                <span className="text-gray-600 text-[13px] sm:text-sm">followers</span>
              </div>
              {stats.following !== undefined && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 cursor-pointer">
                  <span className="font-bold text-gray-900 text-sm sm:text-base">{stats.following}</span>
                  <span className="text-gray-600 text-[13px] sm:text-sm">following</span>
                </div>
              )}
            </div>

            {/* Row 3: Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {isOwnProfile ? (
                <>
                  {!ownerInfo && (
                    <button onClick={onEditClick} className="flex-1 sm:flex-none px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-semibold rounded-lg transition-colors cursor-pointer">
                      Edit Profile
                    </button>
                  )}
                  <button onClick={handleShareProfile} className="flex-1 sm:flex-none px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-semibold rounded-lg transition-colors cursor-pointer">
                    Share
                  </button>
                  {ownerInfo && onPostMedia && (
                    <button onClick={onPostMedia} className="flex-1 sm:flex-none px-4 py-1.5 bg-[#007699] hover:bg-[#005a75] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">
                      Post
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={onFollowToggle}
                    className={`flex-1 sm:flex-none min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      isFollowing 
                        ? "bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200" 
                        : "bg-[#007699] text-white hover:bg-[#005a75]"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-4 h-4 shrink-0" /> Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 shrink-0" /> Follow
                      </>
                    )}
                  </button>
                  <button onClick={onMessage} className="flex-1 sm:flex-none min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-900 text-sm font-semibold hover:bg-gray-200 transition-all cursor-pointer">
                    <MessageCircle className="w-4 h-4 shrink-0" /> Message
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* The Bottom Bio Section */}
        <div className="mt-5 sm:mt-6 w-full">
          {user?.bio ? (
            <p className="text-sm sm:text-base text-gray-900 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
          ) : (
            <p className="text-sm text-gray-500 italic">This user hasn't added a bio yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
