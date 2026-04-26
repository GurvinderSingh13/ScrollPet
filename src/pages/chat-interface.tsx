import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  MoreVertical,
  Globe,
  Pin,
  BookOpen,
  Megaphone,
  Menu,
  X,
  ArrowLeft,
  User,
  AlertTriangle,
  Shield,
  Clock,
  Ban,
  Loader2,
  Newspaper,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Country, State, City } from "country-state-city";
import { ChatInput } from "@/components/ChatInput";
import { MessageBubble } from "@/components/MessageBubble";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format, isToday, isYesterday } from "date-fns";

import { PawPrint } from "lucide-react";

function isMessageTargetedToCurrentRoom(
  crosspostRoomsArray: string[],
  roomLocation: string,
  roomPet: string,
  roomBreed: string | null | undefined
): boolean {
  if (!Array.isArray(crosspostRoomsArray)) return false;
  const currentRoomId = `${roomLocation}::${roomPet}::${roomBreed || 'all'}`;
  
  if (crosspostRoomsArray.includes(currentRoomId)) return true;

  const currentBreed = roomBreed || 'all';

  for (const target of crosspostRoomsArray) {
    if (typeof target !== 'string') continue;
    const parts = target.split('::');
    if (parts.length !== 3) continue;
    
    const tLoc = parts[0];
    const tPet = parts[1];
    const tBreed = parts[2];

    // -- PET & BREED MATCHING --
    let petMatch = false;
    if (tPet === 'all' || roomPet === 'all' || tPet === roomPet) petMatch = true;
    if (!petMatch) continue;

    let breedMatch = false;
    if (tBreed === 'all' || currentBreed === 'all' || tBreed === currentBreed) breedMatch = true;
    if (!breedMatch) continue;

    // -- LOCATION MATCHING --
    let locMatch = false;
    if (tLoc === roomLocation) {
        locMatch = true;
    } else if (roomLocation === 'global' || tLoc === 'global') {
        locMatch = true;
    } else {
        const tLocParts = tLoc.split(':');
        const rLocParts = roomLocation.split(':');

        if (tLocParts[0] === 'country' && rLocParts[1] === tLocParts[1]) {
            locMatch = true;
        } else if (tLocParts[0] === 'state' && rLocParts[1] === tLocParts[1] && rLocParts[2] === tLocParts[2]) {
            locMatch = true;
        } else if (rLocParts[0] === 'country' && tLocParts[1] === rLocParts[1]) {
            locMatch = true;
        } else if (rLocParts[0] === 'state' && tLocParts[1] === rLocParts[1] && tLocParts[2] === rLocParts[2]) {
            locMatch = true;
        }
    }

    if (locMatch) return true;
  }

  return false;
}

function usePinnedStates() {
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("pinnedStates");
    return saved ? JSON.parse(saved) : [];
  });
  const togglePin = useCallback((stateId: string) => {
    setPinnedIds((prev) => {
      const newPinned = prev.includes(stateId)
        ? prev.filter((id) => id !== stateId)
        : [...prev, stateId];
      localStorage.setItem("pinnedStates", JSON.stringify(newPinned));
      return newPinned;
    });
  }, []);
  const isPinned = useCallback(
    (stateId: string) => pinnedIds.includes(stateId),
    [pinnedIds],
  );
  return { pinnedIds, togglePin, isPinned };
}

const canBanTarget = (myRole: string, targetRole: string) => {
  if (myRole === "admin") return targetRole !== "admin";
  if (myRole === "staff") return !["admin", "staff"].includes(targetRole);
  if (myRole === "super_moderator")
    return !["admin", "staff", "super_moderator"].includes(targetRole);
  if (myRole === "moderator") return targetRole === "user";
  return false;
};

const PawIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <circle cx="7" cy="8" r="2.5" />
    <circle cx="17" cy="8" r="2.5" />
    <circle cx="12" cy="5" r="2.5" />
    <path d="M12 11c-2.5 0-5 1.5-5 4s2 4 5 4 5-1.5 5-4-2.5-4-5-4z" />
  </svg>
);

