import { Link, useLocation } from "wouter";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  ShieldCheck,
  Users,
  PawPrint,
  Menu,
  X,
  Heart,
  ArrowRight,
  User,
  Shield,
  Globe,
  Sparkles,
  Star,
  Zap,
  MapPin,
  Megaphone,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import heroImage from "@assets/generated_images/happy_community_of_pet_lovers_in_a_park.png";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";


import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";


const TESTIMONIALS = [
  {
    name: "Sarah M.",
    pet: "Golden Retriever Owner",
    text: "I found my dog's best playdate buddy through ScrollPet! The local chat rooms made it so easy to connect with other retriever owners in my area.",
    avatar: "sarah-m",
    rating: 5,
  },
  {
    name: "James T.",
    pet: "Cat Dad × 3",
    text: "Finally, a community that gets it. No drama, no toxicity — just fellow cat lovers sharing tips and adorable photos. My kittens are thriving thanks to advice I got here!",
    avatar: "james-t",
    rating: 5,
  },
  {
    name: "Priya K.",
    pet: "Parrot Enthusiast",
    text: "The breed-specific rooms are a game changer. I've learned more about my macaw's diet in one week on ScrollPet than in months of random Googling.",
    avatar: "priya-k",
    rating: 5,
  },
];

function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [activePetIndex, setActivePetIndex] = useState(0);
  const [, setLocation] = useLocation();

  const { data: dbUser } = useQuery({
    queryKey: ["db-user-home", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: dbHomeCategories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["chat-room-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, image_url")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const isModOrAbove =
    dbUser &&
    ["moderator", "super_moderator", "staff", "admin"].includes(dbUser.role);

  useEffect(() => {
    if (!dbHomeCategories.length) return;
    const interval = setInterval(() => {
      setActivePetIndex((prev) => (prev + 1) % dbHomeCategories.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [dbHomeCategories.length]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 60, damping: 14 } as const,
    },
  };

  const fadeUp = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen pt-20 bg-background font-sans text-foreground overflow-x-hidden selection:bg-primary/20">
      {/* Header */}
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
                    <p className="font-medium text-sm text-foreground truncate">{user?.displayName || user?.username || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/user-profile" className="w-full cursor-pointer flex items-center">Profile Dashboard</Link>
                  </DropdownMenuItem>
                  {isModOrAbove && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="w-full cursor-pointer flex items-center text-[#007699] font-bold">
                        <Shield className="w-4 h-4 mr-2" /> Moderation Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer flex items-center font-medium border-t border-border/50 mt-1">Log Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => (window.location.href = "/login")} className="font-bold cursor-pointer rounded-full px-6">Login</Button>
            )}
          </div>

          <button className="md:hidden cursor-pointer p-2 hover:bg-muted rounded-full transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

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
                {isModOrAbove && (
                  <Link href="/admin" className="block text-base font-bold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer text-[#007699]">Moderation Dashboard</Link>
                )}
                <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" variant="destructive" onClick={logout}>Log Out</Button>
              </>
            ) : (
              <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" onClick={() => (window.location.href = "/login")}>Login</Button>
            )}
          </div>
        )}
      </header>

      <main>
        {/* ═══════════════════════════════════════════════ */}
        {/* 1. HERO SECTION */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary/8 via-secondary/5 to-transparent rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-secondary/8 via-primary/5 to-transparent rounded-full blur-3xl -z-10" />

          <div className="container px-6 mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-2xl"
              >
                {/* Live badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 text-primary font-bold text-sm mb-6 border border-primary/20">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                  </span>
                  <span className="text-foreground/80">Pet lovers are chatting right now — jump in!</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold font-heading leading-[1.1] mb-6 tracking-tight text-foreground">
                  Your Pet's Community{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#009bb8] to-secondary">
                    Starts Here
                  </span>
                </h1>

                <p className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed font-medium max-w-xl">
                  Join thousands of passionate pet owners sharing advice, swapping stories, and forming real friendships — organized by pet type, breed, and your own neighbourhood.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  {isAuthenticated ? (
                    <Link href="/chat">
                      <Button
                        size="lg"
                        className="text-lg px-8 py-7 rounded-full shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] transition-all cursor-pointer group"
                      >
                        Enter Chat Rooms
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="lg"
                      className="text-sm px-4 py-3 rounded-full shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] transition-all cursor-pointer group"
                      onClick={() => (window.location.href = "/signup")}
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      Create Your Free Account
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  )}
                  <Link href="/community-guidelines">
                    <Button
                      variant="outline"
                      size="lg"
                      className="text-sm px-4 py-3 rounded-full border-2 hover:bg-muted transition-all cursor-pointer"
                    >
                      Community Guidelines
                    </Button>
                  </Link>
                </div>

                {/* Scrolling pet avatars */}
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {dbHomeCategories.slice(0, 5).map((cat: any, i) => (
                      <motion.div
                        key={cat.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="h-11 w-11 rounded-full border-[3px] border-background overflow-hidden shadow-sm"
                      >
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-sky-100 flex items-center justify-center">
                            <PawPrint size={20} className="text-[#007699]" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {dbHomeCategories.length > 5 && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1.1 }}
                        className="h-11 w-11 rounded-full border-[3px] border-background bg-primary flex items-center justify-center shadow-sm"
                      >
                        <span className="text-white text-xs font-bold">+{dbHomeCategories.length - 5}</span>
                      </motion.div>
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-foreground">{dbHomeCategories.length || "—"} pet categories</p>
                    <p className="text-muted-foreground">Dogs, cats, birds & more</p>
                  </div>
                </div>
              </motion.div>

              {/* Hero image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="relative hidden lg:block"
              >
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl ring-8 ring-background aspect-[4/3] group">
                  <img
                    src={heroImage}
                    alt="Happy people with pets in a park"
                    className="object-cover w-full h-full transform transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent" />

                  {/* Floating engagement card */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 60 }}
                    className="absolute bottom-6 left-6 right-6 bg-background/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-border/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-10 w-10 rounded-full bg-muted border-2 border-background overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="Avatar" />
                          </div>
                        ))}
                      </div>
                      <div className="text-sm">
                        <p className="font-bold text-foreground flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          Active Right Now
                        </p>
                        <p className="text-muted-foreground">Chatting about puppies in Global Room</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Floating notification bubble - top right */}
                <motion.div
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.2, type: "spring" }}
                  className="absolute -top-4 -right-4 bg-secondary text-white px-4 py-2.5 rounded-2xl rounded-br-md shadow-lg text-sm font-bold"
                >
                  <span className="flex items-center gap-1.5">🐾 New message in Dog Room!</span>
                </motion.div>

                {/* Background glow */}
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-tr from-primary/15 to-secondary/15 rounded-full blur-3xl opacity-60" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* 2. LIVE STATS BAR */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="py-8 bg-gradient-to-r from-primary via-[#008fb3] to-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.04]" />
          <div className="container px-6 mx-auto relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center text-white">
              {[
                { value: 10000, suffix: "+", label: "Pet Lovers", icon: Users },
                { value: 9, suffix: "", label: "Pet Categories", icon: PawPrint },
                { value: 195, suffix: "+", label: "Countries", icon: Globe },
                { value: 24, suffix: "/7", label: "Moderation", icon: ShieldCheck },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center gap-1"
                >
                  <stat.icon className="w-6 h-6 text-white/70 mb-1" />
                  <div className="text-2xl md:text-3xl font-extrabold">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-white/80 text-sm font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* 3. PET CATEGORIES SHOWCASE */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="py-20 lg:py-28">
          <div className="container px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center max-w-3xl mx-auto mb-14"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary font-bold text-xs uppercase tracking-wider mb-6 border border-secondary/20">
                Find Your Tribe
              </span>
              <h2 className="text-4xl lg:text-5xl font-extrabold mb-5 tracking-tight">
                A Room for <span className="text-primary">Every Pet</span>
              </h2>
              <p className="text-xl text-muted-foreground font-medium">
                Whether you have a playful pup or a majestic macaw, there's a dedicated community waiting for you. Pick your pet and start chatting.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-4 md:gap-6"
            >
              {isCategoriesLoading
                ? Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-3 animate-pulse">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-200" />
                      <div className="h-3 w-14 bg-gray-200 rounded-md" />
                    </div>
                  ))
                : dbHomeCategories.map((cat: any, i) => (
                    <motion.div
                      key={cat.id}
                      variants={itemVariants}
                      whileHover={{ y: -8, scale: 1.05 }}
                      className="flex flex-col items-center gap-3 cursor-pointer group"
                      onClick={() => setLocation(`/chat-interface?category=${encodeURIComponent(cat.name.toLowerCase().trim())}`)}
                    >
                      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-[3px] shadow-md transition-all duration-300 ${
                        activePetIndex === i
                          ? "border-secondary ring-4 ring-secondary/20 scale-110"
                          : "border-border group-hover:border-primary group-hover:ring-4 group-hover:ring-primary/20"
                      }`}>
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center">
                            <PawPrint size={32} className="text-[#007699]" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs md:text-sm font-bold text-foreground/80 group-hover:text-primary transition-colors">
                        {cat.name}
                      </span>
                    </motion.div>
                  ))
              }
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center mt-12"
            >
              <Link href={isAuthenticated ? "/chat" : "/signup"}>
                <Button size="lg" className="rounded-full px-10 py-6 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
                  {isAuthenticated ? "Jump Into Chat" : "Sign Up & Start Chatting"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* 4. WHAT IS SCROLLPET? */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="py-20 lg:py-28 bg-muted/40 relative">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="container px-6 mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
              <div className="order-2 lg:order-1 relative">
                {/* Soft anchoring color blurs */}
                <div className="absolute -z-10 inset-4 bg-secondary/15 rounded-full blur-3xl" />
                <div className="absolute -z-10 -bottom-6 -right-6 w-40 h-40 bg-primary/15 rounded-full blur-3xl" />

                {/* Mock chat preview card — visualizes what ScrollPet looks like in use */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="relative max-w-md mx-auto bg-background rounded-3xl border border-border/60 shadow-2xl overflow-hidden"
                >
                  {/* Room header */}
                  <div className="bg-gradient-to-r from-primary to-[#009bb8] px-5 py-4 flex items-center gap-3 text-white">
                    <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <PawPrint size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">Golden Retrievers — Global</p>
                      <p className="text-xs text-white/80 flex items-center gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                        12 pet parents active now
                      </p>
                    </div>
                    <MessageCircle size={18} className="opacity-80" />
                  </div>

                  {/* Conversation */}
                  <div className="p-5 space-y-4 bg-gradient-to-b from-sky-50/50 to-background">
                    <div className="flex items-start gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-secondary to-[#ff8833] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        M
                      </div>
                      <div className="max-w-[75%]">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Maya • Rex's mom</p>
                        <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-3.5 py-2 shadow-sm">
                          <p className="text-sm text-foreground">Just took Rex to the new vet on 5th Ave — highly recommend!</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 flex-row-reverse">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-[#009bb8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        J
                      </div>
                      <div className="max-w-[75%]">
                        <p className="text-xs font-semibold text-muted-foreground mb-1 text-right">You</p>
                        <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-3.5 py-2 shadow-sm">
                          <p className="text-sm">Thanks! Booking Bella in for next week.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#ff8833] to-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        L
                      </div>
                      <div className="max-w-[75%]">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Liam • Buddy's dad</p>
                        <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-3.5 py-2 shadow-sm">
                          <p className="text-sm text-foreground">Anyone joining the park meetup Saturday?</p>
                        </div>
                      </div>
                    </div>

                    {/* Live typing indicator */}
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        A
                      </div>
                      <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating accent badges that echo the bullet themes on the right */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 120 }}
                  className="hidden md:flex absolute -top-3 -right-2 bg-white rounded-2xl shadow-xl border border-border/60 px-3 py-2 items-center gap-2"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-[#009bb8] flex items-center justify-center text-white shrink-0">
                    <ShieldCheck size={15} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-foreground leading-tight">Safe & Moderated</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">24/7 trust team</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 120 }}
                  className="hidden md:flex absolute -bottom-3 -left-2 bg-white rounded-2xl shadow-xl border border-border/60 px-3 py-2 items-center gap-2"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-secondary to-[#ff8833] flex items-center justify-center text-white shrink-0">
                    <MapPin size={15} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-foreground leading-tight">Local Rooms</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">in 190+ countries</p>
                  </div>
                </motion.div>
              </div>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={containerVariants}
                className="order-1 lg:order-2"
              >
                <motion.span variants={itemVariants} className="inline-block px-4 py-1.5 rounded-full bg-secondary text-white font-bold text-xs uppercase tracking-wider mb-6 shadow-lg shadow-secondary/20">
                  Why ScrollPet?
                </motion.span>
                <motion.h2 variants={itemVariants} className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight">
                  More Than a Chat App —{" "}
                  <span className="text-primary">It's Home</span>
                </motion.h2>
                <motion.p variants={itemVariants} className="text-xl text-muted-foreground mb-10 leading-relaxed font-medium">
                  ScrollPet is purpose-built for pet lovers who crave genuine connections, not endless feeds. Every feature is designed to help you learn, share, and belong.
                </motion.p>
                <div className="space-y-6">
                  {[
                    {
                      icon: PawPrint,
                      title: "Organized by Pet & Breed",
                      desc: "Dog owners chat with dog owners. Cat parents connect with cat parents. No noise, just relevance.",
                    },
                    {
                      icon: MapPin,
                      title: "Local & Global Rooms",
                      desc: "Find pet owners in your city or go global. Discover local meetups, vets, and walking buddies.",
                    },
                    {
                      icon: Megaphone,
                      title: "Built-In News Room",
                      desc: "Stay updated with community announcements, events, and tips from fellow pet enthusiasts.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Safe & Moderated",
                      desc: "Our dedicated mod team keeps things friendly 24/7. Kindness is the rule, not the exception.",
                    },
                  ].map((item, i) => (
                    <motion.div key={i} variants={itemVariants} className="flex gap-4 group">
                      <div className="h-12 w-12 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <item.icon size={20} strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* 5. HOW IT WORKS */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="py-20 lg:py-28">
          <div className="container px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <h2 className="text-4xl lg:text-5xl font-extrabold mb-5 tracking-tight">
                Ready in <span className="text-secondary">60 Seconds</span>
              </h2>
              <p className="text-xl text-muted-foreground font-medium">
                No forms to fill, no hoops to jump through. Get from sign-up to chatting in four quick steps.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-4 gap-6 lg:gap-8"
            >
              {[
                {
                  icon: Zap,
                  step: "01",
                  title: "Sign Up Free",
                  desc: "Create your account with email or social login — takes seconds, costs nothing.",
                  color: "from-primary to-[#009bb8]",
                },
                {
                  icon: PawPrint,
                  step: "02",
                  title: "Pick Your Pet",
                  desc: "Select your pet category and breed. We'll match you to the right rooms instantly.",
                  color: "from-[#009bb8] to-secondary",
                },
                {
                  icon: MessageCircle,
                  step: "03",
                  title: "Join a Room",
                  desc: "Enter your local or global chat room and say hello. Everyone's friendly here!",
                  color: "from-secondary to-[#ff8833]",
                },
                {
                  icon: Heart,
                  step: "04",
                  title: "Make Friends",
                  desc: "Share stories, ask questions, DM new friends, and grow with the community.",
                  color: "from-[#ff8833] to-primary",
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="relative p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center group z-10 overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${step.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                  <div className="text-xs font-extrabold text-primary/40 mb-4 tracking-widest uppercase">{step.step}</div>
                  <div className="h-16 w-16 mx-auto bg-muted rounded-2xl flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <step.icon size={30} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* 6. TESTIMONIALS */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="py-20 lg:py-28 bg-muted/30 relative">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="container px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center max-w-3xl mx-auto mb-14"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-6 border border-primary/20">
                Loved by Pet Owners
              </span>
              <h2 className="text-4xl lg:text-5xl font-extrabold mb-5 tracking-tight">
                Hear From Our <span className="text-primary">Community</span>
              </h2>
              <p className="text-xl text-muted-foreground font-medium">
                Real stories from real pet lovers who found their people on ScrollPet.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-6 lg:gap-8"
            >
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-5 h-5 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <p className="text-foreground/80 leading-relaxed mb-6 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <div className="h-11 w-11 rounded-full bg-muted border border-border overflow-hidden">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.avatar}`}
                        alt={t.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t.name}</p>
                      <p className="text-muted-foreground text-xs">{t.pet}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* 7. SAFETY & COMMUNITY */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="py-20 lg:py-28 bg-primary relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.06]" />
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-secondary rounded-full blur-[120px] opacity-15" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-secondary rounded-full blur-[120px] opacity-15" />

          <div className="container px-4 md:px-8 mx-auto relative z-10">
            <div className="flex flex-col gap-y-8 lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={containerVariants}
                className="w-full px-6 py-4 flex flex-col items-center text-center lg:items-start lg:text-left lg:px-0 lg:py-0"
              >
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white font-bold text-sm mb-6">
                  <ShieldCheck className="h-4 w-4" />
                  Your Safety is Our Priority
                </motion.div>
                <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 tracking-tight leading-tight w-full">
                  A Community Built
                  <br />on <span className="text-secondary">Trust & Respect</span>
                </motion.h2>
                <motion.p variants={itemVariants} className="text-sm md:text-base text-primary-foreground/85 max-w-md md:max-w-xl mb-8 font-medium leading-relaxed">
                  Every conversation is backed by active moderation, clear guidelines, and a zero-tolerance policy for harassment. We're here for the pets — and for each other.
                </motion.p>
                <motion.div variants={itemVariants}>
                  <Link href="/community-guidelines">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="w-[90%] sm:w-auto bg-white text-primary hover:bg-white/90 rounded-full px-6 py-4 sm:px-8 sm:py-6 text-[15px] sm:text-lg font-bold shadow-xl border-none cursor-pointer hover:scale-[1.02] transition-all flex items-center justify-center group"
                    >
                      Read Our Community Guidelines
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex flex-col gap-y-6 sm:grid sm:grid-cols-2 sm:gap-4"
              >
                {[
                  { icon: Shield, title: "24/7 Moderation", desc: "Our dedicated team monitors every room around the clock" },
                  { icon: Users, title: "Verified Members", desc: "Identity verification for a safer, more trusted community" },
                  { icon: ShieldCheck, title: "Easy Reporting", desc: "One-tap reporting keeps the community clean and kind" },
                  { icon: Heart, title: "Zero Tolerance", desc: "Harassment, spam and abuse are met with swift action" },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:bg-white/20 transition-all duration-300 group"
                  >
                    <feature.icon className="w-8 h-8 mb-3 text-white/80 group-hover:text-secondary transition-colors" />
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{feature.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* 8. FINAL CTA */}
        {/* ═══════════════════════════════════════════════ */}
        <section className="py-20 lg:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 -z-10" />
          <div className="container px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="text-5xl mb-6">🐕 🐱 🐠 🦜 🐰</div>
              <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight">
                Your Pet Deserves a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  Great Community
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 font-medium max-w-2xl mx-auto">
                Stop scrolling alone. Join ScrollPet today and become part of the friendliest, most helpful pet community on the internet. It's free, it's fun, and your furry friend will thank you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated ? (
                  <Link href="/chat">
                    <Button size="lg" className="text-lg px-10 py-7 rounded-full shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group">
                      Enter the Chat Rooms
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="lg"
                    className="text-lg px-10 py-7 rounded-full shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group"
                    onClick={() => (window.location.href = "/signup")}
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Join ScrollPet — It's Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════ */}
        {/* 9. FOOTER */}
        {/* ═══════════════════════════════════════════════ */}
        <Footer />
      </main>
    </div>
  );
}
