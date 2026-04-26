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
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Crown,
  MessageSquare,
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
  AreaChart,
  Area,
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
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);

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
        const parentCat = dbCategories.find((c: any) => c.id === selectedCategoryId);
        toast({ 
          description: `Breed "${trimmed}" added! A chat room for ${parentCat?.name || "this category"} → ${trimmed} is now live.`,
        });
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

  // ═══════════════════════════════════════════════════════
  // ═══  COMPREHENSIVE ANALYTICS ENGINE  ════════════════
  // ═══════════════════════════════════════════════════════
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin-analytics-v2"],
    queryFn: async () => {
      const now = new Date();
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Parallel fetch all data we need
      const [
        totalUsersRes,
        totalMsgCountRes,
        allMessagesRes,
        recentSignupsRes,
        recentActiveRes,
        weeklyActiveRes,
        monthlyActiveRes,
        liveNowRes,
        reportsCountRes,
        approvedCountRes,
      ] = await Promise.all([
        // Total users
        supabase.from("users").select("id", { count: "exact", head: true }),
        // Total messages
        supabase.from("messages").select("id", { count: "exact", head: true }),
        // All messages for type breakdown + hour chart + room activity
        supabase.from("messages").select("message_type, created_at, location, pet_type, breed"),
        // Signups last 30 days
        supabase.from("users").select("created_at").gte("created_at", thirtyDaysAgo.toISOString()),
        // DAU — distinct users who sent messages in last 24h
        supabase.from("messages").select("user_id").gte("created_at", oneDayAgo.toISOString()),
        // WAU — distinct users who sent messages in last 7d
        supabase.from("messages").select("user_id").gte("created_at", sevenDaysAgo.toISOString()),
        // MAU — distinct users who sent messages in last 30d
        supabase.from("messages").select("user_id").gte("created_at", thirtyDaysAgo.toISOString()),
        // "Live Now" — unique senders in last 5 min
        supabase.from("messages").select("user_id").gte("created_at", fiveMinAgo.toISOString()),
        // Reports
        supabase.from("reports").select("id", { count: "exact", head: true }),
        // Approved announcements
        supabase.from("announcements").select("id", { count: "exact", head: true }).eq("status", "approved"),
      ]);

      const totalUsers = totalUsersRes.count || 0;
      const totalMessages = totalMsgCountRes.count || 0;

      // ── Live Now (unique users in last 5 min) ──
      const liveNowSet = new Set((liveNowRes.data || []).map((r: any) => r.user_id));
      const liveNow = liveNowSet.size;

      // ── DAU / WAU / MAU ──
      const dauSet = new Set((recentActiveRes.data || []).map((r: any) => r.user_id));
      const wauSet = new Set((weeklyActiveRes.data || []).map((r: any) => r.user_id));
      const mauSet = new Set((monthlyActiveRes.data || []).map((r: any) => r.user_id));

      // ── Message Type Breakdown (donut chart) ──
      const typeCounts: Record<string, number> = { text: 0, image: 0, video: 0, audio: 0 };
      const hourCounts: number[] = new Array(24).fill(0);
      const roomCounts: Record<string, number> = {};

      for (const msg of allMessagesRes.data || []) {
        // Type
        const t = (msg.message_type || "text").toLowerCase();
        if (t in typeCounts) typeCounts[t]++;
        else typeCounts["text"]++;

        // Hour of day
        const h = new Date(msg.created_at).getHours();
        hourCounts[h]++;

        // Room activity
        const petLabel = (msg.pet_type || "other").charAt(0).toUpperCase() + (msg.pet_type || "other").slice(1).replace("-", " ");
        let locLabel = msg.location || "global";
        if (locLabel === "global") locLabel = "🌍 Global";
        else if (locLabel.startsWith("country:")) locLabel = "🏳️ " + locLabel.split(":")[1];
        else if (locLabel.startsWith("state:")) locLabel = "📍 " + locLabel.split(":").slice(2).join(":");
        else if (locLabel === "staff_lounge") locLabel = "🔒 Staff";
        const roomKey = `${petLabel} · ${locLabel}`;
        roomCounts[roomKey] = (roomCounts[roomKey] || 0) + 1;
      }

      const typeChartData = [
        { name: "Text", value: typeCounts.text, color: "#6366f1" },
        { name: "Image", value: typeCounts.image, color: "#06b6d4" },
        { name: "Video", value: typeCounts.video, color: "#f59e0b" },
        { name: "Audio", value: typeCounts.audio, color: "#ec4899" },
      ].filter((d) => d.value > 0);

      // ── Busiest hour of day ──
      const hourChartData = hourCounts.map((count, hour) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        messages: count,
      }));

      // ── Top rooms ──
      const topRooms = Object.entries(roomCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // ── Signup Trends (30 days) ──
      const dayLabels: string[] = [];
      const signupMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        dayLabels.push(label);
        signupMap[label] = 0;
      }
      for (const u of recentSignupsRes.data || []) {
        const d = new Date(u.created_at);
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (label in signupMap) signupMap[label]++;
      }
      const signupChartData = dayLabels.map((label) => ({ date: label, signups: signupMap[label] }));

      // ── Growth rate (last 7 days vs previous 7 days) ──
      const last7 = signupChartData.slice(-7).reduce((s, d) => s + d.signups, 0);
      const prev7 = signupChartData.slice(-14, -7).reduce((s, d) => s + d.signups, 0);
      const growthPercent = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : last7 > 0 ? 100 : 0;

      return {
        totalUsers,
        totalMessages,
        liveNow,
        dau: dauSet.size,
        wau: wauSet.size,
        mau: mauSet.size,
        typeChartData,
        signupChartData,
        hourChartData,
        topRooms,
        growthPercent,
        reportsCount: reportsCountRes.count || 0,
        approvedCount: approvedCountRes.count || 0,
      };
    },
    enabled: isModOrAbove,
    refetchInterval: 60_000, // Auto-refresh every 60s
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
    <div className="min-h-screen pt-16 bg-[#F5F7F9] font-sans">
      <header className="fixed w-full top-0 z-[100] bg-[#00789c] text-white shadow-md h-16 flex items-center px-6 justify-between">
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
            {/* ═══════════════════════════════════════════════════ */}
            {/* ═══  PLATFORM ANALYTICS — PREMIUM DASHBOARD  ═══ */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                {/* Header with last-refresh badge */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
                      <BarChart2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Platform Analytics</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Real-time insights · Auto-refreshes every 60 s</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </div>
                </div>

                {analyticsLoading ? (
                  <div className="py-24 flex flex-col items-center gap-4 text-gray-400">
                    <div className="relative">
                      <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                      <div className="absolute inset-0 rounded-full bg-violet-500/10 animate-ping" />
                    </div>
                    <p className="text-sm font-medium">Crunching numbers…</p>
                  </div>
                ) : (
                  <div className="space-y-6">

                    {/* ═══ ROW 1: KPI HERO CARDS ═══ */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                      {/* Total Users */}
                      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-violet-200/50 group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 blur-2xl group-hover:scale-125 transition-transform duration-700" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 opacity-80" />
                            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Total Users</span>
                          </div>
                          <p className="text-4xl font-black tracking-tight">{(analyticsData?.totalUsers ?? 0).toLocaleString()}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            {(analyticsData?.growthPercent ?? 0) >= 0 ? (
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5 text-red-300" />
                            )}
                            <span className="text-xs font-bold opacity-90">{analyticsData?.growthPercent ?? 0}% this week</span>
                          </div>
                        </div>
                      </div>

                      {/* Total Messages */}
                      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 text-white shadow-lg shadow-sky-200/50 group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 blur-2xl group-hover:scale-125 transition-transform duration-700" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="w-4 h-4 opacity-80" />
                            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Total Messages</span>
                          </div>
                          <p className="text-4xl font-black tracking-tight">{(analyticsData?.totalMessages ?? 0).toLocaleString()}</p>
                          <p className="text-xs mt-2 opacity-80 font-medium">
                            {analyticsData?.reportsCount ?? 0} reports · {analyticsData?.approvedCount ?? 0} approved posts
                          </p>
                        </div>
                      </div>

                      {/* Live Right Now */}
                      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white shadow-lg shadow-emerald-200/50 group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 blur-2xl group-hover:scale-125 transition-transform duration-700" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-4 h-4 opacity-80" />
                            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Live Right Now</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-black tracking-tight">{analyticsData?.liveNow ?? 0}</p>
                            <span className="text-xs font-bold opacity-80 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                              active
                            </span>
                          </div>
                          <p className="text-xs mt-2 opacity-80 font-medium">Based on messages in last 5 min</p>
                        </div>
                      </div>

                      {/* DAU Snapshot */}
                      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white shadow-lg shadow-orange-200/50 group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 blur-2xl group-hover:scale-125 transition-transform duration-700" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-4 h-4 opacity-80" />
                            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Active Today</span>
                          </div>
                          <p className="text-4xl font-black tracking-tight">{analyticsData?.dau ?? 0}</p>
                          <p className="text-xs mt-2 opacity-80 font-medium">Daily Active Users (24 h)</p>
                        </div>
                      </div>
                    </div>

                    {/* ═══ ROW 2: DAU / WAU / MAU RETENTION ═══ */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                          <Activity className="w-4 h-4 text-violet-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-base">User Retention & Activity</h3>
                          <p className="text-xs text-gray-400 mt-0.5">Unique users who sent at least one message in each time window.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: "DAU", sublabel: "Daily Active", value: analyticsData?.dau ?? 0, bg: "from-violet-50 to-indigo-50", border: "border-violet-200", text: "text-violet-700", bar: "bg-gradient-to-r from-violet-500 to-indigo-500", pct: analyticsData?.totalUsers ? Math.round(((analyticsData?.dau ?? 0) / analyticsData.totalUsers) * 100) : 0 },
                          { label: "WAU", sublabel: "Weekly Active", value: analyticsData?.wau ?? 0, bg: "from-sky-50 to-cyan-50", border: "border-sky-200", text: "text-sky-700", bar: "bg-gradient-to-r from-sky-500 to-cyan-500", pct: analyticsData?.totalUsers ? Math.round(((analyticsData?.wau ?? 0) / analyticsData.totalUsers) * 100) : 0 },
                          { label: "MAU", sublabel: "Monthly Active", value: analyticsData?.mau ?? 0, bg: "from-emerald-50 to-teal-50", border: "border-emerald-200", text: "text-emerald-700", bar: "bg-gradient-to-r from-emerald-500 to-teal-500", pct: analyticsData?.totalUsers ? Math.round(((analyticsData?.mau ?? 0) / analyticsData.totalUsers) * 100) : 0 },
                        ].map((m) => (
                          <div key={m.label} className={`rounded-2xl bg-gradient-to-br ${m.bg} border ${m.border} p-5`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-black uppercase tracking-wider ${m.text}`}>{m.label}</span>
                              <span className={`text-[11px] font-bold ${m.text} opacity-60`}>{m.sublabel}</span>
                            </div>
                            <p className={`text-3xl font-black ${m.text} mt-1`}>{m.value.toLocaleString()}</p>
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-500 font-semibold">{m.pct}% of all users</span>
                              </div>
                              <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                                <div className={`h-full ${m.bar} rounded-full transition-all duration-1000`} style={{ width: `${Math.min(m.pct, 100)}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ═══ ROW 3: MESSAGE TYPE DONUT + BUSIEST HOUR ═══ */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                      {/* Donut: Message Type Breakdown */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-pink-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-base">Message Type Breakdown</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Distribution across text, image, video & voice.</p>
                          </div>
                        </div>
                        {(analyticsData?.typeChartData?.length ?? 0) === 0 ? (
                          <div className="h-64 flex items-center justify-center text-gray-300 text-sm">No messages yet.</div>
                        ) : (
                          <div className="flex flex-col items-center gap-4">
                            <ResponsiveContainer width="100%" height={240}>
                              <PieChart>
                                <defs>
                                  <linearGradient id="typeText" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#818cf8" />
                                  </linearGradient>
                                  <linearGradient id="typeImage" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#06b6d4" />
                                    <stop offset="100%" stopColor="#22d3ee" />
                                  </linearGradient>
                                  <linearGradient id="typeVideo" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#f59e0b" />
                                    <stop offset="100%" stopColor="#fbbf24" />
                                  </linearGradient>
                                  <linearGradient id="typeAudio" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#ec4899" />
                                    <stop offset="100%" stopColor="#f472b6" />
                                  </linearGradient>
                                </defs>
                                <Pie
                                  data={analyticsData?.typeChartData || []}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={65}
                                  outerRadius={100}
                                  paddingAngle={4}
                                  dataKey="value"
                                  nameKey="name"
                                  strokeWidth={0}
                                  animationBegin={0}
                                  animationDuration={800}
                                >
                                  {(analyticsData?.typeChartData || []).map((entry: any, idx: number) => {
                                    const fills = ["url(#typeText)", "url(#typeImage)", "url(#typeVideo)", "url(#typeAudio)"];
                                    return <Cell key={entry.name} fill={fills[idx] || entry.color} />;
                                  })}
                                </Pie>
                                <Tooltip
                                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 13 }}
                                  formatter={(value: number) => [value.toLocaleString(), "Messages"]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            {/* Legend cards inline */}
                            <div className="flex flex-wrap items-center justify-center gap-3">
                              {(analyticsData?.typeChartData || []).map((entry: any) => {
                                const total = (analyticsData?.typeChartData || []).reduce((s: number, d: any) => s + d.value, 0);
                                const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                                return (
                                  <div key={entry.name} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                                    <span className="w-3 h-3 rounded-full" style={{ background: entry.color }} />
                                    <span className="text-xs font-bold text-gray-700">{entry.name}</span>
                                    <span className="text-xs text-gray-400 font-semibold">{pct}%</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Busiest Hour of Day */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-base">Busiest Time of Day</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Messages grouped by hour (24 h).</p>
                          </div>
                        </div>
                        {(analyticsData?.hourChartData?.every((d: any) => d.messages === 0)) ? (
                          <div className="h-64 flex items-center justify-center text-gray-300 text-sm">No data yet.</div>
                        ) : (
                          <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={analyticsData?.hourChartData || []} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                              <defs>
                                <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.6} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval={2} />
                              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                              <Tooltip
                                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 13 }}
                                cursor={{ fill: "#fffbeb" }}
                                formatter={(value: number) => [value.toLocaleString(), "Messages"]}
                              />
                              <Bar dataKey="messages" fill="url(#hourGrad)" radius={[6, 6, 0, 0]} name="Messages" animationDuration={800} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* ═══ ROW 4: SIGNUP TRENDS (30 DAY AREA CHART) ═══ */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-base">Signup Trends — Last 30 Days</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Daily new user registrations.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                          <span className="text-xs font-semibold text-gray-500">30-Day Total:</span>
                          <span className="text-sm font-black text-emerald-600">
                            {(analyticsData?.signupChartData || []).reduce((s: number, d: any) => s + d.signups, 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={analyticsData?.signupChartData || []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <defs>
                            <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="signupLine" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval={4} />
                          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 13, fontWeight: 600 }}
                            cursor={{ stroke: "#10b981", strokeWidth: 1, strokeDasharray: "4 4" }}
                            formatter={(value: number) => [value, "New Users"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="signups"
                            stroke="url(#signupLine)"
                            strokeWidth={3}
                            fill="url(#signupGrad)"
                            dot={false}
                            activeDot={{ r: 6, fill: "#059669", strokeWidth: 3, stroke: "#fff" }}
                            animationDuration={1000}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* ═══ ROW 5: MOST ACTIVE ROOMS ═══ */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                          <Crown className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-base">Most Active Chat Rooms</h3>
                          <p className="text-xs text-gray-400 mt-0.5">Top chat rooms ranked by total messages.</p>
                        </div>
                      </div>
                      {(analyticsData?.topRooms?.length ?? 0) === 0 ? (
                        <div className="h-36 flex items-center justify-center text-gray-300 text-sm">No room data yet.</div>
                      ) : (
                        <div className="space-y-2.5">
                          {(analyticsData?.topRooms || []).map((room: any, idx: number) => {
                            const maxCount = analyticsData?.topRooms?.[0]?.count || 1;
                            const pct = Math.round((room.count / maxCount) * 100);
                            const medals = ["🥇", "🥈", "🥉"];
                            const barColors = [
                              "bg-gradient-to-r from-indigo-500 to-violet-500",
                              "bg-gradient-to-r from-sky-500 to-cyan-500",
                              "bg-gradient-to-r from-amber-500 to-orange-500",
                              "bg-gradient-to-r from-emerald-500 to-teal-500",
                              "bg-gradient-to-r from-pink-500 to-rose-500",
                              "bg-gradient-to-r from-purple-500 to-fuchsia-500",
                              "bg-gradient-to-r from-lime-500 to-green-500",
                              "bg-gradient-to-r from-red-500 to-orange-500",
                            ];
                            return (
                              <div key={room.name} className="group">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm w-6 text-center flex-shrink-0">{medals[idx] || `#${idx + 1}`}</span>
                                    <span className="text-sm font-semibold text-gray-700 truncate">{room.name}</span>
                                  </div>
                                  <span className="text-xs font-bold text-gray-500 flex-shrink-0 ml-2">
                                    {room.count.toLocaleString()}
                                  </span>
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden ml-8">
                                  <div
                                    className={`h-full ${barColors[idx % barColors.length]} rounded-full transition-all duration-700`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
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
                            {dbCategories.map((cat: any) => {
                              const isFiltered = filterCategoryId === cat.id;
                              const breedCount = dbBreeds.filter((b: any) => b.category_id === cat.id).length;
                              return (
                                <div
                                  key={cat.id}
                                  className={`flex items-center justify-between px-4 py-3 transition-colors group cursor-pointer ${
                                    isFiltered
                                      ? "bg-teal-100 ring-1 ring-teal-400"
                                      : editingCatId === cat.id
                                        ? "bg-teal-50 ring-1 ring-teal-300"
                                        : "hover:bg-teal-50/50"
                                  }`}
                                  onClick={() => {
                                    setFilterCategoryId(isFiltered ? null : cat.id);
                                    if (!isFiltered) setSelectedCategoryId(cat.id);
                                  }}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {cat.image_url ? (
                                      <img src={cat.image_url} alt={cat.name} className="w-9 h-9 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                                    ) : (
                                      <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">
                                        {cat.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-medium text-gray-800 truncate">{cat.name}</span>
                                      <span className="text-[10px] text-gray-400">{breedCount} breed{breedCount !== 1 ? "s" : ""}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {isFiltered && (
                                      <span className="text-[9px] bg-teal-600 text-white px-1.5 py-0.5 rounded-full font-bold mr-1">VIEWING</span>
                                    )}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); startEditCategory(cat); }}
                                      className="p-1.5 rounded-lg hover:bg-teal-100 text-teal-600 cursor-pointer sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                      title="Edit category"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id, cat.name); }}
                                      className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 cursor-pointer sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                      title="Delete category"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {filterCategoryId && (
                        <button
                          onClick={() => setFilterCategoryId(null)}
                          className="text-[10px] text-teal-600 hover:text-teal-800 font-semibold text-center cursor-pointer transition-colors"
                        >
                          ✕ Clear filter — show all breeds
                        </button>
                      )}
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

                      {/* List — filtered by selected category */}
                      {(() => {
                        const filteredBreeds = filterCategoryId
                          ? dbBreeds.filter((b: any) => b.category_id === filterCategoryId)
                          : dbBreeds;
                        const filterCatName = filterCategoryId
                          ? dbCategories.find((c: any) => c.id === filterCategoryId)?.name
                          : null;
                        return (
                          <>
                            {filterCatName && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 border border-sky-200 rounded-xl">
                                <PawPrint className="w-3.5 h-3.5 text-sky-600" />
                                <span className="text-xs font-semibold text-sky-700">Showing breeds for: {filterCatName}</span>
                                <button
                                  onClick={() => setFilterCategoryId(null)}
                                  className="ml-auto text-[10px] text-sky-500 hover:text-sky-700 font-bold cursor-pointer"
                                >
                                  Show all
                                </button>
                              </div>
                            )}
                            <div className="border border-gray-100 rounded-xl bg-gray-50 overflow-y-auto flex-1" style={{ maxHeight: 340 }}>
                              {breedsLoading ? (
                                <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-sky-500" /></div>
                              ) : filteredBreeds.length === 0 ? (
                                <div className="py-10 flex flex-col items-center gap-2">
                                  <PawPrint className="w-8 h-8 text-gray-200" />
                                  <p className="text-sm text-gray-400 text-center">
                                    {filterCategoryId
                                      ? `No breeds found for "${filterCatName}". Add one above!`
                                      : "No breeds yet. Add a category first, then create breeds."}
                                  </p>
                                </div>
                              ) : (
                                <div className="divide-y divide-gray-100">
                                  {filteredBreeds.map((breed: any) => (
                                    <div key={breed.id} className={`flex items-center justify-between px-4 py-3 transition-colors group ${
                                      editingBreedId === breed.id ? "bg-sky-50 ring-1 ring-sky-300" : "hover:bg-sky-50/50"
                                    }`}>
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-xs flex-shrink-0">
                                          {breed.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                          <span className="text-sm font-medium text-gray-800 block truncate">{breed.name}</span>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                                              {breed.categories?.name || "Uncategorized"}
                                            </span>
                                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                                              <MessageCircle className="w-2.5 h-2.5" /> Room active
                                            </span>
                                          </div>
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
                            <p className="text-[10px] text-gray-400 text-center">
                              {filterCategoryId
                                ? `${filteredBreeds.length} breed${filteredBreeds.length !== 1 ? "s" : ""} in ${filterCatName}`
                                : `${dbBreeds.length} breeds total`}
                            </p>
                          </>
                        );
                      })()}
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