export default function ChatInterface() {
  const [activePet, setActivePet] = useState(() => {
    // URL param takes priority over cached "last visited" state
    if (typeof window !== "undefined") {
      const urlCategory = new URLSearchParams(window.location.search).get("category");
      if (urlCategory && urlCategory.trim()) {
        return urlCategory.toLowerCase().trim();
      }
    }
    return sessionStorage.getItem("activePet") || "dog";
  });

  // Once consumed, strip ?category= from the URL so later in-app pet switches stick on refresh
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("category")) {
      params.delete("category");
      const qs = params.toString();
      const newUrl = window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const [activeBreed, setActiveBreed] = useState<string | null>(() => sessionStorage.getItem("activeBreed") || null);
  const [activeLocation, setActiveLocation] = useState(() => sessionStorage.getItem("activeLocation") || "global");
  const [activeDistrict, setActiveDistrict] = useState<string | null>(() => sessionStorage.getItem("activeDistrict") || null);
  const [activeDmUser, setActiveDmUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => { sessionStorage.setItem("activePet", activePet); }, [activePet]);
  useEffect(() => { if (activeBreed) sessionStorage.setItem("activeBreed", activeBreed); else sessionStorage.removeItem("activeBreed"); }, [activeBreed]);
  useEffect(() => { sessionStorage.setItem("activeLocation", activeLocation); }, [activeLocation]);
  useEffect(() => { if (activeDistrict) sessionStorage.setItem("activeDistrict", activeDistrict); else sessionStorage.removeItem("activeDistrict"); }, [activeDistrict]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarView, setSidebarView] = useState<"public" | "private">(
    "public",
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadDmCount, setUnreadDmCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [replyToUser, setReplyToUser] = useState<{ id: string, name: string } | null>(null);

  const [modSelectedCountry, setModSelectedCountry] = useState<string | null>(
    null,
  );
  const [isModCountryOpen, setIsModCountryOpen] = useState(false);

  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [userToBan, setUserToBan] = useState<{
    id: string;
    displayName: string;
    role?: string;
  } | null>(null);
  const [banDuration, setBanDuration] = useState("24h");
  const [banScope, setBanScope] = useState("global");
  const [isProcessingBan, setIsProcessingBan] = useState(false);
  const [shouldDeleteMessages, setShouldDeleteMessages] = useState(false);
  const [selectedBanRooms, setSelectedBanRooms] = useState<Array<{location: string, petType: string, breed: string | null}>>([]);

  const [isNewsRoom, setIsNewsRoom] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [hasNewAnnouncements, setHasNewAnnouncements] = useState(true);

  const [isCrosspostModalOpen, setIsCrosspostModalOpen] = useState(false);
  const [pendingMessagePayload, setPendingMessagePayload] = useState<any>(null);
  const [crosspostOptions, setCrosspostOptions] = useState<{id: string, label: string}[]>([]);
  const [isSendingCrosspost, setIsSendingCrosspost] = useState(false);

  // New States for Advanced Crossposting
  const [crosspostGlobal, setCrosspostGlobal] = useState(false);
  const [crosspostCurrentRoom, setCrosspostCurrentRoom] = useState(true);
  const [crosspostCountry, setCrosspostCountry] = useState(false);
  const [crosspostAllBreedsInLoc, setCrosspostAllBreedsInLoc] = useState(false);
  const [builderState, setBuilderState] = useState<string>("");
  const [builderCity, setBuilderCity] = useState<string>("");
  const [builderCategory, setBuilderCategory] = useState<string>("");
  const [builderBreed, setBuilderBreed] = useState<string>("");
  const [autoIncludeParents, setAutoIncludeParents] = useState(true);

  const userId = user?.id || "";
  const displayName =
    user?.displayName ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Anonymous";
  const { pinnedIds, togglePin, isPinned } = usePinnedStates();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) window.location.href = "/login";
  }, [authLoading, isAuthenticated]);

  // Fetch categories dynamically from Supabase
  const { data: dbCategories = [] } = useQuery({
    queryKey: ["chat-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Find the active category ID based on the activePet name
  const activeCategoryObj = dbCategories.find(
    (c: any) => c.name.toLowerCase() === activePet.toLowerCase()
  );
  const activeCategoryId = activeCategoryObj?.id;

  // Fetch breeds dynamically based on activeCategoryId
  const { data: dbBreeds = [], isLoading: isLoadingBreeds } = useQuery({
    queryKey: ["chat-breeds", activeCategoryId],
    queryFn: async () => {
      if (!activeCategoryId) return [];
      const { data, error } = await supabase
        .from("breeds")
        .select("*")
        .eq("category_id", activeCategoryId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeCategoryId,
  });

  // Find the builder category object to get its proper ID
  const builderCategoryObj = dbCategories.find(
    (c: any) => c.name.toLowerCase() === builderCategory.toLowerCase() || c.id === builderCategory
  );
  const builderCategoryId = builderCategoryObj?.id;

  // Fetch breeds dynamically for the Crosspost Builder
  const { data: builderBreeds = [], isLoading: isLoadingBuilderBreeds } = useQuery({
    queryKey: ["chat-breeds-builder", builderCategoryId],
    queryFn: async () => {
      if (!builderCategoryId) return [];
      const { data, error } = await supabase
        .from("breeds")
        .select("*")
        .eq("category_id", builderCategoryId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!builderCategoryId,
  });

  const { data: dbUser } = useQuery({
    queryKey: ["db-user-chat", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("users")
        .select("country, state, role, news_cooldown_hours, enable_crossposting")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });


  const { data: myBans } = useQuery({
    queryKey: ["my-ban-status", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("bans")
        .select("*")
        .eq("user_id", userId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("created_at", { ascending: false });
      if (error && error.code !== "PGRST116") throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const isCurrentlyBanned = myBans?.some((ban: any) => {
    // Global ban
    if (!ban.target_location && !ban.target_pet && !ban.target_breed) return true;
    
    // Room specific ban match
    if (
      ban.target_location === chatRoomLocation &&
      ban.target_pet === activePet &&
      (ban.target_breed === activeBreed || ban.target_breed === null)
    ) return true;
    
    return false;
  }) || false;

  const userRole = dbUser?.role || "user";
  const isModOrAbove = [
    "moderator",
    "super_moderator",
    "staff",
    "admin",
  ].includes(userRole);

  const cooldownHours = dbUser?.news_cooldown_hours ?? 24;

  const effectiveCountryName =
    isModOrAbove && modSelectedCountry ? modSelectedCountry : dbUser?.country;
  const userCountryObj = effectiveCountryName
    ? Country.getAllCountries().find((c) => c.name === effectiveCountryName)
    : null;
  const countryCode = userCountryObj?.isoCode;
  const countryStates = countryCode
    ? State.getStatesOfCountry(countryCode)
    : [];

  const pinnedStates = countryStates.filter((s) => pinnedIds.includes(s.isoCode));
  const unpinnedStates = countryStates.filter((s) => !pinnedIds.includes(s.isoCode));

  let chatRoomLocation = "global";
  if (activeLocation === "staff_lounge") chatRoomLocation = "staff_lounge";
  else if (activeLocation === "country" && countryCode)
    chatRoomLocation = `country:${countryCode}`;
  else if (
    activeLocation !== "global" &&
    activeLocation !== "country" &&
    countryCode &&
    activeLocation !== "staff_lounge"
  ) {
    if (activeDistrict)
      chatRoomLocation = `city:${countryCode}:${activeLocation}:${activeDistrict}`;
    else chatRoomLocation = `state:${countryCode}:${activeLocation}`;
  }

  useEffect(() => {
    const tLoc = sessionStorage.getItem("teleport_location");
    const tPet = sessionStorage.getItem("teleport_pet");
    const tDmId = sessionStorage.getItem("teleport_dm_user_id");
    const tDmName = sessionStorage.getItem("teleport_dm_user_name");

    if (tLoc) {
      if (tPet) setActivePet(tPet);
      if (tLoc === "global" || tLoc === "staff_lounge") {
        setActiveLocation(tLoc);
      } else if (tLoc.startsWith("country:")) {
        const cc = tLoc.split(":")[1];
        const cObj = Country.getCountryByCode(cc);
        if (cObj) setModSelectedCountry(cObj.name);
        setActiveLocation("country");
      } else if (tLoc.startsWith("state:")) {
        const parts = tLoc.split(":");
        const cObj = Country.getCountryByCode(parts[1]);
        if (cObj) setModSelectedCountry(cObj.name);
        setActiveLocation(parts[2]);
      } else if (tLoc.startsWith("city:")) {
        const parts = tLoc.split(":");
        const cObj = Country.getCountryByCode(parts[1]);
        if (cObj) setModSelectedCountry(cObj.name);
        setActiveLocation(parts[2]);
        setActiveDistrict(parts[3]);
      }
      sessionStorage.removeItem("teleport_location");
      sessionStorage.removeItem("teleport_pet");
      setSidebarView("public");
      setMobileView("chat");
    } else if (tDmId && tDmName) {
      // Auto-load direct message routing
      setActiveDmUser({ id: tDmId, name: tDmName });
      setIsNewsRoom(false);
      setSidebarView("private");
      setMobileView("chat");
      sessionStorage.removeItem("teleport_dm_user_id");
      sessionStorage.removeItem("teleport_dm_user_name");
    }
  }, []);

  const needsInstantScroll = useRef(true);

  // Any room change (location / pet / breed / DM target) re-arms the instant scroll
  useEffect(() => {
    needsInstantScroll.current = true;
  }, [chatRoomLocation, activePet, activeBreed, activeDmUser]);

  useEffect(() => {
    if (messages.length === 0) return; // Wait for data

    const scrollDelay = setTimeout(() => {
      if (needsInstantScroll.current) {
        // "instant" forces a hard jump even if container CSS sets scroll-behavior: smooth
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
        needsInstantScroll.current = false;
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }, 50); // 50ms gives the browser time to render message heights

    return () => clearTimeout(scrollDelay);
  }, [messages, announcements]);
  const isFirstPetRender = useRef(true);
  useEffect(() => {
    if (isFirstPetRender.current) {
      isFirstPetRender.current = false;
      return;
    }
    setActiveBreed(null);
  }, [activePet]);

  const isFirstLocRender = useRef(true);
  useEffect(() => {
    if (isFirstLocRender.current) {
      isFirstLocRender.current = false;
      return;
    }
    setActiveDistrict(null);
  }, [activeLocation]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileView("chat");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activePetData = dbCategories.find((c: any) => c.name?.toLowerCase() === activePet?.toLowerCase()) || null;

  const handleLocationClick = (locId: string) => {
    setActiveLocation(locId);
    setActiveDistrict(null);
    setActiveDmUser(null);
    setSidebarView("public");
    setMobileView("chat");
    setIsNewsRoom(false);
  };

  const handleUserClick = (clickedUserId: string, clickedUserName: string) => {
    if (clickedUserId === userId) return;
    setActiveDmUser({ id: clickedUserId, name: clickedUserName });
    setSidebarView("private");
    setMobileView("chat");
    setIsNewsRoom(false);
  };

  useEffect(() => {
    if (!isNewsRoom || activeDmUser || !userId) return;

    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select(`*, users:users!author_id(id, username, display_name, role)`)
        .eq("target_location", chatRoomLocation)
        .eq("target_pet", activePet)
        .or(`status.eq.approved,author_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && data) {
        setAnnouncements(data.reverse());
        setHasNewAnnouncements(false);
      }
    };
    fetchAnnouncements();
  }, [isNewsRoom, chatRoomLocation, activePet, activeDmUser, userId]);

  useEffect(() => {
    if (!userId || isNewsRoom) return;
    let cancelled = false;
    setMessages([]);

    const fetchMessages = async () => {
      let data: any[] | null = null;
      let error: any = null;

      if (activeDmUser) {
        const result = await supabase
          .from("messages")
          .select(
            `*, users:users!user_id(id, username, display_name, state, country, role)`,
          )
          .or(
            `and(user_id.eq.${userId},receiver_id.eq.${activeDmUser.id}),and(user_id.eq.${activeDmUser.id},receiver_id.eq.${userId})`,
          )
          .order("created_at", { ascending: false })
          .limit(50);
        data = result.data;
        error = result.error;
      } else {
        const currentRoomId = `${chatRoomLocation}::${activePet}::${activeBreed || 'all'}`;
        let query = supabase
          .from("messages")
          .select(
            `*, users:users!user_id(id, username, display_name, state, country, role)`,
          )
          .is("receiver_id", null);

        if (chatRoomLocation !== "staff_lounge") {
          const nativeMatch = `and(location.eq.${chatRoomLocation},pet_type.eq.${activePet}${activeBreed ? `,breed.eq.${activeBreed}` : ''})`;
          const crosspostMatch = `crosspost_rooms.cs.{${currentRoomId}}`;
          query = query.or(`${nativeMatch},${crosspostMatch}`);
        } else {
          query = query.eq("location", "staff_lounge");
        }
        
        query = query.order("created_at", { ascending: false }).limit(50);
        const result = await query;
        data = result.data;
        error = result.error;
      }

      if (cancelled) return;
      if (error) return;

      const mapped = (data || []).map((row: any) => {
        const userData = row.users || row.users_messages_user_id_fkey;
        return {
          id: row.id,
          userId: row.user_id,
          petType: row.pet_type,
          location: row.location,
          content: row.content,
          messageType: row.message_type,
          mediaUrl: row.media_url,
          mediaDuration: row.media_duration,
          createdAt: row.created_at,
          receiverId: row.receiver_id,
          user: userData
            ? {
              id: userData.id,
              username: userData.username || "",
              displayName: userData.display_name || userData.username || "",
              state: userData.state || "",
              country: userData.country || "",
              role: userData.role || "user",
            }
            : {
              id: row.user_id,
              username: "Unknown",
              displayName: "Unknown",
              state: "",
              country: "",
              role: "user",
            },
        };
      });
      setMessages(mapped.reverse());
    };

    fetchMessages();
    return () => {
      cancelled = true;
    };
  }, [
    userId,
    activePet,
    activeBreed,
    chatRoomLocation,
    activeDmUser?.id,
    isNewsRoom,
  ]);

  const handleNewMessage = useCallback(
    (newMessage: any) => {
      if (isNewsRoom) return;
      if (
        newMessage.receiverId &&
        newMessage.receiverId === userId &&
        !activeDmUser
      ) {
        setUnreadDmCount((prev) => prev + 1);
      }
      
      if (newMessage.replyToUserId === userId && newMessage.userId !== userId) {
        toast({
          title: "Reply received",
          description: `@${newMessage.user?.displayName || 'Someone'} replied to your message.`,
        });
      }

      setMessages((prev) => {
        if (activeDmUser) {
          const isFromMeToThem =
            newMessage.userId === userId &&
            newMessage.receiverId === activeDmUser.id;
          const isFromThemToMe =
            newMessage.userId === activeDmUser.id &&
            newMessage.receiverId === userId;
          if (!isFromMeToThem && !isFromThemToMe) return prev;
        } else {
          if (newMessage.receiverId) return prev;
          
          let matchesCurrentRoom = false;
          if (chatRoomLocation === "staff_lounge") {
             matchesCurrentRoom = newMessage.location === "staff_lounge";
          } else {
             const crosspostRoomsArray = newMessage.crosspost_rooms || newMessage.crosspostRooms || [];
             matchesCurrentRoom = isMessageTargetedToCurrentRoom(crosspostRoomsArray, chatRoomLocation, activePet, activeBreed);
          }
          
          if (!matchesCurrentRoom) return prev;
        }
        return [...prev, newMessage];
      });
    },
    [
      activeDmUser,
      userId,
      chatRoomLocation,
      activeBreed,
      activePet,
      isNewsRoom,
    ],
  );

  const { isConnected, sendMessage: sendWsMessage } = useWebSocket({
    userId,
    petType: activePet,
    breed: activeBreed,
    location: chatRoomLocation,
    onMessage: handleNewMessage,
  });

  const { data: dmContacts } = useQuery({
    queryKey: ["dmContacts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `user_id, receiver_id, users:users!user_id(id, display_name, username), receiver:users!receiver_id(id, display_name, username)`,
        )
        .not("receiver_id", "is", null)
        .or(`user_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const contactsMap = new Map();
      data?.forEach((msg: any) => {
        if (
          msg.user_id !== userId &&
          msg.users &&
          !contactsMap.has(msg.user_id)
        )
          contactsMap.set(msg.user_id, {
            id: msg.user_id,
            name: msg.users.display_name || msg.users.username || "Unknown",
          });
        if (
          msg.receiver_id !== userId &&
          msg.receiver_id &&
          msg.receiver &&
          !contactsMap.has(msg.receiver_id)
        )
          contactsMap.set(msg.receiver_id, {
            id: msg.receiver_id,
            name:
              msg.receiver.display_name || msg.receiver.username || "Unknown",
          });
      });
      return Array.from(contactsMap.values());
    },
    enabled: !!userId,
  });

  const handleDeleteAnnouncement = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", postId);
      if (error) throw error;
      setAnnouncements((prev) => prev.filter((p) => p.id !== postId));
      toast({ description: "Post deleted successfully." });
    } catch (err: any) {
      toast({ description: "Could not delete post.", variant: "destructive" });
    }
  };

  // --- NEW DELETE MESSAGE FUNCTION ---
  const handleDeleteMessage = async (messageId: string) => {
    try {
      let query = supabase.from("messages").delete().eq("id", messageId);
      if (!isModOrAbove) {
        query = query.eq("user_id", userId); // Security check
      }
      const { error } = await query;

      if (error) throw error;

      // Remove from screen
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      toast({ description: isModOrAbove ? "Message deleted." : "Message unsent." });
    } catch (err: any) {
      toast({ description: "Could not delete message.", variant: "destructive" });
    }
  };
  // -----------------------------------

  const handleSendMessage = async (
    content: string,
    messageType: string = "text",
    mediaFile?: File | Blob,
    mediaDuration?: number,
  ): Promise<boolean> => {
    if (!isConnected && !isNewsRoom) return false;

    if (isCurrentlyBanned) {
      toast({
        description: "You are currently banned from sending messages in this room or globally.",
        variant: "destructive",
      });
      return false;
    }

    try {
      if (isNewsRoom) {
        if (!isModOrAbove) {
          const { data: lastPost } = await supabase
            .from("announcements")
            .select("created_at")
            .eq("author_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          if (lastPost) {
            const lastPostTime = new Date(lastPost.created_at).getTime();
            const now = new Date().getTime();
            const hoursSinceLastPost = (now - lastPostTime) / (1000 * 60 * 60);

            if (hoursSinceLastPost < cooldownHours) {
              const hoursLeft = Math.ceil(cooldownHours - hoursSinceLastPost);
              toast({
                description: `You are on cooldown. Please wait ${hoursLeft} more hour(s) before posting again.`,
                variant: "destructive",
              });
              return false;
            }
          }
        }

        let mediaUrl: string | null = null;
        if (mediaFile) {
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const ext =
            mediaFile instanceof File
              ? mediaFile.name.split(".").pop()
              : "webm";
          const filePath = `chat-media/${fileName}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("chat-uploads")
            .upload(filePath, mediaFile);
          if (uploadError) return false;
          const { data: urlData } = supabase.storage
            .from("chat-uploads")
            .getPublicUrl(filePath);
          mediaUrl = urlData.publicUrl;
        }

        const postStatus = isModOrAbove ? "approved" : "pending";
        const { error } = await supabase.from("announcements").insert({
          author_id: userId,
          content:
            content ||
            (messageType === "audio"
              ? "🎤 Voice message"
              : "📎 Media Announcement"),
          media_url: mediaUrl,
          target_location: chatRoomLocation,
          target_pet: activePet,
          status: postStatus,
        });

        if (error) throw error;

        if (postStatus === "pending") {
          toast({
            title: "Submitted for Review",
            description:
              "Your post will appear in the News Room once approved by an Admin.",
          });
        } else {
          toast({ description: "Announcement Published Live!" });
        }

        setAnnouncements((prev) => [
          ...prev,
          {
            id: "temp-" + Date.now(),
            content,
            media_url: mediaUrl,
            target_location: chatRoomLocation,
            target_pet: activePet,
            created_at: new Date().toISOString(),
            status: postStatus,
            users: {
              id: userId,
              display_name: displayName,
              role: userRole,
              username: displayName,
            },
            author_id: userId,
          },
        ]);

        return true;
      }

      let mediaUrl: string | null = null;
      if (mediaFile) {
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const ext =
          mediaFile instanceof File ? mediaFile.name.split(".").pop() : "webm";
        const filePath = `chat-media/${fileName}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("chat-uploads")
          .upload(filePath, mediaFile);
        if (uploadError) return false;
        const { data: urlData } = supabase.storage
          .from("chat-uploads")
          .getPublicUrl(filePath);
        mediaUrl = urlData.publicUrl;
      }

      const currentRoomId = `${chatRoomLocation}::${activePet}::${activeBreed || 'all'}`;
      const insertData: any = {
        user_id: userId,
        pet_type: activePet,
        location: chatRoomLocation,
        content:
          content ||
          (messageType === "audio" ? "🎤 Voice message" : "📎 Media"),
        message_type: messageType,
        media_url: mediaUrl,
        media_duration: mediaDuration || null,
        receiver_id: activeDmUser ? activeDmUser.id : null,
        reply_to_user_id: replyToUser ? replyToUser.id : null,
        crosspost_rooms: [currentRoomId]
      };

      if (activeBreed && !activeDmUser && chatRoomLocation !== "staff_lounge")
        insertData.breed = activeBreed;

      // INTERCEPT CROSSPOSTING
      if (
        dbUser?.enable_crossposting &&
        !activeDmUser &&
        chatRoomLocation !== "staff_lounge" &&
        !isNewsRoom
      ) {
        const options: { id: string; label: string }[] = [];
        const locParts = chatRoomLocation.split(":");
        
        if (locParts[0] === "city") {
          options.push({ id: `state:${locParts[1]}:${locParts[2]}::${activePet}::${activeBreed || 'all'}`, label: `State: ${locParts[2]}` });
          options.push({ id: `country:${locParts[1]}::${activePet}::${activeBreed || 'all'}`, label: `Country: ${locParts[1]}` });
          options.push({ id: `global::${activePet}::${activeBreed || 'all'}`, label: `Global Room` });
        } else if (locParts[0] === "state") {
          options.push({ id: `country:${locParts[1]}::${activePet}::${activeBreed || 'all'}`, label: `Country: ${locParts[1]}` });
          options.push({ id: `global::${activePet}::${activeBreed || 'all'}`, label: `Global Room` });
        } else if (locParts[0] === "country") {
          options.push({ id: `global::${activePet}::${activeBreed || 'all'}`, label: `Global Room` });
        }

        if (activeBreed) {
          options.push({ id: `${chatRoomLocation}::${activePet}::all`, label: `All ${activePet}s in ${chatRoomLocation.split(':').pop()}` });
        }

        if (options.length > 0) {
          setPendingMessagePayload(insertData);
          setCrosspostOptions(options);
          
          // Reset Builder States for a fresh start
          setCrosspostGlobal(false);
          setCrosspostCurrentRoom(true);
          setCrosspostCountry(false);
          setCrosspostAllBreedsInLoc(false);
          setBuilderState("");
          setBuilderCity("");
          setBuilderCategory(activePet); // Default to current pet type for convenience
          setBuilderBreed("");
          setAutoIncludeParents(true);


          setIsCrosspostModalOpen(true);
          return true; // Stop here, wait for modal
        }
      }

      const { data: insertedMsg, error } = await supabase.from("messages").insert(insertData).select(`*, users:users!user_id(id, username, display_name, state, country, role)`).single();
      if (error) throw error;
      
      if (insertedMsg) {
        const userData = insertedMsg.users || insertedMsg.users_messages_user_id_fkey;
        const formattedMsg = {
          id: insertedMsg.id,
          userId: insertedMsg.user_id,
          petType: insertedMsg.pet_type,
          location: insertedMsg.location,
          content: insertedMsg.content,
          messageType: insertedMsg.message_type,
          mediaUrl: insertedMsg.media_url,
          mediaDuration: insertedMsg.media_duration,
          createdAt: insertedMsg.created_at,
          receiverId: insertedMsg.receiver_id,
          user: userData
            ? {
              id: userData.id,
              username: userData.username || "",
              displayName: userData.display_name || userData.username || "",
              state: userData.state || "",
              country: userData.country || "",
              role: userData.role || "user",
            }
            : {
              id: insertedMsg.user_id,
              username: displayName,
              displayName: displayName,
              state: "",
              country: "",
              role: userRole,
            },
        };
        // STRICT OPTIMISTIC GUARD
        const targetRooms = insertedMsg.crosspost_rooms || [];
        const isTargeted = activeDmUser ? true : (
           chatRoomLocation === "staff_lounge" 
             ? insertedMsg.location === "staff_lounge" 
             : isMessageTargetedToCurrentRoom(targetRooms, chatRoomLocation, activePet, activeBreed)
        );

        if (isTargeted) {
          setMessages((prev) => {
            if (prev.some(m => m.id === formattedMsg.id)) return prev;
            return [...prev, formattedMsg];
          });
        }
      }

      return true;
    } catch (error: any) {
      console.error("Message send error:", error);
      toast({
        title: "Error Sending Message",
        description: error?.message || "System Error processing message.",
        variant: "destructive",
      });
      return false;
    }
  };

  const generateHierarchicalTags = (country: string, state: string, city: string, category: string, breed: string) => {
    const tags: string[] = [];
    const c = category || "all";
    const b = breed || "all";

    // 1. City Level
    if (city && state && country) {
      const loc = `city:${country}:${state}:${city}`;
      tags.push(`${loc}::${c}::${b}`);
      tags.push(`${loc}::${c}::all`);
      tags.push(`${loc}::all::all`);
    }

    // 2. State Level
    if (state && country) {
      const loc = `state:${country}:${state}`;
      tags.push(`${loc}::${c}::${b}`);
      tags.push(`${loc}::${c}::all`);
      tags.push(`${loc}::all::all`);
    }

    // 3. Country Level
    if (country) {
      const loc = `country:${country}`;
      tags.push(`${loc}::${c}::${b}`);
      tags.push(`${loc}::${c}::all`);
      tags.push(`${loc}::all::all`);
    }

    return tags;
  };

  const submitCrosspostMessage = async () => {
    if (!pendingMessagePayload) return;
    setIsSendingCrosspost(true);
    
    // Combine and deduplicate rooms
    const allRoomsSet = new Set<string>();
    
    // 1. Current Room (Optional)
    if (crosspostCurrentRoom) {
      const currentRoomId = `${pendingMessagePayload.location}::${activePet}::${activeBreed || 'all'}`;
      allRoomsSet.add(currentRoomId);
    }
    
    // 2. Quick Toggles
    if (crosspostGlobal) {
      allRoomsSet.add(`global::${activePet}::${activeBreed || 'all'}`);
    }
    if (crosspostCountry && countryCode) {
      allRoomsSet.add(`country:${countryCode}::${activePet}::${activeBreed || 'all'}`);
    }
    if (crosspostAllBreedsInLoc) {
      allRoomsSet.add(`${chatRoomLocation}::${activePet}::all`);
    }
    
    // 2b. Include global room if checked (ensuring exact format)
    if (crosspostGlobal) {
      allRoomsSet.add(`global::${activePet}::${activeBreed || 'all'}`);
    }

    // 3. Custom Builder Selection with Hierarchical Logic
    if (builderCategory) {
      if (autoIncludeParents) {
        const generatedTags = generateHierarchicalTags(countryCode || "", builderState, builderCity, builderCategory, builderBreed);
        generatedTags.forEach((tag: string) => allRoomsSet.add(tag));
      } else {
        // Direct Only
        let loc = "";
        if (builderCity && builderState) {
          loc = `city:${countryCode}:${builderState}:${builderCity}`;
        } else if (builderState) {
          loc = `state:${countryCode}:${builderState}`;
        } else if (countryCode) {
          loc = `country:${countryCode}`;
        }

        if (loc) {
          allRoomsSet.add(`${loc}::${builderCategory || "all"}::${builderBreed || "all"}`);
        }
      }
    }

    const finalRooms = Array.from(allRoomsSet);
    console.log("DEBUG: Final Crosspost Rooms:", finalRooms);

    if (finalRooms.length === 0) {
      toast({
        title: "No Target Selected",
        description: "Please select at least one room to post your message.",
        variant: "destructive",
      });
      setIsSendingCrosspost(false);
      return;
    }

    try {
      const payload = {
        ...pendingMessagePayload,
        crosspost_rooms: finalRooms,
      };
      const { data: insertedMsg, error } = await supabase.from("messages").insert(payload).select(`*, users:users!user_id(id, username, display_name, state, country, role)`).single();
      if (error) throw error;
      
      if (insertedMsg) {
        const userData = insertedMsg.users || insertedMsg.users_messages_user_id_fkey;
        const formattedMsg = {
          id: insertedMsg.id,
          userId: insertedMsg.user_id,
          petType: insertedMsg.pet_type,
          location: insertedMsg.location,
          content: insertedMsg.content,
          messageType: insertedMsg.message_type,
          mediaUrl: insertedMsg.media_url,
          mediaDuration: insertedMsg.media_duration,
          createdAt: insertedMsg.created_at,
          receiverId: insertedMsg.receiver_id,
          crosspostRooms: insertedMsg.crosspost_rooms,
          user: userData ? {
            id: userData.id,
            username: userData.username || "",
            displayName: userData.display_name || userData.username || "",
            state: userData.state || "",
            country: userData.country || "",
            role: userData.role || "user",
          } : {
            id: insertedMsg.user_id,
            username: displayName,
            displayName: displayName,
            state: "",
            country: "",
            role: userRole,
          },
        };

        // SENDER OPTIMISTIC GUARD: Only append to local state if current room was targeted
        const finalCrosspostRoomsArray = insertedMsg.crosspost_rooms || [];
        const isOptTargeted = isMessageTargetedToCurrentRoom(finalCrosspostRoomsArray, chatRoomLocation, activePet, activeBreed);
            
        if (isOptTargeted) {
          setMessages((prev) => {
            if (prev.some(m => m.id === formattedMsg.id)) return prev;
            return [...prev, formattedMsg];
          });
        }
      }
      setIsCrosspostModalOpen(false);
      setPendingMessagePayload(null);
    } catch(err: any) {
      toast({description: err.message || "Failed to crosspost", variant: "destructive"});
    } finally {
      setIsSendingCrosspost(false);
    }
  };

  const handleOpenDirectBan = (targetUser: {
    id: string;
    displayName: string;
    role?: string;
  }) => {
    if (!canBanTarget(userRole, targetUser.role || "user")) {
      toast({
        description: `Your rank (${userRole}) cannot ban a ${targetUser.role || "user"}.`,
        variant: "destructive",
      });
      return;
    }
    setUserToBan(targetUser);
    setSelectedBanRooms([{ location: chatRoomLocation, petType: activePet, breed: activeBreed || null }]);
    setShouldDeleteMessages(false);
    setIsBanModalOpen(true);
  };

  const handleIssueDirectBan = async () => {
    if (!userToBan || !user) return;
    setIsProcessingBan(true);
    try {
      let expiresAt = null;
      if (banDuration !== "permanent") {
        const now = new Date();
        if (banDuration === "6h") now.setHours(now.getHours() + 6);
        else if (banDuration === "12h") now.setHours(now.getHours() + 12);
        else if (banDuration === "24h") now.setHours(now.getHours() + 24);
        else if (banDuration === "3d") now.setDate(now.getDate() + 3);
        else if (banDuration === "7d") now.setDate(now.getDate() + 7);
        else if (banDuration === "30d") now.setDate(now.getDate() + 30);
        else if (banDuration === "1y") now.setFullYear(now.getFullYear() + 1);
        expiresAt = now.toISOString();
      }

      if (banScope === "room" && selectedBanRooms.length > 0) {
        for (const room of selectedBanRooms) {
          const insertPayload: any = {
            user_id: userToBan.id,
            banned_by: user.id,
            reason: `Direct ban issued from Chat Room by Moderation.`,
            expires_at: expiresAt,
            target_location: room.location,
            target_pet: room.petType,
            target_breed: room.breed || null,
          };
          const { error: banError } = await supabase.from("bans").insert(insertPayload);
          if (banError) throw banError;
        }
      } else {
        const insertPayload: any = {
           user_id: userToBan.id,
           banned_by: user.id,
           reason: `Direct ban issued from Chat Room by Moderation.`,
           expires_at: expiresAt,
        };
        const { error: banError } = await supabase.from("bans").insert(insertPayload);
        if (banError) throw banError;
      }

      if (shouldDeleteMessages) {
        if (banScope === "global") {
          await supabase.from("messages").delete().eq("user_id", userToBan.id);
          setMessages((prev) => prev.filter((m) => m.userId !== userToBan?.id));
        } else {
          for (const room of selectedBanRooms) {
             let query = supabase.from("messages").delete().eq("user_id", userToBan.id)
                .eq("location", room.location).eq("pet_type", room.petType);
             if (room.breed) query = query.eq("breed", room.breed);
             await query;
          }
          setMessages((prev) => prev.filter((m) => m.userId !== userToBan?.id));
        }
      }
      toast({ description: `Ban issued successfully for ${banDuration}.` });
      setIsBanModalOpen(false);
      setUserToBan(null);
    } catch (err: any) {
      toast({
        description: err.message || "Failed to issue ban.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingBan(false);
    }
  };

  const getHeaderDisplayName = () => {
    if (activeDmUser) return `Chat with @${activeDmUser.name}`;
    if (isNewsRoom)
      return `News Room: ${activeLocation === "global" ? "Global" : activeLocation === "country" ? userCountryObj?.name : activeDistrict || countryStates.find((s) => s.isoCode === activeLocation)?.name}`;
    if (activeLocation === "global") return "Global Room";
    if (activeLocation === "staff_lounge") return "Staff Lounge";
    if (activeLocation === "country")
      return userCountryObj?.name || "Country Room";
    const stateObj = countryStates.find((s) => s.isoCode === activeLocation);
    if (activeDistrict)
      return `${stateObj?.name || "State"} - ${activeDistrict}`;
    return stateObj?.name || "State Room";
  };
  const currentDistricts =
    activeLocation !== "global" &&
      activeLocation !== "country" &&
      activeLocation !== "staff_lounge" &&
      countryCode
      ? City.getCitiesOfState(countryCode, activeLocation)
      : [];

  return (
    <div className="h-[100dvh] flex flex-col bg-background font-sans overflow-hidden">
      <header className="flex-none sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 transition-all">
        <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="cursor-pointer">
            <img
              src={logoImage}
              alt="ScrollPet Logo"
              className="h-8 md:h-12 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8 bg-muted/50 px-6 py-2 rounded-full border border-border/50">
            <Link
              href="/"
              className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
            >
              Home
            </Link>
            <Link
              href="/chat"
              className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
            >
              Chat Rooms
            </Link>
            <Link
              href="/about"
              className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
            >
              About Us
            </Link>
            <Link
              href="/faq"
              className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
            >
              Contact Us
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              {authLoading ? (
                <Button variant="ghost" disabled>
                  ...
                </Button>
              ) : isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-10 w-10 rounded-full border border-border bg-muted flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
                      {user?.id ? (
                        <img
                          src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                          alt="User"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`;
                          }}
                        />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/user-profile"
                        className="w-full cursor-pointer flex items-center"
                      >
                        Profile Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {isModOrAbove && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/admin"
                          className="w-full cursor-pointer flex items-center text-[#007699] font-bold"
                        >
                          Moderation Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-destructive cursor-pointer flex items-center font-medium"
                    >
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => (window.location.href = "/login")}
                  className="font-bold cursor-pointer rounded-full px-6"
                >
                  Login
                </Button>
              )}
            </div>
            
            <button
              className="md:hidden p-2 text-foreground cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border/40 shadow-lg p-4 flex flex-col gap-4 z-40">
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-foreground/80 hover:text-primary transition-colors py-2 font-medium">Home</Link>
            <Link href="/chat" onClick={() => setIsMenuOpen(false)} className="text-primary font-medium py-2">Chat Rooms</Link>
            <Link href="/about" onClick={() => setIsMenuOpen(false)} className="text-foreground/80 hover:text-primary transition-colors py-2 font-medium">About Us</Link>
            <Link href="/faq" onClick={() => setIsMenuOpen(false)} className="text-foreground/80 hover:text-primary transition-colors py-2 font-medium">FAQ</Link>
            <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="text-foreground/80 hover:text-primary transition-colors py-2 font-medium">Contact Us</Link>
            
            <div className="pt-4 border-t border-border/40 mt-2 flex flex-col gap-2">
              {!authLoading && isAuthenticated ? (
                <>
                  <Link href="/user-profile" onClick={() => setIsMenuOpen(false)} className="text-foreground font-medium py-2 px-2 hover:bg-muted rounded-md">Profile Dashboard</Link>
                  {isModOrAbove && (
                    <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="text-[#007699] font-bold py-2 px-2 hover:bg-muted rounded-md">Moderation Dashboard</Link>
                  )}
                  <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-destructive font-medium py-2 px-2 text-left hover:bg-muted rounded-md">Log Out</button>
                </>
              ) : (
                <Button onClick={() => window.location.href = "/login"} className="w-full font-bold">Login</Button>
              )}
            </div>
          </div>
        )}
      </header>

      {sidebarView === "public" && (
        <div className="flex-none bg-white border-b z-20 shadow-sm">
          <div className="flex items-center justify-start md:justify-center gap-3 md:gap-4 p-2 md:p-4 overflow-x-auto no-scrollbar bg-white">
            {dbCategories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActivePet(cat.name?.toLowerCase() || cat.id);
                  setIsNewsRoom(false);
                }}
                className={cn(
                  "flex-none relative rounded-full p-0.5 md:p-1 transition-all duration-200 cursor-pointer",
                  activePet === (cat.name?.toLowerCase() || cat.id)
                    ? "ring-2 ring-primary ring-offset-2 scale-105"
                    : "opacity-70 hover:opacity-100 hover:scale-105",
                )}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-100 shadow-sm">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full items-center justify-center bg-white border-2 border-[#007699]"
                    style={{ display: cat.image_url ? 'none' : 'flex' }}
                  >
                    <PawPrint className="w-5 h-5 text-[#007699]" fill="currentColor" />
                  </div>
                </div>
              </button>
            ))}
            {/* "Other" catch-all */}
            <button
              onClick={() => {
                setActivePet("other");
                setIsNewsRoom(false);
              }}
              className={cn(
                "flex-none relative rounded-full p-0.5 md:p-1 transition-all duration-200 cursor-pointer",
                activePet === "other"
                  ? "ring-2 ring-primary ring-offset-2 scale-105"
                  : "opacity-70 hover:opacity-100 hover:scale-105",
              )}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-100 shadow-sm">
                <div className="w-full h-full flex items-center justify-center bg-white border-2 border-[#007699]">
                  <div className="text-[#007699] font-bold text-[10px] md:text-xs">
                    Other
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        <aside
          className={cn(
            "bg-[#F5F7F9] border-r overflow-hidden flex-col w-full md:w-80 relative z-10 h-full",
            mobileView === "list" ? "flex" : "hidden md:flex"
          )}
        >
          <div className="bg-[#007699] text-white px-4 py-3 shadow-md flex-none">
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 flex-shrink-0">
                {sidebarView === "public" ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/50 bg-white shrink-0">
                      {activePetData?.image_url ? (
                        <img
                          src={activePetData.image_url}
                          alt={activePetData.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white text-[#007699]">
                          <PawPrint className="w-4 h-4" fill="currentColor" />
                        </div>
                      )}
                    </div>
                    {!activeDmUser && (
                      <Select
                        value={activeBreed || "__all__"}
                        onValueChange={(value: string) =>
                          setActiveBreed(value === "__all__" ? null : value)
                        }
                        disabled={isLoadingBreeds}
                      >
                        <SelectTrigger className="h-8 w-[140px] bg-white/10 border-white/20 text-white rounded-lg text-xs hover:bg-white/20 transition-colors flex-shrink-0">
                          <SelectValue
                            placeholder={
                              isLoadingBreeds ? "Loading..." : "All Breeds"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="__all__">All Breeds</SelectItem>
                          {dbBreeds.length > 0 ? (
                            dbBreeds.map((breed: any) => (
                              <SelectItem key={breed.id} value={breed.id}>
                                {breed.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                              No breeds found
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 relative w-[180px]">
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="w-full h-8 bg-white/10 border border-white/20 text-white placeholder:text-white/60 rounded-lg px-3 text-xs focus:outline-none"
                    />
                  </div>
                )}
              </div>
              <button
                className={cn(
                  "p-2 rounded-full transition-colors flex-shrink-0 ml-auto",
                  sidebarView === "private"
                    ? "bg-white/20 text-white"
                    : "hover:bg-white/10",
                )}
                onClick={() => {
                  setSidebarView((prev) =>
                    prev === "public" ? "private" : "public",
                  );
                  if (sidebarView === "public") setUnreadDmCount(0);
                }}
              >
                {sidebarView === "public" ? (
                  <MessageCircle className="w-6 h-6" />
                ) : (
                  <PawIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sidebarView === "public" ? (
              <>
                <button
                  onClick={() => handleLocationClick("global")}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-200 text-left group border mb-2",
                    activeLocation === "global"
                      ? "bg-[#FF6600] text-white shadow-md border-[#FF6600]"
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-100",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Globe
                      className={cn(
                        "w-5 h-5",
                        activeLocation === "global"
                          ? "text-white"
                          : "text-blue-500",
                      )}
                    />
                    <span className="text-base">Global</span>
                  </div>
                </button>
                {isModOrAbove && (
                  <button
                    onClick={() => handleLocationClick("staff_lounge")}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-200 text-left group border mb-2",
                      activeLocation === "staff_lounge"
                        ? "bg-[#00789c] text-white shadow-md border-[#00789c]"
                        : "bg-white hover:bg-gray-50 text-gray-700 border-gray-100",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Shield
                        className={cn(
                          "w-5 h-5",
                          activeLocation === "staff_lounge"
                            ? "text-white"
                            : "text-[#00789c]",
                        )}
                      />
                      <span className="text-base font-bold">Staff Lounge</span>
                    </div>
                  </button>
                )}
                {!userCountryObj ? (
                  <div className="mt-4 p-4 text-xs bg-orange-50 text-orange-600 rounded-lg border border-orange-200 flex items-start gap-2 shadow-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                      Update your profile settings to unlock your private
                      Country and State chat rooms!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => handleLocationClick("country")}
                        className={cn(
                          "flex-1 flex items-center justify-between px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-200 text-left group border",
                          activeLocation === "country"
                            ? "bg-[#FF6600] text-white shadow-md border-[#FF6600]"
                            : "bg-white hover:bg-gray-50 text-gray-700 border-gray-100",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{userCountryObj.flag}</span>
                          <span className="text-base font-bold">
                            {userCountryObj.name}
                          </span>
                        </div>
                      </button>
                      {isModOrAbove && (
                        <Popover
                          open={isModCountryOpen}
                          onOpenChange={setIsModCountryOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-12 h-[52px] p-0 shrink-0 border-gray-200 cursor-pointer"
                            >
                              <Globe className="w-5 h-5 text-gray-500" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[300px] p-0"
                            align="start"
                          >
                            <Command>
                              <CommandInput placeholder="Search global regions..." />
                              <CommandList>
                                <CommandEmpty>No country found.</CommandEmpty>
                                <CommandGroup>
                                  {Country.getAllCountries().map((c) => (
                                    <CommandItem
                                      key={c.isoCode}
                                      value={c.name}
                                      onSelect={() => {
                                        setModSelectedCountry(c.name);
                                        setActiveLocation("country");
                                        setActiveDistrict(null);
                                        setIsModCountryOpen(false);
                                      }}
                                    >
                                      <span className="mr-2 text-lg">
                                        {c.flag}
                                      </span>{" "}
                                      {c.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    {pinnedStates.length > 0 && (
                      <>
                        <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Pinned States
                        </div>
                        {pinnedStates.map((loc) => (
                          <div
                            key={`pinned-${loc.isoCode}`}
                            className="flex items-center gap-1 mb-2"
                          >
                            <button
                              onClick={() => handleLocationClick(loc.isoCode)}
                              className={cn(
                                "flex-1 flex items-center justify-between px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-200 text-left group border",
                                activeLocation === loc.isoCode && !activeDmUser
                                  ? "bg-[#FF6600] text-white border-[#FF6600]"
                                  : "bg-white border-gray-100 hover:bg-gray-50",
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Pin
                                  className={cn(
                                    "w-4 h-4 rotate-45",
                                    activeLocation === loc.isoCode &&
                                      !activeDmUser
                                      ? "text-white"
                                      : "text-orange-500",
                                  )}
                                />
                                <span className="text-sm">{loc.name}</span>
                              </div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePin(loc.isoCode);
                              }}
                              className="p-3 shrink-0 cursor-pointer rounded-lg transition-all opacity-50 hover:opacity-100 hover:bg-orange-50"
                              title="Unpin state"
                            >
                              <PawIcon className="w-4 h-4 text-orange-500" />
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                    <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
                      All States & Regions
                    </div>
                    {unpinnedStates.map((loc) => (
                      <div
                        key={loc.isoCode}
                        className="flex items-center gap-1 mb-2"
                      >
                        <button
                          onClick={() => handleLocationClick(loc.isoCode)}
                          className={cn(
                            "flex-1 flex items-center justify-between px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-200 text-left group border",
                            activeLocation === loc.isoCode && !activeDmUser
                              ? "bg-[#FF6600] text-white border-[#FF6600]"
                              : "bg-white border-gray-100 hover:bg-gray-50",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm">{loc.name}</span>
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(loc.isoCode);
                          }}
                          className="p-3 shrink-0 cursor-pointer rounded-lg transition-all opacity-50 hover:opacity-100 hover:bg-gray-100"
                          title="Pin state"
                        >
                          <PawIcon className="w-4 h-4 text-gray-500 hover:text-orange-500" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </>
            ) : (
              <div className="space-y-1">
                <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Your Conversations
                </div>
                {dmContacts && dmContacts.length > 0 ? (
                  dmContacts.map((contact) => (
                    <button
                      key={`dm-${contact.id}`}
                      onClick={() => handleUserClick(contact.id, contact.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-200 text-left group border mb-2",
                        activeDmUser?.id === contact.id
                          ? "bg-[#FF6600] text-white"
                          : "bg-white",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full border overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center",
                            activeDmUser?.id === contact.id
                              ? "border-white/50"
                              : "border-gray-200",
                          )}
                        >
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.id}`}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-base truncate">
                          @{contact.name}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center p-4 text-gray-500 text-sm">
                    No active conversations yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        <main
          className={cn(
            "flex-1 flex-col bg-white w-full h-full relative",
            mobileView === "chat" ? "flex" : "hidden md:flex"
          )}
        >
          {sidebarView === "private" && !activeDmUser ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-500 p-6 text-center">
              <div className="w-24 h-24 mb-6 text-gray-300 bg-white shadow-sm rounded-full flex items-center justify-center border-4 border-gray-50">
                <MessageCircle className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                Your Messages
              </h3>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "text-white px-4 py-3 flex items-center justify-between shadow-md flex-none h-16 overflow-x-auto no-scrollbar",
                  isNewsRoom
                    ? "bg-amber-600"
                    : activeLocation === "staff_lounge"
                      ? "bg-[#00789c]"
                      : "bg-[#007699]",
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="md:hidden shrink-0">
                    {/* --- MOBILE BACK BUTTON FIX --- */}
                    <button
                      onClick={() => setMobileView("list")}
                      type="button"
                      className="p-1 mr-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                    {/* ------------------------------ */}
                  </div>
                  <h2 className="font-bold text-xl truncate whitespace-nowrap">
                    {getHeaderDisplayName()}
                  </h2>
                  {activeLocation !== "global" &&
                    activeLocation !== "country" &&
                    activeLocation !== "staff_lounge" &&
                    currentDistricts.length > 0 &&
                    !activeDmUser && (
                      <div className="flex-shrink-0 ml-2">
                        <Select
                          value={activeDistrict || "__all__"}
                          onValueChange={(value: string) =>
                            setActiveDistrict(
                              value === "__all__" ? null : value,
                            )
                          }
                        >
                          <SelectTrigger className="w-[150px] md:w-[160px] h-8 bg-white/10 text-white border-white/20 rounded-full text-xs focus:ring-0 hover:bg-white/20 flex-shrink-0">
                            <SelectValue placeholder="Select City/District" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            <SelectItem value="__all__">All Region</SelectItem>
                            {currentDistricts.map((district) => (
                              <SelectItem
                                key={district.name}
                                value={district.name}
                              >
                                {district.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-auto pl-2">
                  <Link href="/community-guidelines" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer" title="Community Guidelines">
                    <BookOpen className="w-5 h-5" />
                  </Link>
                  {!activeDmUser && activeLocation !== "staff_lounge" && (
                    <button
                      onClick={() => setIsNewsRoom(!isNewsRoom)}
                      className={cn(
                        "p-2 rounded-full transition-colors relative cursor-pointer",
                        isNewsRoom
                          ? "bg-white text-amber-600 shadow-sm"
                          : "hover:bg-white/10 text-white",
                      )}
                      title={isNewsRoom ? "Back to Chat" : "Open News Room"}
                    >
                      {isNewsRoom ? (
                        <MessageCircle className="w-5 h-5" />
                      ) : (
                        <Megaphone className="w-5 h-5 -rotate-12" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "flex-1 overflow-y-auto p-4 space-y-6 pt-6 relative",
                  isNewsRoom && "bg-amber-50/30",
                )}
              >
                {/* --- FIXED BACKGROUND WATERMARK --- */}
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0 w-full flex flex-col items-center justify-center p-4">
                  <div className="flex flex-col items-center justify-center w-full text-center uppercase tracking-[0.2em] font-black text-gray-900 opacity-[0.03]">
                    {chatRoomLocation === "global" && !isNewsRoom ? (
                      <span className="text-5xl md:text-8xl">Global Room</span>
                    ) : isNewsRoom ? (
                      <span className="text-5xl md:text-8xl">News Room</span>
                    ) : activeDmUser ? (
                      <div className="flex flex-col items-center gap-2">
                         <span className="text-3xl md:text-5xl">Direct Message</span>
                         <span className="text-5xl md:text-8xl">@{activeDmUser.name}</span>
                      </div>
                    ) : chatRoomLocation === "staff_lounge" ? (
                      <span className="text-5xl md:text-8xl">Staff Lounge</span>
                    ) : (
                      <div className="flex flex-col items-center gap-2 lg:gap-4">
                        <div className="flex items-center gap-3 md:gap-6">
                           <span className="text-4xl md:text-6xl">{activePetData?.name || activePet}</span>
                           {activeBreed && <span className="text-6xl md:text-9xl">/ {activeBreed}</span>}
                        </div>
                        <span className="text-2xl md:text-4xl max-w-[90vw] break-words">
                          {chatRoomLocation.replace(/^(country|state|city):/, '').replace(/:/g, ' • ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* --------------------------------- */}
                {/* ------------------------- */}
                {isNewsRoom ? (
                  announcements.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">
                      <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-lg font-medium">
                        No announcements here yet!
                      </p>
                    </div>
                  ) : (
                    announcements.map((post) => (
                      <div
                        key={post.id}
                        className={cn(
                          "max-w-2xl mx-auto bg-white border rounded-xl shadow-sm overflow-hidden mb-6 relative z-10",
                          post.status === "pending"
                            ? "border-amber-200 opacity-80"
                            : "border-gray-100",
                        )}
                      >
                        {post.status === "pending" && (
                          <div className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 flex items-center justify-between border-b border-amber-200">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" /> Pending Admin
                              Review
                            </div>
                            {post.author_id === userId && (
                              <button
                                onClick={() =>
                                  handleDeleteAnnouncement(post.id)
                                }
                                className="text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            )}
                          </div>
                        )}
                        <div className="p-4 flex items-center gap-3 border-b border-gray-50 bg-gray-50/50">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold border border-amber-200">
                            {post.users?.display_name
                              ?.charAt(0)
                              .toUpperCase() || "A"}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              @{post.users?.display_name}
                            </p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                              {post.users?.role === "admin" ||
                                post.users?.role === "staff"
                                ? "📢 Official Staff"
                                : "🐾 Community Event"}
                            </p>
                          </div>
                          <div className="ml-auto text-xs text-gray-400">
                            {new Date(post.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="p-5">
                          {post.media_url && (
                            <img
                              src={post.media_url}
                              className="w-full rounded-lg mb-4 max-h-80 object-cover bg-gray-100"
                            />
                          )}
                          <p className="text-gray-800 whitespace-pre-wrap">
                            {post.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  messages.map((msg, index) => {
                    const prevMsg = messages[index - 1];
                    const currentDate = new Date(msg.createdAt);
                    const prevDate = prevMsg ? new Date(prevMsg.createdAt) : null;
                    const showDateChip = !prevDate || currentDate.toDateString() !== prevDate.toDateString();
                    
                    let dateChipText = "";
                    if (showDateChip) {
                      if (isToday(currentDate)) dateChipText = "Today";
                      else if (isYesterday(currentDate)) dateChipText = "Yesterday";
                      else dateChipText = format(currentDate, "MMMM d, yyyy");
                    }
                    
                    return (
                      <div key={msg.id} className="relative z-10 flex flex-col">
                        {showDateChip && (
                          <div className="flex justify-center my-4">
                            <span className="bg-gray-100 border border-gray-200 text-gray-500 text-[11px] px-3 py-1 rounded-full font-medium shadow-sm">
                              {dateChipText}
                            </span>
                          </div>
                        )}
                        <MessageBubble
                          message={msg}
                          isOwnMessage={msg.userId === userId}
                          displayName={displayName}
                          currentUserRole={userRole}
                          onUserClick={handleUserClick}
                          onReplyClick={(userId: string, name: string) => setReplyToUser({ id: userId, name })}
                          onBanClick={() => handleOpenDirectBan(msg.user)}
                          onDeleteClick={handleDeleteMessage}
                        />
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <ChatInput
                onSendMessage={handleSendMessage}
                isConnected={isConnected || isNewsRoom}
                initialValue={replyToUser ? `@${replyToUser.name} ` : undefined}
                onClearInitialValue={() => setReplyToUser(null)}
              />
            </>
          )}
        </main>
      </div>

      <Dialog open={isBanModalOpen} onOpenChange={setIsBanModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Ban for @{userToBan?.displayName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ban Scope</label>
              <Select value={banScope} onValueChange={setBanScope}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ban scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global Ban (Entire Platform)</SelectItem>
                  <SelectItem value="room">Specific Rooms</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {banScope === "room" && (
              <div className="space-y-2 mt-2 border border-gray-100 p-2 rounded relative">
                 <label className="text-xs font-semibold text-gray-700">Rooms to Ban From</label>
                 {selectedBanRooms.map((room, idx) => (
                   <div key={idx} className="flex items-center gap-2 mb-2">
                     <Input
                       value={room.location}
                       onChange={(e: any) => {
                         const newRooms = [...selectedBanRooms];
                         newRooms[idx].location = e.target.value;
                         setSelectedBanRooms(newRooms);
                       }}
                       placeholder="Location"
                       className="text-xs h-8"
                     />
                     <Input
                       value={room.petType}
                       onChange={(e: any) => {
                         const newRooms = [...selectedBanRooms];
                         newRooms[idx].petType = e.target.value;
                         setSelectedBanRooms(newRooms);
                       }}
                       placeholder="Pet"
                       className="text-xs h-8"
                     />
                     <Input
                       value={room.breed || ""}
                       onChange={(e: any) => {
                         const newRooms = [...selectedBanRooms];
                         newRooms[idx].breed = e.target.value || null;
                         setSelectedBanRooms(newRooms);
                       }}
                       placeholder="Breed (opt)"
                       className="text-xs h-8"
                     />
                     {selectedBanRooms.length > 1 && (
                       <Button
                         variant="ghost"
                         size="sm"
                         className="px-2 h-8"
                         onClick={() => {
                           const newRooms = [...selectedBanRooms];
                           newRooms.splice(idx, 1);
                           setSelectedBanRooms(newRooms);
                         }}
                       >
                         <X className="w-4 h-4 text-red-500" />
                       </Button>
                     )}
                   </div>
                 ))}
                 <Button
                   variant="outline"
                   size="sm"
                   className="w-full text-xs h-8"
                   onClick={() =>
                     setSelectedBanRooms([
                       ...selectedBanRooms,
                       { location: chatRoomLocation, petType: activePet, breed: activeBreed || null },
                     ])
                   }
                 >
                   + Add Room
                 </Button>
              </div>
            )}
            
            <div className="flex flex-row items-center space-x-2 mt-4">
              <Checkbox
                id="deleteMessages"
                checked={shouldDeleteMessages}
                onCheckedChange={(c: any) => setShouldDeleteMessages(!!c)}
              />
              <label
                htmlFor="deleteMessages"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Delete all messages from this user in the banned rooms
              </label>
            </div>

            <div className="space-y-2 mt-4">
              <label className="text-sm font-medium">Ban Duration</label>
              <Select value={banDuration} onValueChange={setBanDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6h">6 Hours</SelectItem>
                  <SelectItem value="12h">12 Hours</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="3d">3 Days</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsBanModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleIssueDirectBan}
              disabled={isProcessingBan}
            >
              {isProcessingBan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
              Issue Ban
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced Crosspost Target Builder */}
      <Dialog open={isCrosspostModalOpen} onOpenChange={setIsCrosspostModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <div className="p-6 pb-2">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-orange-500" />
                Advanced Target Builder
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-500 mt-1">
              Select high-level targets or build custom combinations for maximum reach.
            </p>
          </div>
          
          <ScrollArea className="flex-1 px-6 py-2">
            <div className="space-y-6 pb-6">
              {/* Quick Toggles Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Quick Toggles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                    <Checkbox
                      id="q-current"
                      checked={crosspostCurrentRoom}
                      onCheckedChange={(c: any) => setCrosspostCurrentRoom(!!c)}
                    />
                    <label htmlFor="q-current" className="text-sm font-medium cursor-pointer flex-1 leading-none">
                      Current Room ({activeBreed ? (dbBreeds.find((b: any) => b.id === activeBreed)?.name || activeBreed) : 'All ' + activePet})
                    </label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                    <Checkbox 
                      id="q-global" 
                      checked={crosspostGlobal} 
                      onCheckedChange={(c: any) => setCrosspostGlobal(!!c)} 
                    />
                    <label htmlFor="q-global" className="text-sm font-medium cursor-pointer flex-1 leading-none">Global Room</label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                    <Checkbox 
                      id="q-country" 
                      checked={crosspostCountry} 
                      onCheckedChange={(c: any) => setCrosspostCountry(!!c)} 
                    />
                    <label htmlFor="q-country" className="text-sm font-medium cursor-pointer flex-1 leading-none">Entire Country ({countryCode})</label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                    <Checkbox 
                      id="q-allbreeds" 
                      checked={crosspostAllBreedsInLoc} 
                      onCheckedChange={(c: any) => setCrosspostAllBreedsInLoc(!!c)} 
                    />
                    <label htmlFor="q-allbreeds" className="text-sm font-medium cursor-pointer flex-1 leading-none">All Breeds in Current Loc</label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Advanced Builder Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Custom Location & Breed Builder</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Location Dropdowns */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600">Location</label>
                    <div className="flex gap-2">
                      <Select value={builderState} onValueChange={(val: string) => { setBuilderState(val); setBuilderCity(""); }}>
                        <SelectTrigger className="flex-1 h-9 text-xs">
                          <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {countryStates.map((s: any) => (
                            <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={builderCity} onValueChange={setBuilderCity}>
                        <SelectTrigger className="flex-1 h-9 text-xs">
                          <SelectValue placeholder="City" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {City.getCitiesOfState(countryCode || "", builderState).map((c: any) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Breed Dropdowns */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600">Pet & Breed</label>
                    <div className="flex gap-2">
                      <Select value={builderCategory} onValueChange={(val: string) => { setBuilderCategory(val); setBuilderBreed(""); }}>
                        <SelectTrigger className="flex-1 h-9 text-xs">
                          <SelectValue placeholder="Pet" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {dbCategories.map((c: any) => (
                            <SelectItem key={c.id} value={c.name.toLowerCase()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={builderBreed} onValueChange={setBuilderBreed}>
                        <SelectTrigger className="flex-1 h-9 text-xs">
                          <SelectValue placeholder="Breed" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="all">All Breeds</SelectItem>
                          {builderBreeds.map((b: any) => (
                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-2 border-t border-dashed">
                  <Checkbox 
                    id="auto-parents" 
                    checked={autoIncludeParents} 
                    onCheckedChange={(c: any) => setAutoIncludeParents(!!c)} 
                  />
                  <label htmlFor="auto-parents" className="text-xs font-semibold cursor-pointer text-gray-700">
                    Auto-include parent rooms (e.g., All {builderCategory || "Pet"}s, All Breeds)
                  </label>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-6 pt-2 border-t bg-gray-50 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsCrosspostModalOpen(false)} disabled={isSendingCrosspost}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 text-white hover:bg-orange-700 font-bold shadow-lg shadow-orange-100 transition-all active:scale-95"
              onClick={submitCrosspostMessage}
              disabled={isSendingCrosspost}
            >
              {isSendingCrosspost ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Megaphone className="w-4 h-4 mr-2" />}
              Post Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}