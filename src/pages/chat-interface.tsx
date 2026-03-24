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
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Country, State, City } from "country-state-city";
import { getBreeds } from "@/data/petBreeds";
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

import dogImg from "@assets/stock_images/happy_dog_portrait_o_6e5075a4.jpg";
import catImg from "@assets/stock_images/ginger_cat_sitting_f_07d19cb3.jpg";
import fishImg from "@assets/stock_images/goldfish_in_a_bowl_o_1769c4d6.jpg";
import birdImg from "@assets/stock_images/colorful_parrot_bird_78491bbe.jpg";
import rabbitImg from "@assets/stock_images/cute_white_rabbit_po_8b3eec97.jpg";
import hamsterImg from "@assets/stock_images/cute_hamster_portrai_97a17a6a.jpg";
import turtleImg from "@assets/stock_images/turtle_close_up_port_f8acb4e1.jpg";
import guineaPigImg from "@assets/stock_images/guinea_pig_portrait_48d4dfd3.jpg";
import horseImg from "@assets/stock_images/horse_portrait_in_na_95b7a90d.jpg";

const PETS = [
  { id: "dog", name: "Dog", image: dogImg },
  { id: "cat", name: "Cat", image: catImg },
  { id: "fish", name: "Fish", image: fishImg },
  { id: "bird", name: "Bird", image: birdImg },
  { id: "rabbit", name: "Rabbit", image: rabbitImg },
  { id: "hamster", name: "Hamster", image: hamsterImg },
  { id: "turtle", name: "Turtle", image: turtleImg },
  { id: "guinea-pig", name: "Guinea Pig", image: guineaPigImg },
  { id: "horse", name: "Horse", image: horseImg },
  { id: "other", name: "Other", isIcon: true },
];

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

