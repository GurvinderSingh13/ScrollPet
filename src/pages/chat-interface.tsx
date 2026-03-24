import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ChevronDown,
  User
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { INDIA_LOCATIONS, getDistricts, type StateOrUT } from "@/data/indiaLocations";
import { PET_BREEDS, getBreeds } from "@/data/petBreeds";
import { ChatInput } from "@/components/ChatInput";
import { MessageBubble } from "@/components/MessageBubble";
import { useAuth } from "@/hooks/use-auth";

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
  { id: 'dog', name: 'Dog', image: dogImg },
  { id: 'cat', name: 'Cat', image: catImg },
  { id: 'fish', name: 'Fish', image: fishImg },
  { id: 'bird', name: 'Bird', image: birdImg },
  { id: 'rabbit', name: 'Rabbit', image: rabbitImg },
  { id: 'hamster', name: 'Hamster', image: hamsterImg },
  { id: 'turtle', name: 'Turtle', image: turtleImg },
  { id: 'guinea-pig', name: 'Guinea Pig', image: guineaPigImg },
  { id: 'horse', name: 'Horse', image: horseImg },
  { id: 'other', name: 'Other', isIcon: true },
];

// Location types for the hierarchy
type LocationType = 'global' | 'country' | 'state';

interface LocationItem {
  id: string;
  name: string;
  type: LocationType;
  stateData?: StateOrUT;
}

// Build location list
const FIXED_LOCATIONS: LocationItem[] = [
  { id: 'global', name: 'Global', type: 'global' },
  { id: 'india', name: 'India', type: 'country' },
];

// Convert INDIA_LOCATIONS to LocationItem format
const STATE_LOCATIONS: LocationItem[] = INDIA_LOCATIONS.map(state => ({
  id: state.id,
  name: state.name,
  type: 'state' as LocationType,
  stateData: state,
}));

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
  };
  receiverId?: string | null;
}

// Hook to manage pinned states with localStorage
function usePinnedStates() {
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('pinnedStates');
    return saved ? JSON.parse(saved) : [];
  });

  const togglePin = useCallback((stateId: string) => {
    setPinnedIds(prev => {
      const newPinned = prev.includes(stateId) 
        ? prev.filter(id => id !== stateId)
        : [...prev, stateId];
      localStorage.setItem('pinnedStates', JSON.stringify(newPinned));
      return newPinned;
    });
  }, []);

  const isPinned = useCallback((stateId: string) => pinnedIds.includes(stateId), [pinnedIds]);

  return { pinnedIds, togglePin, isPinned };
}

