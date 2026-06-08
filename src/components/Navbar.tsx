import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { User, Shield, MessageCircle, LogOut, Search, Phone } from "lucide-react";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { safeSessionStorage } from "@/lib/safe-storage";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/feed", label: "Feed" },
  { href: "/explore", label: "Explore" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact Us" },
];

export default function Navbar() {
  const [currentPath, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const unreadCount = useUnreadMessages(user?.id);
  const { toast } = useToast();

  const handleMessageScrollpet = async () => {
    if (!isAuthenticated) {
      toast({ description: "Please log in to send a message", variant: "default" });
      setLocation("/login");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, display_name, username")
        .or("username.eq.scrollpet,role.eq.admin")
        .limit(1)
        .single();

      if (data) {
        safeSessionStorage.setItem("teleport_dm_user_id", data.id);
        safeSessionStorage.setItem("teleport_dm_user_name", data.display_name || data.username || "Scrollpet");
        setLocation("/inbox");
      } else {
        toast({ description: "Could not find admin user to message", variant: "destructive" });
      }
    } catch (err) {
      console.error("Error finding admin user:", err);
      toast({ description: "Error connecting to chat", variant: "destructive" });
    }
  };

  const { data: dbUser } = useQuery({
    queryKey: ["navbar_user_role", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const isModOrAbove =
    dbUser &&
    ["moderator", "super_moderator", "staff", "admin"].includes(dbUser.role);

  console.log('Current unread count in Navbar:', unreadCount);

  return (
    <header className="fixed w-full top-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="cursor-pointer">
          <img
            src={logoImage}
            alt="ScrollPet Logo"
            className="h-10 md:h-12 w-auto object-contain hover:opacity-90 transition-opacity"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8 bg-muted/50 px-6 py-2 rounded-full border border-border/50">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold hover:text-primary transition-colors cursor-pointer ${
                currentPath === link.href ? "text-primary" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          {/* Action Icon: Message Circle (or Logout on Profile page) */}
          {isAuthenticated && (
            currentPath === "/user-profile" ? (
              <button
                aria-label="Log Out"
                onClick={logout}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-red-50 text-destructive transition-all cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" strokeWidth={1.8} />
              </button>
            ) : (
              <button
                aria-label="Direct Messages"
                onClick={() => setLocation("/inbox")}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-muted-foreground hover:text-[#007699] transition-all cursor-pointer"
                title="Direct Messages"
              >
                <div className="relative">
                  <MessageCircle className="w-5 h-5" strokeWidth={1.8} />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                </div>
              </button>
            )
          )}

          {/* Pet Concierge Popover — Desktop only (mobile uses floating FAB) */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#007699] to-[#00a5d4] text-white text-sm font-bold shadow-lg shadow-[#007699]/25 hover:shadow-xl hover:shadow-[#007699]/30 hover:scale-105 active:scale-95 transition-all ring-2 ring-white/50 cursor-pointer animate-wiggle-periodic"
                title="Need help finding a pet?"
              >
                <Search className="w-4 h-4" />
                Need Help?
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[340px] p-0 rounded-2xl overflow-hidden border-none shadow-2xl" sideOffset={12}>
              <div className="bg-gradient-to-br from-[#007699] to-[#00a5d4] p-5 text-white">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base leading-tight">Pet Concierge</h4>
                    <p className="text-[11px] text-white/70 font-medium">Free personal search service</p>
                  </div>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-3 bg-white">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Can't find what you're looking for? Tell us the breed, age & your city — <span className="font-semibold text-gray-800">we'll personally find verified breeders near you</span>. Completely free!
                </p>
                <div className="flex flex-col gap-2.5">
                  <a
                    href="https://wa.me/919501769649?text=Hi%20Scrollpet,%20I%20am%20looking%20for%20a%20pet%20in%20my%20location..."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fbc58] text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm shadow-md hover:shadow-lg"
                  >
                    <Phone className="w-4 h-4" />
                    Chat on WhatsApp
                  </a>
                  <button
                    onClick={handleMessageScrollpet}
                    className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl transition-all text-sm cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message on ScrollPet
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 text-center mt-0.5">Typically replies within 2 hours ⚡</p>
              </div>
            </PopoverContent>
          </Popover>

          {/* Profile Section - Now visible on all screen sizes */}
          <div className="flex items-center">
            {isLoading ? (
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-10 w-10 rounded-full border border-border bg-muted flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
                    {user?.id ? (
                      <img
                        src={user?.avatarUrl ? `${user.avatarUrl}${user.avatarUrl.includes('?') ? '&' : '?'}cb=${Date.now()}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                        alt="User Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <div className="px-3 py-2 border-b border-border/50 mb-1">
                    <p className="font-medium text-sm text-foreground truncate">
                      {user?.displayName || user?.username || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/user-profile" className="w-full cursor-pointer flex items-center">
                      Profile Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {isModOrAbove && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin"
                        className="w-full cursor-pointer flex items-center text-[#007699] font-bold"
                      >
                        <Shield className="w-4 h-4 mr-2" /> Moderation Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive cursor-pointer flex items-center font-medium border-t border-border/50 mt-1"
                  >
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => (window.location.href = "/login")}
                className="font-bold cursor-pointer rounded-full px-5 md:px-6 h-9 md:h-10 text-sm md:text-base"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
