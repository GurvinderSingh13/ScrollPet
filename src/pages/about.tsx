import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
    Shield,
    Globe,
    Heart,
    Home,
    Users,
    ArrowRight,
    MessageCircleHeart,
    PawPrint,
    Eye,
    Handshake,
    Quote,
    Sparkles,
    Menu,
    X,
    User,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import founderPhoto from "@assets/founder_gurvinder.jpg";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/* ─── animation variants ─── */
const fadeUp = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.65 } },
};
const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
const cardItem = {
    hidden: { y: 24, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 60, damping: 14 } },
};
const scaleIn = {
    hidden: { scale: 0.92, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.7 } },
};

/* ─── data ─── */
const JOURNEY_STEPS = [
    {
        year: "The Spark",
        icon: PawPrint,
        title: "A love for animals led to a broken system",
        text: "When I stepped into the world of pet care and breeding, I expected to find a welcoming community. Instead, I found brokers buying pets cheaply and selling them at unfair prices, making it nearly impossible for genuine animal lovers to connect.",
    },
    {
        year: "The Search",
        icon: Eye,
        title: "Looking for community, finding dead ends",
        text: "I searched everywhere — exclusive WhatsApp groups that were hard to find and rarely helpful, forums scattered across the internet, social media feeds drowning in noise. If you wanted to adopt a pet, or safely rehome one, there was no dedicated, secure platform to make it happen.",
    },
    {
        year: "The Realisation",
        icon: Sparkles,
        title: "Pet owners needed a platform without borders",
        text: "I realised the pet community didn't need another social feed or marketplace. It needed a safe home — a place where genuine pet lovers could connect locally and globally, share advice, and build trust without gatekeepers or brokers standing in the way.",
    },
    {
        year: "The Build",
        icon: Heart,
        title: "So I decided to build it myself",
        text: "ScrollPet was born from that frustration and that hope. I'm building it solo because I believe every pet deserves a loving home, and every pet owner deserves a community they can trust. This is more than an app — it's a mission.",
    },
];

const VALUES = [
    {
        icon: Globe,
        title: "Global & Local Connection",
        desc: "Connecting local pet lovers in your city while making it effortlessly easy to reach out to experts anywhere in the world. Your neighbourhood and the planet, in one platform.",
        gradient: "from-[#007699] to-[#00a3cc]",
    },
    {
        icon: Shield,
        title: "Stop Pet Abuse & Fraud",
        desc: "A heavily moderated community built to expose bad actors, prevent fraud, and ensure the absolute safety of every animal. We fight for the ones who can't fight for themselves.",
        gradient: "from-[#FF6600] to-[#ff8833]",
    },
    {
        icon: Home,
        title: "Zero Abandoned Pets",
        desc: "We are building the infrastructure to ensure every pet finds a loving home. Our goal is to drastically reduce — and ultimately end — pet abandonment rates worldwide.",
        gradient: "from-emerald-500 to-emerald-400",
    },
];

const TRUST = [
    {
        icon: Handshake,
        title: "No Hidden Agendas",
        desc: "ScrollPet isn't building a marketplace to take a cut from breeders. We're building a community. Period.",
    },
    {
        icon: Shield,
        title: "24/7 Active Moderation",
        desc: "Every message, every room — actively monitored to keep the space safe, kind, and free from harm.",
    },
    {
        icon: Users,
        title: "Community-First Decisions",
        desc: "Features are built based on what pet owners actually need, not what investors demand.",
    },
    {
        icon: Globe,
        title: "Borderless by Design",
        desc: "Whether you're in Mumbai or Montreal, ScrollPet connects you with local pet lovers and global experts.",
    },
];