export default function ChatInterface() {
  const [activePet, setActivePet] = useState('dog');
  const [activeBreed, setActiveBreed] = useState<string | null>(null);
  const [activeLocation, setActiveLocation] = useState('global');
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const [activeDmUser, setActiveDmUser] = useState<{ id: string; name: string } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarView, setSidebarView] = useState<'public' | 'private'>('public');
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadDmCount, setUnreadDmCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Paw Prints SVG Icon
  const PawIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="50" height="50" viewBox="0 0 50 50" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_1182_956)">
        <path d="M49.1605 31.1446C48.5374 29.1334 47.299 27.8155 45.6731 27.4336C45.3722 27.363 45.0615 27.3271 44.7494 27.3271C44.582 27.3271 44.4152 27.3379 44.2489 27.3576C44.3882 26.1982 44.2612 24.8561 43.8829 23.6347C43.2255 21.5124 41.9302 20.1244 40.2353 19.7263C39.9242 19.6533 39.6026 19.6162 39.2794 19.6162C37.1541 19.6162 35.3013 21.2032 34.1534 22.9682C33.0056 21.2031 31.1527 19.6162 29.0275 19.6162C28.7044 19.6162 28.3828 19.6533 28.0715 19.7263C27.5353 19.8523 27.0391 20.0777 26.5905 20.3939C26.5216 20.2265 26.4464 20.0599 26.3659 19.894C27.3287 19.7712 28.2531 19.3887 29.0227 18.7865C29.9877 18.0315 30.6737 16.958 30.9542 15.7639C31.239 14.5516 31.1543 13.0057 30.7278 11.6285C30.1047 9.61733 28.8664 8.29937 27.2404 7.91743C26.9395 7.84673 26.6287 7.81089 26.3167 7.81089C26.1449 7.81089 25.9736 7.82193 25.803 7.84263C25.9627 6.66061 25.8396 5.27556 25.4502 4.01843C24.7928 1.89608 23.4974 0.508103 21.8026 0.110058C21.4913 0.0371092 21.1696 0 20.8466 0C18.7213 0 16.8684 1.587 15.7206 3.35203C14.5727 1.587 12.7198 0 10.5945 0C10.2714 0 9.94978 0.0371092 9.63855 0.110156C7.94383 0.508298 6.64843 1.89638 5.99101 4.01863C5.60293 5.27155 5.47939 6.65143 5.63662 7.83081C5.50801 7.8191 5.3793 7.81119 5.2501 7.81119C4.93789 7.81119 4.62715 7.84702 4.32637 7.91773C2.7004 8.29966 1.46184 9.61762 0.83899 11.6288C0.41243 13.006 0.327762 14.5519 0.612526 15.7642C0.892993 16.9582 1.57902 18.0316 2.54406 18.7868C3.342 19.411 4.30645 19.7982 5.30732 19.9057C4.84668 20.719 4.26133 21.979 4.26133 23.1338C4.26133 27.1867 7.55868 30.484 11.6116 30.484C12.1021 30.484 12.5931 30.435 13.0712 30.3385C13.9423 30.1625 14.8312 30.0734 15.713 30.0734C16.5983 30.0734 17.4951 30.1632 18.3786 30.3404C18.7511 30.4153 19.1316 30.4599 19.5134 30.4763C19.4252 30.6901 19.3441 30.9123 19.272 31.145C18.8454 32.5222 18.7608 34.0681 19.0455 35.2804C19.326 36.4744 20.012 37.5479 20.9771 38.303C21.775 38.9272 22.7394 39.3144 23.7403 39.4219C23.2797 40.2351 22.6943 41.4952 22.6943 42.6499C22.6943 46.7029 25.9917 50.0002 30.0446 50.0002C30.535 50.0002 31.0262 49.9512 31.5042 49.8547C32.3753 49.6788 33.2641 49.5896 34.1461 49.5896C35.0314 49.5896 35.9282 49.6794 36.8117 49.8566C37.2867 49.952 37.7747 50.0003 38.2619 50.0003C42.3148 50.0003 45.6122 46.703 45.6122 42.65C45.6122 41.626 45.3255 40.496 44.7987 39.4106C45.7617 39.2879 46.6862 38.9052 47.4559 38.3031C48.4209 37.5481 49.1069 36.4746 49.3874 35.2805C49.6717 34.0677 49.5871 32.5218 49.1605 31.1446ZM35.6669 26.0678C36.0193 24.5678 37.7429 22.313 39.2794 22.313C39.3936 22.313 39.507 22.3255 39.6186 22.3516C41.2302 22.7301 41.8811 25.827 41.5026 27.4385C41.1782 28.8196 39.9472 29.7511 38.5873 29.7511C38.3605 29.7511 38.1298 29.7251 37.8993 29.671C36.2878 29.2924 35.2883 27.6792 35.6669 26.0678ZM28.6881 22.3515C28.7998 22.3253 28.913 22.3129 29.0274 22.3129C30.5637 22.3129 32.2875 24.5678 32.6399 26.0677C33.0184 27.6792 32.0189 29.2925 30.4075 29.671C30.1769 29.7251 29.9465 29.7511 29.7195 29.7511C28.3598 29.7511 27.1286 28.8195 26.8042 27.4385C26.4256 25.8271 27.0766 22.7301 28.6881 22.3515ZM26.3166 10.5079C26.4199 10.5078 26.5226 10.5192 26.6236 10.5429C28.0822 10.8855 28.6714 13.6887 28.329 15.1473C28.0353 16.3974 26.921 17.2405 25.6901 17.2405C25.4847 17.2405 25.2761 17.2171 25.0674 17.1681C23.6088 16.8255 22.704 15.3652 23.0467 13.9067C23.3656 12.549 24.9259 10.5079 26.3166 10.5079ZM17.2341 6.45162C17.5865 4.95163 19.3101 2.69676 20.8466 2.69676C20.9608 2.69676 21.0742 2.70926 21.1858 2.73543C22.7974 3.11395 23.4483 6.2108 23.0698 7.82232C22.7454 9.20336 21.5144 10.1349 20.1545 10.1349C19.9276 10.1349 19.697 10.1089 19.4665 10.0548C17.8551 9.67621 16.8556 8.06304 17.2341 6.45162ZM10.2552 2.73543C10.3669 2.70916 10.4801 2.69676 10.5945 2.69676C12.1308 2.69676 13.8546 4.95173 14.207 6.45162C14.5855 8.06314 13.586 9.67641 11.9746 10.0549C11.744 10.109 11.5136 10.135 11.2866 10.135C9.92692 10.135 8.69568 9.20336 8.37127 7.82242C7.99276 6.2109 8.64373 3.11395 10.2552 2.73543ZM5.87656 17.2404C4.64571 17.2405 3.53136 16.3973 3.23771 15.1473C2.89503 13.6887 3.48429 10.8855 4.94307 10.5429C5.04404 10.5192 5.14658 10.5078 5.2501 10.5078C6.64071 10.5078 8.20106 12.549 8.5199 13.9066C8.86248 15.3651 7.9578 16.8255 6.49921 17.168C6.29062 17.217 6.08203 17.2404 5.87656 17.2404ZM19.8287 27.7869C19.5139 27.7869 19.2063 27.7557 18.909 27.696C17.8486 27.4833 16.7809 27.3764 15.713 27.3764C14.652 27.3764 13.5907 27.4822 12.5373 27.6949C12.238 27.7553 11.9285 27.7869 11.6114 27.7869C9.04128 27.7869 6.9579 25.7036 6.9579 23.1335C6.9579 22.2514 8.23397 19.7163 9.95935 18.6909C10.7016 18.2498 11.092 17.6001 11.0665 16.737C11.0665 14.1669 13.1499 12.0835 15.72 12.0835C18.2901 12.0835 20.3734 14.1669 20.3734 16.737C20.3608 17.6347 20.9103 18.1891 21.7062 18.6045C23.3705 19.473 24.4821 21.6882 24.4821 23.1334C24.4822 25.7035 22.3987 27.7869 19.8287 27.7869ZM24.3094 36.7563C23.0785 36.7564 21.9641 35.9133 21.6706 34.6632C21.3279 33.2046 21.9172 30.4014 23.376 30.0588C23.4769 30.0351 23.5795 30.0238 23.683 30.0238C25.0736 30.0238 26.634 32.0648 26.9528 33.4225C27.2955 34.881 26.3907 36.3413 24.9321 36.6839C24.7235 36.7329 24.5149 36.7563 24.3094 36.7563ZM38.2614 47.3029C37.9466 47.3029 37.639 47.2717 37.3417 47.212C36.2813 46.9992 35.2137 46.8924 34.1458 46.8924C33.0848 46.8924 32.0235 46.9982 30.9701 47.2109C30.6708 47.2713 30.3613 47.303 30.0442 47.303C27.4741 47.303 25.3907 45.2197 25.3907 42.6496C25.3907 41.7675 26.6668 39.2324 28.3921 38.207C29.1344 37.7659 29.5248 37.1162 29.4993 36.2531C29.4993 33.683 31.5827 31.5996 34.1528 31.5996C36.7229 31.5996 38.8062 33.683 38.8062 36.2531C38.7937 37.1508 39.3431 37.7052 40.139 38.1206C41.8033 38.9891 42.9148 41.2043 42.9148 42.6495C42.9149 45.2196 40.8315 47.3029 38.2614 47.3029ZM46.7617 34.6633C46.468 35.9134 45.3537 36.7565 44.1228 36.7565C43.9174 36.7565 43.7088 36.7331 43.5001 36.6841C42.0415 36.3414 41.1367 34.8812 41.4794 33.4227C41.7982 32.0649 43.3585 30.0239 44.7492 30.0239C44.8526 30.0239 44.9553 30.0353 45.0562 30.059C46.5151 30.4015 47.1043 33.2046 46.7617 34.6633Z"/>
      </g>
      <defs>
        <clipPath id="clip0_1182_956">
          <rect width="50" height="50" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );


  // Derive user info from auth
  const userId = user?.id || '';
  const displayName = user?.displayName || user?.username || user?.email?.split('@')[0] || 'Anonymous';

  const { pinnedIds, togglePin, isPinned } = usePinnedStates();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [authLoading, isAuthenticated]);

  // Get available breeds for current pet type
  const currentBreeds = getBreeds(activePet);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset breed when pet type changes
  useEffect(() => {
    setActiveBreed(null);
  }, [activePet]);

  // Mobile View State: 'list' (locations) or 'chat' (messages)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Get current location data
  const currentLocationData = activeLocation === 'global' 
    ? FIXED_LOCATIONS[0]
    : activeLocation === 'india'
    ? FIXED_LOCATIONS[1]
    : STATE_LOCATIONS.find(s => s.id === activeLocation);

  // Get districts for current state (if applicable)
  const currentDistricts = currentLocationData?.type === 'state' 
    ? getDistricts(activeLocation)
    : [];

  // Determine chat room location key (for API/WebSocket)
  // For districts, use format "state:district" so server knows the context
  // Breed is included in the room key to filter by breed
  const chatRoomLocation = activeDistrict 
    ? `${activeLocation}:${activeDistrict}` 
    : activeLocation;
  
  // Get the breed name for display
  const activeBreedData = activeBreed 
    ? currentBreeds.find(b => b.id === activeBreed) 
    : null;

  // Fetch messages for current room OR private DM
  // Uses a direct useEffect instead of useQuery to avoid stale cache races.
  // Strict order: Step A (clear) → Step B (fetch) → Step C (set)
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    // Step A: Immediately clear the messages state
    setMessages([]);

    const fetchMessages = async () => {
      let data: any[] | null = null;
      let error: any = null;

      if (activeDmUser) {
        console.log('[ScrollPet] FETCH DM:', { userId, dmUserId: activeDmUser.id });
        const result = await supabase
          .from('messages')
          .select(`
            *,
            users:users!user_id(
              id,
              username,
              display_name,
              state,
              country
            )
          `)
          .or(
            `and(user_id.eq.${userId},receiver_id.eq.${activeDmUser.id}),` +
            `and(user_id.eq.${activeDmUser.id},receiver_id.eq.${userId})`
          )
          .order('created_at', { ascending: false })
          .limit(50);

        data = result.data;
        error = result.error;
      } else {
        console.log('[ScrollPet] FETCH PUBLIC:', { pet_type: activePet, location: chatRoomLocation, breed: activeBreed });
        let query = supabase
          .from('messages')
          .select(`
            *,
            users:users!user_id(
              id,
              username,
              display_name,
              state,
              country
            )
          `)
          .eq('pet_type', activePet)
          .eq('location', chatRoomLocation)
          .is('receiver_id', null);

        if (activeBreed) {
          query = query.eq('breed', activeBreed);
        }

        query = query.order('created_at', { ascending: false }).limit(50);

        const result = await query;
        data = result.data;
        error = result.error;
      }

      if (cancelled) {
        console.log('[ScrollPet] FETCH CANCELLED (room changed mid-flight)');
        return;
      }

      console.log('[ScrollPet] FETCH RESULT:', { rowCount: data?.length || 0, error: error?.message || null, rawData: data });

      if (error) {
        console.error('[ScrollPet] Failed to fetch messages:', error);
        return;
      }

      // Step C: Map rows and set state
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
                username: userData.username || '',
                displayName: userData.display_name || userData.username || '',
                state: userData.state || '',
                country: userData.country || '',
              }
            : {
                id: row.user_id,
                username: 'Unknown',
                displayName: 'Unknown',
                state: '',
                country: '',
              },
        } as Message;
      });

      console.log('[ScrollPet] SETTING MESSAGES:', mapped.length, 'messages');
      setMessages(mapped.reverse());
    };

    // Step B: Execute the fetch
    fetchMessages();

    // Cleanup: mark this effect as stale if deps change
    return () => {
      cancelled = true;
    };
  }, [userId, activePet, activeBreed, chatRoomLocation, activeDmUser?.id]);

  // Handle new WebSocket messages
  const handleNewMessage = useCallback((newMessage: Message) => {
    // If this is a DM and user is in public mode, increment unread badge
    if (newMessage.receiverId && newMessage.receiverId === userId && !activeDmUser) {
      setUnreadDmCount(prev => prev + 1);
    }

    setMessages(prev => {
      // Filter out messages not meant for the current view
      if (activeDmUser) {
        // In DM view: only add if the message is between me and the active DM user
        const isFromMeToThem = newMessage.userId === userId && newMessage.receiverId === activeDmUser.id;
        const isFromThemToMe = newMessage.userId === activeDmUser.id && newMessage.receiverId === userId;
        if (!isFromMeToThem && !isFromThemToMe) return prev;
      } else {
        // In public view: only add if it's a public message (no receiver ID) matching location and breed
        if (newMessage.receiverId) return prev;
        if (newMessage.petType !== activePet) return prev;
        if (newMessage.location !== chatRoomLocation) return prev;
        if (activeBreed && newMessage.breed !== activeBreed) return prev;
      }
      return [...prev, newMessage];
    });
  }, [activeDmUser, userId, chatRoomLocation, activeBreed, activePet]);

  // WebSocket connection
  const { isConnected, sendMessage: sendWsMessage } = useWebSocket({
    userId,
    petType: activePet,
    breed: activeBreed,
    location: chatRoomLocation,
    onMessage: handleNewMessage,
  });

  // Query to get distinct users the logged in user has DM'd with
  const { data: dmContacts } = useQuery({
    queryKey: ['dmContacts', userId],
    queryFn: async () => {
      // Find all messages involving the current user as sender or receiver
      const { data, error } = await supabase
        .from('messages')
        .select(`
          user_id,
          receiver_id,
          users:users!user_id(id, display_name, username),
          receiver:users!receiver_id(id, display_name, username)
        `)
        .not('receiver_id', 'is', null)
        .or(`user_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract unique contacts
      const contactsMap = new Map();
      
      data?.forEach((msg: any) => {
        if (msg.user_id !== userId && msg.users) {
           if (!contactsMap.has(msg.user_id)) {
               contactsMap.set(msg.user_id, { 
                   id: msg.user_id, 
                   name: msg.users.display_name || msg.users.username || 'Unknown' 
               });
           }
        }
        if (msg.receiver_id !== userId && msg.receiver_id && msg.receiver) {
           if (!contactsMap.has(msg.receiver_id)) {
               contactsMap.set(msg.receiver_id, { 
                   id: msg.receiver_id, 
                   name: msg.receiver.display_name || msg.receiver.username || 'Unknown' 
               });
           }
        }
      });
      
      return Array.from(contactsMap.values());
    },
    enabled: !!userId,
  });

  // Handle window resize to reset view on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileView('chat');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset district when location changes
  useEffect(() => {
    setActiveDistrict(null);
  }, [activeLocation]);

  const activePetData = PETS.find(p => p.id === activePet);

  const handleLogout = () => {
    logout();
  };

  const handleLocationClick = (locId: string) => {
    setActiveLocation(locId);
    setActiveDistrict(null);
    setActiveDmUser(null);
    setSidebarView('public');
    setMobileView('chat');
  };

  const handleUserClick = (clickedUserId: string, clickedUserName: string) => {
    if (clickedUserId === userId) return; // Cannot DM yourself
    setActiveDmUser({ id: clickedUserId, name: clickedUserName });
    setSidebarView('private');
    setMobileView('chat');
  };

  const handleSendMessage = async (
    content: string, 
    messageType: string = 'text', 
    mediaFile?: File | Blob,
    mediaDuration?: number
  ): Promise<boolean> => {
    if (!isConnected) return false;

    try {
      let mediaUrl: string | null = null;

      if (mediaFile) {
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const ext = mediaFile instanceof File ? mediaFile.name.split('.').pop() : 'webm';
        const filePath = `chat-media/${fileName}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-uploads')
          .upload(filePath, mediaFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          return false;
        }

        const { data: urlData } = supabase.storage
          .from('chat-uploads')
          .getPublicUrl(filePath);
        mediaUrl = urlData.publicUrl;
      }

      const insertData: any = {
        user_id: userId,
        pet_type: activePet,
        location: chatRoomLocation,
        content: content || (messageType === 'audio' ? '🎤 Voice message' : '📎 Media'),
        message_type: messageType,
        media_url: mediaUrl,
        media_duration: mediaDuration || null,
        receiver_id: activeDmUser ? activeDmUser.id : null,
      };
      if (activeBreed && !activeDmUser) {
        insertData.breed = activeBreed;
      }

      console.log('[ScrollPet] INSERT payload:', JSON.stringify(insertData));

      const { error } = await supabase.from('messages').insert(insertData);
      if (error) {
        console.error('Failed to send message:', error);
        return false;
      }
      console.log('[ScrollPet] Message sent successfully');

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  // Separate pinned states from unpinned
  const pinnedStates = STATE_LOCATIONS.filter(s => isPinned(s.id));
  const unpinnedStates = STATE_LOCATIONS.filter(s => !isPinned(s.id));

  // Get display name for current view
  const getHeaderDisplayName = () => {
    if (activeDmUser) {
       return `Chat with @${activeDmUser.name}`;
    }
    if (activeDistrict) {
      const district = currentDistricts.find(d => d.id === activeDistrict);
      return `${currentLocationData?.name} - ${district?.name}`;
    }
    return currentLocationData?.name || 'Select Location';
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background font-sans overflow-hidden">
      
      {/* 1. Global App Header */}
      <header className="flex-none bg-background/80 backdrop-blur-md border-b border-border/40 z-30 transition-all">
        <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="cursor-pointer">
            <img 
              src={logoImage} 
              alt="ScrollPet Logo" 
              className="h-8 md:h-12 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 bg-muted/50 px-6 py-2 rounded-full border border-border/50">
            <Link href="/" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Home</Link>
            <Link href="/chat" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Chat Rooms</Link>
            <Link href="/about" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">About Us</Link>
            <Link href="/faq" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">FAQ</Link>
            <Link href="/contact" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Contact Us</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {authLoading ? (
               <Button variant="ghost" disabled>...</Button>
            ) : isAuthenticated ? (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <button className="h-10 w-10 rounded-full border border-border bg-muted flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
                     {user?.id ? (
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} alt="User Avatar" className="h-full w-full object-cover" />
                     ) : (
                       <User className="h-5 w-5 text-muted-foreground" />
                     )}
                   </button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-56 mt-2">
                   <div className="px-3 py-2 border-b border-border/50 mb-1">
                     <p className="font-medium text-sm text-foreground truncate">{user?.displayName || user?.username || 'User'}</p>
                     <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                   </div>
                   <DropdownMenuItem asChild>
                     <Link href="/user-profile" className="w-full cursor-pointer flex items-center">Profile Dashboard</Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer flex items-center font-medium">
                     Log Out
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
            ) : (
               <Button onClick={() => window.location.href = '/login'} className="font-bold cursor-pointer rounded-full px-6">
                 Login
               </Button>
            )}
          </div>

          <button className="md:hidden cursor-pointer p-2 hover:bg-muted rounded-full transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t p-4 space-y-4 bg-background animate-in slide-in-from-top-5 shadow-2xl absolute w-full z-50">
            <Link href="/" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Home</Link>
            <Link href="/chat" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Chat Rooms</Link>
            <Link href="/about" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">About Us</Link>
            <Link href="/faq" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">FAQ</Link>
            <Link href="/contact" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Contact Us</Link>
            {authLoading ? (
              <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" disabled>
                ...
              </Button>
            ) : isAuthenticated ? (
               <>
                 <Link href="/user-profile" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer text-primary">Profile Dashboard</Link>
                 <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" variant="destructive" onClick={handleLogout}>
                   Log Out
                 </Button>
               </>
            ) : (
              <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" onClick={() => window.location.href = '/login'}>
                Login
              </Button>
            )}
          </div>
        )}
      </header>

      {/* 2. Common Pet Icons Row — hidden in Private mode */}
      {sidebarView === 'public' ? (
      <div className="flex-none bg-white border-b z-20 shadow-sm">
        <div className="flex items-center justify-start md:justify-center gap-3 md:gap-4 p-2 md:p-4 overflow-x-auto no-scrollbar bg-white">
          {PETS.map((pet) => (
            <button
              key={pet.id}
              onClick={() => setActivePet(pet.id)}
              data-testid={`pet-icon-${pet.id}`}
              className={cn(
                "flex-none relative rounded-full p-0.5 md:p-1 transition-all duration-200",
                activePet === pet.id ? "ring-2 ring-primary ring-offset-2 scale-105 md:scale-110" : "opacity-70 hover:opacity-100 hover:scale-105"
              )}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-100 shadow-sm">
                {pet.isIcon ? (
                  <div className="w-full h-full flex items-center justify-center bg-white border-2 border-[#007699]">
                    <div className="text-[#007699] font-bold text-[10px] md:text-xs">Other</div>
                  </div>
                ) : (
                  <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
      ) : null}

      {/* 3. Main Split Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT COLUMN: Location Selection */}
        <aside className={cn(
          "bg-[#F5F7F9] border-r overflow-hidden flex flex-col w-full md:w-80 absolute md:relative z-10 h-full transition-transform duration-300",
          mobileView === 'list' ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          <div className="bg-[#007699] text-white px-4 py-3 shadow-md flex-none">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {sidebarView === 'public' ? (
                  <>
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/50 bg-white shrink-0">
                       {activePetData?.isIcon ? (
                          <div className="w-full h-full flex items-center justify-center bg-white text-[#007699] font-bold text-[10px]">Other</div>
                        ) : (
                          <img src={activePetData?.image} alt={activePetData?.name} className="w-full h-full object-cover" />
                        )}
                    </div>
                    
                    {/* Breed Dropdown — inline to save space in public mode */}
                    {currentBreeds.length > 0 && !activeDmUser && (
                      <Select 
                        value={activeBreed || '__all__'} 
                        onValueChange={(value) => setActiveBreed(value === '__all__' ? null : value)}
                      >
                        <SelectTrigger 
                          className="h-8 max-w-[140px] bg-white/10 border-white/20 text-white rounded-lg text-xs hover:bg-white/20 transition-colors shrink pr-1"
                        >
                          <SelectValue placeholder="All Breeds" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="__all__">All Breeds</SelectItem>
                          {currentBreeds.map(breed => (
                            <SelectItem key={breed.id} value={breed.id}>
                              {breed.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </>
                ) : (
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      className="w-full h-8 bg-white/10 border border-white/20 text-white placeholder:text-white/60 rounded-lg px-3 text-xs focus:outline-none focus:ring-1 focus:ring-white/40"
                    />
                  </div>
                )}
              </div>

               <button 
                  className={cn(
                    "p-2 rounded-full transition-colors relative flex-shrink-0 ml-auto",
                    sidebarView === 'private' ? "bg-white/20 text-white" : "hover:bg-white/10"
                  )}
                  onClick={() => {
                    setSidebarView(prev => prev === 'public' ? 'private' : 'public');
                    if (sidebarView === 'public') {
                      setUnreadDmCount(0);
                    }
                  }}
                >
                  {sidebarView === 'public' ? (
                     <MessageCircle className="w-6 h-6" />
                  ) : (
                     <PawIcon className="w-6 h-6" />
                  )}
                  {/* Notification badge */}
                  {unreadDmCount > 0 && sidebarView === 'public' && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-pulse">
                      {unreadDmCount > 9 ? '9+' : unreadDmCount}
                    </span>
                  )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sidebarView === 'public' ? (
              <>
                {/* Global */}
                <button
                  onClick={() => handleLocationClick('global')}
              data-testid="location-global"
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-200 text-left group border mb-2",
                activeLocation === 'global' 
                  ? "bg-[#FF6600] text-white shadow-md border-[#FF6600]" 
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-100 hover:border-gray-200 shadow-sm"
              )}
            >
              <div className="flex items-center gap-3">
                <Globe className={cn("w-5 h-5", activeLocation === 'global' ? "text-white" : "text-blue-500")} />
                <span className="text-base">Global</span>
              </div>
            </button>

            {/* India (Country) */}
            <button
              onClick={() => handleLocationClick('india')}
              data-testid="location-india"
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-200 text-left group border mb-2",
                activeLocation === 'india' 
                  ? "bg-[#FF6600] text-white shadow-md border-[#FF6600]" 
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-100 hover:border-gray-200 shadow-sm"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🇮🇳</span>
                <span className="text-base">India</span>
              </div>
            </button>

            {/* Pinned States Section */}
            {pinnedStates.length > 0 && (
              <>
                <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Pinned
                </div>
                {pinnedStates.map((loc) => (
                  <div key={`pinned-${loc.id}`} className="flex items-center gap-1 mb-2">
                    <button
                      onClick={() => handleLocationClick(loc.id)}
                      data-testid={`location-pinned-${loc.id}`}
                      className={cn(
                        "flex-1 flex items-center justify-between px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-200 text-left group border",
                        activeLocation === loc.id && !activeDmUser
                          ? "bg-[#FF6600] text-white shadow-md border-[#FF6600]" 
                          : "bg-white hover:bg-gray-50 text-gray-700 border-gray-100 hover:border-gray-200 shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Pin className={cn("w-4 h-4 rotate-45", activeLocation === loc.id && !activeDmUser ? "text-white" : "text-orange-500")} />
                        <span className="text-base">{loc.name}</span>
                        {loc.stateData?.type === 'ut' && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">UT</span>
                        )}
                      </div>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => togglePin(loc.id)}>
                          <Pin className="w-4 h-4 mr-2" />
                          Unpin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </>
            )}

            {/* All States & UTs */}
            <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              All States & Union Territories
            </div>
            {unpinnedStates.map((loc) => (
              <div key={loc.id} className="flex items-center gap-1 mb-2">
                <button
                  onClick={() => handleLocationClick(loc.id)}
                  data-testid={`location-${loc.id}`}
                  className={cn(
                    "flex-1 flex items-center justify-between px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-200 text-left group border",
                    activeLocation === loc.id && !activeDmUser
                      ? "bg-[#FF6600] text-white shadow-md border-[#FF6600]" 
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-100 hover:border-gray-200 shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{loc.name}</span>
                    {loc.stateData?.type === 'ut' && (
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        activeLocation === loc.id && !activeDmUser ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                      )}>UT</span>
                    )}
                  </div>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => togglePin(loc.id)}>
                      <Pin className="w-4 h-4 mr-2" />
                      Pin to Top
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            </>
            ) : (

            /* Direct Messages Section — styled like public room list */
            <div className="space-y-1">
              <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Your Conversations
              </div>
            {dmContacts && dmContacts.length > 0 ? (
              <>
                {dmContacts.map((contact) => (
                  <button
                    key={`dm-${contact.id}`}
                    onClick={() => handleUserClick(contact.id, contact.name)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-200 text-left group border mb-2",
                      activeDmUser?.id === contact.id
                        ? "bg-[#FF6600] text-white shadow-md border-[#FF6600]"
                        : "bg-white hover:bg-gray-50 text-gray-700 border-gray-100 hover:border-gray-200 shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full border overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center",
                        activeDmUser?.id === contact.id ? "border-white/50" : "border-gray-200"
                      )}>
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.id}`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-base truncate">@{contact.name}</span>
                    </div>
                  </button>
                ))}
              </>
            ) : (
                <div className="text-center p-4 text-gray-500 text-sm">
                  No active conversations yet. Click a username in any public chat room to start a private chat!
                </div>
            )}
            </div>
            )}
          </div>
        </aside>


        {/* RIGHT COLUMN: Chat Area */}
        <main className={cn(
          "flex-1 flex flex-col bg-white relative w-full h-full absolute md:relative transition-transform duration-300",
           mobileView === 'chat' ? "translate-x-0" : "translate-x-full md:translate-x-0"
        )}>
          {sidebarView === 'private' && !activeDmUser ? (
             <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-500 p-6 text-center">
                <div className="w-24 h-24 mb-6 text-gray-300 bg-white shadow-sm rounded-full flex items-center justify-center border-4 border-gray-50">
                   <MessageCircle className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Your Messages</h3>
                <p className="max-w-md">Select a user from the sidebar to view your conversation or start a new private chat.</p>
             </div>
          ) : (
             <>
                <div className="bg-[#007699] text-white px-4 py-3 flex items-center justify-between shadow-md flex-none h-16">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                     <div className="md:hidden">
                        <button 
                          onClick={() => setMobileView('list')}
                          className="p-1 mr-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                          <ArrowLeft className="w-6 h-6" />
                        </button>
                     </div>

                     {activeDmUser ? (
                       <Link href={`/profile/${activeDmUser.name}`}>
                         <h2 className="font-bold text-xl truncate hover:underline hover:text-orange-200 transition-colors cursor-pointer">
                           {activeDmUser.name}
                         </h2>
                       </Link>
                     ) : (
                       <h2 className="font-bold text-xl truncate">
                         {getHeaderDisplayName()}
                       </h2>
                     )}

                     {/* District Dropdown - Only show for state-level rooms & not in DMs */}
                     {currentLocationData?.type === 'state' && currentDistricts.length > 0 && !activeDmUser && (
                        <div className="hidden sm:block">
                          <Select 
                            value={activeDistrict || '__all__'} 
                            onValueChange={(value) => setActiveDistrict(value === '__all__' ? null : value)}
                          >
                            <SelectTrigger className="w-[160px] h-8 bg-white/10 text-white border-white/20 rounded-full text-xs focus:ring-0 hover:bg-white/20">
                              <SelectValue placeholder="Select District" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              <SelectItem value="__all__">All {currentLocationData.name}</SelectItem>
                              {currentDistricts.map(district => (
                                <SelectItem key={district.id} value={district.id}>
                                  {district.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                     )}
                  </div>

                  <div className="flex items-center gap-1">
                    {activeDmUser ? (
                      <Link href={`/profile/${activeDmUser.name}`} className="p-2 hover:bg-white/10 rounded-full transition-colors" title={`View ${activeDmUser.name}'s Profile`}>
                        <User className="w-5 h-5" />
                      </Link>
                    ) : (
                      <>
                        <Link href="/community-guidelines" className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Community Guidelines" data-testid="link-guidelines">
                          <BookOpen className="w-5 h-5 rotate-12" />
                        </Link>
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="News">
                          <Megaphone className="w-5 h-5 -rotate-12" />
                        </button>
                      </>
                    )}
                      {!isConnected && (
                        <div className="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-200 text-xs rounded-full">
                          Connecting...
                        </div>
                      )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 pt-6 scroll-smooth">
                   {/* Mobile District Dropdown */}
                   {currentLocationData?.type === 'state' && currentDistricts.length > 0 && !activeDmUser && (
                     <div className="sm:hidden mb-4">
                        <Select 
                          value={activeDistrict || '__all__'} 
                          onValueChange={(value) => setActiveDistrict(value === '__all__' ? null : value)}
                        >
                          <SelectTrigger className="w-full h-9 bg-gray-50 text-gray-900 border-gray-200 rounded-lg text-sm focus:ring-0">
                            <SelectValue placeholder="Select District" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            <SelectItem value="__all__">All {currentLocationData.name}</SelectItem>
                            {currentDistricts.map(district => (
                              <SelectItem key={district.id} value={district.id}>
                                {district.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>
                   )}

                  {messages.length === 0 && (
                    <div className="text-center text-gray-400 py-10">
                      <p className="text-lg font-medium">No messages yet</p>
                      <p className="text-sm">Be the first to start the conversation!</p>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwnMessage={msg.userId === userId}
                      displayName={displayName}
                      onUserClick={handleUserClick}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <ChatInput 
                  onSendMessage={handleSendMessage}
                  isConnected={isConnected}
                />
             </>
          )}

        </main>
      </div>
      
      <footer className="hidden md:block flex-none bg-gray-950 text-gray-300 py-12 border-t border-gray-900">
        <div className="container px-6 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 gap-4">
            <div className="flex items-center gap-2 opacity-80">
               <img 
                src={logoImage} 
                alt="ScrollPet Logo" 
                className="h-6 w-auto object-contain brightness-0 invert"
              />
              <span>© {new Date().getFullYear()} ScrollPet. All rights reserved.</span>
            </div>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
