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
import { Input } from "@/components/ui/input";
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
  Mic,
  Image as ImageIcon,
  Play,
  Pause,
  Square,
  PawPrint,
  Tags,
  Trash2,
  Plus,
  Pencil,
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
    "reports" | "announcements" | "broadcast" | "analytics" | "manage-pets"
  >("reports");

  // ── Manage Pets States ──
  const [catFormName, setCatFormName] = useState("");
  const [catFormFile, setCatFormFile] = useState<File | null>(null);
  const [catFormPreview, setCatFormPreview] = useState<string | null>(null);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [isSavingCat, setIsSavingCat] = useState(false);
  const catFileRef = useRef<HTMLInputElement>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [breedFormName, setBreedFormName] = useState("");
  const [editingBreedId, setEditingBreedId] = useState<number | null>(null);
  const [isSavingBreed, setIsSavingBreed] = useState(false);

  // Role Management States
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("user");
  const [cooldownHours, setCooldownHours] = useState("24");
  const [isProcessing, setIsProcessing] = useState(false);

  // Broadcast States
  const [broadcastText, setBroadcastText] = useState("");
  // file media (image / video)
  const [broadcastFile, setBroadcastFile] = useState<{ file: File; url: string; type: "image" | "video" } | null>(null);
  // audio recording
  const [broadcastAudio, setBroadcastAudio] = useState<{ blob: Blob; url: string; duration: number } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // ── Manage Pets Queries ──
  const { data: dbCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: dbUser?.role === "admin",
  });

  const { data: dbBreeds = [], isLoading: breedsLoading } = useQuery({
    queryKey: ["admin-breeds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("breeds")
        .select("*, categories(name)")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: dbUser?.role === "admin",
  });

  // ── Category image file handler ──
  const handleCatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCatFormFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCatFormPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setCatFormPreview(null);
    }
  };

  const resetCatForm = () => {
    setCatFormName("");
    setCatFormFile(null);
    setCatFormPreview(null);
    setEditingCatId(null);
    if (catFileRef.current) catFileRef.current.value = "";
  };

  const resetBreedForm = () => {
    setBreedFormName("");
    setSelectedCategoryId("");
    setEditingBreedId(null);
  };

  const uploadCategoryImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "png";
    const filePath = `category-images/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("categories").upload(filePath, file);
    if (upErr) throw upErr;
    const { data } = supabase.storage.from("categories").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSaveCategory = async () => {
    const trimmed = catFormName.trim();
    if (!trimmed) return toast({ description: "Enter a category name.", variant: "destructive" });
    setIsSavingCat(true);
    try {
      let imageUrl: string | null = null;
      if (catFormFile) {
        imageUrl = await uploadCategoryImage(catFormFile);
        const ext = catFormFile.name.split(".").pop() || "png";
        const filePath = `category-images/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("categories").upload(filePath, catFormFile);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("categories").getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }

      if (editingCatId) {
        const updateData: any = { name: trimmed, image_url: imageUrl };
        const { error } = await supabase.from("categories").update(updateData).eq("id", editingCatId);
        if (error) throw error;
        toast({ description: `Category "${trimmed}" updated!` });
      } else {
        const insertData: any = { name: trimmed, image_url: imageUrl };
        const { error } = await supabase.from("categories").insert(insertData);
        if (error) throw error;
        toast({ description: `Category "${trimmed}" added!` });
      }
      resetCatForm();
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    } catch (err: any) {
      console.error(err);
      toast({ 
        description: err.message || "Failed to save category. Check your database permissions (RLS).", 
        variant: "destructive" 
      });
    } finally {
      setIsSavingCat(false);
    }
  };

  const startEditCategory = (cat: any) => {
    setEditingCatId(cat.id);
    setCatFormName(cat.name);
    setCatFormFile(null);
    setCatFormPreview(cat.image_url || null);
    if (catFileRef.current) catFileRef.current.value = "";
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"? All associated breeds will also be deleted.`)) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      toast({ description: `Category "${name}" deleted.` });
      if (editingCatId === id) resetCatForm();
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-breeds"] });
    } catch (err: any) {
      toast({ description: err.message || "Failed to delete.", variant: "destructive" });
    }
  };

  const handleSaveBreed = async () => {
    if (!selectedCategoryId) return toast({ description: "Select a category first (or create one).", variant: "destructive" });
    const trimmed = breedFormName.trim();
    if (!trimmed) return toast({ description: "Enter a breed name.", variant: "destructive" });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return toast({ description: "Unauthorized: Please log in as admin.", variant: "destructive" });

    setIsSavingBreed(true);
    try {
      if (editingBreedId) {
        const { error } = await supabase.from("breeds").update({
          name: trimmed,
          category_id: selectedCategoryId,
        }).eq("id", editingBreedId);
        if (error) throw error;
        toast({ description: `Breed "${trimmed}" updated!` });
      } else {
        const { error } = await supabase.from("breeds").insert({
          name: trimmed,
          category_id: selectedCategoryId,
        });
        if (error) throw error;
        toast({ description: `Breed "${trimmed}" added!` });
      }
      resetBreedForm();
      queryClient.invalidateQueries({ queryKey: ["admin-breeds"] });
    } catch (err: any) {
      console.error(err);
      toast({ 
        description: err.message || "Failed to save breed. Check your database permissions (RLS).", 
        variant: "destructive" 
      });
    } finally {
      setIsSavingBreed(false);
    }
  };

  const startEditBreed = (breed: any) => {
    setEditingBreedId(breed.id);
    setBreedFormName(breed.name);
    setSelectedCategoryId(String(breed.category_id));
  };

  const handleDeleteBreed = async (id: number, name: string) => {
    if (!confirm(`Delete breed "${name}"?`)) return;
    try {
      const { error } = await supabase.from("breeds").delete().eq("id", id);
      if (error) throw error;
      toast({ description: `Breed "${name}" deleted.` });
      if (editingBreedId === id) resetBreedForm();
      queryClient.invalidateQueries({ queryKey: ["admin-breeds"] });
    } catch (err: any) {
      toast({ description: err.message || "Failed to delete.", variant: "destructive" });
    }
  };

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

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validImages = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const validVideos = ["video/mp4", "video/webm", "video/quicktime"];
    if (!validImages.includes(file.type) && !validVideos.includes(file.type)) {
      return toast({ description: "Select a valid image (JPG, PNG, GIF, WEBP) or video (MP4, WEBM, MOV).", variant: "destructive" });
    }
    if (file.size > 50 * 1024 * 1024) {
      return toast({ description: "File must be under 50 MB.", variant: "destructive" });
    }
    setBroadcastFile({ file, url: URL.createObjectURL(file), type: validImages.includes(file.type) ? "image" : "video" });
    setBroadcastAudio(null);
    e.target.value = "";
  };

  const clearBroadcastFile = () => {
    if (broadcastFile) URL.revokeObjectURL(broadcastFile.url);
    setBroadcastFile(null);
  };

  const clearBroadcastAudio = () => {
    if (broadcastAudio) URL.revokeObjectURL(broadcastAudio.url);
    if (audioPlayerRef.current) { audioPlayerRef.current.pause(); setIsPlayingPreview(false); }
    setBroadcastAudio(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setBroadcastAudio({ blob, url: URL.createObjectURL(blob), duration: recordingTime });
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => { if (prev >= 300) { stopRecording(); return prev; } return prev + 1; });
      }, 1000);
    } catch {
      toast({ description: "Could not access microphone. Check permissions.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
    }
  };

  const togglePreviewPlayback = () => {
    if (!broadcastAudio) return;
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(broadcastAudio.url);
      audioPlayerRef.current.onended = () => setIsPlayingPreview(false);
    }
    if (isPlayingPreview) { audioPlayerRef.current.pause(); setIsPlayingPreview(false); }
    else { audioPlayerRef.current.play(); setIsPlayingPreview(true); }
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim() && !broadcastFile && !broadcastAudio)
      return toast({ description: "Add content to broadcast.", variant: "destructive" });
    if (targetPets.length === 0)
      return toast({ description: "Select at least one pet category.", variant: "destructive" });
    if (!includeGlobal && targetCountries.length === 0)
      return toast({ description: "Select at least one location target.", variant: "destructive" });

    setIsProcessing(true);
    try {
      let mediaUrl: string | null = null;
      let messageType: "text" | "image" | "video" | "audio" = "text";

      if (broadcastFile) {
        const ext = broadcastFile.file.name.split(".").pop() || "bin";
        const filePath = `chat-media/${Date.now()}-broadcast.${ext}`;
        const { error: upErr } = await supabase.storage.from("chat-uploads").upload(filePath, broadcastFile.file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("chat-uploads").getPublicUrl(filePath);
        mediaUrl = urlData.publicUrl;
        messageType = broadcastFile.type;
      } else if (broadcastAudio) {
        const filePath = `chat-media/${Date.now()}-broadcast.webm`;
        const { error: upErr } = await supabase.storage.from("chat-uploads").upload(filePath, broadcastAudio.blob);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("chat-uploads").getPublicUrl(filePath);
        mediaUrl = urlData.publicUrl;
        messageType = "audio";
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

      // Build flat pet+breed list
      const petTargets: Array<{ pet: string; breed: string | null }> = [];
      for (const pet of targetPets) {
        const breeds = targetBreeds[pet] || [];
        if (breeds.length === 0) {
          petTargets.push({ pet, breed: null });
        } else {
          for (const b of breeds) petTargets.push({ pet, breed: b });
        }
      }

      // Cross product insert
      const inserts: any[] = [];
      for (const loc of locations) {
        for (const { pet, breed } of petTargets) {
          inserts.push({
            author_id: user?.id,
            content: broadcastText || (messageType === "audio" ? "🎤 Voice Broadcast" : "📎 Media Broadcast"),
            media_url: mediaUrl,
            message_type: messageType,
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
      clearBroadcastFile();
      clearBroadcastAudio();
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
              {dbUser?.role === "admin" && (
                <button
                  onClick={() => setActiveTab("manage-pets")}
                  className={`pb-3 font-bold border-b-2 flex items-center gap-2 ${activeTab === "manage-pets" ? "border-teal-600 text-teal-600" : "border-transparent text-gray-500"}`}
                >
                  <PawPrint className="w-4 h-4" /> Manage Pets
                </button>
              )}
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

                {/* Message + Media Input */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700">
                    Announcement Content <span className="text-red-500">*</span>
                    <span className="ml-2 font-normal text-gray-400 text-xs">(text, image, video, or voice — or combine)</span>
                  </label>

                  <textarea
                    className="w-full border border-gray-200 rounded-xl p-3 min-h-[80px] text-sm outline-none focus:ring-2 focus:ring-orange-400/30 bg-gray-50 resize-none"
                    placeholder="Type your announcement here… (optional if attaching media)"
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                  />

                  {/* Media attach row */}
                  <div className="flex items-center gap-3">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      onChange={handleFileSelect}
                    />

                    {/* Image / Video button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!!broadcastAudio || isRecording}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                      Image / Video
                    </button>

                    {/* Mic button */}
                    {!isRecording && !broadcastAudio && (
                      <button
                        type="button"
                        onClick={startRecording}
                        disabled={!!broadcastFile}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Mic className="w-4 h-4 text-orange-500" />
                        Record Voice
                      </button>
                    )}

                    {/* Recording indicator */}
                    {isRecording && (
                      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-red-600">Recording… {formatTime(recordingTime)}</span>
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="ml-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <Square className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── File preview ── */}
                  {broadcastFile && (
                    <div className="relative inline-block">
                      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm max-w-sm bg-gray-50">
                        {broadcastFile.type === "image" ? (
                          <img src={broadcastFile.url} alt="Preview" className="max-h-48 object-contain w-full" />
                        ) : (
                          <video src={broadcastFile.url} className="max-h-48 w-full" controls />
                        )}
                        <div className="px-3 py-1.5 text-xs text-gray-500 flex items-center justify-between">
                          <span className="font-medium truncate max-w-[200px]">{broadcastFile.file.name}</span>
                          <span className="ml-2 uppercase text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-bold text-gray-600">{broadcastFile.type}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearBroadcastFile}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* ── Audio preview ── */}
                  {broadcastAudio && !isRecording && (
                    <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 max-w-sm">
                      <button
                        type="button"
                        onClick={togglePreviewPlayback}
                        className="w-9 h-9 flex items-center justify-center bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors shrink-0"
                      >
                        {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="h-1 bg-orange-200 rounded-full w-full">
                          <div className="h-1 bg-orange-500 rounded-full w-0" />
                        </div>
                        <p className="text-xs text-orange-700 mt-1 font-medium">🎤 Voice broadcast · {formatTime(broadcastAudio.duration)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearBroadcastAudio}
                        className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
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

            {/* ═══════ MANAGE PETS TAB ═══════ */}
            {activeTab === "manage-pets" && dbUser?.role === "admin" && (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                    <PawPrint className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Manage Pet Categories & Breeds</h2>
                    <p className="text-sm text-gray-500">Full CRUD — add, edit, delete categories (with images) and breeds.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* ══════════ CATEGORIES CARD ══════════ */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Tags className="w-4 h-4 text-teal-600" /> Categories
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">e.g. Dog, Cat, Bird, Hamster…</p>
                    </div>

                    <div className="p-5 space-y-4 flex-1 flex flex-col">
                      {/* Form (Add / Edit) */}
                      <div className="space-y-3 p-4 rounded-xl border border-teal-200 bg-teal-50/40">
                        <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                          {editingCatId ? "✏️ Edit Category" : "➕ New Category"}
                        </p>
                        <Input
                          placeholder="Category name…"
                          value={catFormName}
                          onChange={(e) => setCatFormName(e.target.value)}
                          className="h-10 bg-white border-gray-200 focus-visible:ring-teal-400 rounded-xl"
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSaveCategory(); } }}
                        />
                        {/* Image upload */}
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-teal-700 bg-white border border-teal-200 rounded-xl cursor-pointer hover:bg-teal-50 transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            {catFormFile ? "Change Image" : "Upload Image"}
                            <input
                              ref={catFileRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleCatFileChange}
                            />
                          </label>
                          {catFormPreview && (
                            <img src={catFormPreview} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-teal-200" />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveCategory}
                            disabled={isSavingCat || !catFormName.trim()}
                            className="flex-1 h-10 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl cursor-pointer"
                          >
                            {isSavingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : editingCatId ? <>Save Changes</> : <><Plus className="w-4 h-4 mr-1" /> Add Category</>}
                          </Button>
                          {editingCatId && (
                            <Button variant="outline" onClick={resetCatForm} className="h-10 rounded-xl cursor-pointer">
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* List */}
                      <div className="border border-gray-100 rounded-xl bg-gray-50 overflow-y-auto flex-1" style={{ maxHeight: 340 }}>
                        {categoriesLoading ? (
                          <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-teal-500" /></div>
                        ) : dbCategories.length === 0 ? (
                          <p className="py-10 text-center text-sm text-gray-400">No categories yet. Add your first one above.</p>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {dbCategories.map((cat: any) => (
                              <div key={cat.id} className={`flex items-center justify-between px-4 py-3 transition-colors group ${
                                editingCatId === cat.id ? "bg-teal-50 ring-1 ring-teal-300" : "hover:bg-teal-50/50"
                              }`}>
                                <div className="flex items-center gap-3 min-w-0">
                                  {cat.image_url ? (
                                    <img src={cat.image_url} alt={cat.name} className="w-9 h-9 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                                  ) : (
                                    <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">
                                      {cat.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="text-sm font-medium text-gray-800 truncate">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => startEditCategory(cat)}
                                    className="p-1.5 rounded-lg hover:bg-teal-100 text-teal-600 cursor-pointer"
                                    title="Edit category"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 cursor-pointer"
                                    title="Delete category"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 text-center">{dbCategories.length} categories total</p>
                    </div>
                  </div>

                  {/* ══════════ BREEDS CARD ══════════ */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-sky-50 to-white">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <PawPrint className="w-4 h-4 text-sky-600" /> Breeds
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">Assign breeds to an existing category.</p>
                    </div>

                    <div className="p-5 space-y-4 flex-1 flex flex-col">
                      {/* Form (Add / Edit) */}
                      <div className="space-y-3 p-4 rounded-xl border border-sky-200 bg-sky-50/40">
                        <p className="text-xs font-bold text-sky-700 uppercase tracking-wider">
                          {editingBreedId ? "✏️ Edit Breed" : "➕ New Breed"}
                        </p>
                        <Select 
                          value={selectedCategoryId} 
                          onValueChange={setSelectedCategoryId}
                        >
                          <SelectTrigger className="h-10 bg-white border-gray-200 rounded-xl shadow-sm focus:ring-sky-400">
                            <SelectValue placeholder="Select parent category…" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-200 shadow-xl overflow-hidden bg-white z-50">
                            {dbCategories && dbCategories.length > 0 ? (
                              dbCategories.map((category: any) => (
                                <SelectItem 
                                  key={category.id} 
                                  value={category.id}
                                  className="focus:bg-sky-50 focus:text-sky-700 cursor-pointer"
                                >
                                  {category.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled className="text-gray-400 italic">
                                No categories found
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Breed name (e.g. Bulldog)…"
                          value={breedFormName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBreedFormName(e.target.value)}
                          className="h-10 bg-white border-gray-200 focus-visible:ring-sky-400 rounded-xl shadow-sm"
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") { e.preventDefault(); handleSaveBreed(); } }}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveBreed}
                            disabled={isSavingBreed || !breedFormName.trim() || !selectedCategoryId}
                            className="flex-1 h-10 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl cursor-pointer"
                          >
                            {isSavingBreed ? <Loader2 className="w-4 h-4 animate-spin" /> : editingBreedId ? <>Save Changes</> : <><Plus className="w-4 h-4 mr-1" /> Add Breed</>}
                          </Button>
                          {editingBreedId && (
                            <Button variant="outline" onClick={resetBreedForm} className="h-10 rounded-xl cursor-pointer">
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* List */}
                      <div className="border border-gray-100 rounded-xl bg-gray-50 overflow-y-auto flex-1" style={{ maxHeight: 340 }}>
                        {breedsLoading ? (
                          <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-sky-500" /></div>
                        ) : dbBreeds.length === 0 ? (
                          <p className="py-10 text-center text-sm text-gray-400">No breeds yet. Add a category first, then create breeds.</p>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {dbBreeds.map((breed: any) => (
                              <div key={breed.id} className={`flex items-center justify-between px-4 py-3 transition-colors group ${
                                editingBreedId === breed.id ? "bg-sky-50 ring-1 ring-sky-300" : "hover:bg-sky-50/50"
                              }`}>
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-xs flex-shrink-0">
                                    {breed.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-sm font-medium text-gray-800 block truncate">{breed.name}</span>
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                                      {breed.categories?.name || "Uncategorized"}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => startEditBreed(breed)}
                                    className="p-1.5 rounded-lg hover:bg-sky-100 text-sky-600 cursor-pointer"
                                    title="Edit breed"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBreed(breed.id, breed.name)}
                                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 cursor-pointer"
                                    title="Delete breed"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 text-center">{dbBreeds.length} breeds total</p>
                    </div>
                  </div>

                </div>
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
