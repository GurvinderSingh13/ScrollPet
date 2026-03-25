import { useState, useEffect, useRef } from "react";
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
  Radio,
} from "lucide-react";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { toast } from "@/hooks/use-toast";
import { PET_BREEDS } from "@/data/petBreeds";
import { Country, State } from "country-state-city";

const canBanTarget = (myRole: string, targetRole: string) => {
  if (myRole === "admin") return targetRole !== "admin";
  if (myRole === "staff") return !["admin", "staff"].includes(targetRole);
  if (myRole === "super_moderator")
    return !["admin", "staff", "super_moderator"].includes(targetRole);
  if (myRole === "moderator") return targetRole === "user";
  return false;
};

const getAvailableDurations = (role: string) => {
  const base = [
    { label: "6 Hours", value: "6h" },
    { label: "12 Hours", value: "12h" },
    { label: "24 Hours", value: "24h" },
  ];
  if (role === "moderator") return base;
  const superMod = [
    ...base,
    { label: "3 Days", value: "3d" },
    { label: "7 Days", value: "7d" },
  ];
  if (role === "super_moderator") return superMod;
  return [
    ...superMod,
    { label: "30 Days", value: "30d" },
    { label: "1 Year", value: "1y" },
    { label: "Permanent", value: "permanent" },
  ];
};

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Tab State
  const [activeTab, setActiveTab] = useState<"reports" | "announcements" | "broadcast">(
    "reports",
  );

  // Broadcast Hub State
  const PET_CATEGORIES = ["Dog", "Cat", "Fish", "Bird", "Rabbit", "Hamster", "Turtle", "Guinea Pig", "Horse", "Other"];
  const allCountries = Country.getAllCountries();
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastMediaFile, setBroadcastMediaFile] = useState<File | null>(null);
  const [broadcastMediaPreview, setBroadcastMediaPreview] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const broadcastFileRef = useRef<HTMLInputElement>(null);
  // Pets: category → set of selected breed IDs (empty = whole category)
  const [selectedPetCategories, setSelectedPetCategories] = useState<string[]>([]);
  const [selectedBreeds, setSelectedBreeds] = useState<Record<string, string[]>>({});
  const [expandedPets, setExpandedPets] = useState<string[]>([]);
  // Locations: country iso codes + per-country state selections
  const [includeGlobal, setIncludeGlobal] = useState(false);
  const [selectedCountryCodes, setSelectedCountryCodes] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<Record<string, string[]>>({});
  const [expandedCountries, setExpandedCountries] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState("");

  // Report States
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [banDuration, setBanDuration] = useState<string>("24h");
  const [isProcessing, setIsProcessing] = useState(false);

  // Role Management States
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("user");
  const [cooldownHours, setCooldownHours] = useState(24);
  const [isSearching, setIsSearching] = useState(false);

  const { data: dbUser, isLoading: userLoading } = useQuery({
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

  useEffect(() => {
    if (!authLoading && !userLoading) {
      if (!user || (dbUser && !isModOrAbove)) {
        toast({ description: "Access Denied.", variant: "destructive" });
        setLocation("/");
      }
    }
  }, [user, dbUser, authLoading, userLoading, setLocation, isModOrAbove]);

  // Fetch Reports
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data: rawReports, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!rawReports || rawReports.length === 0) return [];

      const userIds = [
        ...new Set(
          rawReports
            .flatMap((r) => [r.reporter_id, r.reported_user_id])
            .filter(Boolean),
        ),
      ];
      const { data: usersData } = await supabase
        .from("users")
        .select("id, username, display_name, role")
        .in("id", userIds);

      const msgIds = [
        ...new Set(rawReports.map((r) => r.message_id).filter(Boolean)),
      ];
      let messagesData: any[] = [];
      if (msgIds.length > 0) {
        const { data: mData } = await supabase
          .from("messages")
          .select("id, content, location, pet_type")
          .in("id", msgIds);
        messagesData = mData || [];
      }

      return rawReports.map((report) => {
        const reporterUser = usersData?.find(
          (u) => u.id === report.reporter_id,
        );
        const reportedUser = usersData?.find(
          (u) => u.id === report.reported_user_id,
        );
        const msg = messagesData?.find((m) => m.id === report.message_id);

        return {
          id: report.id,
          reason: report.reason,
          created_at: report.created_at,
          reporter: reporterUser || { display_name: "Unknown User" },
          reported: reportedUser || {
            id: report.reported_user_id,
            display_name: "Unknown User",
            role: "user",
          },
          message: msg || {
            content: "Media file or deleted message",
            location: "Unknown",
            pet_type: "dog",
          },
        };
      });
    },
    enabled: isModOrAbove,
  });

  // NEW: Fetch Pending Announcements
  const { data: pendingPosts, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-pending-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*, users:users!author_id(display_name, username)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isModOrAbove,
  });

  // Action Handlers
  const handleApprovePost = async (id: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ status: "approved" })
        .eq("id", id);
      if (error) throw error;
      toast({ description: "Post approved and published to the News Room!" });
      queryClient.invalidateQueries({
        queryKey: ["admin-pending-announcements"],
      });
    } catch (err: any) {
      toast({ description: "Failed to approve post.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPost = async (id: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ description: "Post rejected and deleted." });
      queryClient.invalidateQueries({
        queryKey: ["admin-pending-announcements"],
      });
    } catch (err: any) {
      toast({ description: "Failed to reject post.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearchUser = async () => {
    if (!searchUsername.trim()) return;
    setIsSearching(true);
    setSearchedUser(null);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, display_name, role")
        .ilike("username", searchUsername.trim())
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setSearchedUser(data);
        setNewRole(data.role || "user");
      } else
        toast({
          description: "No user found with that username.",
          variant: "destructive",
        });
    } catch (err: any) {
      toast({ description: "Search failed.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!searchedUser) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole, news_cooldown_hours: cooldownHours })
        .eq("id", searchedUser.id);
      if (error) throw error;
      toast({
        description: `Successfully updated @${searchedUser.username} to ${newRole.replace("_", " ")} with a ${cooldownHours}h news cooldown!`,
      });
      setIsRoleModalOpen(false);
      setSearchUsername("");
      setSearchedUser(null);
      setCooldownHours(24);
    } catch (err: any) {
      toast({ description: "Failed to update role.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenAction = (report: any) => {
    if (!canBanTarget(dbUser.role, report.reported.role || "user")) {
      toast({
        description: `Your rank (${dbUser.role}) cannot take action against a ${report.reported.role || "user"}.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedReport(report);
    setIsActionModalOpen(true);
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportId);
      if (error) throw error;
      toast({ description: "Report dismissed and removed from queue." });
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    } catch (err: any) {
      toast({
        description: "Failed to dismiss report.",
        variant: "destructive",
      });
    }
  };

  const handleIssueBan = async () => {
    if (!selectedReport || !user) return;
    setIsProcessing(true);
    try {
      let expiresAt = null;
      if (banDuration !== "permanent") {
        const now = new Date();
        if (banDuration === "6h") now.setHours(now.getHours() + 6);
        else if (banDuration === "12h") now.setHours(now.getHours() + 12);
        else if (banDuration === "24h") now.setHours(now.getHours() + 24);
        else if (banDuration === "3d") now.setDate(now.getDate() + 3);
        else if (banDuration === "7d") now.setDate(now.getDate() + 7);
        else if (banDuration === "30d") now.setDate(now.getDate() + 30);
        else if (banDuration === "1y") now.setFullYear(now.getFullYear() + 1);
        expiresAt = now.toISOString();
      }
      const { error: banError } = await supabase
        .from("bans")
        .insert({
          user_id: selectedReport.reported.id,
          banned_by: user.id,
          reason: `Violated terms: ${selectedReport.reason}`,
          expires_at: expiresAt,
        });
      if (banError) throw banError;
      const { error: deleteError } = await supabase
        .from("reports")
        .delete()
        .eq("id", selectedReport.id);
      if (deleteError) throw deleteError;
      toast({ description: `Ban issued successfully for ${banDuration}.` });
      setIsActionModalOpen(false);
      setSelectedReport(null);
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    } catch (err: any) {
      toast({
        description: err.message || "Failed to issue ban.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBroadcastMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBroadcastMediaFile(file);
    setBroadcastMediaPreview(URL.createObjectURL(file));
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) {
      toast({ description: "Please enter announcement text.", variant: "destructive" });
      return;
    }
    if (selectedPetCategories.length === 0) {
      toast({ description: "Please select at least one pet category.", variant: "destructive" });
      return;
    }
    if (!includeGlobal && selectedCountryCodes.length === 0) {
      toast({ description: "Please select at least one target location.", variant: "destructive" });
      return;
    }
    setIsBroadcasting(true);
    try {
      let mediaUrl: string | null = null;
      if (broadcastMediaFile) {
        const ext = broadcastMediaFile.name.split(".").pop();
        const fileName = `broadcast_${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("chat-uploads")
          .upload(fileName, broadcastMediaFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("chat-uploads").getPublicUrl(uploadData.path);
        mediaUrl = urlData.publicUrl;
      }

      // Build flat location targets
      const locationTargets: string[] = [];
      if (includeGlobal) locationTargets.push("global");
      for (const isoCode of selectedCountryCodes) {
        const statesChosen = selectedStates[isoCode] || [];
        if (statesChosen.length === 0) {
          const country = Country.getCountryByCode(isoCode);
          if (country) locationTargets.push(country.name);
        } else {
          locationTargets.push(...statesChosen);
        }
      }

      // Build flat pet targets { petType, breed }
      const petTargets: Array<{ petType: string; breed: string | null }> = [];
      for (const category of selectedPetCategories) {
        const petKey = category.toLowerCase().replace(/ /g, "-");
        const breedsChosen = selectedBreeds[category] || [];
        const availableBreeds = PET_BREEDS[petKey] || [];
        if (breedsChosen.length === 0 || breedsChosen.length === availableBreeds.length) {
          petTargets.push({ petType: category.toLowerCase(), breed: null });
        } else {
          for (const breedId of breedsChosen) {
            petTargets.push({ petType: category.toLowerCase(), breed: breedId });
          }
        }
      }

      // Cross-product insert
      const rows: any[] = [];
      for (const loc of locationTargets) {
        for (const { petType, breed } of petTargets) {
          rows.push({
            content: broadcastText.trim(),
            target_location: loc,
            target_pet: petType,
            target_breed: breed,
            status: "approved",
            author_id: user!.id,
            media_url: mediaUrl,
          });
        }
      }

      const { error } = await supabase.from("announcements").insert(rows);
      if (error) throw error;

      toast({ description: `Broadcast sent! Created ${rows.length} announcement${rows.length !== 1 ? "s" : ""} across ${locationTargets.length} location${locationTargets.length !== 1 ? "s" : ""}.` });
      setBroadcastText("");
      setSelectedPetCategories([]);
      setSelectedBreeds({});
      setExpandedPets([]);
      setIncludeGlobal(false);
      setSelectedCountryCodes([]);
      setSelectedStates({});
      setExpandedCountries([]);
      setCountrySearch("");
      setBroadcastMediaFile(null);
      setBroadcastMediaPreview(null);
      if (broadcastFileRef.current) broadcastFileRef.current.value = "";
    } catch (err: any) {
      toast({ description: err.message || "Broadcast failed.", variant: "destructive" });
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (authLoading || userLoading || !isModOrAbove) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#007699]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] font-sans">
      <header className="bg-[#00789c] text-white shadow-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/user-profile"
              className="cursor-pointer hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Shield className="w-6 h-6 text-orange-400" />
            <h1 className="text-xl font-bold tracking-wide">
              Moderation Dashboard
            </h1>
            <span className="bg-orange-500/20 text-orange-200 border border-orange-500/50 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ml-2">
              {dbUser.role.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {dbUser.role === "admin" && (
              <Button
                onClick={() => setIsRoleModalOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 border text-sm h-9 cursor-pointer"
              >
                <Users className="w-4 h-4 mr-2" /> Manage Team Roles
              </Button>
            )}
            <img
              src={logoImage}
              alt="Logo"
              className="h-8 brightness-0 invert opacity-80"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-white border-b border-gray-100 pb-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="text-2xl text-gray-800 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-[#00789c]" /> Control Center
                </CardTitle>
                <CardDescription className="mt-1 text-gray-500">
                  Manage user reports and community announcements.
                </CardDescription>
              </div>
            </div>

            {/* The Tabs */}
            <div className="flex gap-6 border-b border-gray-200">
              <button
                className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors cursor-pointer ${activeTab === "reports" ? "border-[#00789c] text-[#00789c]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                onClick={() => setActiveTab("reports")}
              >
                User Reports{" "}
                <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {reports?.length || 0}
                </span>
              </button>
              <button
                className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors cursor-pointer ${activeTab === "announcements" ? "border-[#00789c] text-[#00789c]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                onClick={() => setActiveTab("announcements")}
              >
                Pending Announcements{" "}
                <span className="ml-1 bg-amber-100 text-amber-700 py-0.5 px-2 rounded-full text-xs">
                  {pendingPosts?.length || 0}
                </span>
              </button>
              <button
                className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${activeTab === "broadcast" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                onClick={() => setActiveTab("broadcast")}
              >
                <Radio className="w-3.5 h-3.5" />
                Broadcast Hub
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* REPORTS TAB */}
            {activeTab === "reports" &&
              (reportsLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#007699]" />
                  <p>Loading reports...</p>
                </div>
              ) : !reports || reports.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                  <CheckCircle className="w-16 h-16 mb-4 text-emerald-400/50" />
                  <p className="text-lg font-medium text-gray-600">
                    The queue is empty!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/80 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Reported User</th>
                        <th className="px-6 py-4">Context / Location</th>
                        <th className="px-6 py-4">Violation Reason</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reports.map((report: any) => (
                        <tr
                          key={report.id}
                          className="hover:bg-gray-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">
                              @
                              {report.reported?.display_name ||
                                report.reported?.username}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">
                              Role: {report.reported?.role || "user"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-500 max-w-[250px] truncate italic mb-1">
                              "{report.message?.content}"
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="text-[10px] font-mono text-[#007699] bg-[#007699]/10 inline-block px-1.5 py-0.5 rounded">
                                {report.message?.location}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] text-[#007699] hover:text-[#005a75] border border-[#007699]/20 cursor-pointer"
                                onClick={() => {
                                  sessionStorage.setItem(
                                    "teleport_location",
                                    report.message.location,
                                  );
                                  if (report.message.pet_type)
                                    sessionStorage.setItem(
                                      "teleport_pet",
                                      report.message.pet_type,
                                    );
                                  setLocation("/chat-interface");
                                }}
                              >
                                Teleport to Chat ↗
                              </Button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                              {report.reason}
                            </span>
                            <div className="text-xs text-gray-400 mt-2">
                              Reported by @{report.reporter?.display_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-gray-500 hover:text-gray-700 cursor-pointer"
                              onClick={() => handleDismissReport(report.id)}
                            >
                              Dismiss
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white shadow-sm cursor-pointer"
                              onClick={() => handleOpenAction(report)}
                            >
                              Take Action
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {/* ANNOUNCEMENTS TAB */}
            {activeTab === "announcements" &&
              (pendingLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#007699]" />
                  <p>Loading pending announcements...</p>
                </div>
              ) : !pendingPosts || pendingPosts.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                  <CheckCircle className="w-16 h-16 mb-4 text-emerald-400/50" />
                  <p className="text-lg font-medium text-gray-600">
                    No pending posts!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/80 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                      <tr>
                        <th className="px-6 py-4">User Submitting</th>
                        <th className="px-6 py-4">Target Room</th>
                        <th className="px-6 py-4">Content Preview</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pendingPosts.map((post: any) => (
                        <tr
                          key={post.id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-bold text-gray-900">
                            @{post.users?.display_name || post.users?.username}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs bg-[#007699]/10 text-[#007699] px-2 py-0.5 rounded font-mono inline-block w-max">
                                {post.target_location}
                              </span>
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-mono inline-block w-max">
                                {post.target_pet}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {post.media_url && (
                              <div className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded mb-1 w-max">
                                🖼️ Contains Media
                              </div>
                            )}
                            <p className="text-gray-600 text-xs line-clamp-2 max-w-xs">
                              {post.content}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                              onClick={() => handleRejectPost(post.id)}
                              disabled={isProcessing}
                            >
                              <X className="w-4 h-4 mr-1" /> Reject
                            </Button>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                              onClick={() => handleApprovePost(post.id)}
                              disabled={isProcessing}
                            >
                              <Check className="w-4 h-4 mr-1" /> Approve
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            {/* BROADCAST HUB TAB */}
            {activeTab === "broadcast" && (
              <div className="p-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Super Broadcaster</h2>
                    <p className="text-sm text-gray-500">Send an instant announcement to any combination of rooms worldwide.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Announcement Text */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Announcement Message <span className="text-red-500">*</span></label>
                    <textarea
                      data-testid="input-broadcast-text"
                      rows={4}
                      placeholder="Write your announcement here..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 outline-none resize-none transition-colors"
                      value={broadcastText}
                      onChange={(e) => setBroadcastText(e.target.value)}
                    />
                  </div>

                  {/* Media Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Attach Media <span className="text-gray-400 font-normal">(optional — image or video)</span></label>
                    <div
                      className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center gap-3 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-colors"
                      onClick={() => broadcastFileRef.current?.click()}
                    >
                      {broadcastMediaPreview ? (
                        <div className="relative w-full">
                          {broadcastMediaFile?.type.startsWith("video/") ? (
                            <video src={broadcastMediaPreview} className="max-h-40 rounded-lg mx-auto object-cover" controls />
                          ) : (
                            <img src={broadcastMediaPreview} alt="Preview" className="max-h-40 rounded-lg mx-auto object-cover" />
                          )}
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-white border border-gray-200 rounded-full w-6 h-6 flex items-center justify-center shadow cursor-pointer hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBroadcastMediaFile(null);
                              setBroadcastMediaPreview(null);
                              if (broadcastFileRef.current) broadcastFileRef.current.value = "";
                            }}
                          >
                            <X className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-300" />
                          <p className="text-sm text-gray-400">Click to upload image or video</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={broadcastFileRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleBroadcastMediaChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* ── PET CATEGORIES with breeds ── */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-gray-700">Select Pet Categories <span className="text-red-500">*</span></label>
                        <button
                          type="button"
                          data-testid="button-select-all-pets"
                          className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                          onClick={() => {
                            if (selectedPetCategories.length === PET_CATEGORIES.length) {
                              setSelectedPetCategories([]);
                              setSelectedBreeds({});
                              setExpandedPets([]);
                            } else {
                              setSelectedPetCategories([...PET_CATEGORIES]);
                            }
                          }}
                        >
                          {selectedPetCategories.length === PET_CATEGORIES.length ? "Deselect All" : "Select All Pets"}
                        </button>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1 max-h-[420px] overflow-y-auto">
                        {PET_CATEGORIES.map((pet) => {
                          const petKey = pet.toLowerCase().replace(/ /g, "-");
                          const breeds = PET_BREEDS[petKey] || [];
                          const isSelected = selectedPetCategories.includes(pet);
                          const isExpanded = expandedPets.includes(pet);
                          const breedsChosen = selectedBreeds[pet] || [];
                          return (
                            <div key={pet}>
                              <div className="flex items-center gap-2 py-1">
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${isSelected ? "bg-orange-500 border-orange-500" : "border-gray-300 hover:border-orange-400"}`}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedPetCategories((p) => p.filter((c) => c !== pet));
                                      setSelectedBreeds((b) => { const n = { ...b }; delete n[pet]; return n; });
                                      setExpandedPets((e) => e.filter((x) => x !== pet));
                                    } else {
                                      setSelectedPetCategories((p) => [...p, pet]);
                                      setExpandedPets((e) => e.includes(pet) ? e : [...e, pet]);
                                    }
                                  }}
                                  data-testid={`checkbox-pet-${petKey}`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <span
                                  className="text-sm text-gray-700 select-none font-medium flex-1 cursor-pointer"
                                  onClick={() => {
                                    if (isSelected) setExpandedPets((e) => e.includes(pet) ? e.filter((x) => x !== pet) : [...e, pet]);
                                  }}
                                >
                                  {pet}
                                  {isSelected && breeds.length > 0 && (
                                    <span className="ml-2 text-[10px] text-orange-500 font-bold">
                                      {breedsChosen.length === 0 ? "All breeds" : `${breedsChosen.length}/${breeds.length} breeds`}
                                    </span>
                                  )}
                                </span>
                                {isSelected && breeds.length > 0 && (
                                  <button
                                    type="button"
                                    className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer px-1"
                                    onClick={() => setExpandedPets((e) => e.includes(pet) ? e.filter((x) => x !== pet) : [...e, pet])}
                                  >
                                    {isExpanded ? "▲" : "▼"}
                                  </button>
                                )}
                              </div>
                              {isSelected && isExpanded && breeds.length > 0 && (
                                <div className="ml-6 mt-1 mb-2 bg-white border border-gray-100 rounded-lg p-2 space-y-1">
                                  <button
                                    type="button"
                                    className="text-[10px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer mb-1"
                                    onClick={() => {
                                      setSelectedBreeds((b) => {
                                        const n = { ...b };
                                        if ((n[pet] || []).length === breeds.length) {
                                          delete n[pet];
                                        } else {
                                          n[pet] = breeds.map((br) => br.id);
                                        }
                                        return n;
                                      });
                                    }}
                                  >
                                    {(breedsChosen.length === breeds.length) ? "Deselect All Breeds" : "Select All Breeds"}
                                  </button>
                                  {breeds.map((breed) => (
                                    <div key={breed.id} className="flex items-center gap-2">
                                      <div
                                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${breedsChosen.includes(breed.id) ? "bg-orange-400 border-orange-400" : "border-gray-300 hover:border-orange-300"}`}
                                        onClick={() => {
                                          setSelectedBreeds((b) => {
                                            const curr = b[pet] || [];
                                            const updated = curr.includes(breed.id) ? curr.filter((id) => id !== breed.id) : [...curr, breed.id];
                                            return { ...b, [pet]: updated };
                                          });
                                        }}
                                      >
                                        {breedsChosen.includes(breed.id) && <Check className="w-2 h-2 text-white" />}
                                      </div>
                                      <span className="text-xs text-gray-600 select-none">{breed.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── TARGET LOCATIONS with country-state-city ── */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-gray-700">Select Target Locations <span className="text-red-500">*</span></label>
                        <button
                          type="button"
                          data-testid="button-select-all-locations"
                          className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                          onClick={() => {
                            if (selectedCountryCodes.length === allCountries.length && includeGlobal) {
                              setSelectedCountryCodes([]);
                              setSelectedStates({});
                              setExpandedCountries([]);
                              setIncludeGlobal(false);
                            } else {
                              setIncludeGlobal(true);
                              setSelectedCountryCodes(allCountries.map((c) => c.isoCode));
                            }
                          }}
                        >
                          {selectedCountryCodes.length === allCountries.length && includeGlobal ? "Deselect All" : "Select All Countries"}
                        </button>
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search countries..."
                          className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-400/20 outline-none"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                        />
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1 max-h-[420px] overflow-y-auto">
                        {/* Global option */}
                        {(!countrySearch || "global".includes(countrySearch.toLowerCase())) && (
                          <div
                            className="flex items-center gap-2 py-1 cursor-pointer"
                            onClick={() => setIncludeGlobal((g) => !g)}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${includeGlobal ? "bg-orange-500 border-orange-500" : "border-gray-300 hover:border-orange-400"}`}>
                              {includeGlobal && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className="text-sm font-semibold text-orange-700 select-none">🌍 Global</span>
                          </div>
                        )}

                        {/* Countries */}
                        {allCountries
                          .filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
                          .map((country) => {
                            const states = State.getStatesOfCountry(country.isoCode);
                            const isSelected = selectedCountryCodes.includes(country.isoCode);
                            const isExpanded = expandedCountries.includes(country.isoCode);
                            const statesChosen = selectedStates[country.isoCode] || [];
                            return (
                              <div key={country.isoCode}>
                                <div className="flex items-center gap-2 py-0.5">
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${isSelected ? "bg-orange-500 border-orange-500" : "border-gray-300 hover:border-orange-400"}`}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedCountryCodes((c) => c.filter((x) => x !== country.isoCode));
                                        setSelectedStates((s) => { const n = { ...s }; delete n[country.isoCode]; return n; });
                                        setExpandedCountries((e) => e.filter((x) => x !== country.isoCode));
                                      } else {
                                        setSelectedCountryCodes((c) => [...c, country.isoCode]);
                                        if (states.length > 0) setExpandedCountries((e) => e.includes(country.isoCode) ? e : [...e, country.isoCode]);
                                      }
                                    }}
                                    data-testid={`checkbox-country-${country.isoCode}`}
                                  >
                                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  <span className="text-sm text-gray-700 select-none flex-1">
                                    {country.flag} {country.name}
                                    {isSelected && states.length > 0 && (
                                      <span className="ml-2 text-[10px] text-orange-500 font-bold">
                                        {statesChosen.length === 0 ? "Whole country" : `${statesChosen.length} state${statesChosen.length !== 1 ? "s" : ""}`}
                                      </span>
                                    )}
                                  </span>
                                  {isSelected && states.length > 0 && (
                                    <button
                                      type="button"
                                      className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer px-1"
                                      onClick={() => setExpandedCountries((e) => e.includes(country.isoCode) ? e.filter((x) => x !== country.isoCode) : [...e, country.isoCode])}
                                    >
                                      {isExpanded ? "▲" : "▼"}
                                    </button>
                                  )}
                                </div>
                                {isSelected && isExpanded && states.length > 0 && (
                                  <div className="ml-6 mt-1 mb-2 bg-white border border-gray-100 rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto">
                                    <button
                                      type="button"
                                      className="text-[10px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer mb-1"
                                      onClick={() => {
                                        setSelectedStates((s) => {
                                          const n = { ...s };
                                          if ((n[country.isoCode] || []).length === states.length) {
                                            delete n[country.isoCode];
                                          } else {
                                            n[country.isoCode] = states.map((st) => st.name);
                                          }
                                          return n;
                                        });
                                      }}
                                    >
                                      {(statesChosen.length === states.length) ? "Deselect All States" : "Select All States"}
                                    </button>
                                    {states.map((state) => (
                                      <div key={state.isoCode} className="flex items-center gap-2">
                                        <div
                                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${statesChosen.includes(state.name) ? "bg-orange-400 border-orange-400" : "border-gray-300 hover:border-orange-300"}`}
                                          onClick={() => {
                                            setSelectedStates((s) => {
                                              const curr = s[country.isoCode] || [];
                                              const updated = curr.includes(state.name) ? curr.filter((n) => n !== state.name) : [...curr, state.name];
                                              return { ...s, [country.isoCode]: updated };
                                            });
                                          }}
                                        >
                                          {statesChosen.includes(state.name) && <Check className="w-2 h-2 text-white" />}
                                        </div>
                                        <span className="text-xs text-gray-600 select-none">{state.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {(selectedPetCategories.length > 0 && (includeGlobal || selectedCountryCodes.length > 0)) && (() => {
                    const locationCount = (includeGlobal ? 1 : 0) + selectedCountryCodes.reduce((acc, iso) => {
                      const st = selectedStates[iso] || [];
                      return acc + (st.length === 0 ? 1 : st.length);
                    }, 0);
                    const petCount = selectedPetCategories.reduce((acc, cat) => {
                      const petKey = cat.toLowerCase().replace(/ /g, "-");
                      const breeds = PET_BREEDS[petKey] || [];
                      const chosen = selectedBreeds[cat] || [];
                      return acc + (chosen.length === 0 || chosen.length === breeds.length ? 1 : chosen.length);
                    }, 0);
                    return (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-800">
                        <span className="font-bold">Preview:</span> This will create{" "}
                        <span className="font-bold">{locationCount * petCount}</span> announcement{locationCount * petCount !== 1 ? "s" : ""} — targeting{" "}
                        <span className="font-bold">{locationCount}</span> location{locationCount !== 1 ? "s" : ""} × <span className="font-bold">{petCount}</span> pet target{petCount !== 1 ? "s" : ""}.
                      </div>
                    );
                  })()}

                  <Button
                    data-testid="button-broadcast"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-base h-12 cursor-pointer"
                    onClick={handleBroadcast}
                    disabled={isBroadcasting}
                  >
                    {isBroadcasting ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Broadcasting...</>
                    ) : (
                      <><Megaphone className="w-5 h-5 mr-2" /> Broadcast Now</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="w-5 h-5" /> Issue Server Ban
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-5 py-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                <p className="text-gray-500 mb-1">Target User:</p>
                <p className="font-bold text-gray-900">
                  @
                  {selectedReport.reported?.display_name ||
                    selectedReport.reported?.username}
                </p>
                <p className="text-gray-500 mt-3 mb-1">Violation:</p>
                <p className="font-medium text-red-700">
                  {selectedReport.reason}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#007699]" /> Select Ban
                  Duration
                </label>
                <Select value={banDuration} onValueChange={setBanDuration}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select duration..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableDurations(dbUser?.role || "user").map(
                      (dur) => (
                        <SelectItem key={dur.value} value={dur.value}>
                          {dur.label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">
                  Your rank ({dbUser?.role}) authorizes limits up to{" "}
                  {
                    getAvailableDurations(dbUser?.role || "user").slice(-1)[0]
                      .label
                  }
                  .
                </p>
              </div>
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                onClick={handleIssueBan}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isProcessing ? "Processing..." : "Enforce Ban"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#00789c]">
              <Users className="w-5 h-5" /> Manage Team Roles
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Search by Username
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. JohnDoe123"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00789c]/20 outline-none"
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
                  />
                </div>
              </div>
              <Button
                onClick={handleSearchUser}
                disabled={isSearching || !searchUsername}
                className="bg-[#00789c] hover:bg-[#005a75] text-white px-4 cursor-pointer"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>
            {searchedUser && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4">
                <div className="flex items-center gap-3 border-b border-blue-200/50 pb-3">
                  <div className="w-10 h-10 bg-white rounded-full border shadow-sm flex items-center justify-center font-bold text-[#00789c]">
                    {searchedUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      @{searchedUser.username}
                    </p>
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      Current: {searchedUser.role.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Assign New Role
                  </label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select role..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Normal User (Demote)</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="super_moderator">
                        Super Moderator
                      </SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#00789c]" /> Cooldown Hours
                    <span className="text-xs text-gray-400 font-normal">(news posting cooldown)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={8760}
                    data-testid="input-cooldown-hours"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00789c]/20 outline-none"
                    value={cooldownHours}
                    onChange={(e) => setCooldownHours(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
                <Button
                  className="w-full bg-[#00789c] hover:bg-[#005a75] text-white font-bold cursor-pointer"
                  onClick={handleUpdateRole}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isProcessing ? "Updating..." : "Update Role"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
