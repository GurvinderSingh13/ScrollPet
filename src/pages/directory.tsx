import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Menu,
  X,
  LogOut,
  Dog,
  Cat,
  Bird,
  Activity,
  Loader2,
  BookOpen,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const STATUS_FILTERS = [
  { key: "status_for_adoption",   label: "For Adoption",          badge: "bg-green-50 text-green-700 border border-green-200" },
  { key: "status_for_sell",       label: "For Sale",              badge: "bg-blue-50 text-blue-700 border border-blue-200" },
  { key: "status_pups_adoption",  label: "Pups for Adoption",     badge: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  { key: "status_pups_sell",      label: "Pups for Sale",         badge: "bg-sky-50 text-sky-700 border border-sky-200" },
  { key: "status_mating",         label: "Available for Mating",  badge: "bg-pink-50 text-pink-700 border border-pink-200" },
  { key: "status_exchange",       label: "Open for Exchange",     badge: "bg-orange-50 text-orange-700 border border-orange-200" },
] as const;

type StatusKey = typeof STATUS_FILTERS[number]["key"];

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat Rooms" },
  { href: "/explore", label: "Explore" },
  { href: "/directory", label: "Directory" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

function FilterPanel({
  activeFilters,
  toggle,
  clear,
}: {
  activeFilters: StatusKey[];
  toggle: (k: StatusKey) => void;
  clear: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#007699]" /> Filters
        </h2>
        {activeFilters.length > 0 && (
          <button
            onClick={clear}
            className="text-xs font-semibold text-[#007699] hover:underline cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="space-y-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Availability</p>
        {STATUS_FILTERS.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={activeFilters.includes(key)}
              onChange={() => toggle(key)}
              className="w-4 h-4 accent-[#007699] cursor-pointer"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
              {label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function PetDirectoryPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [currentPath] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<StatusKey[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const toggle = (key: StatusKey) =>
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  const clear = () => setActiveFilters([]);

  const handleAuthClick = () => {
    if (isAuthenticated) {
      logout();
      window.location.href = "/";
    } else {
      window.location.href = "/login";
    }
  };

  const { data: pets, isLoading: isPetsLoading } = useQuery({
    queryKey: ["directory_pets", activeFilters],
    queryFn: async () => {
      let query = (supabase as any)
        .from("pets")
        .select("*")
        .order("created_at", { ascending: false });

      if (activeFilters.length > 0) {
        const orClause = activeFilters.map((f) => `${f}=eq.true`).join(",");
        query = query.or(orClause);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="cursor-pointer">
            <img
              src={logoImage}
              alt="ScrollPet Logo"
              className="h-9 md:h-10 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium px-3 py-2 rounded-lg transition-all cursor-pointer",
                  currentPath === link.href
                    ? "text-[#007699] bg-[#007699]/10 font-semibold"
                    : "text-gray-600 hover:text-[#007699] hover:bg-[#007699]/5",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <Button variant="ghost" disabled>...</Button>
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 rounded-full border-2 border-[#007699]/20 bg-white flex items-center justify-center overflow-hidden hover:border-[#007699]/50 hover:shadow-md transition-all cursor-pointer">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-lg border-gray-100">
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <p className="font-semibold text-sm text-gray-900 truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/user-profile" className="w-full cursor-pointer flex items-center gap-2 py-2">
                      <User className="w-4 h-4" /> Profile Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleAuthClick}
                    className="text-red-500 cursor-pointer flex items-center gap-2 font-medium py-2"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => (window.location.href = "/login")}
                className="font-semibold cursor-pointer rounded-full px-5 h-9 bg-[#007699] hover:bg-[#005a75] text-sm shadow-sm"
              >
                Login
              </Button>
            )}
          </div>

          <button
            className="md:hidden cursor-pointer p-2 hover:bg-gray-100 rounded-xl transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 p-4 space-y-1 bg-white shadow-xl absolute w-full z-50">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block text-sm font-medium py-2.5 px-4 rounded-lg cursor-pointer",
                  currentPath === link.href
                    ? "bg-[#007699]/10 text-[#007699] font-semibold"
                    : "hover:bg-[#007699]/5 text-gray-700",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  href="/user-profile"
                  className="block text-sm font-semibold py-2.5 px-4 rounded-lg bg-[#007699]/5 text-[#007699] cursor-pointer"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile Dashboard
                </Link>
                <Button className="w-full mt-3 cursor-pointer rounded-full" variant="destructive" size="sm" onClick={handleAuthClick}>
                  Log Out
                </Button>
              </>
            ) : (
              <Button className="w-full mt-3 cursor-pointer rounded-full bg-[#007699]" size="sm" onClick={() => (window.location.href = "/login")}>
                Login
              </Button>
            )}
          </div>
        )}
      </header>

      {/* ── PAGE TITLE BAR ── */}
      <div className="pt-16">
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#007699]" />
            <h1 className="text-base font-bold text-gray-900">Pet Directory</h1>
            <span className="text-sm text-gray-400 font-normal">— find pets by availability</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer",
              activeFilters.length > 0
                ? "bg-[#007699] text-white border-[#007699] shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:border-[#007699] hover:text-[#007699]",
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilters.length > 0 && (
              <span className="ml-1 bg-white/30 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {activeFilters.length}
              </span>
            )}
          </button>

          {isMobileFilterOpen && (
            <div className="mt-3">
              <FilterPanel activeFilters={activeFilters} toggle={toggle} clear={clear} />
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── SIDEBAR ── */}
          <aside className="hidden lg:block lg:w-1/4 shrink-0">
            <div className="sticky top-24">
              <FilterPanel activeFilters={activeFilters} toggle={toggle} clear={clear} />
            </div>
          </aside>

          {/* ── PET GRID ── */}
          <div className="flex-1 lg:w-3/4 min-w-0">
            {/* Result count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {isPetsLoading ? (
                  "Loading…"
                ) : (
                  <>
                    <span className="font-bold text-gray-900">{pets?.length ?? 0}</span>{" "}
                    {(pets?.length ?? 0) === 1 ? "pet" : "pets"} found
                    {activeFilters.length > 0 && (
                      <span className="text-gray-400"> · {activeFilters.length} filter{activeFilters.length > 1 ? "s" : ""} active</span>
                    )}
                  </>
                )}
              </p>
            </div>

            {isPetsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-pulse">
                    <div className="h-40 bg-gray-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pets && pets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {pets.map((pet) => {
                  const activeBadges = STATUS_FILTERS.filter(
                    ({ key }) => (pet as any)[key] === true,
                  );
                  return (
                    <Link key={pet.id} href={`/pet/${pet.id}`}>
                      <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
                        {/* Image area */}
                        <div
                          className="h-40 relative overflow-hidden"
                          style={{ background: "linear-gradient(135deg, #e8f4f8 0%, #fef3e8 100%)" }}
                        >
                          {pet.image_url ? (
                            <img
                              src={pet.image_url}
                              alt={pet.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {pet.type === "dog" ? <Dog className="h-16 w-16 text-[#007699]/25" /> :
                               pet.type === "cat" ? <Cat className="h-16 w-16 text-[#007699]/25" /> :
                               pet.type === "bird" ? <Bird className="h-16 w-16 text-[#007699]/25" /> :
                               <Activity className="h-16 w-16 text-[#007699]/25" />}
                            </div>
                          )}
                          {/* Type badge */}
                          <div className="absolute top-3 left-3">
                            <span
                              className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg text-white shadow-sm capitalize"
                              style={{ background: "rgba(0,118,153,0.85)", backdropFilter: "blur(4px)" }}
                            >
                              {pet.type || "pet"}
                            </span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <h3 className="font-bold text-lg text-gray-900 capitalize leading-tight">{pet.name}</h3>
                          <p className="text-sm text-gray-500 capitalize mt-0.5">{pet.breed || "Unknown breed"}</p>

                          {/* Basic attribute tags */}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {pet.gender && (
                              <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md capitalize">
                                {pet.gender}
                              </span>
                            )}
                            {pet.dob && (
                              <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                                {pet.dob}
                              </span>
                            )}
                            {pet.location && (
                              <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                                {pet.location}
                              </span>
                            )}
                          </div>

                          {/* Status badges */}
                          {activeBadges.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
                              {activeBadges.map(({ key, label, badge }) => (
                                <span key={key} className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", badge)}>
                                  {label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-3">
                <BookOpen className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium text-gray-700">No pets found</p>
                <p className="text-xs text-gray-400">
                  {activeFilters.length > 0
                    ? "Try removing some filters to see more results."
                    : "No pets have been registered yet."}
                </p>
                {activeFilters.length > 0 && (
                  <button onClick={clear} className="mt-1 text-sm font-semibold text-[#007699] hover:underline cursor-pointer">
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
