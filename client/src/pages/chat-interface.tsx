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
  MessageCircle, 
  Smile, 
  Image as ImageIcon, 
  Mic, 
  Send, 
  MoreVertical, 
  Search, 
  Globe, 
  Pin, 
  Lock,
  BookOpen,
  Megaphone,
  Menu,
  X,
  ArrowLeft
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";

// Mock Data
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

const LOCATIONS = [
  { id: 'global', name: 'Global', type: 'global', icon: Globe },
  { id: 'india', name: 'India', type: 'country', flag: '🇮🇳' },
  { id: 'punjab', name: 'Punjab', type: 'state', pinned: true },
  { id: 'andaman', name: 'Andaman & Nicobar Islands', type: 'state' },
  { id: 'andhra', name: 'Andhra Pradesh', type: 'state' },
  { id: 'assam', name: 'Assam', type: 'state' },
  { id: 'bihar', name: 'Bihar', type: 'state' },
  { id: 'chandigarh', name: 'Chandigarh', type: 'state' },
  { id: 'chattisgarh', name: 'Chattisgarh', type: 'state' },
  { id: 'delhi', name: 'Delhi', type: 'state' },
];

const MESSAGES = [
  { id: 1, user: 'Raj', location: 'Bihar', text: 'Hi', isMe: false },
  { id: 2, user: 'Sonu', location: 'Bihar', text: 'Hello Raj', isMe: false },
  { id: 3, user: 'Me', location: '', text: 'I just adopt a GSD', isMe: true },
  { id: 4, user: 'Raj', location: 'Bihar', text: 'Cool ! can you show us?', isMe: false },
  { id: 5, user: 'Me', location: '', text: 'Sure', isMe: true },
];

