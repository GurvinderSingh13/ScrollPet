import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import {
    Mail,
    MapPin,
    MessageCircle,
    MessageSquare,
    Send,
    Sparkles,
    CheckCircle2,
    ShieldAlert,
    UserCircle,
    Handshake,
    HelpCircle,
    Clock,
    Heart,
    ArrowRight,
    Menu,
    X,
    User,
    Shield,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
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

/* ─── data ─── */
const SUBJECT_OPTIONS = [
    { label: "General Inquiry", icon: HelpCircle, value: "General Inquiry" },
    { label: "Report an Issue", icon: ShieldAlert, value: "Report an Issue" },
    { label: "Account Support", icon: UserCircle, value: "Account Support" },
    { label: "Partnership", icon: Handshake, value: "Partnership" },
    { label: "Other", icon: Sparkles, value: "Other" },
];

const QUICK_LINKS = [
    {
        icon: MessageSquare,
        title: "Message Admin",
        desc: "Message the Scrollpet admin directly.",
        href: "/chat-rooms",
        gradient: "from-[#FF6600] to-[#ff8833]",
    },
    {
        icon: HelpCircle,
        title: "FAQ",
        desc: "Quick answers to common questions.",
        href: "/faq",
        gradient: "from-[#007699] to-[#00a3cc]",
    },
    {
        icon: Clock,
        title: "Response Time",
        desc: "We typically reply within 24 hours.",
        href: "#",
        gradient: "from-emerald-500 to-emerald-400",
    },
];

export default function ContactUs() {
    const [, setLocation] = useLocation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("General Inquiry");
    const [customSubject, setCustomSubject] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const { user, isLoading, isAuthenticated, logout } = useAuth();

    const { data: dbUser } = useQuery({
        queryKey: ["db-user-contact", user?.id],
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

    const isCustom = selectedCategory === "Other";
    const finalSubject = isCustom ? customSubject : selectedCategory;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isCustom && !customSubject.trim()) {
            toast({
                title: "Subject Required",
                description: "Please specify your subject in the text field.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        formData.append("access_key", "1752c8c2-93f2-4d0e-8d8f-b0ef31ddb9d4");
        formData.set("subject", `[ScrollPet Contact] ${finalSubject}`);

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "Message Sent Successfully! ✉️",
                    description:
                        "Thank you for reaching out. We'll get back to you within 24 hours.",
                });
                (e.target as HTMLFormElement).reset();
                setCustomSubject("");
                setSelectedCategory("General Inquiry");
            } else {
                toast({
                    title: "Message Failed",
                    description:
                        data.message ||
                        "There was an issue sending your message. Please try again.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Connection Error",
                description: "A network error occurred. Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen pt-20 bg-background font-sans text-foreground flex flex-col overflow-x-hidden selection:bg-primary/20">
            {/* ── HEADER (matches Home / About) ── */}
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
                        <Link href="/contact" className="text-sm font-semibold text-primary cursor-pointer">Contact Us</Link>
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
                                                src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                                                alt="Avatar"
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
                                        <p className="font-medium text-sm text-foreground truncate">
                                            {user?.displayName || user?.username || "User"}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {user?.email}
                                        </p>
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
                                                <Shield className="w-4 h-4 mr-2" /> Moderation
                                                Dashboard
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                        onClick={logout}
                                        className="text-destructive cursor-pointer font-medium border-t border-border/50 mt-1"
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
                        <Link href="/" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Home</Link>
                        <Link href="/chat" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Chat Rooms</Link>
                        <Link href="/about" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">About Us</Link>
                        <Link href="/faq" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">FAQ</Link>
                        <Link href="/contact" className="block text-base font-semibold py-3 px-4 rounded-lg bg-muted text-primary cursor-pointer">Contact Us</Link>
                        {!isAuthenticated && (
                            <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" onClick={() => (window.location.href = "/login")}>Login</Button>
                        )}
                        {isAuthenticated && (
                            <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" variant="destructive" onClick={logout}>Log Out</Button>
                        )}
                    </div>
                )}
            </header>

            <main className="flex-1">
                {/* ── HERO ── */}
                <section className="relative pt-16 pb-12 lg:pt-24 lg:pb-16 overflow-hidden">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary/8 via-secondary/5 to-transparent rounded-full blur-3xl -z-10" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-secondary/8 via-primary/5 to-transparent rounded-full blur-3xl -z-10" />

                    <div className="container px-6 mx-auto max-w-5xl text-center">
                        <motion.div initial="hidden" animate="visible" variants={stagger}>
                            <motion.div
                                variants={cardItem}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 text-primary font-bold text-sm mb-8 border border-primary/20"
                            >
                                <Mail className="w-4 h-4" />
                                <span className="text-foreground/80">
                                    Get in Touch — We're Listening
                                </span>
                            </motion.div>

                            <motion.h1
                                variants={cardItem}
                                className="text-4xl sm:text-5xl lg:text-7xl font-extrabold font-heading leading-[1.1] mb-6 tracking-tight"
                            >
                                We'd Love to{" "}
                                <br className="hidden sm:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#009bb8] to-secondary">
                                    Hear From You
                                </span>
                            </motion.h1>

                            <motion.p
                                variants={cardItem}
                                className="text-lg lg:text-xl text-muted-foreground leading-relaxed font-medium max-w-2xl mx-auto mb-10"
                            >
                                Whether you have a question, need help, or want to
                                collaborate — we're here. Choose a topic and send us
                                a message below.
                            </motion.p>

                            {/* Quick-link cards */}
                            <motion.div
                                variants={stagger}
                                className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
                            >
                                {QUICK_LINKS.map((ql, i) => {
                                    const isMessageAdmin = ql.title === "Message Admin";
                                    const cardContent = (
                                        <div className="h-full group bg-card p-5 rounded-2xl border border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left">
                                            <div
                                                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ql.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                                            >
                                                <ql.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <h3 className="font-bold text-sm mb-1">
                                                {ql.title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground leading-snug">
                                                {ql.desc}
                                            </p>
                                        </div>
                                    );

                                    return (
                                        <motion.div key={i} variants={cardItem} className="h-full">
                                            {isMessageAdmin ? (
                                                <div 
                                                    className="block h-full cursor-pointer" 
                                                    onClick={() => {
                                                        if (!isAuthenticated) {
                                                            setLocation('/login');
                                                        } else {
                                                            setLocation('/profile/Scrollpet');
                                                        }
                                                    }}
                                                >
                                                    {cardContent}
                                                </div>
                                            ) : (
                                                <Link href={ql.href} className="block h-full">
                                                    {cardContent}
                                                </Link>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* ── MAIN FORM SECTION ── */}
                <section className="py-12 lg:py-20 px-6 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-muted/30 -z-10" />

                    <div className="container mx-auto max-w-6xl">
                        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
                            {/* ─ LEFT: Contact Info ─ */}
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={stagger}
                                className="lg:col-span-5 space-y-10"
                            >
                                <div>
                                    <motion.h2
                                        variants={cardItem}
                                        className="text-3xl font-extrabold mb-4 tracking-tight"
                                    >
                                        Reach Us Directly
                                    </motion.h2>
                                    <motion.p
                                        variants={cardItem}
                                        className="text-muted-foreground text-lg leading-relaxed"
                                    >
                                        ScrollPet is a community-first platform.
                                        Your feedback shapes what we build next — and
                                        how we keep pets and their owners safe.
                                    </motion.p>
                                </div>

                                {/* Contact cards */}
                                <motion.div
                                    variants={stagger}
                                    className="space-y-5"
                                >
                                    {/* Email */}
                                    <motion.a
                                        variants={cardItem}
                                        href="mailto:support@scrollpet.com"
                                        className="flex gap-5 p-5 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-[#007699]/10 border border-[#007699]/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                            <Mail className="w-6 h-6 text-[#007699]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg mb-0.5">
                                                Email Support
                                            </h3>
                                            <p className="text-muted-foreground text-sm mb-1.5">
                                                For general inquiries, account help,
                                                and feedback.
                                            </p>
                                            <span className="text-[#007699] font-bold text-sm group-hover:underline decoration-2 underline-offset-4">
                                                support@scrollpet.com
                                            </span>
                                        </div>
                                    </motion.a>

                                    {/* Community */}
                                    <motion.div variants={cardItem}>
                                        <Link href="/chat">
                                            <div className="flex gap-5 p-5 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer">
                                                <div className="w-14 h-14 rounded-2xl bg-[#FF6600]/10 border border-[#FF6600]/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                    <MessageCircle className="w-6 h-6 text-[#FF6600]" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg mb-0.5">
                                                        Live Community Chat
                                                    </h3>
                                                    <p className="text-muted-foreground text-sm mb-1.5">
                                                        Ask questions directly in our
                                                        Global Chat room.
                                                    </p>
                                                    <span className="text-[#FF6600] font-bold text-sm group-hover:underline decoration-2 underline-offset-4">
                                                        Enter Global Room →
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>

                                    {/* Location */}
                                    <motion.div
                                        variants={cardItem}
                                        className="flex gap-5 p-5 rounded-2xl bg-card border border-border/50 shadow-sm"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center shrink-0">
                                            <MapPin className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg mb-0.5">
                                                Headquarters
                                            </h3>
                                            <p className="text-muted-foreground text-sm">
                                                Chandigarh Capital Region
                                                <br />
                                                Punjab, India
                                            </p>
                                        </div>
                                    </motion.div>
                                </motion.div>

                                {/* Social links */}
                                <motion.div
                                    variants={cardItem}
                                    className="pt-6 border-t border-border/50"
                                >
                                    <h3 className="font-bold mb-5 text-foreground">
                                        Follow Our Journey
                                    </h3>
                                    <div className="flex gap-3">
                                        <a
                                            href="https://www.instagram.com/scrollpet.com_/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white hover:shadow-lg transition-all transform hover:-translate-y-1 cursor-pointer"
                                            aria-label="Instagram"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                            </svg>
                                        </a>
                                        <a
                                            href="https://x.com/Scrollpets"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-black hover:text-white hover:shadow-lg transition-all transform hover:-translate-y-1 cursor-pointer"
                                            aria-label="X (Twitter)"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                            </svg>
                                        </a>
                                        <a
                                            href="https://www.linkedin.com/company/scrollpet/?viewAsMember=true"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-[#0A66C2] hover:text-white hover:shadow-lg transition-all transform hover:-translate-y-1 cursor-pointer"
                                            aria-label="LinkedIn"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                            </svg>
                                        </a>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* ─ RIGHT: Contact Form ─ */}
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="lg:col-span-7"
                            >
                                <div className="bg-card p-8 md:p-10 rounded-3xl shadow-xl shadow-primary/5 border border-border/50 relative overflow-hidden">
                                    {/* subtle corner accent */}
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full -z-[1]" />
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary/5 to-transparent rounded-tr-full -z-[1]" />

                                    <h3 className="text-2xl font-extrabold mb-2 flex items-center gap-3">
                                        Send a Message
                                        <Sparkles className="w-5 h-5 text-primary" />
                                    </h3>
                                    <p className="text-muted-foreground mb-8 text-sm">
                                        We read every message and respond within 24
                                        hours.
                                    </p>

                                    <form
                                        onSubmit={handleSubmit}
                                        className="space-y-6"
                                    >
                                        {/* Hidden subject field */}
                                        <input
                                            type="hidden"
                                            name="subject"
                                            value={finalSubject}
                                        />

                                        {/* Name + Email */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label
                                                    htmlFor="name"
                                                    className="text-sm font-bold text-foreground"
                                                >
                                                    Full Name
                                                </label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    required
                                                    placeholder="Gurvinder Singh"
                                                    className="bg-muted/50 border-border focus-visible:ring-primary/50 h-12 rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label
                                                    htmlFor="email"
                                                    className="text-sm font-bold text-foreground"
                                                >
                                                    Email Address
                                                </label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    required
                                                    placeholder="you@example.com"
                                                    className="bg-muted/50 border-border focus-visible:ring-primary/50 h-12 rounded-xl"
                                                />
                                            </div>
                                        </div>

                                        {/* Subject Chip Selector */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-foreground flex items-center gap-2">
                                                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                                What's this about?
                                            </label>

                                            <div className="flex flex-wrap gap-2.5">
                                                {SUBJECT_OPTIONS.map((opt) => (
                                                    <button
                                                        type="button"
                                                        key={opt.value}
                                                        onClick={() =>
                                                            setSelectedCategory(
                                                                opt.value,
                                                            )
                                                        }
                                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                                                            selectedCategory ===
                                                            opt.value
                                                                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]"
                                                                : "bg-background text-muted-foreground border-border hover:bg-muted hover:border-primary/30 hover:text-foreground"
                                                        }`}
                                                    >
                                                        <opt.icon className="w-4 h-4" />
                                                        {opt.label}
                                                        {selectedCategory ===
                                                            opt.value && (
                                                            <CheckCircle2 className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Custom subject (only for "Other") */}
                                        {isCustom && (
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    height: 0,
                                                    y: -8,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    height: "auto",
                                                    y: 0,
                                                }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden space-y-2"
                                            >
                                                <label
                                                    htmlFor="custom-subject"
                                                    className="text-sm font-bold text-foreground"
                                                >
                                                    Please specify your subject
                                                </label>
                                                <Input
                                                    id="custom-subject"
                                                    value={customSubject}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                        setCustomSubject(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="E.g. Press Inquiry, App Suggestion, etc."
                                                    className="bg-muted/50 border-border focus-visible:ring-primary/50 h-12 rounded-xl"
                                                />
                                            </motion.div>
                                        )}

                                        {/* Message */}
                                        <div className="space-y-2 pt-1">
                                            <label
                                                htmlFor="message"
                                                className="text-sm font-bold text-foreground"
                                            >
                                                Your Message
                                            </label>
                                            <Textarea
                                                id="message"
                                                name="message"
                                                required
                                                placeholder="Tell us exactly what's on your mind. We read every message..."
                                                className="min-h-[160px] bg-muted/50 border-border focus-visible:ring-primary/50 rounded-xl resize-y text-base p-4"
                                            />
                                        </div>

                                        {/* Submit */}
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            size="lg"
                                            className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all group"
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center gap-2">
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Sending securely...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    Send Message
                                                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </span>
                                            )}
                                        </Button>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </main>

            {/* ── FOOTER (matches Home / About) ── */}
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
        </div>
    );
}