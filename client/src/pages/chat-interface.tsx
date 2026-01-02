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
  ChevronDown
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery } from "@tanstack/react-query";
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
  const [activeBreed, setActiveBreed] = useState<string | null>(null);
  const [activeLocation, setActiveLocation] = useState('global');
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive user info from auth
  const userId = user?.id || '';
  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Anonymous';

  const { pinnedIds, togglePin, isPinned } = usePinnedStates();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = '/api/login';
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

  
  // Fetch messages for current room
  const { data: historicalMessages } = useQuery({
    queryKey: ['messages', activePet, activeBreed, chatRoomLocation],
    queryFn: async () => {
      const breedParam = activeBreed ? `&breed=${activeBreed}` : '';
      const res = await fetch(`/api/messages?petType=${activePet}&location=${chatRoomLocation}${breedParam}`);
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
    breed: activeBreed,
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
    logout();
  };

  const handleLocationClick = (locId: string) => {
    setActiveLocation(locId);
    setActiveDistrict(null);
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
      // If there's a media file, use HTTP POST to upload
      if (mediaFile) {
        const formData = new FormData();
        formData.append('file', mediaFile, mediaFile instanceof File ? mediaFile.name : 'audio.webm');
        formData.append('userId', userId);
        formData.append('petType', activePet);
        if (activeBreed) {
          formData.append('breed', activeBreed);
        }
        formData.append('location', chatRoomLocation);
        formData.append('content', content);
        formData.append('messageType', messageType);
        if (mediaDuration) {
          formData.append('mediaDuration', mediaDuration.toString());
        }

        const response = await fetch('/api/messages', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        return true;
      } else {
        // Text-only message via WebSocket
        return sendWsMessage(content);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
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
            {authLoading ? (
              <Button variant="ghost" className="font-bold cursor-pointer rounded-full px-6" disabled>
                ...
              </Button>
            ) : isAuthenticated ? (
              <Button 
                variant="ghost"
                onClick={handleLogout}
                className="font-bold cursor-pointer rounded-full px-6"
              >
                Logout
              </Button>
            ) : (
              <Button 
                variant="default"
                onClick={() => window.location.href = '/api/login'}
                className="font-bold cursor-pointer rounded-full px-6"
              >
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
              <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" onClick={() => window.location.href = '/api/login'}>
                Login
              </Button>
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
          <div className="bg-[#007699] text-white px-4 py-3 shadow-md flex-none">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 bg-white">
                   {activePetData?.isIcon ? (
                      <div className="w-full h-full flex items-center justify-center bg-white text-[#007699] font-bold text-xs">Other</div>
                    ) : (
                      <img src={activePetData?.image} alt={activePetData?.name} className="w-full h-full object-cover" />
                    )}
                </div>
                
                <span className="font-bold text-lg">{activePetData?.name}s</span>
              </div>

               <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <MessageCircle className="w-6 h-6" />
              </button>
            </div>
            
            {/* Breed Dropdown */}
            {currentBreeds.length > 0 && (
              <Select 
                value={activeBreed || '__all__'} 
                onValueChange={(value) => setActiveBreed(value === '__all__' ? null : value)}
              >
                <SelectTrigger 
                  className="w-full h-9 bg-white/10 border-white/20 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
                  data-testid="select-breed"
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
                <Link href="/community-guidelines" className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Community Guidelines" data-testid="link-guidelines">
                  <BookOpen className="w-5 h-5 rotate-12" />
                </Link>
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
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <ChatInput 
            onSendMessage={handleSendMessage}
            isConnected={isConnected}
          />

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
