import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Mock Data
// Pet Icons
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle

  const activePetData = PETS.find(p => p.id === activePet);

  return (
    <div className="h-screen flex flex-col bg-background font-sans overflow-hidden">
      
      {/* 1. Top Navigation Bar */}
      <div className="flex-none bg-white border-b z-20">
        
        {/* 1.1 Pet Icons Row */}
        <div className="flex items-center gap-4 p-4 overflow-x-auto no-scrollbar border-b">
          {PETS.map((pet) => (
            <button
              key={pet.id}
              onClick={() => setActivePet(pet.id)}
              className={cn(
                "flex-none relative rounded-full p-1 transition-all duration-200",
                activePet === pet.id ? "ring-2 ring-primary ring-offset-2" : "opacity-70 hover:opacity-100"
              )}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
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
          
          {/* Left Controls */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 flex-shrink-0">
               {activePetData?.isIcon ? (
                  <div className="w-full h-full flex items-center justify-center bg-white text-[#007699] font-bold text-xs">Other</div>
                ) : (
                  <img src={activePetData?.image} alt={activePetData?.name} className="w-full h-full object-cover" />
                )}
            </div>
            
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px] pl-9 h-10 bg-white text-gray-900 border-none rounded-full">
                  <SelectValue placeholder="All Breeds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Breeds</SelectItem>
                  <SelectItem value="gsd">German Shepherd</SelectItem>
                  <SelectItem value="lab">Labrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Center Controls */}
          <div className="flex items-center gap-4 flex-1 justify-center min-w-0">
            <h2 className="font-bold text-lg hidden md:block truncate">
              {LOCATIONS.find(l => l.id === activeLocation)?.name}
            </h2>
            <Select>
              <SelectTrigger className="w-[160px] h-9 bg-white text-gray-900 border-none rounded-full text-sm">
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patna">Patna</SelectItem>
                <SelectItem value="gaya">Gaya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-2 flex-shrink-0">
             <button className="md:hidden p-2 hover:bg-white/10 rounded-full" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Community Guidelines">
              <BookOpen className="w-5 h-5 rotate-12" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="News Room">
              <Megaphone className="w-5 h-5 -rotate-12" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* 2. Left Sidebar - Locations */}
        <aside className={cn(
          "w-80 flex-none bg-[#F5F7F9] border-r overflow-y-auto transition-all duration-300 absolute md:relative z-10 h-full",
          isSidebarOpen ? "left-0" : "-left-80 md:left-0"
        )}>
          <div className="p-2 space-y-1">
            {LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                onClick={() => {
                  setActiveLocation(loc.id);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left group",
                  activeLocation === loc.id 
                    ? "bg-[#FF6600] text-white shadow-md" 
                    : "bg-white hover:bg-gray-100 text-gray-700"
                )}
              >
                <div className="flex items-center gap-3">
                  {loc.type === 'global' && loc.icon && <loc.icon className="w-5 h-5 text-blue-500" />}
                  {loc.type === 'country' && <span className="text-xl">{loc.flag}</span>}
                  <span>{loc.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {loc.pinned && activeLocation !== loc.id && (
                    <Pin className="w-3 h-3 text-gray-400 rotate-45" />
                  )}
                  {loc.type === 'global' && <Lock className="w-3 h-3 text-gray-400" />}
                  {activeLocation === loc.id && (
                    <MoreVertical className="w-4 h-4 text-white/80" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* 3. Main Chat Area */}
        <main className="flex-1 flex flex-col bg-white relative w-full">
          
          {/* 3.1 Chat Header Badge */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="bg-[#FF6600] text-white px-6 py-1.5 rounded-md text-sm font-bold shadow-sm">
              {activePetData?.name}s Chat Room
            </div>
          </div>

          {/* 3.2 Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {MESSAGES.map((msg) => (
              <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                {!msg.isMe && (
                  <div className="text-xs text-gray-400 mb-1 ml-1 flex gap-1">
                    <span className="font-medium text-gray-600">@{msg.user}</span>
                    <span>({msg.location})</span>
                  </div>
                )}
                
                <div className={cn(
                  "px-5 py-3 rounded-2xl text-[15px] shadow-sm",
                  msg.isMe 
                    ? "bg-[#007699] text-white rounded-tr-none" 
                    : "bg-gray-100 text-gray-800 rounded-tl-none"
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
            <div className="flex items-center gap-3 max-w-4xl mx-auto bg-white border rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#007699]/20 transition-all">
              <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <Smile className="w-6 h-6" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <ImageIcon className="w-6 h-6" />
              </button>
              
              <input 
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none focus:outline-none text-gray-700 placeholder:text-gray-400 h-10 px-2"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <button 
                className={cn(
                  "p-2 rounded-full transition-all duration-200",
                  message.trim() ? "bg-[#007699] text-white hover:bg-[#007699]/90" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
              >
                {message.trim() ? <Send className="w-5 h-5 ml-0.5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
