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
  Smile, 
  Image as ImageIcon, 
  Mic, 
  Send, 
  MoreVertical, 
  Globe, 
  Pin,
  BookOpen,
  Megaphone,
  Menu,
  X,
  ArrowLeft,
  ChevronDown
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery } from "@tanstack/react-query";
import { INDIA_LOCATIONS, getDistricts, type StateOrUT, type District } from "@/data/indiaLocations";

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
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
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
  const [activeLocation, setActiveLocation] = useState('global');
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [userId, setUserId] = useState(() => localStorage.getItem('userId') || '');
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('displayName') || 'Anonymous');
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);

  const { pinnedIds, togglePin, isPinned } = usePinnedStates();

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
  const chatRoomLocation = activeDistrict 
    ? `${activeLocation}:${activeDistrict}` 
    : activeLocation;

  // Create demo user if needed
  useEffect(() => {
    if (!userId && isLoggedIn) {
      fetch('/api/users/create-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: 'User_' + Math.floor(Math.random() * 1000) }),
      })
        .then(res => res.json())
        .then(user => {
          setUserId(user.id);
          setDisplayName(user.displayName);
          localStorage.setItem('userId', user.id);
          localStorage.setItem('displayName', user.displayName);
        })
        .catch(console.error);
    }
  }, [userId, isLoggedIn]);

  // Fetch messages for current room
  const { data: historicalMessages } = useQuery({
    queryKey: ['messages', activePet, chatRoomLocation],
    queryFn: async () => {
      const res = await fetch(`/api/messages?petType=${activePet}&location=${chatRoomLocation}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json() as Promise<Message[]>;
    },
    enabled: !!userId,
  });

  // Update messages when historical messages load
  useEffect(() => {
    if (historicalMessages) {
      setMessages(historicalMessages.reverse());
    }
  }, [historicalMessages]);

  // Handle new WebSocket messages
  const handleNewMessage = useCallback((newMessage: Message) => {
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // WebSocket connection
  const { isConnected, sendMessage: sendWsMessage } = useWebSocket({
    userId,
    petType: activePet,
    location: chatRoomLocation,
    onMessage: handleNewMessage,
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
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('displayName');
    setIsLoggedIn(false);
    setLocation('/');
  };

  const handleLocationClick = (locId: string) => {
    setActiveLocation(locId);
    setActiveDistrict(null);
    setMobileView('chat');
  };

  const handleSendMessage = () => {
    if (!message.trim() || !isConnected) return;
    
    const success = sendWsMessage(message.trim());
    if (success) {
      setMessage('');
    }
  };

  // Separate pinned states from unpinned
  const pinnedStates = STATE_LOCATIONS.filter(s => isPinned(s.id));
  const unpinnedStates = STATE_LOCATIONS.filter(s => !isPinned(s.id));

  // Get display name for current location
  const getLocationDisplayName = () => {
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

          <nav className="hidden md:flex items-center gap-8 bg-muted/50 px-6 py-2 rounded-full border border-border/50">
            <Link href="/" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Home</Link>
            <Link href="/chat" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Chat Rooms</Link>
            <Link href="/about" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">About Us</Link>
            <Link href="/faq" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">FAQ</Link>
            <Link href="/contact" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Contact Us</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <Button 
                variant="ghost"
                onClick={handleLogout}
                className="font-bold cursor-pointer rounded-full px-6"
              >
                Logout
              </Button>
            ) : (
              <Link href="/login">
                <Button 
                  variant="default"
                  className="font-bold cursor-pointer rounded-full px-6"
                >
                  Login
                </Button>
              </Link>
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
            {isLoggedIn ? (
              <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <Link href="/login">
                <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg">
                  Login
                </Button>
              </Link>
            )}
          </div>
        )}
      </header>

      {/* 2. Common Pet Icons Row */}
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

      {/* 3. Main Split Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT COLUMN: Location Selection */}
        <aside className={cn(
          "bg-[#F5F7F9] border-r overflow-hidden flex flex-col w-full md:w-80 absolute md:relative z-10 h-full transition-transform duration-300",
          mobileView === 'list' ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          <div className="bg-[#007699] text-white px-4 py-3 flex items-center justify-between shadow-md flex-none h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 bg-white">
                 {activePetData?.isIcon ? (
                    <div className="w-full h-full flex items-center justify-center bg-white text-[#007699] font-bold text-xs">Other</div>
                  ) : (
                    <img src={activePetData?.image} alt={activePetData?.name} className="w-full h-full object-cover" />
                  )}
              </div>
              
              <div className="relative">
                <button className="flex items-center gap-1 font-bold text-lg hover:opacity-90 transition-opacity">
                   All {activePetData?.name}s <ChevronDown className="w-4 h-4 opacity-80" />
                </button>
              </div>
            </div>

             <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
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
                        activeLocation === loc.id 
                          ? "bg-[#FF6600] text-white shadow-md border-[#FF6600]" 
                          : "bg-white hover:bg-gray-50 text-gray-700 border-gray-100 hover:border-gray-200 shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Pin className={cn("w-4 h-4 rotate-45", activeLocation === loc.id ? "text-white" : "text-orange-500")} />
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
                    activeLocation === loc.id 
                      ? "bg-[#FF6600] text-white shadow-md border-[#FF6600]" 
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-100 hover:border-gray-200 shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{loc.name}</span>
                    {loc.stateData?.type === 'ut' && (
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        activeLocation === loc.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
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
          </div>
        </aside>


        {/* RIGHT COLUMN: Chat Area */}
        <main className={cn(
          "flex-1 flex flex-col bg-white relative w-full h-full absolute md:relative transition-transform duration-300",
           mobileView === 'chat' ? "translate-x-0" : "translate-x-full md:translate-x-0"
        )}>
          
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

               <h2 className="font-bold text-xl truncate">
                 {getLocationDisplayName()}
               </h2>

               {/* District Dropdown - Only show for state-level rooms */}
               {currentLocationData?.type === 'state' && currentDistricts.length > 0 && (
                  <div className="hidden sm:block">
                    <Select 
                      value={activeDistrict || ''} 
                      onValueChange={(value) => setActiveDistrict(value || null)}
                    >
                      <SelectTrigger className="w-[160px] h-8 bg-white/10 text-white border-white/20 rounded-full text-xs focus:ring-0 hover:bg-white/20">
                        <SelectValue placeholder="Select District" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="">All {currentLocationData.name}</SelectItem>
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
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Guidelines">
                  <BookOpen className="w-5 h-5 rotate-12" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="News">
                  <Megaphone className="w-5 h-5 -rotate-12" />
                </button>
                {!isConnected && (
                  <div className="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-200 text-xs rounded-full">
                    Connecting...
                  </div>
                )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 pt-6 scroll-smooth">
             {/* Mobile District Dropdown */}
             {currentLocationData?.type === 'state' && currentDistricts.length > 0 && (
               <div className="sm:hidden mb-4">
                  <Select 
                    value={activeDistrict || ''} 
                    onValueChange={(value) => setActiveDistrict(value || null)}
                  >
                    <SelectTrigger className="w-full h-9 bg-gray-50 text-gray-900 border-gray-200 rounded-lg text-sm focus:ring-0">
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="">All {currentLocationData.name}</SelectItem>
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
              <div key={msg.id} className={cn("flex flex-col max-w-[85%] md:max-w-[70%]", msg.userId === userId ? "ml-auto items-end" : "mr-auto items-start")}>
                {msg.userId !== userId && (
                  <div className="text-xs text-gray-400 mb-1 ml-1 flex gap-1 items-center">
                    <span className="font-bold text-gray-600">@{msg.user.displayName}</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-500">[{msg.location}]</span>
                  </div>
                )}
                
                <div className={cn(
                  "px-5 py-3.5 text-[15px] shadow-sm leading-relaxed",
                  msg.userId === userId
                    ? "bg-[#007699] text-white rounded-2xl rounded-tr-sm" 
                    : "bg-[#F3F4F6] text-gray-800 rounded-2xl rounded-tl-sm"
                )}>
                  {msg.content}
                </div>
                
                {msg.userId === userId && (
                  <div className="text-xs text-gray-400 mt-1 mr-1">
                    @{displayName}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 bg-white border-t">
            <div className="flex items-center gap-2 max-w-4xl mx-auto bg-white border rounded-full px-2 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#007699]/20 transition-all hover:border-gray-300">
              <button className="p-2.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <Smile className="w-6 h-6" />
              </button>
              <button className="p-2.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <ImageIcon className="w-6 h-6" />
              </button>
              
              <input 
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none focus:outline-none text-gray-700 placeholder:text-gray-400 h-10 px-2 text-base"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && message.trim()) {
                    handleSendMessage();
                  }
                }}
                data-testid="input-message"
              />

              <button 
                className={cn(
                  "p-2.5 rounded-full transition-all duration-200 shadow-sm",
                  message.trim() ? "bg-[#007699] text-white hover:bg-[#007699]/90 scale-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
                onClick={handleSendMessage}
                disabled={!isConnected}
                data-testid="button-send"
              >
                {message.trim() ? <Send className="w-5 h-5 ml-0.5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
          </div>

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
