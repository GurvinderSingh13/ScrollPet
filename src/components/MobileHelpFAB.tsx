import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { X, Phone, MessageCircle, Search, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { safeSessionStorage } from "@/lib/safe-storage";

/**
 * MobileHelpFAB — A floating "Need Help?" button that only shows on mobile (< md).
 *
 * - Appears after 1s so it doesn't compete with first paint.
 * - Pulsing glow draws the eye without being intrusive.
 * - Tapping opens a bottom-sheet with WhatsApp + in-app contact options.
 * - Users can dismiss the label to collapse it to a small icon.
 * - Sits above the MobileBottomNav (bottom-[5.5rem]).
 */
export default function MobileHelpFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Delay showing to avoid competing with the initial page load
  useEffect(() => {
    const timer = setTimeout(() => setShowFAB(true), 1000);
    return () => clearTimeout(timer);
  }, []);

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

  if (!showFAB) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[199] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Bottom Sheet ── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[200] md:hidden transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#007699] to-[#00a5d4] p-5 text-white relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Pet Concierge</h3>
                <p className="text-xs text-white/70 font-medium">Free personal pet search</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 pb-8 flex flex-col gap-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Tell us the <span className="font-semibold text-gray-800">breed, age &amp; your city</span> — 
              we'll personally connect you with verified breeders near you. <span className="font-semibold text-[#007699]">Completely free!</span>
            </p>

            {/* WhatsApp CTA — most prominent */}
            <a
              href="https://wa.me/919501769649?text=Hi%20Scrollpet,%20I%20am%20looking%20for%20a%20pet%20in%20my%20location..."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1fbc58] text-white font-bold py-3.5 px-5 rounded-2xl transition-all text-base shadow-lg shadow-green-500/25 active:scale-95"
            >
              <Phone className="w-5 h-5" />
              Chat on WhatsApp
              <ChevronRight className="w-4 h-4 ml-auto opacity-70" />
            </a>

            {/* In-app message CTA */}
            <button
              onClick={handleMessageScrollpet}
              className="flex items-center justify-center gap-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-5 rounded-2xl transition-all text-sm cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              Message on ScrollPet
            </button>

            <p className="text-[11px] text-gray-400 text-center">Typically replies within 2 hours ⚡</p>
          </div>
        </div>
      </div>

      {/* ── Inline Banner Button ── */}
      {!isOpen && !isDismissed && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#007699] to-[#00a5d4] text-white rounded-xl shadow-sm active:scale-[0.98] transition-transform md:hidden"
          aria-label="Need help finding a pet?"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Search className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-sm">Need Help?</span>
              <span className="text-xs text-white/80">Find a pet with our Pet Concierge</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 opacity-80" />
        </button>
      )}
    </>
  );
}
