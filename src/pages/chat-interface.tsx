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

interface Message {
  id: string;
  userId: string;
  petType: string;
  location: string;
  content: string;
  messageType: string;
  mediaUrl?: string | null;
  mediaDuration?: number | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    state?: string;
    country?: string;
    role?: string;
  };
  receiverId?: string | null;
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
  const [messages, setMessages] = useState<Message[]>([]);
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

  // NEW: Teleportation Listener
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

  const PawIcon = ({ className }: { className?: string }) => (
    <svg
      className={className}
      width="50"
      height="50"
      viewBox="0 0 50 50"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M49.1605 31.1446C48.5374 29.1334 47.299 27.8155 45.6731 27.4336C45.3722 27.363 45.0615 27.3271 44.7494 27.3271C44.582 27.3271 44.4152 27.3379 44.2489 27.3576C44.3882 26.1982 44.2612 24.8561 43.8829 23.6347C43.2255 21.5124 41.9302 20.1244 40.2353 19.7263C39.9242 19.6533 39.6026 19.6162 39.2794 19.6162C37.1541 19.6162 35.3013 21.2032 34.1534 22.9682C33.0056 21.2031 31.1527 19.6162 29.0275 19.6162C28.7044 19.6162 28.3828 19.6533 28.0715 19.7263C27.5353 19.8523 27.0391 20.0777 26.5905 20.3939C26.5216 20.2265 26.4464 20.0599 26.3659 19.894C27.3287 19.7712 28.2531 19.3887 29.0227 18.7865C29.9877 18.0315 30.6737 16.958 30.9542 15.7639C31.239 14.5516 31.1543 13.0057 30.7278 11.6285C30.1047 9.61733 28.8664 8.29937 27.2404 7.91743C26.9395 7.84673 26.6287 7.81089 26.3167 7.81089C26.1449 7.81089 25.9736 7.82193 25.803 7.84263C25.9627 6.66061 25.8396 5.27556 25.4502 4.01843C24.7928 1.89608 23.4974 0.508103 21.8026 0.110058C21.4913 0.0371092 21.1696 0 20.8466 0C18.7213 0 16.8684 1.587 15.7206 3.35203C14.5727 1.587 12.7198 0 10.5945 0C10.2714 0 9.94978 0.0371092 9.63855 0.110156C7.94383 0.508298 6.64843 1.89638 5.99101 4.01863C5.60293 5.27155 5.47939 6.65143 5.63662 7.83081C5.50801 7.8191 5.3793 7.81119 5.2501 7.81119C4.93789 7.81119 4.62715 7.84702 4.32637 7.91773C2.7004 8.29966 1.46184 9.61762 0.83899 11.6288C0.41243 13.006 0.327762 14.5519 0.612526 15.7642C0.892993 16.9582 1.57902 18.0316 2.54406 18.7868C3.342 19.411 4.30645 19.7982 5.30732 19.9057C4.84668 20.719 4.26133 21.979 4.26133 23.1338C4.26133 27.1867 7.55868 30.484 11.6116 30.484C12.1021 30.484 12.5931 30.435 13.0712 30.3385C13.9423 30.1625 14.8312 30.0734 15.713 30.0734C16.5983 30.0734 17.4951 30.1632 18.3786 30.3404C18.7511 30.4153 19.1316 30.4599 19.5134 30.4763C19.4252 30.6901 19.3441 30.9123 19.272 31.145C18.8454 32.5222 18.7608 34.0681 19.0455 35.2804C19.326 36.4744 20.012 37.5479 20.9771 38.303C21.775 38.9272 22.7394 39.3144 23.7403 39.4219C23.2797 40.2351 22.6943 41.4952 22.6943 42.6499C22.6943 46.7029 25.9917 50.0002 30.0446 50.0002C30.535 50.0002 31.0262 49.9512 31.5042 49.8547C32.3753 49.6788 33.2641 49.5896 34.1461 49.5896C35.0314 49.5896 35.9282 49.6794 36.8117 49.8566C37.2867 49.952 37.7747 50.0003 38.2619 50.0003C42.3148 50.0003 45.6122 46.703 45.6122 42.65C45.6122 41.626 45.3255 40.496 44.7987 39.4106C45.7617 39.2879 46.6862 38.9052 47.4559 38.3031C48.4209 37.5481 49.1069 36.4746 49.3874 35.2805C49.6717 34.0677 49.5871 32.5218 49.1605 31.1446ZM35.6669 26.0678C36.0193 24.5678 37.7429 22.313 39.2794 22.313C39.3936 22.313 39.507 22.3255 39.6186 22.3516C41.2302 22.7301 41.8811 25.827 41.5026 27.4385C41.1782 28.8196 39.9472 29.7511 38.5873 29.7511C38.3605 29.7511 38.1298 29.7251 37.8993 29.671C36.2878 29.2924 35.2883 27.6792 35.6669 26.0678ZM28.6881 22.3515C28.7998 22.3253 28.913 22.3129 29.0274 22.3129C30.5637 22.3129 32.2875 24.5678 32.6399 26.0677C33.0184 27.6792 32.0189 29.2925 30.4075 29.671C30.1769 29.7251 29.9465 29.7511 29.7195 29.7511C28.3598 29.7511 27.1286 28.8195 26.8042 27.4385C26.4256 25.8271 27.0766 22.7301 28.6881 22.3515ZM26.3166 10.5079C26.4199 10.5078 26.5226 10.5192 26.6236 10.5429C28.0822 10.8855 28.6714 13.6887 28.329 15.1473C28.0353 16.3974 26.921 17.2405 25.6901 17.2405C25.4847 17.2405 25.2761 17.2171 25.0674 17.1681C23.6088 16.8255 22.704 15.3652 23.0467 13.9067C23.3656 12.549 24.9259 10.5079 26.3166 10.5079ZM17.2341 6.45162C17.5865 4.95163 19.3101 2.69676 20.8466 2.69676C20.9608 2.69676 21.0742 2.70926 21.1858 2.73543C22.7974 3.11395 23.4483 6.2108 23.0698 7.82232C22.7454 9.20336 21.5144 10.1349 20.1545 10.1349C19.9276 10.1349 19.697 10.1089 19.4665 10.0548C17.8551 9.67621 16.8556 8.06304 17.2341 6.45162ZM10.2552 2.73543C10.3669 2.70916 10.4801 2.69676 10.5945 2.69676C12.1308 2.69676 13.8546 4.95173 14.207 6.45162C14.5855 8.06314 13.586 9.67641 11.9746 10.0549C11.744 10.109 11.5136 10.135 11.2866 10.135C9.92692 10.135 8.69568 9.20336 8.37127 7.82242C7.99276 6.2109 8.64373 3.11395 10.2552 2.73543ZM5.87656 17.2404C4.64571 17.2405 3.53136 16.3973 3.23771 15.1473C2.89503 13.6887 3.48429 10.8855 4.94307 10.5429C5.04404 10.5192 5.14658 10.5078 5.2501 10.5078C6.64071 10.5078 8.20106 12.549 8.5199 13.9066C8.86248 15.3651 7.9578 16.8255 6.49921 17.168C6.29062 17.217 6.08203 17.2404 5.87656 17.2404ZM19.8287 27.7869C19.5139 27.7869 19.2063 27.7557 18.909 27.696C17.8486 27.4833 16.7809 27.3764 15.713 27.3764C14.652 27.3764 13.5907 27.4822 12.5373 27.6949C12.238 27.7553 11.9285 27.7869 11.6114 27.7869C9.04128 27.7869 6.9579 25.7036 6.9579 23.1335C6.9579 22.2514 8.23397 19.7163 9.95935 18.6909C10.7016 18.2498 11.092 17.6001 11.0665 16.737C11.0665 14.1669 13.1499 12.0835 15.72 12.0835C18.2901 12.0835 20.3734 14.1669 20.3734 16.737C20.3608 17.6347 20.9103 18.1891 21.7062 18.6045C23.3705 19.473 24.4821 21.6882 24.4821 23.1334C24.4822 25.7035 22.3987 27.7869 19.8287 27.7869ZM24.3094 36.7563C23.0785 36.7564 21.9641 35.9133 21.6706 34.6632C21.3279 33.2046 21.9172 30.4014 23.376 30.0588C23.4769 30.0351 23.5795 30.0238 23.683 30.0238C25.0736 30.0238 26.634 32.0648 26.9528 33.4225C27.2955 34.881 26.3907 36.3413 24.9321 36.6839C24.7235 36.7329 24.5149 36.7563 24.3094 36.7563ZM38.2614 47.3029C37.9466 47.3029 37.639 47.2717 37.3417 47.212C36.2813 46.9992 35.2137 46.8924 34.1458 46.8924C33.0848 46.8924 32.0235 46.9982 30.9701 47.2109C30.6708 47.2713 30.3613 47.303 30.0442 47.303C27.4741 47.303 25.3907 45.2197 25.3907 42.6496C25.3907 41.7675 26.6668 39.2324 28.3921 38.207C29.1344 37.7659 29.5248 37.1162 29.4993 36.2531C29.4993 33.683 31.5827 31.5996 34.1528 31.5996C36.7229 31.5996 38.8062 33.683 38.8062 36.2531C38.7937 37.1508 39.3431 37.7052 40.139 38.1206C41.8033 38.9891 42.9148 41.2043 42.9148 42.6495C42.9149 45.2196 40.8315 47.3029 38.2614 47.3029ZM46.7617 34.6633C46.468 35.9134 45.3537 36.7565 44.1228 36.7565C43.9174 36.7565 43.7088 36.7331 43.5001 36.6841C42.0415 36.3414 41.1367 34.8812 41.4794 33.4227C41.7982 32.0649 43.3585 30.0239 44.7492 30.0239C44.8526 30.0239 44.9553 30.0353 45.0562 30.059C46.5151 30.4015 47.1043 33.2046 46.7617 34.6633Z" />
    </svg>
  );

  const userId = user?.id || "";
  const displayName =
    user?.displayName ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Anonymous";
  const { pinnedIds, togglePin, isPinned } = usePinnedStates();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
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
  if (activeLocation === "staff_lounge") {
    chatRoomLocation = "staff_lounge";
  } else if (activeLocation === "country" && countryCode) {
    chatRoomLocation = `country:${countryCode}`;
  } else if (
    activeLocation !== "global" &&
    activeLocation !== "country" &&
    countryCode &&
    activeLocation !== "staff_lounge"
  ) {
    if (activeDistrict) {
      chatRoomLocation = `city:${countryCode}:${activeLocation}:${activeDistrict}`;
    } else {
      chatRoomLocation = `state:${countryCode}:${activeLocation}`;
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
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
  };

  const handleUserClick = (clickedUserId: string, clickedUserName: string) => {
    if (clickedUserId === userId) return;
    setActiveDmUser({ id: clickedUserId, name: clickedUserName });
    setSidebarView("private");
    setMobileView("chat");
  };

  useEffect(() => {
    if (!userId) return;
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
        } as Message;
      });
      setMessages(mapped.reverse());
    };

    fetchMessages();
    return () => {
      cancelled = true;
    };
  }, [userId, activePet, activeBreed, chatRoomLocation, activeDmUser?.id]);

  const handleNewMessage = useCallback(
    (newMessage: Message) => {
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
    [activeDmUser, userId, chatRoomLocation, activeBreed, activePet],
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
    if (!isConnected) return false;

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
        if (uploadError) return false;
        const { data: urlData } = supabase.storage
          .from("chat-uploads")
          .getPublicUrl(filePath);
        mediaUrl = urlData.publicUrl;
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
      if (error) return false;
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
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

      const { error: banError } = await supabase.from("bans").insert({
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
                  <div className="px-3 py-2 border-b border-border/50 mb-1">
                    <p className="font-medium text-sm text-foreground truncate">
                      {user?.displayName || user?.username || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
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
                onClick={() => setActivePet(pet.id)}
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-2 hover:bg-gray-100 rounded-lg">
                                  <MoreVertical className="w-4 h-4 text-gray-500" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => togglePin(loc.isoCode)}
                                >
                                  <Pin className="w-4 h-4 mr-2" />
                                  Unpin
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => togglePin(loc.isoCode)}
                            >
                              <Pin className="w-4 h-4 mr-2" />
                              Pin to Top
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                  <>
                    {dmContacts.map((contact) => (
                      <button
                        key={`dm-${contact.id}`}
                        onClick={() =>
                          handleUserClick(contact.id, contact.name)
                        }
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
                    ))}
                  </>
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
              <p className="max-w-md">
                Select a user to view your conversation.
              </p>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "text-white px-4 py-3 flex items-center justify-between shadow-md flex-none h-16 overflow-x-auto no-scrollbar",
                  activeLocation === "staff_lounge"
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
                  {activeDmUser ? (
                    <Link
                      href={`/profile/${activeDmUser.name}`}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <User className="w-5 h-5" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/community-guidelines"
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <BookOpen className="w-5 h-5 rotate-12" />
                      </Link>
                      <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <Megaphone className="w-5 h-5 -rotate-12" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6 pt-6 scroll-smooth">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 py-10">
                    <p className="text-lg font-medium">No messages yet</p>
                  </div>
                )}

                {myBan && (
                  <div className="mx-auto max-w-md bg-red-50 text-red-700 p-3 rounded-lg text-sm font-bold flex items-center gap-2 mb-4 justify-center border border-red-200 shadow-sm">
                    <Ban className="w-5 h-5" /> You are currently banned from
                    chatting.
                  </div>
                )}

                {messages.map((msg) => (
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
                ))}
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
                <p className="text-xs text-gray-400 mt-1">
                  Your rank ({userRole}) authorizes limits up to{" "}
                  {getAvailableDurations(userRole).slice(-1)[0].label}.
                </p>
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
