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
import { Input } from "@/components/ui/input";
import { User, Shield, MessageCircle, LogOut, Search, Phone } from "lucide-react";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { safeSessionStorage } from "@/lib/safe-storage";
import DesktopHelpButton from "@/components/DesktopHelpButton";

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

  // Hide the global navbar entirely on mobile when viewing profiles
  const isProfilePage = currentPath === "/user-profile" || currentPath.startsWith("/profile/");

  return (
    <header className="hidden md:flex fixed w-full top-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between w-full">
        <Link href="/" className="hidden md:block cursor-pointer">
          <img
            src={logoImage}
            alt="ScrollPet Logo"
            className="h-10 md:h-12 w-auto object-contain hover:opacity-90 transition-opacity"
          />
        </Link>

        {/* Mobile Search Bar removed as per request */}

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
                onClick={() => logout()}
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

          {/* Desktop Auth Dropdown / Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <DesktopHelpButton />
            {!isLoading && (
              isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-muted/50 border border-border/50 hover:bg-muted cursor-pointer">
                      <User className="h-5 w-5 text-primary" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white border-border/40 shadow-xl rounded-xl">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/user-profile")}>
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                    
                    {isModOrAbove && (
                      <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/admin")}>
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => logout()}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login">
                    <Button variant="ghost" className="font-semibold cursor-pointer">Login</Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-6 cursor-pointer">Sign Up</Button>
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
