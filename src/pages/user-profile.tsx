import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  PlusCircle,
  Settings,
  LogOut,
  Edit3,
  Dog,
  Cat,
  Bird,
  Activity,
  Trash2,
  Check,
  ChevronsUpDown,
  Image as ImageIcon,
  Video as VideoIcon,
  Loader2,
  AlertTriangle,
  Clock,
  LocateFixed,
  PlusSquare,
  Grid3X3,
} from "lucide-react";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Country, State } from "country-state-city";
import { Lock, Unlock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Pet } from "@shared/schema";
import ProfileForm from "@/components/Profile";

const daysArray = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const monthsArray = [
  { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' }, { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' }, { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' }, { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' },
];
const currentYearValue = new Date().getFullYear();
const yearsArray = Array.from({ length: currentYearValue - 1989 }, (_, i) => String(currentYearValue - i));

export default function UserProfile() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isPetDetailsModalOpen, setIsPetDetailsModalOpen] = useState(false);

  const [isEditingPet, setIsEditingPet] = useState(false);
  const [isSavingPet, setIsSavingPet] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Pet>>({});
  const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
  const [newShowcaseImages, setNewShowcaseImages] = useState<File[]>([]);
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [isUploadingPost, setIsUploadingPost] = useState(false);
  const postFileInputRef = useRef<HTMLInputElement>(null);

  const [editBirthDay, setEditBirthDay] = useState("");
  const [editBirthMonth, setEditBirthMonth] = useState("");
  const [editBirthYear, setEditBirthYear] = useState("");

  const [activeTab, setActiveTab] = useState<"my-pets" | "account-settings">("my-pets");
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    country: "",
    state: "",
    bio: "",
    phone: "",
    display_name: "",
    enable_crossposting: false,
  });
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [openCountry, setOpenCountry] = useState(false);
  const [openState, setOpenState] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  // Pet Delete Confirmation States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isVerifyingDelete, setIsVerifyingDelete] = useState(false);

  // Account Deletion States
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const countries = Country.getAllCountries();
  const states = editProfileForm.country
    ? State.getStatesOfCountry(editProfileForm.country)
    : [];

  const queryClient = useQueryClient();

  const handleAuthClick = () => {
    if (isAuthenticated) {
      logout();
      window.location.href = "/";
    } else {
      window.location.href = "/login";
    }
  };

  const handleAutoDetectLocation = async () => {
    setIsAutoDetecting(true);
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (!res.ok) throw new Error("Location service unavailable.");
      const data = await res.json();

      const detectedCountryName = data.country_name;
      const detectedRegion = data.region;

      if (!detectedCountryName) throw new Error("Could not detect your country.");

      // Match country name to ISO code
      const matchedCountry = Country.getAllCountries().find(
        (c) => c.name.toLowerCase() === detectedCountryName.toLowerCase()
      );

      if (!matchedCountry) {
        toast({ description: `Detected "${detectedCountryName}" but could not match it. Please select manually.`, variant: "destructive" });
        setIsAutoDetecting(false);
        return;
      }

      let matchedStateCode = "";
      if (detectedRegion) {
        const statesOfCountry = State.getStatesOfCountry(matchedCountry.isoCode);
        const matchedState = statesOfCountry.find(
          (s) => s.name.toLowerCase() === detectedRegion.toLowerCase()
        );
        if (matchedState) matchedStateCode = matchedState.isoCode;
      }

      setEditProfileForm((prev) => ({
        ...prev,
        country: matchedCountry.isoCode,
        state: matchedStateCode,
      }));

      toast({
        description: `📍 Detected: ${detectedCountryName}${detectedRegion ? ", " + detectedRegion : ""}`,
      });
    } catch (err: any) {
      console.error("Auto-detect location error:", err);
      toast({
        description: err.message || "Failed to detect location. Please select manually.",
        variant: "destructive",
      });
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const { data: userPets, isLoading: isPetsLoading } = useQuery({
    queryKey: ["pets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: dbUser, isLoading: isProfileLoading } = useQuery({
    queryKey: ["db-user", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: petMedia, isLoading: isPetMediaLoading } = useQuery({
    queryKey: ["pet_media", selectedPet?.id],
    queryFn: async () => {
      if (!selectedPet?.id) return [];
      const { data, error } = await supabase
        .from("pet_media")
        .select("*")
        .eq("pet_id", selectedPet.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as { id: string; media_url: string; media_type: string }[];
    },
    enabled: !!selectedPet?.id,
  });

  const handleNewPost = async (file: File) => {
    if (!selectedPet || !user) return;
    setIsUploadingPost(true);
    try {
      const mediaUrl = await uploadFile(file, "pets/posts", "pet_media");
      const mediaType = file.type.startsWith("video") ? "video" : "image";
      const { error } = await supabase
        .from("pet_media")
        .insert({ pet_id: selectedPet.id, media_url: mediaUrl, media_type: mediaType });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["pet_media", selectedPet.id] });
      toast({ description: "Post uploaded successfully!" });
    } catch (err: any) {
      toast({ description: err.message || "Failed to upload post", variant: "destructive" });
    } finally {
      setIsUploadingPost(false);
      if (postFileInputRef.current) postFileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (dbUser) {
      let matchedCountryCode = "";
      let matchedStateCode = "";

      if (dbUser.country) {
        const matchedC = Country.getAllCountries().find(
          (c) => c.name === dbUser.country,
        );
        if (matchedC) matchedCountryCode = matchedC.isoCode;
      }

      if (dbUser.state && matchedCountryCode) {
        const matchedS = State.getStatesOfCountry(matchedCountryCode).find(
          (s) => s.name === dbUser.state,
        );
        if (matchedS) matchedStateCode = matchedS.isoCode;
      }

      setEditProfileForm({
        country: matchedCountryCode,
        state: matchedStateCode,
        bio: dbUser.bio || "",
        phone: dbUser.phone || "",
        display_name: dbUser.display_name || user?.displayName || user?.username || "",
        enable_crossposting: Boolean(dbUser.enable_crossposting ?? false),
      });
      setAvatarPreview(dbUser.profile_image_url || dbUser.avatar_url || null);
    }
  }, [dbUser, user]);

  // NEW: Calculate the 10-Day Cooldown Logic
  const { canChangeLocation, daysLeft } = useMemo(() => {
    if (!dbUser?.location_last_updated)
      return { canChangeLocation: true, daysLeft: 0 };

    const lastUpdated = new Date(dbUser.location_last_updated).getTime();
    const now = new Date().getTime();
    const diffHours = (now - lastUpdated) / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    const canChange = diffDays >= 10;
    const remaining = Math.ceil(10 - diffDays);

    return {
      canChangeLocation: canChange,
      daysLeft: remaining > 0 ? remaining : 0,
    };
  }, [dbUser?.location_last_updated]);

  const openEditProfile = () => {
    let matchedCountryCode = "";
    let matchedStateCode = "";

    if (dbUser?.country) {
      const matchedC = Country.getAllCountries().find(
        (c) => c.name === dbUser.country,
      );
      if (matchedC) matchedCountryCode = matchedC.isoCode;
    }

    if (dbUser?.state && matchedCountryCode) {
      const matchedS = State.getStatesOfCountry(matchedCountryCode).find(
        (s) => s.name === dbUser.state,
      );
      if (matchedS) matchedStateCode = matchedS.isoCode;
    }

    setEditProfileForm({
      country: matchedCountryCode,
      state: matchedStateCode,
      bio: dbUser?.bio || "",
      phone: dbUser?.phone || "",
      display_name: dbUser?.display_name || user?.displayName || user?.username || "",
      enable_crossposting: Boolean(dbUser?.enable_crossposting ?? false),
    });
    setIsEditProfileModalOpen(true);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async () => {
    if (!user?.id) return;
    setIsSavingProfile(true);

    try {
      const countryName = editProfileForm.country
        ? Country.getCountryByCode(editProfileForm.country)?.name
        : null;
      const stateName =
        editProfileForm.state && editProfileForm.country
          ? State.getStateByCodeAndCountry(
              editProfileForm.state,
              editProfileForm.country,
            )?.name
          : null;

      const isLocationChanged =
        dbUser?.country !== countryName || dbUser?.state !== stateName;

      const updatePayload: any = {
        bio: editProfileForm.bio,
        phone: editProfileForm.phone,
        display_name: editProfileForm.display_name,
        enable_crossposting: editProfileForm.enable_crossposting,
      };

      if (newAvatarFile) {
        updatePayload.profile_image_url = await uploadFile(
          newAvatarFile,
          "avatars",
          "avatars" // bucket
        );
      }

      // NEW: Only update location if it actually changed AND they are allowed to
      if (isLocationChanged) {
        if (!canChangeLocation) {
          toast({
            description: `Location changes are locked for ${daysLeft} more days.`,
            variant: "destructive",
          });
          setIsSavingProfile(false);
          return;
        }
        updatePayload.country = countryName;
        updatePayload.state = stateName;
        updatePayload.location_last_updated = new Date().toISOString(); // Reset the stopwatch!
      }

      const { error } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("id", user.id);

      if (error) throw error;

      // Update Supabase Auth metadata just in case
      const authUpdates: any = { 
        display_name: editProfileForm.display_name,
      };
      if (isLocationChanged) {
        authUpdates.country = countryName;
        authUpdates.state = stateName;
      }
      if (updatePayload.profile_image_url) {
        authUpdates.avatar_url = updatePayload.profile_image_url;
      }
      
      await supabase.auth.updateUser({
        data: authUpdates,
      });

      // After updating, immediately refresh session so that `supabase.auth.getSession()` returns the new metadata
      await supabase.auth.refreshSession();

      toast({ description: "Profile updated successfully!" });
      // Force the specific queries across all pages to refetch immediately, guaranteeing accurate sync
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["db-user", user.id] });
        queryClient.invalidateQueries({ queryKey: ["db-user-chat", user.id] });
        queryClient.invalidateQueries({ queryKey: ["db-user-home", user.id] });
        queryClient.invalidateQueries({ queryKey: ["db-user-contact", user.id] });
        queryClient.invalidateQueries({ queryKey: ["db-user-admin", user.id] });
        queryClient.invalidateQueries({ queryKey: ["db-user-about", user.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["supabase-auth-user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      setIsEditProfileModalOpen(false);
      setNewAvatarFile(null);
    } catch (err: any) {
      toast({
        description: err.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const openPetDetails = (pet: any) => {
    setSelectedPet(pet);
    setIsPetDetailsModalOpen(true);
    setIsEditingPet(false);
    setNewProfileImage(null);
    setNewShowcaseImages([]);
    setNewVideoFile(null);
    setEditForm({
      name: pet.name,
      gender: pet.gender,
      dob: pet.dob,
      location: pet.location,
      status_mating: pet.status_mating ?? false,
      status_pups_sell: pet.status_pups_sell ?? false,
      status_pups_adoption: pet.status_pups_adoption ?? false,
      status_for_sell: pet.status_for_sell ?? false,
      status_for_adoption: pet.status_for_adoption ?? false,
      status_lost: pet.status_lost ?? false,
      status_dead: pet.status_dead ?? false,
      status_exchange: pet.status_exchange ?? false,
    });
    
    if (pet.dob) {
      const parts = pet.dob.split("-");
      setEditBirthYear(parts[0] || "");
      setEditBirthMonth(parts[1] || "");
      setEditBirthDay(parts[2] || "");
    } else {
      setEditBirthYear("");
      setEditBirthMonth("");
      setEditBirthDay("");
    }
  };

  const uploadFile = async (file: File, folder: string, bucket: string = "chat-uploads") => {
    const isVideo = file.type.includes("video");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new Error(
        `File ${file.name} is too large. Max size is ${isVideo ? "50MB" : "5MB"}.`,
      );
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const handleUpdatePet = async () => {
    if (!selectedPet || !user) return;
    setIsSavingPet(true);

    try {
      const updatePayload: any = { ...editForm };
      
      if (editBirthYear && editBirthMonth && editBirthDay) {
        updatePayload.dob = `${editBirthYear}-${editBirthMonth}-${editBirthDay}`;
      } else if (editBirthYear || editBirthMonth || editBirthDay) {
        toast({
          description: "Please complete all parts of the Date of Birth.",
          variant: "destructive",
        });
        setIsSavingPet(false);
        return;
      } else {
         updatePayload.dob = null;
      }

      if (newProfileImage) {
        updatePayload.image_url = await uploadFile(
          newProfileImage,
          "pets/profiles",
        );
      }
      if (newShowcaseImages[0]) {
        updatePayload.showcase_image_1 = await uploadFile(
          newShowcaseImages[0],
          "pets/showcase",
        );
      }
      if (newShowcaseImages[1]) {
        updatePayload.showcase_image_2 = await uploadFile(
          newShowcaseImages[1],
          "pets/showcase",
        );
      }
      if (newShowcaseImages[2]) {
        updatePayload.showcase_image_3 = await uploadFile(
          newShowcaseImages[2],
          "pets/showcase",
        );
      }
      if (newVideoFile) {
        updatePayload.video_url = await uploadFile(newVideoFile, "pets/videos");
      }

      const { error } = await supabase
        .from("pets")
        .update(updatePayload)
        .eq("id", selectedPet.id);

      if (error) throw error;

      toast({ description: "Pet details and media updated successfully!" });
      setIsEditingPet(false);

      setSelectedPet({ ...selectedPet, ...updatePayload } as Pet);

      setNewProfileImage(null);
      setNewShowcaseImages([]);
      setNewVideoFile(null);

      queryClient.invalidateQueries({ queryKey: ["pets", user?.id] });
    } catch (error: any) {
      toast({
        description: error.message || "Failed to update pet",
        variant: "destructive",
      });
    } finally {
      setIsSavingPet(false);
    }
  };

  const handleDeletePet = async () => {
    if (!selectedPet || !user?.email) return;
    setIsVerifyingDelete(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordConfirm,
      });

      if (authError) {
        throw new Error("Incorrect password. Deletion canceled.");
      }

      const { error: deleteError } = await supabase
        .from("pets")
        .delete()
        .eq("id", selectedPet.id);

      if (deleteError) throw deleteError;

      toast({ description: "Pet profile deleted successfully!" });
      setIsDeleteDialogOpen(false);
      setIsPetDetailsModalOpen(false);
      setPasswordConfirm("");
      setDeleteConfirmationText("");
      queryClient.invalidateQueries({ queryKey: ["pets", user?.id] });
    } catch (error: any) {
      toast({
        description: error.message || "Failed to delete pet",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingDelete(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id || deleteAccountConfirmText !== "DELETE") return;
    setIsDeletingAccount(true);
    try {
      const { error: dbError } = await supabase
        .from("users")
        .delete()
        .eq("id", user.id);
      if (dbError) throw dbError;

      await logout();
      window.location.href = "/";
    } catch (err: any) {
      toast({
        description: err.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-[#f0f4f8] flex flex-col" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      {/* ══════════════════════════════════════════════════════════════════
          HEADER — Refined with subtle glass effect
         ══════════════════════════════════════════════════════════════════ */}
      <header className="fixed w-full top-0 z-[100] border-b border-white/20 shadow-sm" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px) saturate(180%)' }}>
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="cursor-pointer">
            <img src={logoImage} alt="ScrollPet Logo" className="h-9 md:h-10 w-auto object-contain hover:opacity-90 transition-opacity" />
          </Link>

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

          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <Button variant="ghost" disabled>...</Button>
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 rounded-full border-2 border-[#007699]/20 bg-white flex items-center justify-center overflow-hidden hover:border-[#007699]/50 hover:shadow-md transition-all cursor-pointer">
                    {user?.id ? (
                      <img src={dbUser?.profile_image_url || dbUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-lg border-gray-100">
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <p className="font-semibold text-sm text-gray-900 truncate">{dbUser?.display_name || user?.displayName || user?.username || "User"}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/user-profile" className="w-full cursor-pointer flex items-center gap-2 py-2">
                      <User className="w-4 h-4" /> Profile Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAuthClick} className="text-red-500 cursor-pointer flex items-center gap-2 font-medium py-2">
                    <LogOut className="w-4 h-4" /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => (window.location.href = "/login")} className="font-semibold cursor-pointer rounded-full px-5 h-9 bg-[#007699] hover:bg-[#005a75] text-sm shadow-sm">
                Login
              </Button>
            )}
          </div>

          <button className="md:hidden cursor-pointer p-2 hover:bg-gray-100 rounded-xl transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 p-4 space-y-1 bg-white shadow-xl absolute w-full z-50" style={{ animation: 'slideDown 0.2s ease-out' }}>
            {["/", "/chat", "/about", "/faq", "/contact"].map((href, i) => (
              <Link key={href} href={href} className="block text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-[#007699]/5 text-gray-700 cursor-pointer">
                {["Home", "Chat Rooms", "About", "FAQ", "Contact"][i]}
              </Link>
            ))}
            {isLoading ? null : isAuthenticated ? (
              <>
                <Link href="/user-profile" className="block text-sm font-semibold py-2.5 px-4 rounded-lg bg-[#007699]/5 text-[#007699] cursor-pointer">Profile Dashboard</Link>
                <Button className="w-full mt-3 cursor-pointer rounded-full" variant="destructive" size="sm" onClick={handleAuthClick}>Log Out</Button>
              </>
            ) : (
              <Button className="w-full mt-3 cursor-pointer rounded-full bg-[#007699]" size="sm" onClick={() => (window.location.href = "/login")}>Login</Button>
            )}
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          HERO PROFILE BANNER
         ══════════════════════════════════════════════════════════════════ */}
      <div className="w-full relative">
        <div className="h-40 md:h-52" style={{ background: 'linear-gradient(135deg, #007699 0%, #00a3cc 40%, #FF6600 100%)' }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,102,0,0.2) 0%, transparent 50%)' }} />
        </div>
        <div className="container mx-auto px-4 max-w-5xl relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5 -mt-16 md:-mt-14">
            {/* Avatar */}
            <div className="relative group">
              <div className="h-28 w-28 md:h-32 md:w-32 rounded-2xl border-4 border-white bg-white flex items-center justify-center overflow-hidden shadow-xl" style={{ borderRadius: '24px' }}>
                {dbUser?.profile_image_url || dbUser?.avatar_url ? (
                  <img src={dbUser.profile_image_url || dbUser.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : user?.id ? (
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-14 w-14 text-gray-300" />
                )}
              </div>
              <button
                onClick={() => { setActiveTab("account-settings"); openEditProfile(); }}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#007699] text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-[#005a75] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Info */}
            <div className="flex-1 text-center md:text-left pb-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {dbUser?.display_name || user?.displayName || user?.username || "Guest User"}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                @{user?.username || "username"} · {user?.email}
              </p>
              {dbUser?.bio && (
                <p className="text-sm text-gray-600 mt-2 max-w-lg leading-relaxed line-clamp-2">{dbUser.bio}</p>
              )}
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2 pb-2 md:pb-1">
              <Link href={`/profile/${user?.username}`}>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:border-[#007699] hover:text-[#007699] hover:shadow-md transition-all cursor-pointer">
                  <User className="w-4 h-4" /> View Profile
                </button>
              </Link>
              <button onClick={() => { openEditProfile(); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007699] text-white text-sm font-semibold hover:bg-[#005a75] shadow-md hover:shadow-lg transition-all cursor-pointer">
                <Edit3 className="w-4 h-4" /> Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          QUICK STATS BAR
         ══════════════════════════════════════════════════════════════════ */}
      <div className="w-full border-b border-gray-200/80 bg-white">
        <div className="container mx-auto px-4 max-w-5xl py-4">
          <div className="flex items-center justify-center md:justify-start gap-8 md:gap-12">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-[#007699]">{userPets?.length || 0}</p>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">Pets</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-gray-900">{dbUser?.country || "—"}</p>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">Location</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-gray-900">{dbUser?.created_at ? new Date(dbUser.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "—"}</p>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">Joined</p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB NAVIGATION + MAIN CONTENT
         ══════════════════════════════════════════════════════════════════ */}
      <main className="flex-grow container mx-auto px-4 max-w-5xl">
        {/* Tab Bar */}
        <div className="flex items-center gap-1 border-b border-gray-200/80 bg-white -mx-4 px-4 sticky top-16 z-30" style={{ backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.95)' }}>
          <button
            onClick={() => setActiveTab("my-pets")}
            className={cn(
              "px-5 py-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer",
              activeTab === "my-pets"
                ? "border-[#007699] text-[#007699]"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
            )}
          >
            🐾 My Pets
          </button>
          <button
            onClick={() => setActiveTab("account-settings")}
            className={cn(
              "px-5 py-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer",
              activeTab === "account-settings"
                ? "border-[#007699] text-[#007699]"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
            )}
          >
            ⚙️ Settings
          </button>
        </div>

        <div className="py-6 md:py-8">
          {activeTab === "account-settings" ? (
            isProfileLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#007699] mb-4" />
                <p className="text-sm text-gray-500 font-medium">Loading profile settings...</p>
              </div>
            ) : (
            <div className="max-w-2xl space-y-6">
              {/* Edit Profile Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Update your public information and avatar.</p>
                </div>
                <div className="p-6 space-y-5">
                  {/* Cooldown Alert */}
                  {!canChangeLocation && (
                    <div className="p-3 text-xs bg-amber-50 text-amber-700 rounded-xl border border-amber-200 flex items-start gap-2">
                      <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>Location changes are limited. You can change again in <strong>{daysLeft} days</strong>.</p>
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="flex items-center gap-5 p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                    <div className="h-20 w-20 rounded-2xl border-2 border-white bg-white flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <p className="text-sm font-semibold text-gray-800">Profile Picture</p>
                      <Input type="file" accept="image/*" onChange={handleAvatarSelect} className="file:bg-[#007699] file:text-white file:border-0 file:rounded-full file:px-3 file:py-0.5 file:text-xs file:font-semibold file:mr-3 file:cursor-pointer cursor-pointer text-xs bg-white h-8" />
                    </div>
                  </div>

                  {/* Display Name */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Display Name</label>
                    <Input placeholder="Choose a display name" value={editProfileForm.display_name} onChange={(e) => setEditProfileForm({ ...editProfileForm, display_name: e.target.value })} className="bg-gray-50/50 border-gray-200 focus-visible:ring-[#007699] rounded-xl h-10" />
                  </div>

                  {/* Bio */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">About Me</label>
                    <Textarea placeholder="Tell the community about yourself and your pets..." value={editProfileForm.bio} onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })} className="bg-gray-50/50 border-gray-200 focus-visible:ring-[#007699] min-h-[90px] rounded-xl" />
                  </div>

                  {/* Contact */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                    <Input placeholder="+91 9876543210" value={editProfileForm.phone} onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })} className="bg-gray-50/50 border-gray-200 focus-visible:ring-[#007699] rounded-xl h-10" />
                  </div>

                  {/* Location */}
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-gray-700">Location</label>
                    {canChangeLocation && (
                      <button
                        type="button"
                        onClick={handleAutoDetectLocation}
                        disabled={isAutoDetecting}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#007699] hover:text-[#005a75] hover:bg-[#007699]/5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAutoDetecting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <LocateFixed className="w-3.5 h-3.5" />
                        )}
                        {isAutoDetecting ? "Detecting…" : "Auto-detect Location"}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={cn("text-sm font-semibold", canChangeLocation ? "text-gray-700" : "text-gray-400")}>Country</label>
                      <Popover open={openCountry} onOpenChange={setOpenCountry}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={openCountry} disabled={!canChangeLocation} className="justify-between bg-gray-50/50 border-gray-200 w-full font-normal rounded-xl h-10 disabled:opacity-50">
                            {editProfileForm.country ? countries.find((c) => c.isoCode === editProfileForm.country)?.name : "Select Country"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search country..." />
                            <CommandList>
                              <CommandEmpty>No country found.</CommandEmpty>
                              <CommandGroup>
                                {countries.map((c) => (
                                  <CommandItem key={c.isoCode} value={c.name} onSelect={() => { setEditProfileForm({ ...editProfileForm, country: c.isoCode === editProfileForm.country ? "" : c.isoCode, state: "" }); setOpenCountry(false); }}>
                                    <Check className={cn("mr-2 h-4 w-4 text-[#007699]", editProfileForm.country === c.isoCode ? "opacity-100" : "opacity-0")} />
                                    {c.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1.5">
                      <label className={cn("text-sm font-semibold", canChangeLocation ? "text-gray-700" : "text-gray-400")}>State / Region</label>
                      <Popover open={openState} onOpenChange={setOpenState}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={openState} disabled={!canChangeLocation || !editProfileForm.country || states.length === 0} className="justify-between bg-gray-50/50 border-gray-200 w-full font-normal rounded-xl h-10 disabled:opacity-50">
                            {editProfileForm.state ? states.find((s) => s.isoCode === editProfileForm.state)?.name : !editProfileForm.country ? "Select Country" : states.length === 0 ? "No States" : "Select State"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search state..." />
                            <CommandList>
                              <CommandEmpty>No state found.</CommandEmpty>
                              <CommandGroup>
                                {states.map((s) => (
                                  <CommandItem key={s.isoCode} value={s.name} onSelect={() => { setEditProfileForm((prev) => ({ ...prev, state: s.isoCode === editProfileForm.state ? "" : s.isoCode })); setOpenState(false); }}>
                                    <Check className={cn("mr-2 h-4 w-4 text-[#007699]", editProfileForm.state === s.isoCode ? "opacity-100" : "opacity-0")} />
                                    {s.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                {/* Save */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                  <Button onClick={handleUpdateProfile} disabled={isSavingProfile} className="bg-[#007699] hover:bg-[#005a75] text-white rounded-xl px-6 h-10 cursor-pointer shadow-sm font-semibold">
                    {isSavingProfile ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>) : "Save Changes"}
                  </Button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-2xl border border-red-100 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-red-600 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Danger Zone</p>
                  <p className="text-xs text-gray-500 mt-0.5">Permanently delete your account and all data.</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => { setDeleteAccountConfirmText(""); setIsDeleteAccountDialogOpen(true); }} className="shrink-0 bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer font-semibold" data-testid="button-delete-account">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Account
                </Button>
              </div>
            </div>
            )
          ) : (
            /* ═══ MY PETS TAB ═══ */
            <div className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">My Pets</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{userPets?.length || 0} registered {(userPets?.length || 0) === 1 ? "pet" : "pets"}</p>
                </div>
                <Button onClick={() => setIsProfileModalOpen(true)} className="rounded-xl px-5 h-10 shadow-md hover:shadow-lg transition-all cursor-pointer bg-[#007699] hover:bg-[#005a75] font-semibold">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Pet
                </Button>
              </div>

              {isPetsLoading ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center h-64 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#007699] mb-4" />
                  <p className="text-sm text-gray-500 font-medium">Loading your pets...</p>
                </div>
              ) : userPets && userPets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userPets.map((pet) => (
                    <div
                      key={pet.id}
                      onClick={() => openPetDetails(pet)}
                      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      {/* Pet Image Area */}
                      <div className="h-40 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #fef3e8 100%)' }}>
                        {pet.image_url ? (
                          <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {pet.type === "dog" ? <Dog className="h-16 w-16 text-[#007699]/25" /> :
                             pet.type === "cat" ? <Cat className="h-16 w-16 text-[#007699]/25" /> :
                             pet.type === "bird" ? <Bird className="h-16 w-16 text-[#007699]/25" /> :
                             <Activity className="h-16 w-16 text-[#007699]/25" />}
                          </div>
                        )}
                        {/* Type Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg text-white shadow-sm capitalize" style={{ background: 'rgba(0,118,153,0.85)', backdropFilter: 'blur(4px)' }}>
                            {pet.type}
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
                          {pet.location && (
                            <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md truncate max-w-[110px]">{pet.location}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#007699]/10 to-[#FF6600]/10 flex items-center justify-center text-[#007699] mb-5">
                    <PlusCircle className="h-10 w-10" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">No pets added yet</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm leading-relaxed">
                    Register your first pet to connect with other owners and join communities specific to your furry friend.
                  </p>
                  <Button onClick={() => setIsProfileModalOpen(true)} className="rounded-xl px-6 bg-[#007699] hover:bg-[#005a75] cursor-pointer font-semibold shadow-md">
                    Register a Pet
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-transparent border-none shadow-none">
          <ProfileForm onClose={() => setIsProfileModalOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPetDetailsModalOpen}
        onOpenChange={setIsPetDetailsModalOpen}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto no-scrollbar pb-6">
          {selectedPet && (
            <div className="space-y-6">
              <div className="sticky top-0 bg-white z-10 pb-4 border-b border-gray-100 -mx-6 px-6">
                <div className="flex flex-row items-start gap-6">
                  <div className="h-24 w-24 shrink-0 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-100">
                    {selectedPet.image_url ? (
                      <img
                        src={selectedPet.image_url}
                        alt={selectedPet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : selectedPet.type === "dog" ? (
                      <Dog className="h-10 w-10 text-primary" />
                    ) : selectedPet.type === "cat" ? (
                      <Cat className="h-10 w-10 text-primary" />
                    ) : selectedPet.type === "bird" ? (
                      <Bird className="h-10 w-10 text-primary" />
                    ) : (
                      <Activity className="h-10 w-10 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    {isEditingPet ? (
                      <input
                        className="text-xl font-bold bg-background border border-input rounded px-2 py-1 mb-1 w-full"
                        value={editForm.name || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    ) : (
                      <h2 className="text-xl font-bold capitalize leading-tight">
                        {selectedPet.name}
                      </h2>
                    )}
                    <p className="text-sm text-muted-foreground mt-0.5">
                      @{(selectedPet.name || "pet").toLowerCase().replace(/\s+/g, "_")}
                    </p>

                    <div className="flex gap-6 mt-2 text-sm">
                      <span><strong className="font-semibold">{petMedia?.length ?? 0}</strong> <span className="text-muted-foreground">Posts</span></span>
                      <span><strong className="font-semibold">0</strong> <span className="text-muted-foreground">Followers</span></span>
                    </div>

                    {user?.id === (selectedPet as any).user_id && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingPet(!isEditingPet)}
                          className={cn("text-xs px-4 cursor-pointer", isEditingPet && "bg-muted")}
                        >
                          <Edit3 className="h-3 w-3 mr-1.5" />
                          {isEditingPet ? "Cancel Edit" : "Edit Profile"}
                        </Button>
                        {!isEditingPet && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => postFileInputRef.current?.click()}
                              disabled={isUploadingPost}
                              className="text-xs px-4 cursor-pointer"
                            >
                              {isUploadingPost ? (
                                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                              ) : (
                                <PlusSquare className="h-3 w-3 mr-1.5" />
                              )}
                              {isUploadingPost ? "Uploading…" : "New Post"}
                            </Button>
                            <input
                              ref={postFileInputRef}
                              type="file"
                              accept="image/*,video/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleNewPost(file);
                              }}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mt-4 pb-4 border-b border-gray-100">
                {isEditingPet ? (
                  <>
                    <div>
                      <span className="font-semibold text-muted-foreground block mb-1">
                        Gender:{" "}
                      </span>
                      <input
                        className="w-full bg-background border border-input rounded px-2 py-1"
                        value={editForm.gender || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, gender: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-muted-foreground block mb-1">
                        DOB:{" "}
                      </span>
                      <div className="flex gap-2 w-full">
                        <select
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={editBirthDay}
                          onChange={(e) => setEditBirthDay(e.target.value)}
                        >
                          <option value="" disabled>Day</option>
                          {daysArray.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>

                        <select
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={editBirthMonth}
                          onChange={(e) => setEditBirthMonth(e.target.value)}
                        >
                          <option value="" disabled>Month</option>
                          {monthsArray.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                          ))}
                        </select>

                        <select
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={editBirthYear}
                          onChange={(e) => setEditBirthYear(e.target.value)}
                        >
                          <option value="" disabled>Year</option>
                          {yearsArray.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold text-muted-foreground block mb-1">
                        Location:{" "}
                      </span>
                      <input
                        className="w-full bg-background border border-input rounded px-2 py-1"
                        value={editForm.location || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, location: e.target.value })
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="font-semibold text-muted-foreground">
                        Gender:{" "}
                      </span>
                      <span className="capitalize">
                        {selectedPet.gender || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-muted-foreground">
                        DOB:{" "}
                      </span>
                      <span>{selectedPet.dob || "Unknown"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold text-muted-foreground">
                        Location:{" "}
                      </span>
                      <span>{selectedPet.location || "Unknown"}</span>
                    </div>
                  </>
                )}
              </div>

              {!isEditingPet && (
                <div className="pt-2 pb-2">
                  {isPetMediaLoading ? (
                    <div className="grid grid-cols-3 gap-1">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-square bg-gray-100 rounded-sm animate-pulse" />
                      ))}
                    </div>
                  ) : petMedia && petMedia.length > 0 ? (
                    <div className="grid grid-cols-3 gap-1">
                      {petMedia.map((item) => (
                        <div key={item.id} className="aspect-square overflow-hidden rounded-sm bg-gray-100">
                          {item.media_type === "video" ? (
                            <video
                              src={item.media_url}
                              className="w-full h-full object-cover"
                              autoPlay
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <img
                              src={item.media_url}
                              alt="Pet post"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-2">
                      <Grid3X3 className="h-8 w-8 opacity-30" />
                      <p className="text-sm font-medium">No posts yet</p>
                      {user?.id === (selectedPet as any).user_id && (
                        <p className="text-xs">Tap <strong>New Post</strong> to share your first photo.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isEditingPet && (
                <div className="space-y-3 pt-2 pb-4 border-b border-gray-100">
                  <h3 className="font-bold text-sm text-gray-900">
                    Pet Status <span className="text-muted-foreground font-normal">(Optional)</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {(
                      [
                        { key: "status_mating", label: "Available for Mating" },
                        { key: "status_pups_sell", label: "Pups for Sell" },
                        { key: "status_pups_adoption", label: "Pups for Adoption" },
                        { key: "status_for_sell", label: "For Sell" },
                        { key: "status_for_adoption", label: "For Adoption" },
                        { key: "status_lost", label: "Lost" },
                        { key: "status_dead", label: "Dead" },
                        { key: "status_exchange", label: "Open for Exchange" },
                      ] as { key: keyof typeof editForm; label: string }[]
                    ).map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-input bg-background cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <span className="text-sm">{label}</span>
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-[#007699] cursor-pointer"
                          checked={!!(editForm as any)[key]}
                          onChange={(e) =>
                            setEditForm({ ...editForm, [key]: e.target.checked })
                          }
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {isEditingPet && (
                <div className="space-y-4 pt-2 pb-4 border-b border-gray-100">
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#FF6600]" /> Update Pet
                    Media
                  </h3>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 font-semibold uppercase block mb-1">
                      Profile Avatar
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setNewProfileImage(e.target.files?.[0] || null)
                      }
                      className="w-full bg-background border border-input rounded px-2 py-1 text-sm cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 font-semibold uppercase block mb-1">
                      Update Showcase Images (Max 3)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) =>
                        setNewShowcaseImages(Array.from(e.target.files || []))
                      }
                      className="w-full bg-background border border-input rounded px-2 py-1 text-sm cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Selecting new files will replace all existing showcase
                      images.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 font-semibold uppercase block items-center gap-1 mb-1">
                      <VideoIcon className="w-3 h-3 inline mr-1" /> Profile
                      Video (Max 50MB)
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) =>
                        setNewVideoFile(e.target.files?.[0] || null)
                      }
                      className="w-full bg-background border border-input rounded px-2 py-1 text-sm cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {isEditingPet && (
                <div className="col-span-2 flex flex-col gap-4 mt-2 pt-2">
                  <Button
                    onClick={handleUpdatePet}
                    className="w-full cursor-pointer bg-[#007699] hover:bg-[#005a75] text-white"
                    disabled={isSavingPet}
                  >
                    {isSavingPet ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Uploading & Saving...
                      </>
                    ) : (
                      "Save Details & Media"
                    )}
                  </Button>

                  <div className="border-t border-red-100 pt-4 mt-2">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setDeleteConfirmationText("");
                        setPasswordConfirm("");
                        setIsDeleteDialogOpen(true);
                      }}
                      className="w-full sm:w-auto text-xs py-1 h-8 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-none cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 mr-2" /> Delete Pet Profile
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <div>
            <h2 className="text-xl font-bold text-red-600 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Secure Deletion
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              This action will permanently delete{" "}
              <strong>{selectedPet?.name}</strong>'s profile and media.
            </p>
          </div>

          <div className="space-y-4 py-2">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-bold text-gray-700">
                1. Type{" "}
                <strong className="select-none">{selectedPet?.name}</strong> to
                confirm:
              </label>
              <input
                type="text"
                placeholder={`Type ${selectedPet?.name} here...`}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-bold text-gray-700">
                2. Enter your account password:
              </label>
              <input
                type="password"
                placeholder="Enter password..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isVerifyingDelete}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePet}
              disabled={
                deleteConfirmationText !== selectedPet?.name ||
                !passwordConfirm ||
                isVerifyingDelete
              }
              className="cursor-pointer"
            >
              {isVerifyingDelete ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isVerifyingDelete ? "Verifying..." : "Delete Permanently"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditProfileModalOpen}
        onOpenChange={setIsEditProfileModalOpen}
      >
        <DialogContent className="sm:max-w-[450px]">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Edit Profile
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Update your public account information.
            </p>
          </div>

          <div className="space-y-4 py-2">
            {/* NEW: Cooldown Alert UI */}
            {!canChangeLocation && (
              <div className="p-3 mb-2 text-xs bg-amber-50 text-amber-700 rounded-lg border border-amber-200 flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  To protect our local communities, location changes are
                  limited. You can change your location again in{" "}
                  <strong>{daysLeft} days</strong>.
                </p>
              </div>
            )}

            {/* Avatar Upload */}
            <div className="flex flex-col md:flex-row items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50 shadow-sm mt-2">
              <div className="h-20 w-20 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col space-y-2 flex-1 w-full text-center md:text-left">
                <label className="text-sm font-bold text-gray-800">Change Profile Picture</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="file:bg-[#007699] file:text-white file:border-0 file:rounded-full file:px-4 file:py-1 file:mr-3 file:cursor-pointer file:font-semibold file:text-xs cursor-pointer bg-white text-sm"
                  title="Choose Image"
                />
              </div>
            </div>

            {/* Display Name */}
            <div className="flex flex-col space-y-2 mt-4">
              <label className="text-sm font-bold text-gray-700">Display Name</label>
              <Input
                placeholder="Choose a display name"
                value={editProfileForm.display_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditProfileForm({ ...editProfileForm, display_name: e.target.value })}
                className="bg-gray-50 focus-visible:ring-[#007699]"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-bold text-gray-700">
                About Me (Bio)
              </label>
              <textarea
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#007699]/20 focus:border-[#007699] min-h-[80px]"
                placeholder="Tell the community about yourself and your pets..."
                value={editProfileForm.bio}
                onChange={(e) =>
                  setEditProfileForm({
                    ...editProfileForm,
                    bio: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Contact Number
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#007699]/20 focus:border-[#007699]"
                placeholder="+91 9876543210"
                value={editProfileForm.phone}
                onChange={(e) =>
                  setEditProfileForm({
                    ...editProfileForm,
                    phone: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex flex-row items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 mt-4">
              <div className="space-y-0.5">
                <label className="text-sm font-bold text-gray-700">Multi-Room Crossposting</label>
                <div className="text-xs text-gray-500">
                  Allow your messages to be seamlessly shared into larger regional or global rooms.
                </div>
              </div>
              <Switch
                checked={Boolean(editProfileForm.enable_crossposting)}
                onCheckedChange={(checked: boolean) => setEditProfileForm(prev => ({ ...prev, enable_crossposting: checked }))}
              />
            </div>

            <div className="flex flex-col space-y-2 mt-4">
              <label
                className={cn(
                  "text-sm font-bold",
                  canChangeLocation ? "text-gray-700" : "text-gray-400",
                )}
              >
                Country
              </label>
              <Popover open={openCountry} onOpenChange={setOpenCountry}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCountry}
                    disabled={!canChangeLocation}
                    className="justify-between bg-white border-gray-200 focus:ring-2 focus:ring-[#007699]/20 w-full font-normal disabled:opacity-60 disabled:bg-gray-50"
                  >
                    {editProfileForm.country
                      ? countries.find(
                          (c) => c.isoCode === editProfileForm.country,
                        )?.name
                      : "Select Country"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {countries.map((c) => (
                          <CommandItem
                            key={c.isoCode}
                            value={c.name}
                            onSelect={() => {
                              setEditProfileForm({
                                ...editProfileForm,
                                country:
                                  c.isoCode === editProfileForm.country
                                    ? ""
                                    : c.isoCode,
                                state: "",
                              });
                              setOpenCountry(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-[#007699]",
                                editProfileForm.country === c.isoCode
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {c.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col space-y-2">
              <label
                className={cn(
                  "text-sm font-bold",
                  canChangeLocation ? "text-gray-700" : "text-gray-400",
                )}
              >
                State / Region
              </label>
              <Popover open={openState} onOpenChange={setOpenState}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openState}
                    disabled={
                      !canChangeLocation ||
                      !editProfileForm.country ||
                      states.length === 0
                    }
                    className="justify-between bg-white border-gray-200 focus:ring-2 focus:ring-[#007699]/20 w-full font-normal disabled:opacity-60 disabled:bg-gray-50"
                  >
                    {editProfileForm.state
                      ? states.find((s) => s.isoCode === editProfileForm.state)
                          ?.name
                      : !editProfileForm.country
                        ? "Select Country First"
                        : states.length === 0
                          ? "No States Available"
                          : "Select State"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Search state..." />
                    <CommandList>
                      <CommandEmpty>No state found.</CommandEmpty>
                      <CommandGroup>
                        {states.map((s) => (
                          <CommandItem
                            key={s.isoCode}
                            value={s.name}
                            onSelect={() => {
                              setEditProfileForm((prev) => ({
                                ...prev,
                                state:
                                  s.isoCode === editProfileForm.state
                                    ? ""
                                    : s.isoCode,
                              }));
                              setOpenState(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-[#007699]",
                                editProfileForm.state === s.isoCode
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {s.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
            <Button
              onClick={handleUpdateProfile}
              disabled={isSavingProfile}
              className="w-full sm:w-auto cursor-pointer bg-[#007699] hover:bg-[#005a75] text-white rounded-full px-8"
            >
              {isSavingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Deletion Dialog */}
      <Dialog
        open={isDeleteAccountDialogOpen}
        onOpenChange={(open) => {
          if (!isDeletingAccount) {
            setIsDeleteAccountDialogOpen(open);
            if (!open) setDeleteAccountConfirmText("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <div className="flex items-start gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Delete Account</h2>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure? This action is permanent and will delete all your messages, announcements, and profile data.
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 my-2 text-sm text-red-700">
            This <strong>cannot be undone</strong>. Your account and all associated data will be permanently erased.
          </div>

          <div className="space-y-2 mt-2">
            <label className="text-sm font-bold text-gray-700">
              Type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-red-600">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              placeholder="DELETE"
              value={deleteAccountConfirmText}
              onChange={(e) => setDeleteAccountConfirmText(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition"
              data-testid="input-delete-account-confirm"
              autoComplete="off"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteAccountDialogOpen(false);
                setDeleteAccountConfirmText("");
              }}
              disabled={isDeletingAccount}
              className="cursor-pointer"
              data-testid="button-cancel-delete-account"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteAccountConfirmText !== "DELETE" || isDeletingAccount}
              className="bg-red-600 hover:bg-red-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-confirm-delete-account"
            >
              {isDeletingAccount ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {isDeletingAccount ? "Deleting…" : "Delete My Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  function handleLogout() {
    logout();
    window.location.href = "/login";
  }
}
