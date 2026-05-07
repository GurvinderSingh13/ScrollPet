import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Menu, X, Shield } from "lucide-react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPath] = useLocation();
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

        <button
          className="md:hidden cursor-pointer p-2 hover:bg-muted rounded-full transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t p-4 space-y-4 bg-background animate-in slide-in-from-top-5 shadow-2xl">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isLoading ? (
            <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" disabled>
              ...
            </Button>
          ) : isAuthenticated ? (
            <>
              <Link
                href="/user-profile"
                className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile Dashboard
              </Link>
              {isModOrAbove && (
                <Link
                  href="/admin"
                  className="block text-base font-bold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer text-[#007699]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Moderation Dashboard
                </Link>
              )}
              <Button
                className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg"
                variant="destructive"
                onClick={logout}
              >
                Log Out
              </Button>
            </>
          ) : (
            <Button
              className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg"
              onClick={() => (window.location.href = "/login")}
            >
              Login
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
