import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Menu,
  X,
  Lock,
  PawPrint,
  Loader2
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function ChatRooms() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch categories dynamically from Supabase
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["chat-room-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const handleRoomClick = (roomId: string) => {
    if (isAuthenticated) {
      setLocation('/chat-interface');
    } else {
      window.location.href = '/login';
    }
  };

  const handleAuthClick = () => {
    if (isAuthenticated) {
      logout();
    } else {
      window.location.href = '/login';
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
            <Link href="/chat" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Chat Rooms</Link>
            <Link href="/about" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">About Us</Link>
            <Link href="/faq" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">FAQ</Link>
            <Link href="/contact" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Contact Us</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
               <Button variant="ghost" disabled>...</Button>
            ) : isAuthenticated ? (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <button className="h-10 w-10 rounded-full border border-border bg-muted flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
                     {user?.id ? (
                      <img 
                        src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
                        alt="User Avatar" 
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

          {/* Mobile Menu Toggle */}
          <button className="md:hidden cursor-pointer p-2 hover:bg-muted rounded-full transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t p-4 space-y-4 bg-background animate-in slide-in-from-top-5 shadow-2xl">
            <Link href="/" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Home</Link>
            <Link href="/chat" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Chat Rooms</Link>
            <Link href="/about" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">About Us</Link>
            <Link href="/faq" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">FAQ</Link>
            <Link href="/contact" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Contact Us</Link>
            {isLoading ? (
               <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" disabled>...</Button>
            ) : isAuthenticated ? (
               <>
                 <Link href="/user-profile" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer text-primary">Profile Dashboard</Link>
                 <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" variant="destructive" onClick={logout}>
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

      <main className="flex-grow flex items-center justify-center py-20">
        <section className="container px-6 mx-auto max-w-7xl">
          {isCategoriesLoading ? (
            /* Skeleton Loader */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-12 gap-x-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center justify-center w-full animate-pulse">
                  <div className="w-40 h-40 md:w-48 md:h-48 mb-4 rounded-full bg-gray-200" />
                  <div className="h-5 w-20 bg-gray-200 rounded-md" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <PawPrint size={64} className="text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-500 mb-2">No categories yet</h3>
              <p className="text-gray-400">Pet categories will appear here once an admin adds them.</p>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-12 gap-x-8"
            >
              {categories.map((category: any) => (
                <motion.button
                  key={category.id}
                  variants={itemVariants}
                  onClick={() => handleRoomClick(String(category.id))}
                  className="group relative flex flex-col items-center justify-center w-full cursor-pointer"
                >
                  <div className="relative w-40 h-40 md:w-48 md:h-48 mb-4">
                    <div className="w-full h-full rounded-full overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-300 ring-4 ring-transparent group-hover:ring-primary/20">
                      {category.image_url ? (
                        <img 
                          src={category.image_url} 
                          alt={category.name} 
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                          onError={(e: any) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      {/* Fallback icon (shown if no image_url or image fails to load) */}
                      <div 
                        className="w-full h-full bg-gradient-to-br from-sky-50 to-sky-100 border-4 border-[#007699] items-center justify-center"
                        style={{ display: category.image_url ? 'none' : 'flex' }}
                      >
                        <PawPrint size={80} className="text-[#007699]" fill="currentColor" />
                      </div>
                      
                      {/* Locked Overlay */}
                      {!isAuthenticated && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                          <Lock className="text-white w-10 h-10 drop-shadow-md" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </motion.button>
              ))}

              {/* "Other" catch-all room */}
              <motion.button
                key="other"
                variants={itemVariants}
                onClick={() => handleRoomClick('other')}
                className="group relative flex flex-col items-center justify-center w-full cursor-pointer"
              >
                <div className="relative w-40 h-40 md:w-48 md:h-48 mb-4">
                  <div className="w-full h-full rounded-full overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-300 ring-4 ring-transparent group-hover:ring-primary/20">
                    <div className="w-full h-full bg-white border-4 border-[#007699] flex items-center justify-center">
                      <PawPrint size={80} className="text-[#007699]" fill="currentColor" />
                    </div>
                    {!isAuthenticated && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                        <Lock className="text-white w-10 h-10 drop-shadow-md" />
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 group-hover:text-primary transition-colors">
                  Other
                </h3>
              </motion.button>
            </motion.div>
          )}
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-950 text-gray-300 py-20 border-t border-gray-900">
        <div className="container px-6 mx-auto">
          <div className="grid md:grid-cols-12 gap-12 mb-16">
            <div className="col-span-12 md:col-span-4">
              <Link href="/" className="inline-block mb-6 opacity-90 hover:opacity-100 transition-opacity">
                 <img 
                  src={logoImage} 
                  alt="ScrollPet Logo" 
                  className="h-10 w-auto object-contain brightness-0 invert opacity-90"
                />
              </Link>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Connecting pet lovers worldwide in a safe, trusted environment. Join us in building the most positive pet community on the internet.
              </p>
              <div className="flex gap-4">
                {/* Social placeholders */}
                {[1,2,3].map(i => (
                  <div key={i} className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer">
                    <div className="w-5 h-5 bg-current rounded-sm opacity-50"></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-2 md:col-start-6">
              <h4 className="font-bold text-white mb-6 text-lg">Platform</h4>
              <ul className="space-y-3">
                <li><Link href="/" className="hover:text-primary transition-colors cursor-pointer">Home</Link></li>
                <li><Link href="/chat" className="hover:text-primary transition-colors cursor-pointer">Chat Rooms</Link></li>
                <li><Link href="/login" className="hover:text-primary transition-colors cursor-pointer">Login</Link></li>
                <li><Link href="/signup" className="hover:text-primary transition-colors cursor-pointer">Sign Up</Link></li>
              </ul>
            </div>

            <div className="col-span-6 md:col-span-2">
              <h4 className="font-bold text-white mb-6 text-lg">Company</h4>
              <ul className="space-y-3">
                <li><Link href="/about" className="hover:text-primary transition-colors cursor-pointer">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors cursor-pointer">Contact Us</Link></li>
                <li><Link href="/careers" className="hover:text-primary transition-colors cursor-pointer">Careers</Link></li>
                <li><Link href="/press" className="hover:text-primary transition-colors cursor-pointer">Press</Link></li>
              </ul>
            </div>

            <div className="col-span-6 md:col-span-2">
              <h4 className="font-bold text-white mb-6 text-lg">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="/privacy" className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors cursor-pointer">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-primary transition-colors cursor-pointer">Cookie Policy</Link></li>
                <li><Link href="/community-guidelines" className="hover:text-primary transition-colors cursor-pointer">Community Guidelines</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 gap-4">
            <div>© {new Date().getFullYear()} ScrollPet. All rights reserved.</div>
            <div className="flex gap-8">
              <span>Built for pet lovers 🐾</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Requirement Dialog - REMOVED since we redirect to /login now */}
    </div>
  );
}
