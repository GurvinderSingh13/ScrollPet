import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Grid3X3,
  Loader2,
  Heart,
  Send,
  Compass,
  ChevronDown,
  Tag,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { INDIA_LOCATIONS } from "@/data/indiaLocations";
import { PET_BREEDS } from "@/data/petBreeds";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

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
    type?: string | null;
  } | null;
};

type FeedItem = {
  id: string;
  source_type: "media" | "chat";
  media_url: string | null;
  media_type: string | null;
  text_content: string | null;
  user_display_name: string;
  user_id: string | null;
  category: string | null;
  breed: string | null;
  location: string | null;
  country: string | null;
  state_val: string | null;
  intent_status: string | null;
  created_at: string;
  raw_media: MediaItem | null;
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

const PET_CATEGORIES = [
  { value: "dog",        label: "Dog" },
  { value: "cat",        label: "Cat" },
  { value: "fish",       label: "Fish" },
  { value: "bird",       label: "Bird" },
  { value: "rabbit",     label: "Rabbit" },
  { value: "hamster",    label: "Hamster" },
  { value: "reptile",    label: "Reptile" },
  { value: "guinea_pig", label: "Guinea Pig" },
  { value: "turtle",     label: "Turtle" },
  { value: "horse",      label: "Horse" },
];

export default function ExplorePage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  // ── Filter state ──
  const [filterSource, setFilterSource] = useState<"all" | "media" | "chat">("all");
  const [filterIntent, setFilterIntent] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBreed, setFilterBreed] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [filterDistrict, setFilterDistrict] = useState("all");

  const availableBreeds = filterCategory !== "all" ? (PET_BREEDS[filterCategory] ?? []) : [];
  const availableDistricts = filterState !== "all"
    ? (INDIA_LOCATIONS.find((s) => s.name === filterState)?.districts ?? [])
    : [];

  // ── Feed state ──
  const [allFeedItems, setAllFeedItems] = useState<FeedItem[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);

  // ── Lightbox state ──
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [localIntentStatus, setLocalIntentStatus] = useState<string>("");
  const [commentText, setCommentText] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [localComments, setLocalComments] = useState<
    { id: string; media_id: string; user_id: string; content: string; created_at: string }[]
  >([]);

  // Reset lightbox comment state when media changes
  useEffect(() => {
    setLocalComments([]);
    setCommentText("");
    setLocalIntentStatus(selectedMedia?.intent_status || "");
  }, [selectedMedia?.id]);

  // ── Unified fetch (source / intent / category) ──
  useEffect(() => {
    const fetchFeed = async () => {
      setIsFeedLoading(true);
      try {
        let mediaItems: FeedItem[] = [];
        let chatItems: FeedItem[] = [];

        // ── Profile Media ──
        if (filterSource === "all" || filterSource === "media") {
          let q = supabase
            .from("pet_media")
            .select("*, pets(id, name, image_url, user_id, type, breed)")
            .order("created_at", { ascending: false });

          if (filterIntent !== "all") q = q.eq("intent_status", filterIntent);

          const { data, error } = await q;
          if (!error && data) {
            mediaItems = (data as any[])
              .filter((item) => {
                if (filterCategory !== "all" && item.pets?.type !== filterCategory) return false;
                return true;
              })
              .map((item) => ({
                id: item.id,
                source_type: "media" as const,
                media_url: item.media_url ?? null,
                media_type: item.media_type ?? null,
                text_content: null,
                user_display_name: item.pets?.name ?? "Unknown Pet",
                user_id: item.pets?.user_id ?? null,
                category: item.pets?.type ?? null,
                breed: item.pets?.breed ?? null,
                location: null,
                country: null,
                state_val: null,
                intent_status: item.intent_status ?? null,
                created_at: item.created_at,
                raw_media: item as MediaItem,
              }));
          }
        }

        // ── Chat Room Posts — fetch everything, filter in React ──
        if (filterSource === "all" || filterSource === "chat") {
          const { data, error } = await supabase
            .from("messages")
            .select("id, user_id, content, message_type, media_url, intent_status, created_at, pet_type, breed, users(display_name, username, country, state)")
            .order("created_at", { ascending: false });

          if (!error && data) {
            // Step 1 — keep only tagged posts
            let tagged = (data as any[]).filter(
              (item) => item.intent_status && item.intent_status !== "None",
            );

            // Step 2 — apply every dropdown filter in JavaScript
            if (filterIntent !== "all") {
              tagged = tagged.filter((item) => item.intent_status === filterIntent);
            }
            if (filterCategory !== "all") {
              tagged = tagged.filter((item) => item.pet_type === filterCategory);
            }
            if (filterBreed !== "all") {
              tagged = tagged.filter(
                (item) =>
                  item.breed?.toLowerCase().includes(filterBreed.toLowerCase()) ||
                  item.content?.toLowerCase().includes(filterBreed.toLowerCase()),
              );
            }
            if (filterCountry !== "all") {
              tagged = tagged.filter(
                (item) => (item.users as any)?.country === filterCountry,
              );
            }
            if (filterState !== "all") {
              tagged = tagged.filter(
                (item) => (item.users as any)?.state === filterState,
              );
            }
            if (filterDistrict !== "all") {
              tagged = tagged.filter((item) =>
                item.content?.toLowerCase().includes(filterDistrict.toLowerCase()),
              );
            }

            console.log("Filtered Chat Data:", tagged);

            chatItems = tagged.map((item) => {
              const u = item.users as any;
              const locationStr = [u?.state, u?.country].filter(Boolean).join(", ") || null;
              const mediaType =
                item.message_type === "image" ? "image"
                : item.message_type === "video" ? "video"
                : null;
              return {
                id: item.id,
                source_type: "chat" as const,
                media_url: item.media_url ?? null,
                media_type: mediaType,
                text_content: item.content ?? null,
                user_display_name: u?.display_name || u?.username || "Pet Lover",
                user_id: item.user_id ?? null,
                category: item.pet_type ?? null,
                breed: item.breed ?? null,
                location: locationStr,
                country: u?.country ?? null,
                state_val: u?.state ?? null,
                intent_status: item.intent_status ?? null,
                created_at: item.created_at,
                raw_media: null,
              };
            });
          }
        }

        const merged = [...mediaItems, ...chatItems].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        setAllFeedItems(merged);
      } catch (err: any) {
        toast({ description: "Failed to load feed.", variant: "destructive" });
      } finally {
        setIsFeedLoading(false);
      }
    };

    fetchFeed();
  }, [filterSource, filterIntent, filterCategory, filterBreed, filterCountry, filterState, filterDistrict]);

  // ── Sync allFeedItems → feedItems (all filtering already done inside fetchFeed) ──
  useEffect(() => {
    setFeedItems(allFeedItems);
  }, [allFeedItems]);

  // ── Lightbox queries ──
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ── PAGE TITLE ── */}
      <div className="pt-20">
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#007699]" />
            <h1 className="text-base font-bold text-gray-900">Explore</h1>
            <span className="text-sm text-gray-400 font-normal hidden sm:inline">— marketplace &amp; discovery feed</span>
          </div>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-2 md:gap-3">

            {/* Source */}
            <div className="relative">
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value as "all" | "media" | "chat")}
                className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors"
              >
                <option value="all">All Posts</option>
                <option value="media">Profile Media</option>
                <option value="chat">Chat Room Posts</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Intent */}
            <div className="relative">
              <select
                value={filterIntent}
                onChange={(e) => setFilterIntent(e.target.value)}
                className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors"
              >
                <option value="all">All Intents</option>
                {INTENT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Category */}
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setFilterBreed("all"); }}
                className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors"
              >
                <option value="all">All Categories</option>
                {PET_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Breed */}
            <div className="relative">
              <select
                value={filterBreed}
                onChange={(e) => setFilterBreed(e.target.value)}
                disabled={availableBreeds.length === 0}
                className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="all">All Breeds</option>
                {availableBreeds.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Country */}
            <div className="relative">
              <select
                value={filterCountry}
                onChange={(e) => { setFilterCountry(e.target.value); setFilterState("all"); setFilterDistrict("all"); }}
                className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors"
              >
                <option value="all">All Countries</option>
                <option value="India">India</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* State */}
            <div className="relative">
              <select
                value={filterState}
                onChange={(e) => { setFilterState(e.target.value); setFilterDistrict("all"); }}
                disabled={filterCountry === "all"}
                className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="all">All States</option>
                {INDIA_LOCATIONS.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* District */}
            <div className="relative">
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                disabled={availableDistricts.length === 0}
                className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="all">All Districts</option>
                {availableDistricts.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Result count */}
            <span className="text-xs text-gray-400 ml-auto">
              {isFeedLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
              ) : (
                <><span className="font-bold text-gray-600">{feedItems.length}</span> result{feedItems.length !== 1 ? "s" : ""}</>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {isFeedLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : feedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <Grid3X3 className="h-10 w-10 opacity-20" />
            <p className="text-sm font-medium text-gray-700">No posts found</p>
            <p className="text-xs text-gray-400">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {feedItems.map((item) =>
              item.source_type === "media" ? (
                /* ── Media Card ── */
                <div
                  key={item.id}
                  className="aspect-square overflow-hidden rounded-xl bg-gray-100 cursor-pointer relative group"
                  onClick={() => item.raw_media && setSelectedMedia(item.raw_media)}
                >
                  {item.media_type === "video" ? (
                    <video
                      src={item.media_url!}
                      className="w-full h-full object-cover pointer-events-none"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img src={item.media_url!} alt="Pet media" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-2 pointer-events-none">
                    <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
                      {item.user_display_name}
                    </span>
                  </div>
                  {item.intent_status && INTENT_BADGE_COLORS[item.intent_status] && (
                    <div className="absolute top-1.5 left-1.5 pointer-events-none">
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shadow-sm", INTENT_BADGE_COLORS[item.intent_status])}>
                        {item.intent_status}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Chat Marketplace Card ── */
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                >
                  {/* Image / video — always square, badge overlaid top-right */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden shrink-0">
                    {item.media_url ? (
                      item.media_type === "video" ? (
                        <video
                          src={item.media_url}
                          className="w-full h-full object-cover pointer-events-none"
                          autoPlay muted loop playsInline
                        />
                      ) : (
                        <img src={item.media_url} alt="Post attachment" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
                        <span className="text-4xl opacity-20">🐾</span>
                      </div>
                    )}
                    {item.intent_status && INTENT_BADGE_COLORS[item.intent_status] && (
                      <div className="absolute top-2 right-2 pointer-events-none">
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shadow-sm", INTENT_BADGE_COLORS[item.intent_status])}>
                          {item.intent_status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Text content — full text, pre-wrap so line breaks show */}
                  {item.text_content && (
                    <div className="px-2.5 pt-2 pb-1">
                      <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{item.text_content}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-1.5 px-2.5 py-2 mt-auto border-t border-gray-50">
                    <div className="h-5 w-5 rounded-full overflow-hidden bg-gray-100 shrink-0">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id ?? item.id}`}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-gray-700 truncate">{item.user_display_name}</p>
                      {item.location && (
                        <p className="text-[9px] text-gray-400 truncate flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          {item.location}
                        </p>
                      )}
                    </div>
                    {item.category && (
                      <span className="text-[9px] font-semibold bg-[#007699]/10 text-[#007699] px-1.5 py-0.5 rounded-md capitalize shrink-0">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* ── LIGHTBOX (media items only) ── */}
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

              {/* Status row */}
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

      <Footer />
    </div>
  );
}