export default function ChatInterface() {
  const [activePet, setActivePet] = useState('dog');
  const [activeLocation, setActiveLocation] = useState('bihar');
  const [message, setMessage] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [, setLocation] = useLocation();

  // Mobile View State: 'list' (locations) or 'chat' (messages)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Handle window resize to reset view on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileView('chat'); // Always show chat on desktop
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activePetData = PETS.find(p => p.id === activePet);
  const activeLocationData = LOCATIONS.find(l => l.id === activeLocation);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setLocation('/');
  };

  const handleLocationClick = (locId: string) => {
    setActiveLocation(locId);
    setMobileView('chat');
  };

  return (
    <div className="h-screen flex flex-col bg-background font-sans overflow-hidden">
      
      {/* 1. Standard Header */}
      <header className="flex-none bg-background/80 backdrop-blur-md border-b border-border/40 z-30">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="cursor-pointer">
            <img 
              src={logoImage} 
              alt="ScrollPet Logo" 
              className="h-10 md:h-12 w-auto object-contain hover:opacity-90 transition-opacity"
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

          {/* Mobile Menu Toggle */}
          <button className="md:hidden cursor-pointer p-2 hover:bg-muted rounded-full transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
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

      {/* Chat Interface specific top bar */}
      <div className="flex-none bg-white border-b z-20 shadow-sm">
        
        {/* 1.1 Pet Icons Row - Center Aligned */}
        <div className="flex items-center justify-center gap-4 p-4 overflow-x-auto no-scrollbar border-b bg-white">
          {PETS.map((pet) => (
            <button
              key={pet.id}
              onClick={() => setActivePet(pet.id)}
              className={cn(
                "flex-none relative rounded-full p-1 transition-all duration-200",
                activePet === pet.id ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-70 hover:opacity-100 hover:scale-105"
              )}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shadow-sm">
                {pet.isIcon ? (
                  <div className="w-full h-full flex items-center justify-center bg-white border-2 border-[#007699]">
                    <div className="text-[#007699] font-bold text-xs">Other</div>
                  </div>
                ) : (
                  <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* 1.2 Controls Bar */}
        <div className="bg-[#007699] text-white px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Mobile Back Button (Only visible in chat view on mobile) */}
          <div className="md:hidden">
             {mobileView === 'chat' && (
                <button 
                  onClick={() => setMobileView('list')}
                  className="p-1 mr-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
             )}
          </div>

          {/* Left Controls / Title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Show Pet Image only if we have space or on desktop */}
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 flex-shrink-0 bg-white hidden sm:block">
               {activePetData?.isIcon ? (
                  <div className="w-full h-full flex items-center justify-center bg-white text-[#007699] font-bold text-xs">Other</div>
                ) : (
                  <img src={activePetData?.image} alt={activePetData?.name} className="w-full h-full object-cover" />
                )}
            </div>
            
            {/* On Mobile: Show current location name in header if in chat view */}
            <div className="md:hidden font-bold text-lg truncate">
              {mobileView === 'chat' ? activeLocationData?.name : 'Select Location'}
            </div>

            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px] pl-9 h-10 bg-white text-gray-900 border-none rounded-full focus:ring-0">
                  <SelectValue placeholder="All Breeds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Breeds</SelectItem>
                  <SelectItem value="gsd">German Shepherd</SelectItem>
                  <SelectItem value="lab">Labrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <button className="p-2 hover:bg-white/10 rounded-full transition-colors hidden sm:block">
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Center Controls - Desktop Only */}
          <div className="hidden md:flex items-center gap-4 flex-1 justify-center min-w-0">
            <h2 className="font-bold text-lg truncate">
              {activeLocationData?.name}
            </h2>
            <Select>
              <SelectTrigger className="w-[160px] h-9 bg-white text-gray-900 border-none rounded-full text-sm focus:ring-0">
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patna">Patna</SelectItem>
                <SelectItem value="gaya">Gaya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            {mobileView === 'chat' && (
              <>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Clear Chat">
                  <BookOpen className="w-5 h-5 rotate-12" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Announcements">
                  <Megaphone className="w-5 h-5 -rotate-12" />
                </button>
              </>
            )}
             {mobileView === 'list' && (
                <div className="text-sm font-medium opacity-80 mr-2 md:hidden">
                  {PETS.length} Categories
                </div>
             )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* 2. Location List (Sidebar on Desktop, Main View on Mobile) */}
        <aside className={cn(
          "bg-[#F5F7F9] border-r overflow-y-auto transition-all duration-300 w-full md:w-80 absolute md:relative z-10 h-full",
          // Mobile visibility logic
          mobileView === 'list' ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          <div className="p-2 space-y-1">
            {LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleLocationClick(loc.id)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-200 text-left group border mb-2",
                  activeLocation === loc.id 
                    ? "bg-[#FF6600] text-white shadow-md border-[#FF6600]" 
                    : "bg-white hover:bg-gray-50 text-gray-700 border-gray-100 hover:border-gray-200 shadow-sm"
                )}
              >
                <div className="flex items-center gap-3">
                  {loc.type === 'global' && <loc.icon className={cn("w-5 h-5", activeLocation === loc.id ? "text-white" : "text-blue-500")} />}
                  {loc.type === 'country' && <span className="text-xl">{loc.flag}</span>}
                  <span className="text-base">{loc.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {loc.pinned && activeLocation !== loc.id && (
                    <Pin className="w-3 h-3 text-gray-400 rotate-45" />
                  )}
                  {loc.type === 'global' && <Lock className={cn("w-3 h-3", activeLocation === loc.id ? "text-white/70" : "text-gray-400")} />}
                  {activeLocation === loc.id && (
                    <MoreVertical className="w-4 h-4 text-white/80" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* 3. Main Chat Area (Hidden on mobile if in list view) */}
        <main className={cn(
          "flex-1 flex flex-col bg-white relative w-full h-full absolute md:relative transition-transform duration-300",
           mobileView === 'chat' ? "translate-x-0" : "translate-x-full md:translate-x-0"
        )}>
          
          {/* 3.1 Chat Header Badge - Only show if in chat view */}
          <div className="flex justify-center pt-4 pb-2 absolute w-full top-0 z-10 pointer-events-none">
            <div className="bg-[#FF6600] text-white px-6 py-1.5 rounded-md text-sm font-bold shadow-md animate-in slide-in-from-top-2">
              {activePetData?.name}s Chat Room
            </div>
          </div>

          {/* 3.2 Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 pt-16 scroll-smooth">
            {MESSAGES.map((msg) => (
              <div key={msg.id} className={cn("flex flex-col max-w-[85%] md:max-w-[70%]", msg.isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                {!msg.isMe && (
                  <div className="text-xs text-gray-400 mb-1 ml-1 flex gap-1 items-center">
                    <span className="font-bold text-gray-600">@{msg.user}</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-500">[{msg.location}]</span>
                  </div>
                )}
                
                <div className={cn(
                  "px-5 py-3.5 text-[15px] shadow-sm leading-relaxed",
                  msg.isMe 
                    ? "bg-[#007699] text-white rounded-2xl rounded-tr-sm" 
                    : "bg-[#F3F4F6] text-gray-800 rounded-2xl rounded-tl-sm"
                )}>
                  {msg.text}
                </div>
                
                {msg.isMe && (
                  <div className="text-xs text-gray-400 mt-1 mr-1">
                    @{msg.user}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 3.3 Chat Input */}
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
                    setMessage('');
                  }
                }}
              />

              <button 
                className={cn(
                  "p-2.5 rounded-full transition-all duration-200 shadow-sm",
                  message.trim() ? "bg-[#007699] text-white hover:bg-[#007699]/90 scale-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
                onClick={() => setMessage('')}
              >
                {message.trim() ? <Send className="w-5 h-5 ml-0.5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
          </div>

        </main>
      </div>
      
      {/* 5. Standard Footer */}
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