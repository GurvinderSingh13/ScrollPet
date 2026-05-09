import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Shield, MessageCircle, LogOut } from "lucide-react";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat Rooms" },
  { href: "/explore", label: "Explore" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact Us" },
];

export default function Navbar() {
  const [currentPath, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

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

        <div className="flex items-center gap-4">
          {/* Conditional icon logic for Profile Page vs others */}
          {currentPath === "/user-profile" ? (
            isAuthenticated && (
              <button
                aria-label="Log Out"
                onClick={logout}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-destructive transition-all cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" strokeWidth={1.8} />
              </button>
            )
          ) : (
            <button
              aria-label="Direct Messages"
              onClick={() => setLocation(isAuthenticated ? "/chat-interface" : "/login")}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-muted-foreground hover:text-[#007699] transition-all cursor-pointer"
              title={isAuthenticated ? "Direct Messages" : "Log in to view messages"}
            >
              <MessageCircle className="w-5 h-5" strokeWidth={1.8} />
            </button>
          )}

          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <Button variant="ghost" disabled>...</Button>
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-10 w-10 rounded-full border border-border bg-muted flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
                    {user?.id ? (
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
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
                className="font-bold cursor-pointer rounded-full px-6"
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
