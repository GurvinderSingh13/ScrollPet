import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu,
  X,
  Lock,
  PawPrint
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";

// Import stock images
import dogImg from "@assets/stock_images/happy_dog_portrait_o_6e5075a4.jpg";
import catImg from "@assets/stock_images/ginger_cat_sitting_f_07d19cb3.jpg";
import fishImg from "@assets/stock_images/goldfish_in_a_bowl_o_1769c4d6.jpg";
import birdImg from "@assets/stock_images/colorful_parrot_bird_78491bbe.jpg";
import rabbitImg from "@assets/stock_images/cute_white_rabbit_po_8b3eec97.jpg";
import hamsterImg from "@assets/stock_images/cute_hamster_portrai_97a17a6a.jpg";
import turtleImg from "@assets/stock_images/turtle_close_up_port_f8acb4e1.jpg";
import guineaPigImg from "@assets/stock_images/guinea_pig_portrait_48d4dfd3.jpg";
import horseImg from "@assets/stock_images/horse_portrait_in_na_95b7a90d.jpg";

// Mock data for chat rooms
const CHAT_ROOMS = [
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

export default function ChatRooms() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [location, setLocation] = useLocation();

  const handleRoomClick = (roomId: string) => {
    if (!isLoggedIn) {
      setShowLoginDialog(true);
    } else {
      console.log(`Entering ${roomId} room`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 } as const
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-foreground overflow-x-hidden selection:bg-primary/20 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="cursor-pointer">
            <img 
              src={logoImage} 
              alt="ScrollPet Logo" 
              className="h-10 md:h-12 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            <Link href="/" className="text-base font-medium text-gray-700 hover:text-primary transition-colors cursor-pointer">Home</Link>
            <Link href="/chat" className="text-base font-medium text-primary transition-colors cursor-pointer">Chat Rooms</Link>
            <Link href="/about" className="text-base font-medium text-gray-700 hover:text-primary transition-colors cursor-pointer">About Us</Link>
            <Link href="/faq" className="text-base font-medium text-gray-700 hover:text-primary transition-colors cursor-pointer">FAQ</Link>
            <Link href="/contact" className="text-base font-medium text-gray-700 hover:text-primary transition-colors cursor-pointer">Contact Us</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant={isLoggedIn ? "ghost" : "default"}
              onClick={() => setIsLoggedIn(!isLoggedIn)}
              className="font-bold cursor-pointer rounded-full px-8 py-5 bg-[#FF6600] hover:bg-[#FF6600]/90 text-white shadow-md hover:shadow-lg transition-all"
            >
              {isLoggedIn ? "Logout" : "Log in"}
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="text-gray-700" /> : <Menu className="text-gray-700" />}
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t bg-white overflow-hidden"
            >
              <div className="p-4 space-y-4 shadow-xl">
                <Link href="/" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 text-gray-700 cursor-pointer">Home</Link>
                <Link href="/chat" className="block text-base font-semibold py-3 px-4 rounded-lg bg-primary/5 text-primary cursor-pointer">Chat Rooms</Link>
                <Link href="/about" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 text-gray-700 cursor-pointer">About Us</Link>
                <Link href="/faq" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 text-gray-700 cursor-pointer">FAQ</Link>
                <Link href="/contact" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 text-gray-700 cursor-pointer">Contact Us</Link>
                <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg bg-[#FF6600] hover:bg-[#FF6600]/90" onClick={() => setIsLoggedIn(!isLoggedIn)}>
                  {isLoggedIn ? "Logout" : "Log in"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow flex items-center justify-center py-20">
        <section className="container px-6 mx-auto max-w-7xl">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-12 gap-x-8"
          >
            {CHAT_ROOMS.map((room) => (
              <motion.button
                key={room.id}
                variants={itemVariants}
                onClick={() => handleRoomClick(room.id)}
                className="group relative flex flex-col items-center justify-center w-full cursor-pointer"
              >
                <div className="relative w-40 h-40 md:w-48 md:h-48 mb-4">
                  <div className="w-full h-full rounded-full overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-300 ring-4 ring-transparent group-hover:ring-primary/20">
                    {room.isIcon ? (
                      <div className="w-full h-full bg-white border-4 border-[#007699] flex items-center justify-center">
                         <PawPrint size={80} className="text-[#007699]" fill="currentColor" />
                      </div>
                    ) : (
                      <img 
                        src={room.image} 
                        alt={room.name} 
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      />
                    )}
                    
                    {/* Locked Overlay */}
                    {!isLoggedIn && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                        <Lock className="text-white w-10 h-10 drop-shadow-md" />
                      </div>
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg md:text-xl font-bold text-gray-800 group-hover:text-primary transition-colors">
                  {room.name}
                </h3>
              </motion.button>
            ))}
          </motion.div>
        </section>
      </main>
      
      {/* Footer - Minimal Black */}
      <footer className="bg-black text-white/50 text-center py-6 text-sm">
        <p>© ScrollPet. All Rights Reserved.</p>
      </footer>

      {/* Login Requirement Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl p-0 overflow-hidden">
          <div className="bg-[#007699] p-8 text-center text-white relative overflow-hidden">
             {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-inner border border-white/20">
              <Lock size={32} />
            </div>
            <DialogTitle className="text-2xl font-bold mb-2">Login Required</DialogTitle>
            <DialogDescription className="text-white/80 text-base">
              Please log in to enter the {CHAT_ROOMS.find(r => r.id === location)?.name} chat room.
            </DialogDescription>
          </div>
          
          <div className="p-8 space-y-4 bg-white">
            <Button 
              className="w-full text-lg py-6 rounded-full font-bold shadow-lg bg-[#FF6600] hover:bg-[#FF6600]/90 text-white" 
              onClick={() => {
                setIsLoggedIn(true);
                setShowLoginDialog(false);
              }}
            >
              Log In
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-base font-semibold text-gray-500 hover:text-gray-800"
              onClick={() => setShowLoginDialog(false)}
            >
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
