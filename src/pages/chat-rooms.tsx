import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  PawPrint,
  Loader2
} from "lucide-react";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function ChatRooms() {
  const { user, isAuthenticated, logout } = useAuth();
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

  const handleRoomClick = (categoryName: string) => {
    const slug = encodeURIComponent(categoryName.toLowerCase().trim());
    setLocation(`/chat-interface?category=${slug}`);
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
    <div className="min-h-screen pt-20 bg-white font-sans text-foreground overflow-x-hidden selection:bg-primary/20 flex flex-col">

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
                  onClick={() => handleRoomClick(String(category.name))}
                  className="group relative flex flex-col items-center justify-center w-full cursor-pointer transition-transform duration-200 hover:scale-105"
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
                className="group relative flex flex-col items-center justify-center w-full cursor-pointer transition-transform duration-200 hover:scale-105"
              >
                <div className="relative w-40 h-40 md:w-48 md:h-48 mb-4">
                  <div className="w-full h-full rounded-full overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-300 ring-4 ring-transparent group-hover:ring-primary/20">
                    <div className="w-full h-full bg-white border-4 border-[#007699] flex items-center justify-center">
                      <PawPrint size={80} className="text-[#007699]" fill="currentColor" />
                    </div>
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
      
      <Footer />

      {/* Login Requirement Dialog - REMOVED since we redirect to /login now */}
    </div>
  );
}
