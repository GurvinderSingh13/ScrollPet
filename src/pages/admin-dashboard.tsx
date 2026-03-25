import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Clock,
  Ban,
  Users,
  Search,
  Megaphone,
  Check,
  X,
  Upload,
  BarChart2,
} from "lucide-react";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { toast } from "@/hooks/use-toast";
import { Country, State } from "country-state-city";
import { getBreeds } from "@/data/petBreeds";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PET_CATEGORIES = [
  "dog",
  "cat",
  "fish",
  "bird",
  "rabbit",
  "hamster",
  "turtle",
  "guinea-pig",
  "horse",
  "other",
];

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<
    "reports" | "announcements" | "broadcast" | "analytics"
  >("reports");

  // Role Management States
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("user");
  const [cooldownHours, setCooldownHours] = useState("24");
  const [isProcessing, setIsProcessing] = useState(false);

  // Broadcast States
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastMedia, setBroadcastMedia] = useState<File | null>(null);
  // multi-country
  const [includeGlobal, setIncludeGlobal] = useState(false);
  const [targetCountries, setTargetCountries] = useState<string[]>([]); // ISO codes
  const [targetStates, setTargetStates] = useState<Record<string, string[]>>({}); // isoCode -> state names
  const [countrySearch, setCountrySearch] = useState("");
  // pets + breeds
  const [targetPets, setTargetPets] = useState<string[]>([]);
  const [targetBreeds, setTargetBreeds] = useState<Record<string, string[]>>({}); // pet -> breed IDs
  const allCountries = Country.getAllCountries();

  const { data: dbUser } = useQuery({
    queryKey: ["db-user-admin", user?.id],
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

  const { data: reports } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select(
          "*, reporter:users!reporter_id(display_name), reported:users!reported_user_id(display_name, role)",
        )
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isModOrAbove,
  });

  const { data: pendingPosts } = useQuery({
    queryKey: ["admin-pending-announcements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*, users:users!author_id(display_name, username)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isModOrAbove,
  });

  // Analytics Queries
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [messagesRes, usersRes, reportsCountRes, approvedCountRes] =
        await Promise.all([
          supabase.from("messages").select("pet_type"),
          supabase
            .from("users")
            .select("created_at")
            .gte("created_at", sevenDaysAgo.toISOString()),
          supabase
            .from("reports")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("announcements")
            .select("id", { count: "exact", head: true })
            .eq("status", "approved"),
        ]);

      // Bar chart: messages per pet category
      const petCounts: Record<string, number> = {};
      for (const msg of messagesRes.data || []) {
        const key = msg.pet_type || "other";
        petCounts[key] = (petCounts[key] || 0) + 1;
      }
      const petChartData = Object.entries(petCounts)
        .map(([name, count]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1).replace("-", " "),
          count,
        }))
        .sort((a, b) => b.count - a.count);

      // Line chart: signups per day over last 7 days
      const dayLabels: string[] = [];
      const signupMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        dayLabels.push(label);
        signupMap[label] = 0;
      }
      for (const u of usersRes.data || []) {
        const d = new Date(u.created_at);
        const label = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (label in signupMap) signupMap[label]++;
      }
      const signupChartData = dayLabels.map((label) => ({
        date: label,
        signups: signupMap[label],
      }));

      // Pie chart: reports vs approved announcements
      const pieData = [
        { name: "Reports Filed", value: reportsCountRes.count || 0 },
        {
          name: "Approved Announcements",
          value: approvedCountRes.count || 0,
        },
      ];

      return { petChartData, signupChartData, pieData };
    },
    enabled: isModOrAbove,
  });

  const handleSearchUser = async () => {
    if (!searchUsername.trim()) return;
    setIsProcessing(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, username, display_name, role, news_cooldown_hours")
      .ilike("username", searchUsername.trim())
      .maybeSingle();
    setIsProcessing(false);
    if (data) {
      setSearchedUser(data);
      setNewRole(data.role || "user");
      setCooldownHours((data.news_cooldown_hours || 24).toString());
    } else {
      toast({ description: "User not found.", variant: "destructive" });
    }
  };

  const handleUpdateRole = async () => {
    if (!searchedUser) return;
    setIsProcessing(true);
    const { error } = await supabase
      .from("users")
      .update({
        role: newRole,
        news_cooldown_hours: parseInt(cooldownHours),
      })
      .eq("id", searchedUser.id);
    setIsProcessing(false);
    if (!error) {
      toast({ description: "User updated successfully!" });
      setIsRoleModalOpen(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim() && !broadcastMedia)
      return toast({ description: "Add content to broadcast.", variant: "destructive" });
    if (targetPets.length === 0)
      return toast({ description: "Select at least one pet category.", variant: "destructive" });
    if (!includeGlobal && targetCountries.length === 0)
      return toast({ description: "Select at least one location target.", variant: "destructive" });

    setIsProcessing(true);
    try {
      let mediaUrl: string | null = null;
      if (broadcastMedia) {
        const filePath = `chat-media/${Date.now()}-${broadcastMedia.name}`;
        const { data: up } = await supabase.storage.from("chat-uploads").upload(filePath, broadcastMedia);
        if (up) {
          const { data: urlData } = supabase.storage.from("chat-uploads").getPublicUrl(filePath);
          mediaUrl = urlData.publicUrl;
        }
      }

      // Build flat location list
      const locations: string[] = [];
      if (includeGlobal) locations.push("global");
      for (const iso of targetCountries) {
        const states = targetStates[iso] || [];
        if (states.length === 0) {
          const country = Country.getCountryByCode(iso);
          if (country) locations.push(country.name);
        } else {
          locations.push(...states);
        }
      }

      // Build flat pet+breed list: [{ pet, breed }]
      const petTargets: Array<{ pet: string; breed: string | null }> = [];
      for (const pet of targetPets) {
        const breeds = targetBreeds[pet] || [];
        if (breeds.length === 0) {
          petTargets.push({ pet, breed: null });
        } else {
          for (const b of breeds) petTargets.push({ pet, breed: b });
        }
      }

      // Cross product
      const inserts: any[] = [];
      for (const loc of locations) {
        for (const { pet, breed } of petTargets) {
          inserts.push({
            author_id: user?.id,
            content: broadcastText,
            media_url: mediaUrl,
            target_location: loc,
            target_pet: pet,
            target_breed: breed,
            status: "approved",
          });
        }
      }

      const { error } = await supabase.from("announcements").insert(inserts);
      if (error) throw error;
      toast({ description: `✓ Broadcast sent to ${inserts.length} room${inserts.length !== 1 ? "s" : ""}!` });
      setBroadcastText("");
      setBroadcastMedia(null);
      setTargetPets([]);
      setTargetBreeds({});
      setTargetCountries([]);
      setTargetStates({});
      setIncludeGlobal(false);
    } catch (err: any) {
      toast({ description: err.message || "Broadcast failed.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isModOrAbove)
    return <div className="p-10 text-center">Access Denied</div>;

  return (
    <div className="min-h-screen bg-[#F5F7F9] font-sans">
      <header className="bg-[#00789c] text-white shadow-md h-16 flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/chat">
            <ArrowLeft className="w-5 h-5 cursor-pointer" />
          </Link>
          <Shield className="w-6 h-6 text-orange-400" />
          <h1 className="text-xl font-bold">Control Center</h1>
        </div>
        {dbUser.role === "admin" && (
          <Button
            onClick={() => setIsRoleModalOpen(true)}
            className="bg-white/20 hover:bg-white/30 cursor-pointer"
          >
            <Users className="w-4 h-4 mr-2" /> Manage Team & Cooldowns
          </Button>
        )}
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-white border-b pb-0">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab("reports")}
                className={`pb-3 font-bold border-b-2 ${activeTab === "reports" ? "border-[#00789c] text-[#00789c]" : "border-transparent text-gray-500"}`}
              >
                User Reports ({reports?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("announcements")}
                className={`pb-3 font-bold border-b-2 ${activeTab === "announcements" ? "border-[#00789c] text-[#00789c]" : "border-transparent text-gray-500"}`}
              >
                Pending Posts ({pendingPosts?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("broadcast")}
                className={`pb-3 font-bold border-b-2 flex items-center gap-2 ${activeTab === "broadcast" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500"}`}
              >
                <Megaphone className="w-4 h-4" /> Broadcast Hub
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`pb-3 font-bold border-b-2 flex items-center gap-2 ${activeTab === "analytics" ? "border-violet-600 text-violet-600" : "border-transparent text-gray-500"}`}
              >
                <BarChart2 className="w-4 h-4" /> Platform Analytics
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {activeTab === "reports" && (
              <div>
                Reports table here... (Use your existing dismiss/action logic)
              </div>
            )}
            {activeTab === "announcements" && (
              <div>
                Pending posts table here... (Use your existing approve/reject
                logic)
              </div>
            )}

            {activeTab === "broadcast" && (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <Megaphone className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Super Broadcaster</p>
                    <p className="text-xs text-gray-400">Target any combination of countries, states, pet categories, and breeds.</p>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Announcement Message <span className="text-red-500">*</span></label>
                  <textarea
                    className="w-full border border-gray-200 rounded-xl p-3 min-h-[90px] text-sm outline-none focus:ring-2 focus:ring-orange-400/30 bg-gray-50 resize-none"
                    placeholder="Type your announcement here…"
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                  />
                </div>

                {/* 4-column targeting grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                  {/* ── Col 1: Countries ── */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Countries</span>
                      <button
                        type="button"
                        className="text-[10px] font-semibold text-orange-500 hover:text-orange-700 cursor-pointer"
                        onClick={() => {
                          if (targetCountries.length === allCountries.length && includeGlobal) {
                            setTargetCountries([]);
                            setTargetStates({});
                            setIncludeGlobal(false);
                          } else {
                            setIncludeGlobal(true);
                            setTargetCountries(allCountries.map((c) => c.isoCode));
                          }
                        }}
                      >
                        {targetCountries.length === allCountries.length && includeGlobal ? "Clear All" : "Select All"}
                      </button>
                    </div>
                    {/* Search */}
                    <div className="relative">
                      <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search…"
                        className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-orange-300"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                      />
                    </div>
                    <div className="border border-gray-200 rounded-xl bg-gray-50 overflow-y-auto max-h-60 p-2 space-y-0.5">
                      {/* Global */}
                      {(!countrySearch || "global".includes(countrySearch.toLowerCase())) && (
                        <label className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-orange-50 cursor-pointer">
                          <input
                            type="checkbox"
                            className="accent-orange-500"
                            checked={includeGlobal}
                            onChange={(e) => setIncludeGlobal(e.target.checked)}
                          />
                          <span className="text-xs font-semibold text-orange-700">🌍 Global</span>
                        </label>
                      )}
                      {allCountries
                        .filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
                        .map((c) => (
                          <label key={c.isoCode} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-orange-50 cursor-pointer">
                            <input
                              type="checkbox"
                              className="accent-orange-500"
                              checked={targetCountries.includes(c.isoCode)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTargetCountries((prev) => [...prev, c.isoCode]);
                                } else {
                                  setTargetCountries((prev) => prev.filter((x) => x !== c.isoCode));
                                  setTargetStates((prev) => { const n = { ...prev }; delete n[c.isoCode]; return n; });
                                }
                              }}
                            />
                            <span className="text-xs text-gray-700">{c.flag} {c.name}</span>
                          </label>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400 text-center">
                      {(includeGlobal ? 1 : 0) + targetCountries.length} selected
                    </p>
                  </div>

                  {/* ── Col 2: States ── */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">States / Regions</span>
                      <span className="text-[10px] text-gray-400">optional</span>
                    </div>
                    <div className="border border-gray-200 rounded-xl bg-gray-50 overflow-y-auto max-h-[292px] p-2 space-y-2">
                      {targetCountries.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-8">Select countries first</p>
                      ) : (
                        targetCountries.map((iso) => {
                          const country = Country.getCountryByCode(iso);
                          const states = State.getStatesOfCountry(iso);
                          if (states.length === 0) return null;
                          const chosen = targetStates[iso] || [];
                          return (
                            <div key={iso}>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] font-bold text-gray-500 uppercase">{country?.flag} {country?.name}</p>
                                <button
                                  type="button"
                                  className="text-[10px] text-orange-500 hover:text-orange-700 cursor-pointer"
                                  onClick={() => {
                                    setTargetStates((prev) => {
                                      const n = { ...prev };
                                      if (chosen.length === states.length) delete n[iso];
                                      else n[iso] = states.map((s) => s.name);
                                      return n;
                                    });
                                  }}
                                >
                                  {chosen.length === states.length ? "Clear" : "All"}
                                </button>
                              </div>
                              {states.map((s) => (
                                <label key={s.isoCode} className="flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-orange-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="accent-orange-500"
                                    checked={chosen.includes(s.name)}
                                    onChange={(e) => {
                                      setTargetStates((prev) => {
                                        const curr = prev[iso] || [];
                                        return {
                                          ...prev,
                                          [iso]: e.target.checked
                                            ? [...curr, s.name]
                                            : curr.filter((x) => x !== s.name),
                                        };
                                      });
                                    }}
                                  />
                                  <span className="text-xs text-gray-700">{s.name}</span>
                                </label>
                              ))}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* ── Col 3: Pet Categories ── */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Pet Categories</span>
                      <button
                        type="button"
                        className="text-[10px] font-semibold text-orange-500 hover:text-orange-700 cursor-pointer"
                        onClick={() => {
                          if (targetPets.length === PET_CATEGORIES.length) {
                            setTargetPets([]);
                            setTargetBreeds({});
                          } else {
                            setTargetPets([...PET_CATEGORIES]);
                          }
                        }}
                      >
                        {targetPets.length === PET_CATEGORIES.length ? "Clear All" : "Select All"}
                      </button>
                    </div>
                    <div className="border border-gray-200 rounded-xl bg-gray-50 overflow-y-auto max-h-[292px] p-2 space-y-0.5">
                      {PET_CATEGORIES.map((pet) => {
                        const label = pet.charAt(0).toUpperCase() + pet.slice(1).replace("-", " ");
                        return (
                          <label key={pet} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-orange-50 cursor-pointer">
                            <input
                              type="checkbox"
                              className="accent-orange-500"
                              checked={targetPets.includes(pet)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTargetPets((prev) => [...prev, pet]);
                                } else {
                                  setTargetPets((prev) => prev.filter((p) => p !== pet));
                                  setTargetBreeds((prev) => { const n = { ...prev }; delete n[pet]; return n; });
                                }
                              }}
                            />
                            <span className="text-sm text-gray-700">{label}</span>
                            {targetPets.includes(pet) && (targetBreeds[pet]?.length ?? 0) > 0 && (
                              <span className="ml-auto text-[10px] bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded-full">
                                {targetBreeds[pet].length}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-gray-400 text-center">{targetPets.length} selected</p>
                  </div>

                  {/* ── Col 4: Breeds ── */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Breeds</span>
                      <span className="text-[10px] text-gray-400">optional</span>
                    </div>
                    <div className="border border-gray-200 rounded-xl bg-gray-50 overflow-y-auto max-h-[292px] p-2 space-y-2">
                      {targetPets.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-8">Select pet categories first</p>
                      ) : (
                        targetPets.map((pet) => {
                          const breeds = getBreeds(pet);
                          if (breeds.length === 0) return null;
                          const label = pet.charAt(0).toUpperCase() + pet.slice(1).replace("-", " ");
                          const chosen = targetBreeds[pet] || [];
                          return (
                            <div key={pet}>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] font-bold text-gray-500 uppercase">{label}</p>
                                <button
                                  type="button"
                                  className="text-[10px] text-orange-500 hover:text-orange-700 cursor-pointer"
                                  onClick={() => {
                                    setTargetBreeds((prev) => {
                                      const n = { ...prev };
                                      if (chosen.length === breeds.length) delete n[pet];
                                      else n[pet] = breeds.map((b) => b.id);
                                      return n;
                                    });
                                  }}
                                >
                                  {chosen.length === breeds.length ? "Clear" : "All"}
                                </button>
                              </div>
                              {breeds.map((b) => (
                                <label key={b.id} className="flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-orange-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="accent-orange-500"
                                    checked={chosen.includes(b.id)}
                                    onChange={(e) => {
                                      setTargetBreeds((prev) => {
                                        const curr = prev[pet] || [];
                                        return {
                                          ...prev,
                                          [pet]: e.target.checked
                                            ? [...curr, b.id]
                                            : curr.filter((x) => x !== b.id),
                                        };
                                      });
                                    }}
                                  />
                                  <span className="text-xs text-gray-700">{b.name}</span>
                                </label>
                              ))}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview + Broadcast button */}
                {(targetPets.length > 0 && (includeGlobal || targetCountries.length > 0)) && (() => {
                  const locCount = (includeGlobal ? 1 : 0) + targetCountries.reduce((acc, iso) => {
                    const st = targetStates[iso] || [];
                    return acc + (st.length === 0 ? 1 : st.length);
                  }, 0);
                  const petCount = targetPets.reduce((acc, pet) => {
                    const br = targetBreeds[pet] || [];
                    const all = getBreeds(pet);
                    return acc + (br.length === 0 || br.length === all.length ? 1 : br.length);
                  }, 0);
                  return (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-sm text-orange-800">
                      <span className="font-bold">Preview:</span> {locCount * petCount} announcement{locCount * petCount !== 1 ? "s" : ""} will be created
                      ({locCount} location{locCount !== 1 ? "s" : ""} × {petCount} pet target{petCount !== 1 ? "s" : ""})
                    </div>
                  );
                })()}

                <Button
                  className="w-full py-5 text-base bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer"
                  onClick={handleBroadcast}
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Broadcasting…</>
                    : <><Megaphone className="w-5 h-5 mr-2" /> Blast Announcement Now</>
                  }
                </Button>
              </div>
            )}
            {/* ANALYTICS TAB */}
            {activeTab === "analytics" && (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <BarChart2 className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Platform Analytics</h2>
                    <p className="text-sm text-gray-500">Live insights pulled directly from your Supabase tables.</p>
                  </div>
                </div>

                {analyticsLoading ? (
                  <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                    <p className="text-sm">Loading analytics…</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Stat summary cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Total Messages",
                          value: (analyticsData?.petChartData || []).reduce((s, d) => s + d.count, 0).toLocaleString(),
                          color: "bg-sky-50 border-sky-200 text-sky-700",
                          dot: "bg-sky-500",
                        },
                        {
                          label: "Signups (7 days)",
                          value: (analyticsData?.signupChartData || []).reduce((s, d) => s + d.signups, 0).toLocaleString(),
                          color: "bg-emerald-50 border-emerald-200 text-emerald-700",
                          dot: "bg-emerald-500",
                        },
                        {
                          label: "Open Reports",
                          value: (analyticsData?.pieData?.[0]?.value ?? 0).toLocaleString(),
                          color: "bg-red-50 border-red-200 text-red-700",
                          dot: "bg-red-500",
                        },
                        {
                          label: "Approved Posts",
                          value: (analyticsData?.pieData?.[1]?.value ?? 0).toLocaleString(),
                          color: "bg-violet-50 border-violet-200 text-violet-700",
                          dot: "bg-violet-500",
                        },
                      ].map((stat) => (
                        <div key={stat.label} className={`rounded-2xl border p-4 ${stat.color}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2.5 h-2.5 rounded-full ${stat.dot}`} />
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{stat.label}</p>
                          </div>
                          <p className="text-3xl font-black mt-1">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Bar Chart: Messages per pet category */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <div className="mb-5">
                        <h3 className="font-bold text-gray-800 text-base">Messages by Pet Category</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Total messages sent across all chat rooms, grouped by pet type.</p>
                      </div>
                      {(analyticsData?.petChartData?.length ?? 0) === 0 ? (
                        <div className="h-64 flex items-center justify-center text-gray-300 text-sm">No message data yet.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={analyticsData!.petChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <defs>
                              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#7c3aed" stopOpacity={1} />
                                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.8} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip
                              contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 13 }}
                              cursor={{ fill: "#f5f3ff" }}
                            />
                            <Bar dataKey="count" fill="url(#barGrad)" radius={[8, 8, 0, 0]} name="Messages" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {/* Line Chart: Signups over 7 days */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <div className="mb-5">
                        <h3 className="font-bold text-gray-800 text-base">New User Signups — Last 7 Days</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Daily registration trend over the past week.</p>
                      </div>
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={analyticsData?.signupChartData || []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <defs>
                            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 13 }}
                            cursor={{ stroke: "#10b981", strokeWidth: 1, strokeDasharray: "4 4" }}
                          />
                          <Line
                            type="monotone"
                            dataKey="signups"
                            stroke="url(#lineGrad)"
                            strokeWidth={3}
                            dot={{ fill: "#10b981", strokeWidth: 2, r: 5 }}
                            activeDot={{ r: 7, fill: "#059669" }}
                            name="New Users"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Pie Chart: Reports vs Approved Announcements */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <div className="mb-5">
                        <h3 className="font-bold text-gray-800 text-base">Reports vs Approved Announcements</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Proportion of open user reports against successfully approved posts.</p>
                      </div>
                      {(analyticsData?.pieData?.every((d) => d.value === 0)) ? (
                        <div className="h-64 flex items-center justify-center text-gray-300 text-sm">No data yet.</div>
                      ) : (
                        <div className="flex flex-col md:flex-row items-center gap-8">
                          <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                              <defs>
                                <linearGradient id="pieRed" x1="0" y1="0" x2="1" y2="1">
                                  <stop offset="0%" stopColor="#ef4444" />
                                  <stop offset="100%" stopColor="#f87171" />
                                </linearGradient>
                                <linearGradient id="pieViolet" x1="0" y1="0" x2="1" y2="1">
                                  <stop offset="0%" stopColor="#7c3aed" />
                                  <stop offset="100%" stopColor="#a78bfa" />
                                </linearGradient>
                              </defs>
                              <Pie
                                data={analyticsData?.pieData || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={72}
                                outerRadius={110}
                                paddingAngle={4}
                                dataKey="value"
                                nameKey="name"
                                strokeWidth={0}
                              >
                                <Cell fill="url(#pieRed)" />
                                <Cell fill="url(#pieViolet)" />
                              </Pie>
                              <Tooltip
                                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 13 }}
                              />
                              <Legend
                                iconType="circle"
                                iconSize={10}
                                formatter={(value) => <span style={{ fontSize: 13, color: "#374151" }}>{value}</span>}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-col gap-4 min-w-[160px]">
                            {(analyticsData?.pieData || []).map((entry, i) => (
                              <div key={entry.name} className={`rounded-xl p-4 text-center ${i === 0 ? "bg-red-50 border border-red-200" : "bg-violet-50 border border-violet-200"}`}>
                                <p className={`text-3xl font-black ${i === 0 ? "text-red-600" : "text-violet-600"}`}>{entry.value}</p>
                                <p className={`text-xs font-semibold mt-1 ${i === 0 ? "text-red-500" : "text-violet-500"}`}>{entry.name}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Team & Cooldowns</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Username"
              className="flex-1 border p-2 rounded"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
            />
            <Button onClick={handleSearchUser} disabled={isProcessing}>
              Search
            </Button>
          </div>
          {searchedUser && (
            <div className="space-y-4 mt-4 p-4 bg-gray-50 border rounded-lg">
              <p className="font-bold">@{searchedUser.username}</p>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500">
                  News Post Cooldown (Hours)
                </label>
                <input
                  type="number"
                  className="w-full border p-2 rounded mt-1 bg-white"
                  value={cooldownHours}
                  onChange={(e) => setCooldownHours(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Set to higher numbers for spammers, lower for good users.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleUpdateRole}
                disabled={isProcessing}
              >
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
