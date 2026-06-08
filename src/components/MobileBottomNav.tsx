import { Link, useLocation } from "wouter";
import { Home, PawPrint, Compass, User, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const NAV_ITEMS = [
  { href: "/",       icon: Home,          label: "Home" },
  { href: "/feed",   icon: PawPrint,      label: "Feed" },
  { href: "/explore",icon: Compass,       label: "Explore" },
];

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Determine the active item — exact match for "/" to avoid false positives
  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <nav
      className="fixed bottom-0 left-0 w-full bg-white/95 border-t border-gray-200 z-[100] flex justify-around items-center h-16 md:hidden"
      style={{ backdropFilter: "blur(12px) saturate(160%)" }}
    >
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = isActive(href);
        return (
          <Link key={href} href={href}>
            <button
              aria-label={label}
              className={`flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl transition-all cursor-pointer ${
                active
                  ? "text-[#007699]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon
                className={`w-6 h-6 transition-transform ${active ? "scale-110" : ""}`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-semibold ${active ? "text-[#007699]" : "text-gray-400"}`}>
                {label}
              </span>
            </button>
          </Link>
        );
      })}

      {/* Auth-aware last tab */}
      {!isLoading && (
        isAuthenticated ? (
          <Link href="/user-profile">
            <button
              aria-label="Profile"
              className={`flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl transition-all cursor-pointer ${
                isActive("/user-profile")
                  ? "text-[#007699]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <User
                className={`w-6 h-6 transition-transform ${isActive("/user-profile") ? "scale-110" : ""}`}
                strokeWidth={isActive("/user-profile") ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-semibold ${isActive("/user-profile") ? "text-[#007699]" : "text-gray-400"}`}>
                Profile
              </span>
            </button>
          </Link>
        ) : (
          <Link href="/login">
            <button
              aria-label="Log In"
              className={`flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl transition-all cursor-pointer ${
                isActive("/login")
                  ? "text-[#007699]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <LogIn
                className={`w-6 h-6 transition-transform ${isActive("/login") ? "scale-110" : ""}`}
                strokeWidth={isActive("/login") ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-semibold ${isActive("/login") ? "text-[#007699]" : "text-gray-400"}`}>
                Log In
              </span>
            </button>
          </Link>
        )
      )}
    </nav>
  );
}
