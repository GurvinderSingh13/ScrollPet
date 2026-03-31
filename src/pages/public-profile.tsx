import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, MapPin, Phone, FileText, PawPrint, MessageCircle, Share2, Calendar, Dog, Cat, Bird, Activity } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";

export default function PublicProfile() {
    const [match, params] = useRoute("/profile/:username");
    const username = params?.username ? decodeURIComponent(params.username) : "";
    const [, setLocation] = useLocation();
    const { isAuthenticated } = useAuth();

    const { data: profileData, isLoading, error } = useQuery({
        queryKey: ["publicProfile", username],
        queryFn: async () => {
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("*")
                .or(`username.eq."${username}",display_name.eq."${username}"`)
                .single();

            if (userError || !userData) throw new Error("User not found");

            const { data: petsData, error: petsError } = await supabase
                .from("pets")
                .select("*")
                .eq("user_id", userData.id);

            return { user: userData, pets: petsData || [] };
        },
        enabled: !!username,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-3 border-[#007699] border-t-transparent animate-spin" />
                    <p className="text-sm font-medium text-gray-500">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error || !profileData?.user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f8] text-center p-4" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md">
                    <h1 className="text-6xl font-extrabold text-gray-200 mb-2">404</h1>
                    <p className="text-lg font-semibold text-gray-700 mb-1">User not found</p>
                    <p className="text-sm text-gray-500 mb-8">We couldn't find a user by that name.</p>
                    <Link href="/chat">
                        <button className="bg-[#007699] text-white px-6 py-2.5 rounded-xl hover:bg-[#005a75] transition-all font-semibold shadow-md hover:shadow-lg cursor-pointer">
                            Return to Chat
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const { user, pets } = profileData;

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast({ description: "Profile link copied to clipboard!" });
        } catch (err) {
            toast({ description: "Failed to copy link.", variant: "destructive" });
        }
    };

    const handleMessage = () => {
        if (!isAuthenticated) {
            toast({ description: "Please log in to send a message." });
            setLocation('/login');
            return;
        }
        sessionStorage.setItem("teleport_dm_user_id", user.id);
        sessionStorage.setItem("teleport_dm_user_name", user.display_name || user.username);
        setLocation('/chat-interface');
    };

    const joinedDate = user.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : null;

    return (
        <div className="min-h-screen bg-[#f0f4f8] flex flex-col" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

            {/* ══════════════════════════════════════════════════════════════════
                HEADER — Frosted glass, matching the dashboard
               ══════════════════════════════════════════════════════════════════ */}
            <header className="sticky top-0 z-50 w-full border-b border-white/20" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px) saturate(180%)' }}>
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/chat">
                            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 cursor-pointer">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </Link>
                        <Link href="/" className="cursor-pointer">
                            <img src={logoImage} alt="ScrollPet Logo" className="h-9 md:h-10 w-auto object-contain hover:opacity-90 transition-opacity" />
                        </Link>
                    </div>

                    <nav className="hidden md:flex items-center gap-1">
                        {[
                            { href: "/", label: "Home" },
                            { href: "/chat", label: "Chat Rooms" },
                            { href: "/about", label: "About" },
                            { href: "/faq", label: "FAQ" },
                            { href: "/contact", label: "Contact" },
                        ].map((link) => (
                            <Link key={link.href} href={link.href} className="text-sm font-medium text-gray-600 hover:text-[#007699] px-3 py-2 rounded-lg hover:bg-[#007699]/5 transition-all cursor-pointer">
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </header>

            {/* ══════════════════════════════════════════════════════════════════
                HERO PROFILE BANNER
               ══════════════════════════════════════════════════════════════════ */}
            <div className="w-full relative">
                <div className="h-40 md:h-52" style={{ background: 'linear-gradient(135deg, #007699 0%, #00a3cc 40%, #FF6600 100%)' }}>
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,102,0,0.2) 0%, transparent 50%)' }} />
                </div>
                <div className="container mx-auto px-4 max-w-4xl relative">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-5 -mt-16 md:-mt-14">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="h-28 w-28 md:h-32 md:w-32 rounded-2xl border-4 border-white bg-white flex items-center justify-center overflow-hidden shadow-xl" style={{ borderRadius: '24px' }}>
                                {user.profile_image_url || user.avatar_url ? (
                                    <img src={user.profile_image_url || user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="Avatar" className="h-full w-full object-cover" />
                                )}
                            </div>
                        </div>
                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left pb-1">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                                {user.display_name || user.username}
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                @{user.username}
                            </p>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pb-2 md:pb-1">
                            <button
                                onClick={handleMessage}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#007699] text-white text-sm font-semibold hover:bg-[#005a75] shadow-md hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5"
                            >
                                <MessageCircle className="w-4 h-4" /> Message
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:border-[#007699] hover:text-[#007699] hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
                            >
                                <Share2 className="w-4 h-4" /> Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                QUICK STATS BAR
               ══════════════════════════════════════════════════════════════════ */}
            <div className="w-full border-b border-gray-200/80 bg-white">
                <div className="container mx-auto px-4 max-w-4xl py-4">
                    <div className="flex items-center justify-center md:justify-start gap-6 md:gap-10 flex-wrap">
                        <div className="flex items-center gap-2 text-sm">
                            <PawPrint className="w-4 h-4 text-[#007699]" />
                            <span className="font-extrabold text-gray-900">{pets.length}</span>
                            <span className="text-gray-500 font-medium">{pets.length === 1 ? "Pet" : "Pets"}</span>
                        </div>
                        {(user.state || user.country) && (
                            <>
                                <div className="w-px h-5 bg-gray-200" />
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-[#FF6600]" />
                                    <span className="font-semibold text-gray-700">
                                        {user.state}{user.state && user.country ? ', ' : ''}{user.country}
                                    </span>
                                </div>
                            </>
                        )}
                        {user.phone && (
                            <>
                                <div className="w-px h-5 bg-gray-200" />
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium text-gray-600">{user.phone}</span>
                                </div>
                            </>
                        )}
                        {joinedDate && (
                            <>
                                <div className="w-px h-5 bg-gray-200" />
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-500 font-medium">Joined {joinedDate}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                MAIN CONTENT
               ══════════════════════════════════════════════════════════════════ */}
            <main className="flex-grow container mx-auto px-4 max-w-4xl py-6 md:py-8 space-y-6">

                {/* About Me Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#007699]" />
                            About Me
                        </h2>
                    </div>
                    <div className="px-6 py-5">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {user.bio || "This user hasn't added a bio yet. They are busy taking care of their pets!"}
                        </p>
                    </div>
                </div>

                {/* Registered Pets Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                            <PawPrint className="w-5 h-5 text-[#FF6600]" />
                            Registered Pets
                        </h2>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-3 py-1 rounded-lg">
                            {pets.length} {pets.length === 1 ? "pet" : "pets"}
                        </span>
                    </div>

                    {pets.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-16 text-center px-4">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#007699]/10 to-[#FF6600]/10 flex items-center justify-center text-[#007699] mb-5">
                                <PawPrint className="h-10 w-10" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">No pets registered</h3>
                            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                                This user hasn't registered any pets yet. When they do, their furry friends will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pets.map(pet => (
                                <div
                                    key={pet.id}
                                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    {/* Pet Image Area */}
                                    <div className="h-44 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #fef3e8 100%)' }}>
                                        {pet.image_url ? (
                                            <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                {pet.type === "dog" ? <Dog className="h-16 w-16 text-[#007699]/25" /> :
                                                 pet.type === "cat" ? <Cat className="h-16 w-16 text-[#007699]/25" /> :
                                                 pet.type === "bird" ? <Bird className="h-16 w-16 text-[#007699]/25" /> :
                                                 <PawPrint className="h-16 w-16 text-[#007699]/25" />}
                                            </div>
                                        )}
                                        {/* Type Badge */}
                                        <div className="absolute top-3 left-3">
                                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg text-white shadow-sm capitalize" style={{ background: 'rgba(0,118,153,0.85)', backdropFilter: 'blur(4px)' }}>
                                                {pet.type || "pet"}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Pet Info */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-lg text-gray-900 capitalize leading-tight">{pet.name}</h3>
                                        <p className="text-sm text-gray-500 capitalize mt-0.5">{pet.breed || "Unknown breed"}</p>
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {pet.gender && (
                                                <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md capitalize">{pet.gender}</span>
                                            )}
                                            {pet.dob && (
                                                <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">{pet.dob}</span>
                                            )}
                                            {(pet.state || pet.country) && (
                                                <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                                                    {pet.state}{pet.state && pet.country ? ', ' : ''}{pet.country}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Posts Placeholder */}
                <div>
                    <h2 className="text-xl font-extrabold text-gray-900 mb-4">Recent Posts</h2>
                    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-14 text-center px-4">
                        <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
                            <FileText className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">No posts yet</p>
                        <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                            When this user shares updates about their pets, they will appear here.
                        </p>
                    </div>
                </div>

            </main>

            {/* ══════════════════════
                FOOTER
               ══════════════════════ */}
            <footer className="border-t border-gray-200/80 bg-white mt-auto">
                <div className="container mx-auto px-4 max-w-4xl py-6 flex items-center justify-between">
                    <p className="text-xs text-gray-400">© {new Date().getFullYear()} ScrollPet. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <Link href="/about" className="text-xs text-gray-400 hover:text-[#007699] transition-colors cursor-pointer">About</Link>
                        <Link href="/faq" className="text-xs text-gray-400 hover:text-[#007699] transition-colors cursor-pointer">FAQ</Link>
                        <Link href="/contact" className="text-xs text-gray-400 hover:text-[#007699] transition-colors cursor-pointer">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}