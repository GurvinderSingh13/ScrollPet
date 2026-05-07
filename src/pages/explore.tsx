import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Menu,
  X,
  LogOut,
  Grid3X3,
  Loader2,
  Heart,
  Send,
  Compass,
  ChevronDown,
  Dog,
  Cat,
  Bird,
  Activity,
  Tag,
} from "lucide-react";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

type MediaItem = {
  id: string;
  pet_id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  intent_status?: string | null;
  pets: {
    id: string;
    name: string;
    image_url: string | null;
    user_id?: string | null;
  } | null;
};

const INTENT_OPTIONS = [
  "For Adoption",
  "For Sale",
  "His/Her pups for Adoption",
  "His/Her pups for Sale",
  "Available for Mating",
  "Open for Exchange",
  "Lost",
  "Dead",
];

const INTENT_BADGE_COLORS: Record<string, string> = {
  "For Adoption": "bg-green-100 text-green-700 border-green-200",
  "For Sale": "bg-blue-100 text-blue-700 border-blue-200",
  "His/Her pups for Adoption": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "His/Her pups for Sale": "bg-sky-100 text-sky-700 border-sky-200",
  "Available for Mating": "bg-pink-100 text-pink-700 border-pink-200",
  "Open for Exchange": "bg-orange-100 text-orange-700 border-orange-200",
  "Lost": "bg-amber-100 text-amber-700 border-amber-200",
  "Dead": "bg-gray-100 text-gray-600 border-gray-200",
};

const VIEW_OPTIONS = [
  { value: "feed",                label: "Global Feed" },
  { value: "status_for_adoption", label: "For Adoption" },
  { value: "status_for_sell",     label: "For Sale" },
  { value: "status_pups_adoption",label: "Pups for Adoption" },
  { value: "status_pups_sell",    label: "Pups for Sale" },
  { value: "status_mating",       label: "Available for Mating" },
  { value: "status_exchange",     label: "Open for Exchange" },
] as const;

