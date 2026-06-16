import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Grid3X3,
  Loader2,
  Heart,
  Send,
  Compass,
  ChevronDown,
  Tag,
  MapPin,
  X,
  Filter,
  Plus,
  MoreHorizontal,
  Phone,
  MessageCircle,
  PawPrint,
} from "lucide-react";
import { CreatePostModal } from "@/components/CreatePostModal";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn, parseUTCDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { INDIA_LOCATIONS } from "@/data/indiaLocations";
import { Country, State } from "country-state-city";
import Footer from "@/components/Footer";
import ReactPlayer from 'react-player';

const formatLocation = (loc: string | null) => {
  if (!loc) return "";
  if (loc.startsWith("city:") || loc.startsWith("state:") || loc.startsWith("country:")) {
    const parts = loc.split(":");
    if (parts.length >= 4) {
      return `${parts[3]}, ${parts[2]}`; // e.g. Delhi, DL
    } else if (parts.length === 3) {
      return `${parts[2]}, ${parts[1]}`; // e.g. DL, IN
    } else if (parts.length === 2) {
      return parts[1];
    }
  }
  return loc;
};

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
    breed?: string | null;
    gender?: string | null;
  } | null;
};

type FeedItem = {
  id: string;
  source_type: "media" | "chat";
  display_image: string | null;
  display_text: string | null;
  media_url: string | null;
  media_type: string | null;
  text_content: string | null;
  user_display_name: string;
  user_id: string | null;
  category: string | null;
  breed: string | null;
  location: string | null;
  crosspost_rooms: string[];
  raw_location: string | null;
  intent_status: string | null;
  created_at: string;
  raw_media: MediaItem | null;
  age: string | null;
  price: number | null;
  user_phone: string | null;
  gender: string | null;
  user_avatar_url: string | null;
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

const AGE_OPTIONS = [
  "Less than 1 Month",
  "1 Month",
  "2 Months",
  "3 Months",
  "4 Months",
  "5 Months",
  "6 Months",
  "7-11 Months",
  "1 Year",
  "2 Years",
  "3 Years",
  "4+ Years"
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

import { PET_CATEGORIES } from "@/constants/config";

const FeedVideo = ({ src, className, controls, autoPlay, muted, loop, playsInline }: any) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setIsPlaying(false);
        } else if (entry.isIntersecting && autoPlay) {
          setIsPlaying(true);
        }
      },
      { threshold: 0.1 } // Play when at least 10% is visible
    );

    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [autoPlay]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {!isVideoLoaded && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-200 animate-pulse z-10">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}
      <ReactPlayer
        src={src}
        playing={isPlaying}
        controls={controls}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        width="100%"
        height="100%"
        className={`absolute inset-0 [&_video]:object-cover ${!isVideoLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onReady={() => setIsVideoLoaded(true)}
      />
    </div>
  );
};



export default function FeedPage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  // ── Handlers ──state ──
  const [filterSource, setFilterSource] = useState<"all" | "media" | "chat">("all");
  const [filterIntent, setFilterIntent] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBreed, setFilterBreed] = useState("all");
  const [filterMyPosts, setFilterMyPosts] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [filterAge, setFilterAge] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");

  // ── Categories from DB (same source as chat room) ──
  const { data: dbCategories = [] } = useQuery({
    queryKey: ["explore-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // ── ALL breeds (used to resolve UUID/slug → name during normalization) ──
  const { data: allBreeds = [] } = useQuery({
    queryKey: ["explore-all-breeds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("breeds")
        .select("id, name, category_id")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  // Build a resolver map: uuid → name AND slug → name (e.g. "labrador-retriever" → "Labrador Retriever")
  const breedResolverMap = useMemo(() => {
    const map: Record<string, string> = {};
    (allBreeds as any[]).forEach((b) => {
      // by UUID
      map[b.id.toLowerCase()] = b.name;
      // by slug (kebab-case of name)
      const slug = b.name.toLowerCase().replace(/\s+/g, "-");
      map[slug] = b.name;
      // by lowercase name
      map[b.name.toLowerCase()] = b.name;
    });
    return map;
  }, [allBreeds]);

  const filterCategoryId: string | null =
    filterCategory !== "all"
      ? ((dbCategories.find(
          (c: any) => c.name.toLowerCase() === filterCategory.toLowerCase(),
        ) as any)?.id ?? null)
      : null;

  // ── Breeds from DB filtered by category — mirrors chat room's breed query ──
  const { data: availableBreeds = [] } = useQuery({
    queryKey: ["explore-breeds", filterCategoryId],
    queryFn: async () => {
      if (!filterCategoryId) return [];
      const { data, error } = await supabase
        .from("breeds")
        .select("id, name")
        .eq("category_id", filterCategoryId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!filterCategoryId,
  });

  const availableStates = filterCountry !== "all" ? State.getStatesOfCountry(filterCountry) : [];
  const selectedStateName = filterState !== "all"
    ? (availableStates.find((s) => s.isoCode === filterState)?.name ?? "")
    : "";
  const availableDistricts = selectedStateName
    ? (INDIA_LOCATIONS.find((s) => s.name === selectedStateName)?.districts ?? [])
    : [];

  // ── Feed state ──
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPost, setSelectedPost] = useState<FeedItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<FeedItem | null>(null);

  const dynamicAgeOptions = useMemo(() => {
    const ages = new Set<string>();
    AGE_OPTIONS.forEach(a => ages.add(a));
    feedItems.forEach(item => {
      if (item.age) ages.add(item.age);
    });
    // Alphabetical sort is fine for dynamic options
    return Array.from(ages).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [feedItems]);

  const handleDeletePost = async (id: string, authorId: string) => {
    if (!user || user.id !== authorId) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this listing?");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('messages').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      toast({ description: "Post deleted successfully!" });
      setSelectedPost(null);
      fetchFeed();
    } catch (err: any) {
      console.error("Delete error:", err);
      toast({ description: err.message || "Failed to delete post", variant: "destructive" });
    }
  };

  // ── Reels / snap-scroll refs ──
  const reelsScrollRef = useRef<HTMLDivElement>(null);
  const itemRefsMap = useRef<Record<string, HTMLDivElement | null>>({});
  const [, setLocation] = useLocation();

  // When the reels feed opens, scroll to the clicked post immediately
  useEffect(() => {
    if (!selectedPost) return;
    const el = itemRefsMap.current[selectedPost.id];
    if (el) {
      el.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, [selectedPost?.id]);


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

  // ── Unified fetch — no inline PostgREST joins; users fetched separately ──
  const fetchFeed = useCallback(async (pageNum: number = 0, isLoadMore: boolean = false) => {
      // Helper: resolve a stored breed value (UUID, slug, or name) → canonical display name
      const resolveBreed = (raw: string | null): string | null => {
        if (!raw) return null;
        const key = raw.trim().toLowerCase();
        return breedResolverMap[key] ?? raw.trim();
      };
      // Helper: normalize pet_type to consistent lowercase trimmed value
      const normalizePetType = (raw: string | null): string | null => {
        if (!raw) return null;
        return raw.trim().toLowerCase();
      };
      if (!isLoadMore) setIsFeedLoading(true);
      else setIsLoadingMore(true);
      console.log('Fetching page:', pageNum, 'filterCategory:', filterCategory, 'filterBreed:', filterBreed);
      try {
        const PAGE_SIZE = 50; // larger page so client-side filters have enough data
        const start = pageNum * PAGE_SIZE;
        const end = start + PAGE_SIZE - 1;        const sortColumn = "created_at"; // Database must always sort by created_at since views/likes are computed/merged client-side

        // Step 1 — fetch both tables in parallel
        const [mediaResult] = await Promise.all([
          supabase.from("pet_media")
            .select("*, pets(id, name, image_url, user_id, type, breed, gender)")
            .order("created_at", { ascending: false })
            .range(start, end)
        ]);

        if (mediaResult.error) console.error("pet_media fetch error:", mediaResult.error);

        // Step 3 — fetch users for chats AND pet_media owners in one query
        let usersMap: Record<string, any> = {};
        const mediaOwnerIds = (mediaResult.data || [])
          .map((m: any) => m.pets?.user_id as string | undefined)
          .filter(Boolean) as string[];
        const allUserIds = Array.from(new Set([...mediaOwnerIds]));
        if (allUserIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("id, display_name, username, country, state, phone, profile_image_url")
            .in("id", allUserIds);
          if (usersError) console.error("users fetch error:", usersError);
          (usersData || []).forEach((u: any) => { usersMap[u.id] = u; });
        }

        // Build a country-name → ISO-code lookup once (used for media location mapping)
        const countryNameToCode: Record<string, string> = Object.fromEntries(
          Country.getAllCountries().map((c) => [c.name, c.isoCode]),
        );

        // Step 4 — normalize media (build synthetic crosspost_rooms from pet owner's profile)
        const normalizedMedia: FeedItem[] = (mediaResult.data || []).map((item: any) => {
          const owner = usersMap[item.pets?.user_id ?? ""] ?? null;
          const syntheticRooms: string[] = [];
          if (owner?.country) {
            const cc = countryNameToCode[owner.country] ?? null;
            if (cc) {
              syntheticRooms.push(`country:${cc}::all::all`);
              if (owner.state) {
                const stateCode = State.getStatesOfCountry(cc)
                  .find((s: any) => s.name === owner.state)?.isoCode ?? null;
                if (stateCode) syntheticRooms.push(`state:${cc}:${stateCode}::all::all`);
              }
            }
          }
          return {
            id: item.id,
            source_type: "media" as const,
            display_image: item.media_url ?? null,
            display_text: null,
            media_url: item.media_url ?? null,
            media_type: item.media_type ?? null,
            text_content: null,
            user_display_name: item.pets?.name ?? "Unknown Pet",
            user_id: item.pets?.user_id ?? null,
            category: normalizePetType(item.pets?.type ?? null),
            breed: resolveBreed(item.pets?.breed ?? null)?.toLowerCase() ?? null,
            location: syntheticRooms[0] ?? null,
            crosspost_rooms: syntheticRooms,
            raw_location: syntheticRooms[0] ?? null,
            intent_status: item.intent_status ?? null,
            created_at: item.created_at,
            raw_media: item as MediaItem,
            age: null,
            price: null,
            user_phone: owner?.phone ?? null,
            gender: item.pets?.gender ?? null,
            user_avatar_url: owner?.profile_image_url || owner?.avatar_url || null,
            views: item.views || 0,
            likes: item.likes || item.likes_count || 0,
          };
        });

        // Step 6 — merge and apply dropdown filters in JavaScript
        let merged = [...normalizedMedia];

        if (filterSource !== "all") {
          merged = merged.filter((item) => item.source_type === filterSource);
        }
        if (filterIntent !== "all") {
          merged = merged.filter((item) => item.intent_status?.toLowerCase() === filterIntent.toLowerCase());
        }
        if (filterCategory !== "all") {
          merged = merged.filter((item) => item.category?.toLowerCase() === filterCategory.toLowerCase());
        }
        if (filterBreed !== "all") {
          // filterBreed is the breed name (from availableBreeds), lowercased
          const filterBreedLower = filterBreed.toLowerCase().trim();
          merged = merged.filter((item) => {
            const stored = (item.breed ?? "").toLowerCase().trim();
            // Direct name match (both are resolved to names now)
            if (stored === filterBreedLower) return true;
            // Also check crosspost_rooms breed segment (3rd segment after split by ::)
            return item.crosspost_rooms.some((tag) => {
              const parts = tag.split("::");
              const tagBreed = (parts[2] ?? "").toLowerCase().trim();
              return tagBreed === filterBreedLower;
            });
          });
        }
        if (filterAge !== "all") {
          merged = merged.filter((item) => item.age?.toLowerCase() === filterAge.toLowerCase());
        }
        if (filterGender !== "all") {
          merged = merged.filter((item) => item.gender?.toLowerCase() === filterGender.toLowerCase());
        }
        if (filterMaxPrice !== "" && filterMaxPrice !== "0") {
          const max = parseInt(filterMaxPrice, 10);
          if (!isNaN(max) && max > 0) {
            merged = merged.filter((item) => item.price !== null && item.price <= max);
          }
        }
        
        if (filterMyPosts && user) {
          merged = merged.filter(item => item.user_id === user.id);
        }

        // Checks any item's location hierarchy against a predicate.
        // Uses crosspost_rooms first. Falls back to raw_location.
        const itemMatchesLoc = (item: FeedItem, pred: (loc: string) => boolean): boolean => {
          if (item.crosspost_rooms.length > 0) {
            return item.crosspost_rooms.some((tag) => pred(tag.split("::")[0]));
          }
          return item.raw_location ? pred(item.raw_location) : false;
        };

        if (filterCountry !== "all") {
          merged = merged.filter((item) =>
            itemMatchesLoc(item, (loc) =>
              loc === `country:${filterCountry}` ||
              loc.startsWith(`state:${filterCountry}:`) ||
              loc.startsWith(`city:${filterCountry}:`),
            ),
          );
        }
        if (filterState !== "all") {
          merged = merged.filter((item) =>
            itemMatchesLoc(item, (loc) =>
              loc === `state:${filterCountry}:${filterState}` ||
              loc.startsWith(`city:${filterCountry}:${filterState}:`),
            ),
          );
        }
        if (filterDistrict !== "all") {
          merged = merged.filter((item) =>
            itemMatchesLoc(item, (loc) =>
              loc === `city:${filterCountry}:${filterState}:${filterDistrict}`,
            ),
          );
        }

        merged.sort((a: any, b: any) => {
          if (sortBy === "top") {
            const scoreA = (a.views || 0) + (a.likes || 0);
            const scoreB = (b.views || 0) + (b.likes || 0);
            if (scoreB !== scoreA) return scoreB - scoreA;
          }
          return parseUTCDate(b.created_at).getTime() - parseUTCDate(a.created_at).getTime();
        });

        console.log("Final feed:", merged.length);
        
        const isDataExhausted = (mediaResult.data?.length || 0) < PAGE_SIZE;
        setHasMore(!isDataExhausted);

        if (isLoadMore) {
          setFeedItems((prev) => {
            const newItems = merged.filter((item) => !prev.some((p) => p.id === item.id));
            console.log('Returned items:', newItems.length);
            return [...prev, ...newItems].sort((a: any, b: any) => {
              if (sortBy === "top") {
                const scoreA = (a.views || 0) + (a.likes || 0);
                const scoreB = (b.views || 0) + (b.likes || 0);
                if (scoreB !== scoreA) return scoreB - scoreA;
              }
              return parseUTCDate(b.created_at).getTime() - parseUTCDate(a.created_at).getTime();
            });
          });
        } else {
          setFeedItems(merged);
        }
      } catch (err: any) {
        console.error("fetchFeed exception:", err);
        toast({ description: "Failed to load feed.", variant: "destructive" });
      } finally {
        setIsFeedLoading(false);
        setIsLoadingMore(false);
      }
  }, [filterSource, filterIntent, filterCategory, filterBreed, filterCountry, filterState, filterDistrict, filterAge, filterGender, filterMaxPrice, breedResolverMap, filterMyPosts, user, allBreeds, sortBy]);

  useEffect(() => {
    setPage(0);
    fetchFeed(0, false);
  }, [fetchFeed]);

  useEffect(() => {
    if (isAuthenticated) {
      if (sessionStorage.getItem('intent') === 'create-post') {
        sessionStorage.removeItem('intent');
        setIsCreateModalOpen(true);
      }
    }
  }, [isAuthenticated]);


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

  const renderFilters = () => (
    <>
      {/* Source — segmented control removed */}      {/* Sort By */}
      <div className="relative w-full md:w-auto">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full md:w-auto text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors"
        >
          <option value="recent">Recent Posts</option>
          <option value="top">Top Posts</option>
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>

      {/* Intent */}
      <div className="relative w-full md:w-auto">
        <select
          value={filterIntent}
          onChange={(e) => setFilterIntent(e.target.value)}
          className="w-full md:w-auto text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors"
        >
          <option value="all">All Intents</option>
          {INTENT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>

      {/* Category */}
      <div className="relative w-full md:w-auto">
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setFilterBreed("all"); }}
          className="w-full md:w-auto text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors"
        >
          <option value="all">All Categories</option>
          {dbCategories.map((c: any) => (
            <option key={c.id} value={c.name.toLowerCase()}>{c.name}</option>
          ))}
          {!dbCategories.some((c: any) => c.name.toLowerCase() === "other") && (
            <option value="other">Other</option>
          )}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>

      {/* Breed */}
      <div className="relative w-full md:w-auto">
        <select
          value={filterBreed}
          onChange={(e) => setFilterBreed(e.target.value)}
          disabled={availableBreeds.length === 0}
          className="w-full md:w-auto text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <option value="all">All Breeds</option>
          {availableBreeds.map((b: any) => (
            <option key={b.id} value={b.name.toLowerCase()}>{b.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>

      {/* Age */}
      <div className="relative w-full md:w-auto">
        <select
          value={filterAge}
          onChange={(e) => setFilterAge(e.target.value)}
          className="w-full md:w-auto text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors"
        >
          <option value="all">Any Age</option>
          {dynamicAgeOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>

      {/* Gender */}
      <div className="relative w-full md:w-auto">
        <select
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
          className="w-full md:w-auto text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors"
        >
          <option value="all">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Pair">Pair</option>
          <option value="Lot">Lot</option>
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>

      {/* Max Price */}
      <div className="relative w-full md:w-auto">
        <input
          type="number"
          placeholder="Max Price (₹)"
          value={filterMaxPrice}
          onChange={(e) => setFilterMaxPrice(e.target.value)}
          className="w-full md:w-auto text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-4 py-1.5 outline-none hover:border-[#007699] focus:border-[#007699] transition-colors"
          min="0"
        />
      </div>

      {/* Country */}
      <div className="relative w-full md:w-auto">
        <select
          value={filterCountry}
          onChange={(e) => { setFilterCountry(e.target.value); setFilterState("all"); setFilterDistrict("all"); }}
          className="w-full md:w-auto text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors"
        >
          <option value="all">All Countries</option>
          <option value="IN">India</option>
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>

      {/* State */}
      <div className="relative w-full md:w-auto">
        <select
          value={filterState}
          onChange={(e) => { setFilterState(e.target.value); setFilterDistrict("all"); }}
          disabled={filterCountry === "all"}
          className="w-full md:w-auto text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <option value="all">All States</option>
          {availableStates.map((s) => (
            <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>

      {/* District */}
      <div className="relative w-full md:w-auto">
        <select
          value={filterDistrict}
          onChange={(e) => setFilterDistrict(e.target.value)}
          disabled={availableDistricts.length === 0}
          className="w-full md:w-auto text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <option value="all">All Districts</option>
          {availableDistricts.map((d) => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── PAGE TITLE ── */}
      <div className="pt-20">
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#007699]" />
            <h1 className="text-base font-bold text-gray-900">Feed</h1>
          </div>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 md:gap-3">
            {/* Mobile Sheet Filter */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-1.5 hover:border-[#007699] transition-colors">
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl overflow-y-auto">
                  <SheetHeader className="mb-4">
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4">
                    {renderFilters()}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Inline Filters */}
            <div className="hidden md:flex flex-wrap items-center gap-3">
              {renderFilters()}
            </div>
            {/* Result count */}
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-gray-400">
                {isFeedLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
                ) : (
                  <><span className="font-bold text-gray-600">{feedItems.length}</span> result{feedItems.length !== 1 ? "s" : ""}</>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {isFeedLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {feedItems.map((item) =>
                item.source_type === "media" ? (
                  /* ── Media Card ── */
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group aspect-square relative"
                    onClick={() => setSelectedMedia(item.raw_media)}
                  >
                    {item.media_type === "video" ? (
                      <FeedVideo
                        src={item.media_url!}
                        className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-300"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img src={item.media_url!} alt="Pet media" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    )}
                    
                    {/* Hover overlay with minimal stats (optional Instagram-like behavior) */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-4 text-white font-bold text-sm">
                        <div className="flex items-center gap-1.5 shadow-sm">
                          <Heart className="w-5 h-5 fill-white" />
                          <span>{(item as any).likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shadow-sm">
                          <MessageCircle className="w-5 h-5 fill-white" />
                          <span>0</span>
                        </div>
                      </div>
                    </div>
                  </div>
              ) : (
                /* ── Chat Marketplace Card ── */
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col cursor-pointer group"
                  onClick={() => setSelectedPost(item)}
                >
                  {/* Image / video */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden shrink-0">
                    {item.display_image ? (
                      item.media_type === "video" ? (
                        <FeedVideo
                          src={item.display_image}
                          className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-300"
                          autoPlay muted loop playsInline
                        />
                      ) : (
                        <img src={item.display_image} alt="Post attachment" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#007699]/5 to-[#007699]/20 gap-2">
                        <span className="text-5xl opacity-30">🐾</span>
                        {item.display_text && (
                          <p className="text-[10px] text-gray-500 text-center px-3 line-clamp-3 leading-relaxed">{item.display_text}</p>
                        )}
                      </div>
                    )}
                    {/* Intent badge */}
                    {item.intent_status && INTENT_BADGE_COLORS[item.intent_status] && (
                      <div className="absolute top-2 left-2 pointer-events-none">
                        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-sm backdrop-blur-sm", INTENT_BADGE_COLORS[item.intent_status])}>
                          {item.intent_status}
                        </span>
                      </div>
                    )}
                    {/* Price overlay */}
                    {item.price !== null && item.price !== undefined && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pt-4 pb-2">
                        <p className="text-white font-bold text-base leading-none">₹{item.price.toLocaleString('en-IN')}</p>
                      </div>
                    )}
                    {/* Owner menu */}
                    {user?.id === item.user_id && (
                      <div className="absolute top-2 right-2 z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors outline-none"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-white border-gray-200 text-gray-800 z-50">
                            <DropdownMenuItem
                              className="cursor-pointer focus:bg-gray-100"
                              onClick={(e) => { e.stopPropagation(); setPostToEdit(item); setIsCreateModalOpen(true); }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600 focus:bg-gray-100 focus:text-red-700"
                              onClick={(e) => { e.stopPropagation(); handleDeletePost(item.id, item.user_id!); }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>

                  {/* Info Section */}
                  <div className="flex flex-col p-3 gap-2.5 flex-1">
                    {/* Row 1: Breed + Gender pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.breed && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          <PawPrint className="w-2.5 h-2.5" />
                          {item.breed.charAt(0).toUpperCase() + item.breed.slice(1)}
                        </span>
                      )}
                      {item.gender && (
                        <span className={cn(
                          "inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                          item.gender.toLowerCase() === "male"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-pink-50 text-pink-700 border-pink-200"
                        )}>
                          {item.gender.toLowerCase() === "male" ? "♂" : "♀"} {item.gender.charAt(0).toUpperCase() + item.gender.slice(1)}
                        </span>
                      )}
                      {item.age && (
                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                          {item.age}
                        </span>
                      )}
                    </div>

                    {/* Row 2: User */}
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={item.user_avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id ?? item.id}`}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-[10px] font-semibold text-gray-700 truncate">{item.user_display_name}</p>
                      <span className="text-[9px] text-gray-400 ml-auto whitespace-nowrap shrink-0">
                        {formatDistanceToNow(parseUTCDate(item.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Row 3: Location */}
                    {item.location && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{formatLocation(item.location)}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-auto pt-2 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-1.5 w-full">
                        {item.user_phone && (
                          <a
                            href={`https://wa.me/${item.user_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-semibold py-1.5 rounded-lg transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-3 h-3" />
                            WhatsApp
                          </a>
                        )}
                        {user ? (
                          <button
                            className={cn("flex items-center justify-center gap-1 bg-[#007699] hover:bg-[#005a75] text-white text-[10px] font-semibold py-1.5 rounded-lg transition-colors", !item.user_phone && "col-span-2")}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.user_id) setLocation(`/chat?user=${item.user_id}`);
                            }}
                          >
                            <MessageCircle className="w-3 h-3" />
                            Message
                          </button>
                        ) : (
                          <button
                            className={cn("flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-semibold py-1.5 rounded-lg transition-colors", !item.user_phone && "col-span-2")}
                            onClick={(e) => { e.stopPropagation(); setLocation(`/login`); }}
                          >
                            Login
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
          
          {hasMore && feedItems.length > 0 && (
            <div className="mt-8 flex justify-center pb-8">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchFeed(nextPage, true);
                }}
                disabled={isLoadingMore}
                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-2.5 px-6 rounded-full shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin inline" />}
                {isLoadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
          </>
        )}
      </div>

      {/* ── REELS FEED — snap-scroll cinematic ── */}
      {selectedPost && (
        <div className="fixed inset-0 z-[9999] bg-black h-[100dvh] w-full overflow-y-auto">

          {/* Fixed Back button — stays pinned while feed scrolls */}
          <div className="fixed top-0 left-0 w-full p-4 bg-gradient-to-b from-black/70 to-transparent z-[10000] pointer-events-none">
            <button
              className="pointer-events-auto text-white font-bold text-lg flex items-center gap-2 active:opacity-60 transition-opacity"
              onClick={() => setSelectedPost(null)}
              aria-label="Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back
            </button>
          </div>

          {/* Snap-scroll container */}
          <div
            ref={reelsScrollRef}
            className="h-full w-full overflow-y-scroll snap-y snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {feedItems.map((item) => (
              <div
                key={item.id}
                ref={(el) => { itemRefsMap.current[item.id] = el; }}
                className="h-[100dvh] w-full snap-start relative flex flex-col"
              >
                {/* ── Media area (flex-1 fills space between top gradient and drawer) ── */}
                <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
                  {item.display_image ? (
                    item.media_type === "video" ? (
                      <FeedVideo
                        src={item.display_image}
                        controls
                        playsInline
                        loop
                        className="max-h-full w-full object-contain"
                      />
                    ) : (
                      <img
                        src={item.display_image}
                        alt="Post media"
                        className="max-h-full w-full object-contain"
                        loading="lazy"
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                      <span className="text-7xl">🐾</span>
                      <span className="text-sm font-medium text-gray-400">No media</span>
                    </div>
                  )}
                </div>

                {/* ── Light Reels-style details drawer ── */}
                <div className="bg-white/95 backdrop-blur-xl text-gray-900 rounded-t-3xl px-5 pt-3 pb-8 overflow-y-auto overflow-x-visible max-h-[60vh] shrink-0 border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">

                  {/* Drag handle */}
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-5" />

                  {/* Profile row and Actions */}
                  <div className="flex items-center gap-3 mb-5">
                    {/* Clickable profile info */}
                    <div
                      className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                      onClick={() => item.user_id && setLocation(`/profile/${item.user_id}`)}
                      role="link"
                      aria-label={`View ${item.user_display_name}'s profile`}
                    >
                      <div className="h-11 w-11 rounded-full overflow-hidden bg-gray-100 shrink-0 ring-2 ring-gray-200 group-active:ring-gray-300 transition-all">
                        <img
                          src={item.user_avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id ?? item.id}`}
                          alt="avatar"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-[15px] truncate group-hover:text-gray-700 transition-colors">{item.user_display_name}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {parseUTCDate(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      {item.intent_status && INTENT_BADGE_COLORS[item.intent_status] && (
                        <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 shadow-sm", INTENT_BADGE_COLORS[item.intent_status])}>
                          {item.intent_status}
                        </span>
                      )}
                    </div>

                    {/* 3-Dot Menu for Author */}
                    {user?.id === item.user_id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 -mr-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors shrink-0 outline-none">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-white border-gray-200 text-gray-900 rounded-xl shadow-xl">
                          <DropdownMenuItem 
                            className="cursor-pointer focus:bg-gray-100 focus:text-gray-900 py-2.5"
                            onClick={(e) => { e.stopPropagation(); setPostToEdit(item); setIsCreateModalOpen(true); }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600 py-2.5"
                            onClick={(e) => { e.stopPropagation(); handleDeletePost(item.id, item.user_id!); }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Text content */}
                  {item.display_text && (
                    <div className="mb-6 bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <p className="text-[13px] sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">
                        {item.display_text}
                      </p>
                    </div>
                  )}

                  {/* Details chips */}
                  <div className="flex flex-wrap gap-2.5 mb-2">
                    {item.category && (
                      <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2.5 grow sm:grow-0 flex-1 min-w-[120px]">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Category</span>
                        <span className="text-[13px] sm:text-sm font-semibold text-gray-900 capitalize">{item.category}</span>
                      </div>
                    )}
                    {item.breed && (
                      <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2.5 grow sm:grow-0 flex-1 min-w-[120px]">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Breed</span>
                        <span className="text-[13px] sm:text-sm font-semibold text-gray-900 capitalize">{item.breed.replace(/-/g, ' ')}</span>
                      </div>
                    )}
                    {item.gender && (
                      <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2.5 grow sm:grow-0 flex-1 min-w-[120px]">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Gender</span>
                        <span className="text-[13px] sm:text-sm font-semibold text-gray-900 capitalize">{item.gender}</span>
                      </div>
                    )}
                    {item.location && (
                      <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2.5 grow sm:grow-0 flex-1 min-w-[120px]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <MapPin className="w-3 h-3 text-gray-500" />
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Location</span>
                        </div>
                        <span className="text-[13px] sm:text-sm font-semibold text-gray-900">
                          {item.location.split(':').pop() || item.location}
                        </span>
                      </div>
                    )}
                    {item.age && (
                      <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2.5 grow sm:grow-0 flex-1 min-w-[120px]">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Age</span>
                        <span className="text-[13px] sm:text-sm font-semibold text-gray-900">{item.age}</span>
                      </div>
                    )}
                    {item.price !== null && (
                      <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2.5 grow sm:grow-0 flex-1 min-w-[120px]">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Price</span>
                        <span className="text-[13px] sm:text-sm font-semibold text-[#FF6600]">₹{item.price.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {user?.id !== item.user_id && (
                    <div className="flex flex-row gap-3 mt-6">
                      <button
                        onClick={() => {
                          if (!user) {
                            setLocation('/login');
                          } else {
                            setLocation(`/inbox/${item.user_id}`);
                          }
                        }}
                        className="flex-1 bg-[#007699] hover:bg-[#005a75] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#007699]/20 flex items-center justify-center gap-2 text-sm sm:text-[15px] active:scale-[0.98]"
                      >
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        Message
                      </button>
                      {item.user_phone && (
                        <button
                          onClick={() => {
                            const formattedPhone = item.user_phone!.replace(/\D/g, '');
                            window.open(`https://wa.me/${formattedPhone}?text=I'm interested in your post on ScrollPet`, '_blank');
                          }}
                          className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 text-sm sm:text-[15px] active:scale-[0.98]"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          WhatsApp
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LIGHTBOX (media items only) ── */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            className="fixed top-4 right-4 text-white hover:text-white/70 bg-black/50 rounded-full p-2 cursor-pointer z-[70]"
            onClick={(e) => { e.stopPropagation(); setSelectedMedia(null); }}
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
                <FeedVideo
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
                        loading="lazy"
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
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-snug">
                            <span className="font-semibold text-gray-900 mr-1">Pet Lover</span>
                            <span className="text-gray-700">{c.content}</span>
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {parseUTCDate(c.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
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

      {/* Mobile FAB */}
      <button
        onClick={() => {
          if (!isAuthenticated) setLocation("/login?redirectTo=/feed&intent=create-post");
          else setIsCreateModalOpen(true);
        }}
        className="md:hidden fixed bottom-20 right-4 z-50 flex items-center justify-center w-14 h-14 bg-[#007699] text-white rounded-full shadow-lg hover:bg-[#005a75] hover:scale-105 active:scale-95 transition-all"
        aria-label="Create Post"
      >
        <Plus className="w-6 h-6" />
      </button>

      <CreatePostModal 
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setPostToEdit(null); }}
        onSuccess={() => {
          setSelectedPost(null);
          fetchFeed();
        }}
        postToEdit={postToEdit}
      />

      <Footer />
    </div>
  );
}
