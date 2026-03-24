import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, MapPin, Phone, FileText, PawPrint } from "lucide-react";

export default function PublicProfile() {
    const [match, params] = useRoute("/profile/:username");
    const username = params?.username ? decodeURIComponent(params.username) : "";

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
        return <div className="min-h-screen flex items-center justify-center text-[#007699] font-medium">Loading Profile...</div>;
    }

    if (error || !profileData?.user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7F9] text-center p-4">
                <h1 className="text-5xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-gray-600 mb-8">We couldn't find a user by that name.</p>
                <Link href="/chat">
                    <button className="bg-[#007699] text-white px-6 py-2 rounded-full hover:bg-[#005a75] transition-colors font-semibold">
                        Return to Chat
                    </button>
                </Link>
            </div>
        );
    }

    const { user, pets } = profileData;

    return (
        <div className="min-h-screen bg-[#F5F7F9] pb-12 font-sans">

            {/* Updated Clean App Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
                <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/chat">
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 flex items-center gap-2">
                                <ArrowLeft className="w-5 h-5" />
                                <span className="font-semibold text-[#007699] text-lg tracking-tight hidden sm:block">ScrollPet</span>
                            </button>
                        </Link>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 px-6 py-2">
                        <Link href="/" className="text-sm font-semibold text-gray-700 hover:text-[#007699] transition-colors cursor-pointer">Home</Link>
                        <Link href="/chat" className="text-sm font-semibold text-gray-700 hover:text-[#007699] transition-colors cursor-pointer">Chat Rooms</Link>
                        <Link href="/about" className="text-sm font-semibold text-gray-700 hover:text-[#007699] transition-colors cursor-pointer">About Us</Link>
                        <Link href="/faq" className="text-sm font-semibold text-gray-700 hover:text-[#007699] transition-colors cursor-pointer">FAQ</Link>
                    </nav>
                </div>
            </header>

            <div className="max-w-4xl mx-auto p-4 md:p-8 mt-4">
                {/* Profile Identity Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[#007699]/80 to-[#FF6600]/80"></div>

                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-full border-4 border-white shadow-lg overflow-hidden flex-shrink-0 relative z-10">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>

                    <div className="text-center md:text-left flex-1 relative z-10 mt-2 md:mt-0">
                        <h2 className="text-3xl font-bold text-gray-900">{user.display_name || user.username}</h2>
                        <p className="text-[#007699] font-medium mb-4">@{user.username}</p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            {(user.state || user.country) && (
                                <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 shadow-sm">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {user.state}{user.state && user.country ? ', ' : ''}{user.country}
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 shadow-sm">
                                <Phone className="w-4 h-4 text-gray-400" />
                                {user.phone || "Contact hidden"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bio Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#007699]" />
                        About Me
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                        {user.bio || "This user hasn't added a bio yet. They are busy taking care of their pets!"}
                    </p>
                </div>

                {/* Registered Pets Grid with Detailed Badges */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <PawPrint className="w-6 h-6 text-[#FF6600]" />
                    Registered Pets ({pets.length})
                </h3>

                {pets.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500 shadow-sm mb-8">
                        This user hasn't registered any pets yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                        {pets.map(pet => (
                            <div key={pet.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                                <div className="aspect-square bg-gray-50 relative flex items-center justify-center border-b border-gray-100">
                                    {pet.image_url ? (
                                        <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-[#007699] font-medium flex flex-col items-center">
                                            <PawPrint className="w-10 h-10 mb-2 opacity-50" />
                                            No Image
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 text-center">
                                    <h4 className="text-xl font-bold text-gray-900 truncate">{pet.name}</h4>
                                    {pet.breed && <p className="text-sm text-gray-500 truncate mt-1">{pet.breed}</p>}

                                    {/* Detailed Pet Badges */}
                                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                                        {pet.gender && (
                                            <span className="text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200 text-gray-600 font-medium">
                                                {pet.gender}
                                            </span>
                                        )}
                                        {pet.dob && (
                                            <span className="text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200 text-gray-600 font-medium">
                                                DOB: {pet.dob}
                                            </span>
                                        )}
                                    </div>

                                    {/* Location Tag */}
                                    {(pet.state || pet.country) && (
                                        <div className="mt-3 text-xs text-gray-500 flex items-center justify-center gap-1 bg-gray-50 py-1.5 rounded-full border border-gray-100">
                                            <MapPin className="w-3 h-3 text-gray-400" />
                                            {pet.state}{pet.state && pet.country ? ', ' : ''}{pet.country}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Future Posts Section Placeholder */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 mt-8">Recent Posts</h3>
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500 shadow-sm">
                    <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="font-medium text-gray-600">No posts yet</p>
                    <p className="text-sm mt-1">When this user shares updates about their pets, they will appear here.</p>
                </div>

            </div>
        </div>
    );
}