type ViewValue = typeof VIEW_OPTIONS[number]["value"];

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat Rooms" },
  { href: "/explore", label: "Explore" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function ExplorePage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [currentPath] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewValue>("feed");

  // ── media feed state ──
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [localIntentStatus, setLocalIntentStatus] = useState<string>("");
  const [commentText, setCommentText] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [localComments, setLocalComments] = useState<
    { id: string; media_id: string; user_id: string; content: string; created_at: string }[]
  >([]);

  // close lightbox when switching views
  useEffect(() => {
    setSelectedMedia(null);
  }, [activeView]);

  useEffect(() => {
    setLocalComments([]);
    setCommentText("");
    setLocalIntentStatus(selectedMedia?.intent_status || "");
  }, [selectedMedia?.id]);

  const handleAuthClick = () => {
    if (isAuthenticated) {
      logout();
      window.location.href = "/";
    } else {
      window.location.href = "/login";
    }
  };

  // ── MEDIA FEED query ──
  const { data: allMedia, isLoading: isMediaLoading } = useQuery({
    queryKey: ["explore_media"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_media")
        .select("*, pets(id, name, image_url, user_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MediaItem[];
    },
    enabled: activeView === "feed",
  });

  // ── PET DIRECTORY query ──
  const { data: filteredPets, isLoading: isPetsLoading } = useQuery({
    queryKey: ["explore_pets", activeView],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("pets")
        .select("*")
        .eq(activeView, true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: activeView !== "feed",
  });

  // ── lightbox queries ──
  const { data: mediaLikes, refetch: refetchLikes } = useQuery({
    queryKey: ["media_likes", selectedMedia?.id],
    queryFn: async () => {
      if (!selectedMedia?.id) return [];
      const { data, error } = await supabase
        .from("media_likes")
        .select("*")
        .eq("media_id", selectedMedia.id);
      if (error) throw error;
      return data as { id: string; media_id: string; user_id: string }[];
    },
    enabled: !!selectedMedia?.id,
  });

  const { data: mediaComments, refetch: refetchComments } = useQuery({
    queryKey: ["media_comments", selectedMedia?.id],
    queryFn: async () => {
      if (!selectedMedia?.id) return [];
      const { data, error } = await supabase
        .from("media_comments")
        .select("*")
        .eq("media_id", selectedMedia.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as { id: string; media_id: string; user_id: string; content: string; created_at: string }[];
    },
    enabled: !!selectedMedia?.id,
  });

  const userHasLiked = !!user?.id && (mediaLikes ?? []).some((l) => l.user_id === user.id);
  const likeCount = (mediaLikes ?? []).length;

  const handleUpdateIntentStatus = async (status: string) => {
    if (!selectedMedia?.id) return;
    const newStatus = status === "" ? null : status;
    const { error } = await supabase
      .from("pet_media")
      .update({ intent_status: newStatus })
      .eq("id", selectedMedia.id);
    if (error) {
      toast({ description: "Failed to update status.", variant: "destructive" });
      return;
    }
    setLocalIntentStatus(status);
    setSelectedMedia((prev) => prev ? { ...prev, intent_status: newStatus } : prev);
  };

  const handleToggleLike = async () => {
    if (!user?.id || !selectedMedia?.id) return;
    if (userHasLiked) {
      await supabase.from("media_likes").delete().eq("media_id", selectedMedia.id).eq("user_id", user.id);
    } else {
      await supabase.from("media_likes").insert({ media_id: selectedMedia.id, user_id: user.id });
    }
    refetchLikes();
  };

  const handlePostComment = async () => {
    if (!user?.id || !selectedMedia?.id || !commentText.trim()) return;
    const trimmed = commentText.trim();
    setCommentText("");
    setIsPostingComment(true);
    const optimistic = {
      id: `temp-${Date.now()}`,
      media_id: selectedMedia.id,
      user_id: user.id,
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setLocalComments((prev) => [...prev, optimistic]);
    try {
      const { error } = await supabase
        .from("media_comments")
        .insert({ media_id: selectedMedia.id, user_id: user.id, content: trimmed });
      if (error) throw error;
      refetchComments();
    } catch (err: any) {
      setLocalComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setCommentText(trimmed);
      toast({ description: err.message || "Failed to post comment", variant: "destructive" });
    } finally {
      setIsPostingComment(false);
    }
  };

  const activeLabel = VIEW_OPTIONS.find((o) => o.value === activeView)?.label ?? "Global Feed";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="cursor-pointer">
            <img
              src={logoImage}
              alt="ScrollPet Logo"
              className="h-9 md:h-10 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium px-3 py-2 rounded-lg transition-all cursor-pointer",
                  currentPath === link.href
                    ? "text-[#007699] bg-[#007699]/10 font-semibold"
                    : "text-gray-600 hover:text-[#007699] hover:bg-[#007699]/5",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <Button variant="ghost" disabled>...</Button>
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 rounded-full border-2 border-[#007699]/20 bg-white flex items-center justify-center overflow-hidden hover:border-[#007699]/50 hover:shadow-md transition-all cursor-pointer">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-lg border-gray-100">
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <p className="font-semibold text-sm text-gray-900 truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/user-profile" className="w-full cursor-pointer flex items-center gap-2 py-2">
                      <User className="w-4 h-4" /> Profile Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleAuthClick}
                    className="text-red-500 cursor-pointer flex items-center gap-2 font-medium py-2"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => (window.location.href = "/login")}
                className="font-semibold cursor-pointer rounded-full px-5 h-9 bg-[#007699] hover:bg-[#005a75] text-sm shadow-sm"
              >
                Login
              </Button>
            )}
          </div>

          <button
            className="md:hidden cursor-pointer p-2 hover:bg-gray-100 rounded-xl transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 p-4 space-y-1 bg-white shadow-xl absolute w-full z-50">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block text-sm font-medium py-2.5 px-4 rounded-lg cursor-pointer",
                  currentPath === link.href
                    ? "bg-[#007699]/10 text-[#007699] font-semibold"
                    : "hover:bg-[#007699]/5 text-gray-700",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  href="/user-profile"
                  className="block text-sm font-semibold py-2.5 px-4 rounded-lg bg-[#007699]/5 text-[#007699] cursor-pointer"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile Dashboard
                </Link>
                <Button className="w-full mt-3 cursor-pointer rounded-full" variant="destructive" size="sm" onClick={handleAuthClick}>
                  Log Out
                </Button>
              </>
            ) : (
              <Button className="w-full mt-3 cursor-pointer rounded-full bg-[#007699]" size="sm" onClick={() => (window.location.href = "/login")}>
                Login
              </Button>
            )}
          </div>
        )}
      </header>

      {/* ── PAGE TITLE ── */}
      <div className="pt-16">
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#007699]" />
            <h1 className="text-base font-bold text-gray-900">Explore</h1>
            <span className="text-sm text-gray-400 font-normal hidden sm:inline">— discover pets &amp; media</span>
          </div>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0">View:</span>
            <div className="relative">
              <select
                value={activeView}
                onChange={(e) => setActiveView(e.target.value as ViewValue)}
                className="text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl pl-4 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors"
              >
                {VIEW_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            {activeView !== "feed" && (
              <span className="text-xs text-gray-500">
                {isPetsLoading ? "Loading…" : <><span className="font-bold text-gray-800">{filteredPets?.length ?? 0}</span> pets found</>}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ════ GLOBAL FEED VIEW ════ */}
        {activeView === "feed" && (
          isMediaLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-sm animate-pulse" />
              ))}
            </div>
          ) : allMedia && allMedia.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {allMedia.map((item) => (
                <div
                  key={item.id}
                  className="aspect-square overflow-hidden rounded-sm bg-gray-100 cursor-pointer relative group"
                  onClick={() => setSelectedMedia(item)}
                >
                  {item.media_type === "video" ? (
                    <video
                      src={item.media_url}
                      className="w-full h-full object-cover pointer-events-none"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img src={item.media_url} alt="Pet post" className="w-full h-full object-cover" />
                  )}
                  {item.pets?.name && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-2 pointer-events-none">
                      <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
                        {item.pets.name}
                      </span>
                    </div>
                  )}
                  {item.intent_status && INTENT_BADGE_COLORS[item.intent_status] && (
                    <div className="absolute top-1.5 left-1.5 pointer-events-none">
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shadow-sm", INTENT_BADGE_COLORS[item.intent_status])}>
                        {item.intent_status}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-3">
              <Grid3X3 className="h-10 w-10 opacity-20" />
              <p className="text-sm font-medium">No posts yet</p>
              <p className="text-xs">Be the first to share a pet photo!</p>
            </div>
          )
        )}

        {/* ════ PET CARDS VIEW ════ */}
        {activeView !== "feed" && (
          isPetsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-pulse">
                  <div className="h-40 bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPets && filteredPets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPets.map((pet: any) => (
                <Link key={pet.id} href={`/pet/${pet.id}`}>
                  <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                    <div
                      className="h-40 relative overflow-hidden"
                      style={{ background: "linear-gradient(135deg, #e8f4f8 0%, #fef3e8 100%)" }}
                    >
                      {pet.image_url ? (
                        <img
                          src={pet.image_url}
                          alt={pet.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {pet.type === "dog" ? <Dog className="h-16 w-16 text-[#007699]/25" /> :
                           pet.type === "cat" ? <Cat className="h-16 w-16 text-[#007699]/25" /> :
                           pet.type === "bird" ? <Bird className="h-16 w-16 text-[#007699]/25" /> :
                           <Activity className="h-16 w-16 text-[#007699]/25" />}
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span
                          className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg text-white shadow-sm capitalize"
                          style={{ background: "rgba(0,118,153,0.85)", backdropFilter: "blur(4px)" }}
                        >
                          {pet.type || "pet"}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 capitalize leading-tight">{pet.name}</h3>
                      <p className="text-sm text-gray-500 capitalize mt-0.5">{pet.breed || "Unknown breed"}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {pet.gender && (
                          <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md capitalize">
                            {pet.gender}
                          </span>
                        )}
                        {pet.dob && (
                          <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                            {pet.dob}
                          </span>
                        )}
                        {pet.location && (
                          <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                            {pet.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
              <Compass className="h-10 w-10 text-gray-200" />
              <p className="text-sm font-medium text-gray-700">No pets found</p>
              <p className="text-xs text-gray-400">No pets currently listed as "{activeLabel}".</p>
            </div>
          )
        )}
      </div>

      {/* ── LIGHTBOX (feed only) ── */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            className="fixed top-4 right-4 text-white hover:text-white/70 bg-black/50 rounded-full p-2 cursor-pointer z-10"
            onClick={() => setSelectedMedia(null)}
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="flex flex-col md:flex-row w-full max-w-5xl max-h-[90vh] rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* LEFT: media */}
            <div className="bg-black flex items-center justify-center md:w-[63%] min-h-[40vh] md:min-h-0">
              {selectedMedia.media_type === "video" ? (
                <video
                  src={selectedMedia.media_url}
                  controls
                  autoPlay
                  className="w-full h-full max-h-[55vh] md:max-h-[90vh] object-contain"
                />
              ) : (
                <img
                  src={selectedMedia.media_url}
                  alt="Full size post"
                  className="w-full h-full max-h-[55vh] md:max-h-[90vh] object-contain"
                />
              )}
            </div>

            {/* RIGHT: sidebar */}
            <div className="bg-white flex flex-col md:w-[37%] md:max-h-[90vh]">
              {/* Pet header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
                <Link
                  href={`/pet/${selectedMedia.pet_id}`}
                  className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                  onClick={() => setSelectedMedia(null)}
                >
                  <div className="h-9 w-9 rounded-full overflow-hidden bg-gray-100 shrink-0">
                    {selectedMedia.pets?.image_url ? (
                      <img
                        src={selectedMedia.pets.image_url}
                        alt={selectedMedia.pets.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                        {selectedMedia.pets?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-sm text-gray-900 truncate">
                    {selectedMedia.pets?.name ?? "Unknown Pet"}
                  </span>
                </Link>
              </div>

              {/* Status row — badge for all, edit dropdown for owner */}
              {(localIntentStatus || selectedMedia.pets?.user_id === user?.id) && (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-50 shrink-0">
                  {localIntentStatus && INTENT_BADGE_COLORS[localIntentStatus] && (
                    <span className={cn("text-[11px] font-semibold px-2.5 py-0.5 rounded-full border", INTENT_BADGE_COLORS[localIntentStatus])}>
                      {localIntentStatus}
                    </span>
                  )}
                  {selectedMedia.pets?.user_id === user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-[#007699] transition-colors">
                          <Tag className="w-3.5 h-3.5" />
                          {localIntentStatus ? "Change" : "Add Status"}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          className="text-xs text-gray-500 cursor-pointer"
                          onClick={() => handleUpdateIntentStatus("")}
                        >
                          None
                        </DropdownMenuItem>
                        {INTENT_OPTIONS.map((opt) => (
                          <DropdownMenuItem
                            key={opt}
                            className="text-xs cursor-pointer"
                            onClick={() => handleUpdateIntentStatus(opt)}
                          >
                            {opt}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                {(() => {
                  const fetched = mediaComments ?? [];
                  const fetchedIds = new Set(fetched.map((c) => c.id));
                  const merged = [...fetched, ...localComments.filter((c) => !fetchedIds.has(c.id))];
                  return merged.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">No comments yet. Be the first!</p>
                  ) : (
                    merged.map((c) => (
                      <div key={c.id} className="flex gap-2.5">
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 shrink-0">
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_id}`}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-snug">
                            <span className="font-semibold text-gray-900 mr-1">Pet Lover</span>
                            <span className="text-gray-700">{c.content}</span>
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(c.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                    ))
                  );
                })()}
              </div>

              {/* Like row */}
              <div className="px-4 py-2 border-t border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleLike}
                    disabled={!isAuthenticated}
                    className={cn(
                      "cursor-pointer transition-transform active:scale-90",
                      !isAuthenticated && "opacity-40 cursor-default",
                    )}
                    aria-label="Like"
                  >
                    <Heart
                      className={cn(
                        "w-6 h-6 transition-colors",
                        userHasLiked ? "fill-red-500 text-red-500" : "text-gray-500 hover:text-red-400",
                      )}
                    />
                  </button>
                  <span className="text-sm font-semibold text-gray-800">
                    {likeCount} {likeCount === 1 ? "like" : "likes"}
                  </span>
                </div>
              </div>

              {/* Comment input */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 shrink-0">
                  <input
                    type="text"
                    placeholder="Add a comment…"
                    className="flex-1 text-sm border-0 outline-none bg-transparent placeholder:text-gray-400"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handlePostComment(); }}
                    maxLength={500}
                  />
                  <button
                    onClick={handlePostComment}
                    disabled={!commentText.trim() || isPostingComment}
                    className="text-[#007699] font-semibold text-sm disabled:opacity-40 cursor-pointer disabled:cursor-default"
                  >
                    {isPostingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <div className="px-4 py-3 border-t border-gray-100 shrink-0 text-xs text-gray-400 text-center">
                  <span
                    className="text-[#007699] cursor-pointer font-semibold hover:underline"
                    onClick={() => (window.location.href = "/login")}
                  >
                    Log in
                  </span>{" "}
                  to like &amp; comment.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
