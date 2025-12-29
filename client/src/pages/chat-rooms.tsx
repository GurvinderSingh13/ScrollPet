import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dog, 
  Cat, 
  Fish, 
  Bird, 
  Rabbit, 
  Turtle, 
  Rat,
  Search,
  Lock,
  MessageCircle,
  PawPrint,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import bgPattern from "@assets/generated_images/minimalist_pet_chat_rooms_background.png";

// Mock data for chat rooms
const CHAT_ROOMS = [
  { id: 'dog', name: 'Dog', icon: Dog, color: 'bg-orange-100 text-orange-600' },
  { id: 'cat', name: 'Cat', icon: Cat, color: 'bg-blue-100 text-blue-600' },
  { id: 'fish', name: 'Fish', icon: Fish, color: 'bg-cyan-100 text-cyan-600' },
  { id: 'bird', name: 'Bird', icon: Bird, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'rabbit', name: 'Rabbit', icon: Rabbit, color: 'bg-pink-100 text-pink-600' },
  { id: 'hamster', name: 'Hamster', icon: Rat, color: 'bg-amber-100 text-amber-600' }, // Lucide doesn't have Hamster, using Rat as fallback
  { id: 'turtle', name: 'Turtle', icon: Turtle, color: 'bg-green-100 text-green-600' },
  { id: 'guinea-pig', name: 'Guinea Pig', icon: PawPrint, color: 'bg-rose-100 text-rose-600' },
  { id: 'horse', name: 'Horse', icon: PawPrint, color: 'bg-stone-100 text-stone-600' }, // Using PawPrint as fallback
  { id: 'other', name: 'Other', icon: MessageCircle, color: 'bg-purple-100 text-purple-600' },
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
      // In a real app, this would navigate to the chat room
      // For now, we'll just show a toast or log
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
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 } as const
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground overflow-x-hidden selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
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
            <Link href="/chat" className="text-sm font-semibold text-primary transition-colors cursor-pointer">Chat Rooms</Link>
            <Link href="/about" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">About Us</Link>
            <Link href="/faq" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">FAQ</Link>
            <Link href="/contact" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Contact Us</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant={isLoggedIn ? "ghost" : "default"}
              onClick={() => setIsLoggedIn(!isLoggedIn)}
              className="font-bold cursor-pointer rounded-full px-6"
            >
              {isLoggedIn ? "Logout" : "Login"}
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden cursor-pointer p-2 hover:bg-muted rounded-full transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t bg-background overflow-hidden"
            >
              <div className="p-4 space-y-4 shadow-xl">
                <Link href="/" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Home</Link>
                <Link href="/chat" className="block text-base font-semibold py-3 px-4 rounded-lg bg-primary/5 text-primary cursor-pointer">Chat Rooms</Link>
                <Link href="/about" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">About Us</Link>
                <Link href="/faq" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">FAQ</Link>
                <Link href="/contact" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Contact Us</Link>
                <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" onClick={() => setIsLoggedIn(!isLoggedIn)}>
                  {isLoggedIn ? "Logout" : "Login"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative min-h-[calc(100vh-80px)]">
        {/* Subtle background pattern */}
        <div 
          className="absolute inset-0 opacity-40 z-0 pointer-events-none"
          style={{ 
            backgroundImage: `url(${bgPattern})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>

        <section className="relative z-10 container px-6 py-12 md:py-20 mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold font-heading mb-4 tracking-tight">
              Chat Rooms
            </h1>
            <p className="text-xl text-muted-foreground">
              Choose a pet category to explore conversations.
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {CHAT_ROOMS.map((room) => (
              <motion.button
                key={room.id}
                variants={itemVariants}
                onClick={() => handleRoomClick(room.id)}
                className="group relative flex flex-col items-center justify-center p-8 rounded-3xl bg-white/80 backdrop-blur-sm border border-border hover:border-primary/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full cursor-pointer"
              >
                {!isLoggedIn && (
                  <div className="absolute top-4 right-4 bg-gray-100 p-1.5 rounded-full text-gray-400 group-hover:text-primary transition-colors">
                    <Lock size={16} />
                  </div>
                )}
                
                <div className={`h-20 w-20 rounded-2xl ${room.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                  <room.icon size={40} strokeWidth={1.5} />
                </div>
                
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {room.name}
                </h3>
                
                {!isLoggedIn && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl font-bold text-foreground/80">
                    <span className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                      <Lock size={14} /> Login Required
                    </span>
                  </span>
                )}
              </motion.button>
            ))}
          </motion.div>

          <div className="mt-20 text-center">
            <p className="text-muted-foreground text-sm">
              Don't see your pet category? <Link href="/contact" className="text-primary hover:underline cursor-pointer">Suggest a new one</Link>
            </p>
          </div>
        </section>
      </main>

      {/* Login Requirement Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-secondary p-8 text-center text-white">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <Lock size={32} />
            </div>
            <DialogTitle className="text-2xl font-bold mb-2">Login Required</DialogTitle>
            <DialogDescription className="text-white/80 text-base">
              Please log in to enter chat rooms and join the conversation.
            </DialogDescription>
          </div>
          
          <div className="p-8 space-y-4 bg-background">
            <Button 
              className="w-full text-lg py-6 rounded-xl font-bold shadow-lg" 
              onClick={() => {
                setIsLoggedIn(true);
                setShowLoginDialog(false);
              }}
            >
              Log In
            </Button>
            <Button 
              variant="outline" 
              className="w-full text-lg py-6 rounded-xl font-bold border-2"
              onClick={() => setShowLoginDialog(false)}
            >
              Maybe Later
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Don't have an account? <span className="text-primary font-bold cursor-pointer hover:underline">Sign up free</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