const getAvailableDurations = (role: string) => {
  const base = [
    { label: "6 Hours", value: "6h" },
    { label: "12 Hours", value: "12h" },
    { label: "24 Hours", value: "24h" },
  ];
  if (role === "moderator") return base;
  const superMod = [
    ...base,
    { label: "3 Days", value: "3d" },
    { label: "7 Days", value: "7d" },
  ];
  if (role === "super_moderator") return superMod;
  return [
    ...superMod,
    { label: "30 Days", value: "30d" },
    { label: "1 Year", value: "1y" },
    { label: "Permanent", value: "permanent" },
  ];
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
  const [activePet, setActivePet] = useState("dog");
  const [activeBreed, setActiveBreed] = useState<string | null>(null);
  const [activeLocation, setActiveLocation] = useState("global");
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const [activeDmUser, setActiveDmUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
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
  const [replyToUser, setReplyToUser] = useState<string | null>(null);

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
  const [isProcessingBan, setIsProcessingBan] = useState(false);

  const [isNewsRoom, setIsNewsRoom] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [hasNewAnnouncements, setHasNewAnnouncements] = useState(true);

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

  const currentBreeds = getBreeds(activePet);

  const { data: dbUser } = useQuery({
    queryKey: ["db-user-chat", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("users")
        .select("country, state, role")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: myBan } = useQuery({
    queryKey: ["my-ban-status", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("bans")
        .select("*")
        .eq("user_id", userId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    },
    enabled: !!userId,
  });

  const userRole = dbUser?.role || "user";
  const isModOrAbove = [
    "moderator",
    "super_moderator",
    "staff",
    "admin",
  ].includes(userRole);

  const effectiveCountryName =
    isModOrAbove && modSelectedCountry ? modSelectedCountry : dbUser?.country;
  const userCountryObj = effectiveCountryName
    ? Country.getAllCountries().find((c) => c.name === effectiveCountryName)
    : null;
  const countryCode = userCountryObj?.isoCode;
  const countryStates = countryCode
    ? State.getStatesOfCountry(countryCode)
    : [];

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
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, announcements]);
  useEffect(() => {
    setActiveBreed(null);
  }, [activePet]);
  useEffect(() => {
    setActiveDistrict(null);
  }, [activeLocation]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileView("chat");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activePetData = PETS.find((p) => p.id === activePet);

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
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(20);

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
        let query = supabase
          .from("messages")
          .select(
            `*, users:users!user_id(id, username, display_name, state, country, role)`,
          )
          .eq("location", chatRoomLocation)
          .is("receiver_id", null);
        if (chatRoomLocation !== "staff_lounge") {
          query = query.eq("pet_type", activePet);
          if (activeBreed) query = query.eq("breed", activeBreed);
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
      )
        setUnreadDmCount((prev) => prev + 1);
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
          if (newMessage.location !== chatRoomLocation) return prev;
          if (chatRoomLocation !== "staff_lounge") {
            if (newMessage.petType !== activePet) return prev;
            if (activeBreed && newMessage.breed !== activeBreed) return prev;
          }
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

  const handleSendMessage = async (
    content: string,
    messageType: string = "text",
    mediaFile?: File | Blob,
    mediaDuration?: number,
  ): Promise<boolean> => {
    if (!isConnected && !isNewsRoom) return false;

    if (myBan) {
      toast({
        description: "You are currently banned from sending messages.",
        variant: "destructive",
      });
      return false;
    }

    try {
      let mediaUrl: string | null = null;
      if (mediaFile) {
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const ext =
          mediaFile instanceof File ? mediaFile.name.split(".").pop() : "webm";
        const filePath = `chat-media/${fileName}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("chat-uploads")
          .upload(filePath, mediaFile);

        if (uploadError) {
          toast({
            description: `Media Upload Error: ${uploadError.message}`,
            variant: "destructive",
          });
          return false;
        }
        const { data: urlData } = supabase.storage
          .from("chat-uploads")
          .getPublicUrl(filePath);
        mediaUrl = urlData.publicUrl;
      }

      if (isNewsRoom) {
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
          setAnnouncements((prev) => [
            ...prev,
            {
              id: "temp",
              content,
              media_url: mediaUrl,
              target_location: chatRoomLocation,
              target_pet: activePet,
              created_at: new Date().toISOString(),
              status: "approved",
              users: {
                id: userId,
                display_name: displayName,
                role: userRole,
                username: displayName,
              },
            },
          ]);
        }
        return true;
      }

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
      };

      if (activeBreed && !activeDmUser && chatRoomLocation !== "staff_lounge")
        insertData.breed = activeBreed;

      const { error } = await supabase.from("messages").insert(insertData);
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error("Error sending:", error);
      // NEW: Added this toast to catch ANY silent database failures!
      toast({
        description: `System Error: ${error.message || "Failed to process message."}`,
        variant: "destructive",
      });
      return false;
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
      const { error: banError } = await supabase
        .from("bans")
        .insert({
          user_id: userToBan.id,
          banned_by: user.id,
          reason: `Direct ban issued from Chat Room by Moderation.`,
          expires_at: expiresAt,
        });
      if (banError) throw banError;
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

  const pinnedStates = countryStates.filter((s) => isPinned(s.isoCode));
  const unpinnedStates = countryStates.filter((s) => !isPinned(s.isoCode));
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
      <header className="flex-none bg-background/80 backdrop-blur-md border-b border-border/40 z-30 transition-all">
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
          </nav>
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
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                        alt="User"
                        className="h-full w-full object-cover"
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
            className="md:hidden cursor-pointer p-2 hover:bg-muted rounded-full transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {sidebarView === "public" ? (
        <div className="flex-none bg-white border-b z-20 shadow-sm">
          <div className="flex items-center justify-start md:justify-center gap-3 md:gap-4 p-2 md:p-4 overflow-x-auto no-scrollbar bg-white">
            {PETS.map((pet) => (
              <button
                key={pet.id}
                onClick={() => {
                  setActivePet(pet.id);
                  setIsNewsRoom(false);
                }}
                className={cn(
                  "flex-none relative rounded-full p-0.5 md:p-1 transition-all duration-200",
                  activePet === pet.id
                    ? "ring-2 ring-primary ring-offset-2 scale-105"
                    : "opacity-70 hover:opacity-100 hover:scale-105",
                )}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-100 shadow-sm">
                  {pet.isIcon ? (
                    <div className="w-full h-full flex items-center justify-center bg-white border-2 border-[#007699]">
                      <div className="text-[#007699] font-bold text-[10px] md:text-xs">
                        Other
                      </div>
                    </div>
                  ) : (
                    <img
                      src={pet.image}
                      alt={pet.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex-1 flex overflow-hidden relative">
        <aside
          className={cn(
            "bg-[#F5F7F9] border-r overflow-hidden flex flex-col w-full md:w-80 absolute md:relative z-10 h-full transition-transform duration-300",
            mobileView === "list"
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="bg-[#007699] text-white px-4 py-3 shadow-md flex-none">
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 flex-shrink-0">
                {sidebarView === "public" ? (
                  <>
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/50 bg-white shrink-0">
                      {activePetData?.isIcon ? (
                        <div className="w-full h-full flex items-center justify-center bg-white text-[#007699] font-bold text-[10px]">
                          Other
                        </div>
                      ) : (
                        <img
                          src={activePetData?.image}
                          alt={activePetData?.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    {currentBreeds.length > 0 && !activeDmUser && (
                      <Select
                        value={activeBreed || "__all__"}
                        onValueChange={(value) =>
                          setActiveBreed(value === "__all__" ? null : value)
                        }
                      >
                        <SelectTrigger className="h-8 w-[140px] bg-white/10 border-white/20 text-white rounded-lg text-xs hover:bg-white/20 transition-colors flex-shrink-0">
                          <SelectValue placeholder="All Breeds" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="__all__">All Breeds</SelectItem>
                          {currentBreeds.map((breed) => (
                            <SelectItem key={breed.id} value={breed.id}>
                              {breed.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </>
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
                {unreadDmCount > 0 && sidebarView === "public" && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {unreadDmCount > 9 ? "9+" : unreadDmCount}
                  </span>
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
            "flex-1 flex flex-col bg-white relative w-full h-full absolute md:relative transition-transform duration-300",
            mobileView === "chat"
              ? "translate-x-0"
              : "translate-x-full md:translate-x-0",
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
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="md:hidden">
                    <button
                      onClick={() => setMobileView("list")}
                      className="p-1 mr-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                  </div>
                  {activeDmUser ? (
                    <Link href={`/profile/${activeDmUser.name}`}>
                      <h2 className="font-bold text-xl truncate hover:underline hover:text-orange-200 transition-colors cursor-pointer whitespace-nowrap">
                        {activeDmUser.name}
                      </h2>
                    </Link>
                  ) : (
                    <h2 className="font-bold text-xl truncate whitespace-nowrap">
                      {getHeaderDisplayName()}
                    </h2>
                  )}
                  {activeLocation !== "global" &&
                    activeLocation !== "country" &&
                    activeLocation !== "staff_lounge" &&
                    currentDistricts.length > 0 &&
                    !activeDmUser && (
                      <div className="flex-shrink-0 ml-2">
                        <Select
                          value={activeDistrict || "__all__"}
                          onValueChange={(value) =>
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

                <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
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
                      {!isNewsRoom && hasNewAnnouncements && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 border border-[#007699] rounded-full animate-pulse" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "flex-1 overflow-y-auto p-4 space-y-6 pt-6 scroll-smooth",
                  isNewsRoom && "bg-amber-50/30",
                )}
              >
                {myBan && (
                  <div className="mx-auto max-w-md bg-red-50 text-red-700 p-3 rounded-lg text-sm font-bold flex items-center gap-2 mb-4 justify-center border border-red-200 shadow-sm">
                    <Ban className="w-5 h-5" /> You are currently banned from
                    posting.
                  </div>
                )}

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
                        className="max-w-2xl mx-auto bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6"
                      >
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
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-10">
                    <p className="text-lg font-medium">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwnMessage={msg.userId === userId}
                      displayName={displayName}
                      currentUserRole={userRole}
                      onUserClick={handleUserClick}
                      onReplyClick={(name) => setReplyToUser(`@${name} `)}
                      onBanClick={() => handleOpenDirectBan(msg.user)}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <ChatInput
                onSendMessage={handleSendMessage}
                isConnected={isConnected}
                initialValue={replyToUser || undefined}
                onClearInitialValue={() => setReplyToUser(null)}
              />
            </>
          )}
        </main>
      </div>

      <Dialog open={isBanModalOpen} onOpenChange={setIsBanModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="w-5 h-5" /> Issue Server Ban
            </DialogTitle>
          </DialogHeader>
          {userToBan && (
            <div className="space-y-5 py-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                <p className="text-gray-500 mb-1">Target User:</p>
                <p className="font-bold text-gray-900">
                  @{userToBan.displayName || userToBan.id}
                </p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                  Role: {userToBan.role || "user"}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#007699]" /> Select Ban
                  Duration
                </label>
                <Select value={banDuration} onValueChange={setBanDuration}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select duration..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableDurations(userRole).map((dur) => (
                      <SelectItem key={dur.value} value={dur.value}>
                        {dur.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                onClick={handleIssueDirectBan}
                disabled={isProcessingBan}
              >
                {isProcessingBan ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isProcessingBan ? "Processing..." : "Enforce Ban"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