/* ─── component ─── */
export default function AboutUs() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, isLoading, isAuthenticated, logout } = useAuth();

    const { data: dbUser } = useQuery({
        queryKey: ["db-user-about", user?.id],
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

    const isModOrAbove =
        dbUser &&
        ["moderator", "super_moderator", "staff", "admin"].includes(dbUser.role);

    return (
        <div className="min-h-screen pt-20 bg-background font-sans text-foreground overflow-x-hidden selection:bg-primary/20">

            {/* ── HEADER ── */}
            <header className="fixed w-full top-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="cursor-pointer">
                        <img src={logoImage} alt="ScrollPet Logo" className="h-10 md:h-12 w-auto object-contain hover:opacity-90 transition-opacity" />
                    </Link>

                    <nav className="hidden md:flex items-center gap-8 bg-muted/50 px-6 py-2 rounded-full border border-border/50">
                        <Link href="/" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Home</Link>
                        <Link href="/chat" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Chat Rooms</Link>
                        <Link href="/about" className="text-sm font-semibold text-primary cursor-pointer">About Us</Link>
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
                                        {user?.id
                                            ? <img 
                                                src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                                                alt="Avatar" 
                                                className="h-full w-full object-cover" 
                                                onError={(e) => {
                                                  e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`;
                                                }}
                                              />
                                            : <User className="h-5 w-5 text-muted-foreground" />}
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
                                    <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer font-medium border-t border-border/50 mt-1">Log Out</DropdownMenuItem>
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
                        <Link href="/about" className="block text-base font-semibold py-3 px-4 rounded-lg bg-muted text-primary cursor-pointer">About Us</Link>
                        <Link href="/faq" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">FAQ</Link>
                        <Link href="/contact" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Contact Us</Link>
                        {!isAuthenticated && (
                            <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" onClick={() => (window.location.href = "/login")}>Login</Button>
                        )}
                        {isAuthenticated && (
                            <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" variant="destructive" onClick={logout}>Log Out</Button>
                        )}
                    </div>
                )}
            </header>

            <main>
                {/* ── 1. HERO ── */}
                <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary/8 via-secondary/5 to-transparent rounded-full blur-3xl -z-10" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-secondary/8 via-primary/5 to-transparent rounded-full blur-3xl -z-10" />

                    <div className="container px-6 mx-auto max-w-5xl text-center">
                        <motion.div initial="hidden" animate="visible" variants={stagger}>
                            <motion.div variants={cardItem} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 text-primary font-bold text-sm mb-8 border border-primary/20">
                                <MessageCircleHeart className="w-4 h-4" />
                                <span className="text-foreground/80">Our Story — Why ScrollPet Exists</span>
                            </motion.div>

                            <motion.h1 variants={cardItem} className="text-4xl sm:text-5xl lg:text-7xl font-extrabold font-heading leading-[1.1] mb-8 tracking-tight">
                                Built by a Pet Lover,{" "}
                                <br className="hidden sm:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#009bb8] to-secondary">
                                    For Every Pet Lover.
                                </span>
                            </motion.h1>

                            <motion.p variants={cardItem} className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed font-medium max-w-3xl mx-auto">
                                Every great community starts with a real story. Ours began when one person couldn't find a safe place to connect with other pet owners — and decided the world deserved better.
                            </motion.p>

                            <motion.div variants={cardItem} className="flex justify-center gap-2 text-3xl">
                                <span>🐕</span><span>🐱</span><span>🐠</span><span>🦜</span><span>🐰</span><span>🐹</span><span>🐢</span><span>🐴</span>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* ── 2. ORIGIN STORY TIMELINE ── */}
                <section className="py-20 lg:py-28 bg-muted/40 relative">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                    <div className="container px-6 mx-auto max-w-5xl">
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary font-bold text-xs uppercase tracking-wider mb-6 border border-secondary/20">
                                The Origin Story
                            </span>
                            <h2 className="text-3xl lg:text-5xl font-extrabold mb-5 tracking-tight">
                                It Started With a <span className="text-primary">Simple Search</span>
                            </h2>
                            <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
                                A search for community that exposed a broken system — and ignited a mission to fix it.
                            </p>
                        </motion.div>

                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="relative">
                            {/* vertical line */}
                            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 via-secondary/30 to-primary/30 md:-translate-x-px" />

                            {JOURNEY_STEPS.map((step, i) => (
                                <motion.div
                                    key={i}
                                    variants={cardItem}
                                    className={`relative flex gap-6 md:gap-12 mb-12 last:mb-0 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} flex-col`}
                                >
                                    {/* dot */}
                                    <div className="absolute left-6 md:left-1/2 top-2 md:top-4 -translate-x-1/2 z-10">
                                        <div className="w-12 h-12 rounded-full bg-background border-[3px] border-primary shadow-lg shadow-primary/20 flex items-center justify-center">
                                            <step.icon className="w-5 h-5 text-primary" />
                                        </div>
                                    </div>

                                    {/* card */}
                                    <div className={`ml-16 md:ml-0 md:w-[calc(50%-3rem)] ${i % 2 === 0 ? "md:pr-4" : "md:pl-4"}`}>
                                        <div className="bg-card p-6 md:p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 group">
                                            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-4">
                                                {step.year}
                                            </span>
                                            <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{step.title}</h3>
                                            <p className="text-muted-foreground leading-relaxed">{step.text}</p>
                                        </div>
                                    </div>

                                    <div className="hidden md:block md:w-[calc(50%-3rem)]" />
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ── 3. FOUNDER ── */}
                <section className="py-20 lg:py-28 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/6 to-transparent rounded-full blur-3xl -z-10" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-secondary/6 to-transparent rounded-full blur-3xl -z-10" />

                    <div className="container px-6 mx-auto max-w-5xl">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                            {/* photo */}
                            <motion.div
                                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}
                                className="relative order-2 lg:order-1 flex justify-center"
                            >
                                <div className="relative">
                                    <div className="absolute -inset-6 rounded-full border-2 border-dashed border-primary/15 animate-[spin_30s_linear_infinite]" />
                                    <div className="absolute -inset-12 rounded-full border border-dashed border-secondary/10 animate-[spin_45s_linear_infinite_reverse]" />

                                    <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-full overflow-hidden ring-[6px] ring-background shadow-2xl shadow-primary/15">
                                        <img
                                            src={founderPhoto}
                                            alt="Gurvinder Singh — Founder of ScrollPet"
                                            className="w-full h-full object-cover object-top"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gurvinder';
                                            }}
                                        />
                                    </div>

                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
                                        viewport={{ once: true }} transition={{ delay: 0.5, type: "spring" }}
                                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-background px-5 py-2.5 rounded-full shadow-lg border border-border/50 flex items-center gap-2 whitespace-nowrap"
                                    >
                                        <Heart className="w-4 h-4 text-secondary fill-secondary" />
                                        <span className="font-bold text-sm">Solo Founder</span>
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* message */}
                            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="order-1 lg:order-2">
                                <motion.span variants={cardItem} className="inline-block px-4 py-1.5 rounded-full bg-primary text-white font-bold text-xs uppercase tracking-wider mb-6 shadow-lg shadow-primary/20">
                                    Meet the Founder
                                </motion.span>

                                <motion.h2 variants={cardItem} className="text-3xl lg:text-4xl font-extrabold mb-6 tracking-tight">
                                    Hi, I'm <span className="text-primary">Gurvinder</span>.
                                </motion.h2>

                                <motion.div variants={cardItem} className="relative mb-8">
                                    <Quote className="absolute -top-2 -left-2 w-8 h-8 text-primary/15" />
                                    <div className="space-y-4 text-muted-foreground leading-relaxed text-lg pl-4 border-l-4 border-primary/20">
                                        <p>
                                            I'm building ScrollPet solo because I believe the world desperately needs a{" "}
                                            <strong className="text-foreground">safe haven for pet owners</strong> — a place where your love for animals connects you with others who feel the same way, without boundaries or barriers.
                                        </p>
                                        <p>
                                            This platform isn't backed by venture capital or built to maximise profit. It's built with{" "}
                                            <strong className="text-foreground">honesty, empathy, and purpose</strong>. Every feature, every decision, is guided by one question:
                                            <em> "Does this make the lives of pets and their owners better?"</em>
                                        </p>
                                        <p className="text-foreground font-semibold">
                                            My ultimate dream? When this platform is ready, I'll be adopting my next permanent furry family member directly through the ScrollPet community. 🐾
                                        </p>
                                    </div>
                                </motion.div>

                                <motion.div variants={cardItem} className="flex flex-wrap gap-3">
                                    <Link href="/chat">
                                        <Button size="lg" className="rounded-full px-8 py-6 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group">
                                            Join the Community <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                    <Link href="/contact">
                                        <Button variant="outline" size="lg" className="rounded-full px-8 py-6 text-base font-bold border-2 hover:bg-muted transition-all cursor-pointer">
                                            Say Hello
                                        </Button>
                                    </Link>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ── 4. MISSION & VALUES ── */}
                <section className="py-20 lg:py-28 bg-primary relative overflow-hidden text-white">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.06]" />
                    <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-secondary rounded-full blur-[120px] opacity-15" />
                    <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-secondary rounded-full blur-[120px] opacity-10" />

                    <div className="container px-6 mx-auto max-w-6xl relative z-10">
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center max-w-3xl mx-auto mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 font-bold text-sm mb-6">
                                <Sparkles className="h-4 w-4" /> Our Ultimate Mission
                            </div>
                            <h2 className="text-3xl lg:text-5xl font-extrabold mb-6 tracking-tight leading-tight">
                                A Safer World for Pets —{" "}
                                <span className="text-secondary">Starting Here</span>
                            </h2>
                            <p className="text-lg text-primary-foreground/85 font-medium leading-relaxed">
                                To provide every pet owner with a safe, unified platform. Whether you're looking to adopt, find the perfect family for your pet, or seek the best possible advice — ScrollPet exists to stop fraud, end pet abuse, and connect people who genuinely care.
                            </p>
                        </motion.div>

                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                            {VALUES.map((v, i) => (
                                <motion.div key={i} variants={cardItem} className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-white/20 transition-all duration-300 group relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${v.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                                    <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-6 group-hover:bg-white/25 transition-colors">
                                        <v.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{v.title}</h3>
                                    <p className="text-white/75 leading-relaxed">{v.desc}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ── 5. TRUST SIGNALS ── */}
                <section className="py-20 lg:py-28 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-muted/30 -z-10" />
                    <div className="container px-6 mx-auto max-w-5xl">
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center max-w-3xl mx-auto mb-16">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-6 border border-primary/20">
                                What Makes Us Different
                            </span>
                            <h2 className="text-3xl lg:text-5xl font-extrabold mb-5 tracking-tight">
                                Built on <span className="text-primary">Trust</span>, Not Hype
                            </h2>
                            <p className="text-lg text-muted-foreground font-medium">
                                In a world of empty promises, ScrollPet is built on transparency, accountability, and a genuine love for animals.
                            </p>
                        </motion.div>

                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 gap-6">
                            {TRUST.map((t, i) => (
                                <motion.div key={i} variants={cardItem} className="flex gap-5 p-6 md:p-8 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 group">
                                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                        <t.icon size={22} strokeWidth={2} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-2">{t.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">{t.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ── 6. FINAL CTA ── */}
                <section className="py-20 lg:py-28 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 -z-10" />
                    <div className="container px-6 mx-auto">
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-3xl mx-auto text-center">
                            <div className="text-5xl mb-6">🐾</div>
                            <h2 className="text-3xl lg:text-5xl font-extrabold mb-6 tracking-tight">
                                Be Part of{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                                    Something Real
                                </span>
                            </h2>
                            <p className="text-xl text-muted-foreground mb-10 font-medium max-w-2xl mx-auto leading-relaxed">
                                ScrollPet isn't just an app — it's a movement built by people who believe every pet deserves love, and every pet owner deserves community. Will you join us?
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                {isAuthenticated ? (
                                    <Link href="/chat">
                                        <Button size="lg" className="text-lg px-10 py-7 rounded-full shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group">
                                            Enter the Chat Rooms <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button size="lg" className="text-lg px-10 py-7 rounded-full shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group" onClick={() => (window.location.href = "/signup")}>
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Join ScrollPet — It's Free
                                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ── FOOTER (matches Home) ── */}
                <footer className="bg-gray-950 text-gray-300 pt-20 pb-10 border-t border-gray-900">
                    <div className="container px-6 mx-auto">
                        <div className="flex flex-col gap-y-10 md:grid md:grid-cols-12 md:gap-12 mb-16">
                            <div className="col-span-12 md:col-span-4">
                                <Link href="/" className="inline-block mb-6 opacity-90 hover:opacity-100 transition-opacity">
                                    <img src={logoImage} alt="ScrollPet Logo" className="h-10 w-auto object-contain brightness-0 invert opacity-90" />
                                </Link>
                                <p className="text-gray-400 mb-6 leading-relaxed">
                                    Connecting pet lovers worldwide in a safe, trusted environment. Join us in building the most positive pet community on the internet.
                                </p>
                                <div className="flex gap-3">
                                    <a href="https://www.instagram.com/scrollpet.com_/" target="_blank" rel="noopener noreferrer"
                                        className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] transition-all cursor-pointer group" aria-label="Instagram">
                                        <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    </a>
                                    <a href="https://x.com/Scrollpets" target="_blank" rel="noopener noreferrer"
                                        className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-black transition-colors cursor-pointer group" aria-label="X (Twitter)">
                                        <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                    </a>
                                    <a href="https://www.linkedin.com/company/scrollpet/?viewAsMember=true" target="_blank" rel="noopener noreferrer"
                                        className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-[#0A66C2] transition-colors cursor-pointer group" aria-label="LinkedIn">
                                        <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>

                            <div className="col-span-6 md:col-span-2 md:col-start-6">
                                <h4 className="font-bold text-white mb-6 text-lg">Platform</h4>
                                <ul className="space-y-3">
                                    <li><Link href="/" className="hover:text-primary transition-colors cursor-pointer">Home</Link></li>
                                    <li><Link href="/chat" className="hover:text-primary transition-colors cursor-pointer">Chat Rooms</Link></li>
                                    <li><Link href="/login" className="hover:text-primary transition-colors cursor-pointer">Login</Link></li>
                                    <li><Link href="/signup" className="hover:text-primary transition-colors cursor-pointer">Sign Up</Link></li>
                                </ul>
                            </div>

                            <div className="col-span-6 md:col-span-2">
                                <h4 className="font-bold text-white mb-6 text-lg">Company</h4>
                                <ul className="space-y-3">
                                    <li><Link href="/about" className="hover:text-primary transition-colors cursor-pointer">About Us</Link></li>
                                    <li><Link href="/contact" className="hover:text-primary transition-colors cursor-pointer">Contact Us</Link></li>
                                    <li><Link href="/faq" className="hover:text-primary transition-colors cursor-pointer">FAQ</Link></li>
                                </ul>
                            </div>

                            <div className="col-span-6 md:col-span-2">
                                <h4 className="font-bold text-white mb-6 text-lg">Legal</h4>
                                <ul className="space-y-3">
                                    <li><Link href="/privacy" className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</Link></li>
                                    <li><Link href="/terms" className="hover:text-primary transition-colors cursor-pointer">Terms of Service</Link></li>
                                    <li><Link href="/cookies" className="hover:text-primary transition-colors cursor-pointer">Cookie Policy</Link></li>
                                    <li><Link href="/community-guidelines" className="hover:text-primary transition-colors cursor-pointer">Community Guidelines</Link></li>
                                </ul>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 gap-4">
                            <div>© {new Date().getFullYear()} ScrollPet. All rights reserved.</div>
                            <span>Made with ❤️ for pet lovers everywhere 🐾</span>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}