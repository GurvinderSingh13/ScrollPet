import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Phone, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { safeSessionStorage } from "@/lib/safe-storage";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function DesktopHelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleMessageScrollpet = async () => {
    if (!isAuthenticated) {
      toast({ description: "Please log in to send a message", variant: "default" });
      setLocation("/login");
      setIsOpen(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("users")
        .select("id, display_name, username")
        .or("username.eq.scrollpet,role.eq.admin")
        .limit(1)
        .single();

      if (data) {
        safeSessionStorage.setItem("teleport_dm_user_id", data.id);
        safeSessionStorage.setItem("teleport_dm_user_name", data.display_name || data.username || "Scrollpet");
        setIsOpen(false);
        setLocation("/inbox");
      } else {
        toast({ description: "Could not find admin user to message", variant: "destructive" });
      }
    } catch (err) {
      console.error("Error finding admin user:", err);
      toast({ description: "Error connecting to chat", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="hidden md:flex items-center gap-2 bg-gradient-to-r from-[#007699] to-[#00a5d4] hover:opacity-90 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          Need Help?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden bg-white rounded-3xl shadow-2xl">
        <DialogTitle className="sr-only">Pet Concierge</DialogTitle>
        <DialogDescription className="sr-only">Get help finding a pet from our concierges.</DialogDescription>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#007699] to-[#00a5d4] p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl leading-tight tracking-tight">Pet Concierge</h3>
              <p className="text-sm text-white/80 font-medium mt-0.5">Free personal pet search</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 pb-8 flex flex-col gap-4">
          <p className="text-[15px] text-gray-600 leading-relaxed">
            Tell us the <span className="font-semibold text-gray-800">breed, age & your city</span> — 
            we'll personally connect you with verified breeders near you. <span className="font-semibold text-[#007699]">Completely free!</span>
          </p>

          {/* WhatsApp CTA */}
          <a
            href="https://wa.me/919501769649?text=Hi%20Scrollpet,%20I%20am%20looking%20for%20a%20pet%20in%20my%20location..."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1fbc58] text-white font-bold py-3.5 px-5 rounded-2xl transition-all text-base shadow-lg shadow-green-500/25 active:scale-95 mt-2"
          >
            <Phone className="w-5 h-5" />
            Chat on WhatsApp
          </a>

          {/* In-app message CTA */}
          <button
            onClick={handleMessageScrollpet}
            className="flex items-center justify-center gap-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-5 rounded-2xl transition-all text-sm cursor-pointer active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            Message on ScrollPet
          </button>

          <p className="text-xs text-gray-400 text-center mt-2 font-medium">Typically replies within 2 hours ⚡</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
