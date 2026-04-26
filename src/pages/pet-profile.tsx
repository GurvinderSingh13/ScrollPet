import { useState, useRef, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  Edit3,
  Dog,
  Cat,
  Bird,
  Activity,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  Loader2,
  AlertTriangle,
  PlusSquare,
  Grid3X3,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Pet } from "@shared/schema";

const daysArray = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const monthsArray = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];
const currentYearValue = new Date().getFullYear();
const yearsArray = Array.from(
  { length: currentYearValue - 1989 },
  (_, i) => String(currentYearValue - i),
);

const selectClass =
  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export default function PetProfilePage() {
  const { petId } = useParams<{ petId: string }>();
  const [, navigate] = useLocation();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isEditingPet, setIsEditingPet] = useState(false);
  const [isSavingPet, setIsSavingPet] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Pet>>({});
  const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
  const [newShowcaseImages, setNewShowcaseImages] = useState<File[]>([]);
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [isUploadingPost, setIsUploadingPost] = useState(false);
  const postFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMedia, setSelectedMedia] = useState<{
    media_url: string;
    media_type: string;
  } | null>(null);
  const [editBirthDay, setEditBirthDay] = useState("");
  const [editBirthMonth, setEditBirthMonth] = useState("");
  const [editBirthYear, setEditBirthYear] = useState("");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isVerifyingDelete, setIsVerifyingDelete] = useState(false);

  const queryClient = useQueryClient();

  const { data: pet, isLoading: isPetLoading } = useQuery({
    queryKey: ["pet", petId],
    queryFn: async () => {
      if (!petId) return null;
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("id", petId)
        .single();
      if (error) throw error;
      return data as Pet;
    },
    enabled: !!petId,
  });

  const { data: petMedia, isLoading: isPetMediaLoading } = useQuery({
    queryKey: ["pet_media", petId],
    queryFn: async () => {
      if (!petId) return [];
      const { data, error } = await supabase
        .from("pet_media")
        .select("*")
        .eq("pet_id", petId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as { id: string; media_url: string; media_type: string }[];
    },
    enabled: !!petId,
  });

  const { data: dbUser } = useQuery({
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

  useEffect(() => {
    if (pet) {
      setEditForm({
        name: pet.name,
        gender: pet.gender,
        dob: pet.dob,
        location: pet.location,
        status_mating: (pet as any).status_mating ?? false,
        status_pups_sell: (pet as any).status_pups_sell ?? false,
        status_pups_adoption: (pet as any).status_pups_adoption ?? false,
        status_for_sell: (pet as any).status_for_sell ?? false,
        status_for_adoption: (pet as any).status_for_adoption ?? false,
        status_lost: (pet as any).status_lost ?? false,
        status_dead: (pet as any).status_dead ?? false,
        status_exchange: (pet as any).status_exchange ?? false,
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
    }
  }, [pet]);

  const handleAuthClick = () => {
    if (isAuthenticated) {
      logout();
      window.location.href = "/";
    } else {
      window.location.href = "/login";
    }
  };

  const uploadFile = async (
    file: File,
    folder: string,
    bucket: string = "chat-uploads",
  ) => {
    const isVideo = file.type.includes("video");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize)
      throw new Error(
        `File ${file.name} is too large. Max size is ${isVideo ? "50MB" : "5MB"}.`,
      );
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const handleNewPost = async (file: File) => {
    if (!pet || !user) return;
    setIsUploadingPost(true);
    try {
      const mediaUrl = await uploadFile(file, "pets/posts", "pet_media");
      const mediaType = file.type.startsWith("video") ? "video" : "image";
      const { error } = await supabase
        .from("pet_media")
        .insert({ pet_id: pet.id, media_url: mediaUrl, media_type: mediaType });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["pet_media", petId] });
      toast({ description: "Post uploaded successfully!" });
    } catch (err: any) {
      toast({
        description: err.message || "Failed to upload post",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPost(false);
      if (postFileInputRef.current) postFileInputRef.current.value = "";
    }
  };

  const handleUpdatePet = async () => {
    if (!pet || !user) return;
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
      if (newProfileImage)
        updatePayload.image_url = await uploadFile(
          newProfileImage,
          "pets/profiles",
        );
      if (newShowcaseImages[0])
        updatePayload.showcase_image_1 = await uploadFile(
          newShowcaseImages[0],
          "pets/showcase",
        );
      if (newShowcaseImages[1])
        updatePayload.showcase_image_2 = await uploadFile(
          newShowcaseImages[1],
          "pets/showcase",
        );
      if (newShowcaseImages[2])
        updatePayload.showcase_image_3 = await uploadFile(
          newShowcaseImages[2],
          "pets/showcase",
        );
      if (newVideoFile)
        updatePayload.video_url = await uploadFile(newVideoFile, "pets/videos");

      const { error } = await supabase
        .from("pets")
        .update(updatePayload)
        .eq("id", pet.id);
      if (error) throw error;

      toast({ description: "Pet details and media updated successfully!" });
      setIsEditingPet(false);
      setNewProfileImage(null);
      setNewShowcaseImages([]);
      setNewVideoFile(null);
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });
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
    if (!pet || !user?.email) return;
    setIsVerifyingDelete(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordConfirm,
      });
      if (authError) throw new Error("Incorrect password. Deletion canceled.");

      const { error: deleteError } = await supabase
        .from("pets")
        .delete()
        .eq("id", pet.id);
      if (deleteError) throw deleteError;

      toast({ description: "Pet profile deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["pets", user?.id] });
      navigate("/user-profile");
    } catch (error: any) {
      toast({
        description: error.message || "Failed to delete pet",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingDelete(false);
    }
  };

  const isOwner = !!user?.id && user.id === (pet as any)?.user_id;

  if (isPetLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#007699]" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f8] gap-4">
        <p className="text-gray-600 font-medium">Pet not found.</p>
        <Button onClick={() => navigate("/user-profile")}>
          ← Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f0f4f8]"
      style={{
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── NAV HEADER ── */}
      <header
        className="fixed w-full top-0 z-[100] border-b border-white/20 shadow-sm"
        style={{
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(16px) saturate(180%)",
        }}
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="cursor-pointer">
            <img
              src={logoImage}
              alt="ScrollPet Logo"
              className="h-9 md:h-10 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "/", label: "Home" },
              { href: "/chat", label: "Chat Rooms" },
              { href: "/about", label: "About" },
              { href: "/faq", label: "FAQ" },
              { href: "/contact", label: "Contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-[#007699] px-3 py-2 rounded-lg hover:bg-[#007699]/5 transition-all cursor-pointer"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <Button variant="ghost" disabled>
                ...
              </Button>
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 rounded-full border-2 border-[#007699]/20 bg-white flex items-center justify-center overflow-hidden hover:border-[#007699]/50 hover:shadow-md transition-all cursor-pointer">
                    <img
                      src={
                        dbUser?.profile_image_url ||
                        dbUser?.avatar_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`
                      }
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 mt-2 rounded-xl shadow-lg border-gray-100"
                >
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {dbUser?.display_name ||
                        user?.displayName ||
                        user?.username ||
                        "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/user-profile"
                      className="w-full cursor-pointer flex items-center gap-2 py-2"
                    >
                      <User className="w-4 h-4" /> Profile Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleAuthClick}
                    className="text-red-500 cursor-pointer flex items-center gap-2 font-medium py-2"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => (window.location.href = "/login")}
                className="font-semibold cursor-pointer rounded-full px-5 h-9 bg-[#007699] hover:bg-[#005a75] text-sm shadow-sm"
              >
                Login
              </Button>
            )}
          </div>

          <button
            className="md:hidden cursor-pointer p-2 hover:bg-gray-100 rounded-xl transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 p-4 space-y-1 bg-white shadow-xl absolute w-full z-50">
            {["/", "/chat", "/about", "/faq", "/contact"].map((href, i) => (
              <Link
                key={href}
                href={href}
                className="block text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-[#007699]/5 text-gray-700 cursor-pointer"
              >
                {["Home", "Chat Rooms", "About", "FAQ", "Contact"][i]}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  href="/user-profile"
                  className="block text-sm font-semibold py-2.5 px-4 rounded-lg bg-[#007699]/5 text-[#007699] cursor-pointer"
                >
                  Profile Dashboard
                </Link>
                <Button
                  className="w-full mt-3 cursor-pointer rounded-full"
                  variant="destructive"
                  size="sm"
                  onClick={handleAuthClick}
                >
                  Log Out
                </Button>
              </>
            ) : (
              <Button
                className="w-full mt-3 cursor-pointer rounded-full bg-[#007699]"
                size="sm"
                onClick={() => (window.location.href = "/login")}
              >
                Login
              </Button>
            )}
          </div>
        )}
      </header>

      {/* ── BACK BAR ── */}
      <div className="pt-16">
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 h-12 flex items-center">
            <button
              onClick={() => navigate("/user-profile")}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#007699] hover:text-[#005a75] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* HEADER CARD: avatar + name + stats + buttons */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-row items-start gap-6">
            <div className="h-24 w-24 shrink-0 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-100">
              {pet.image_url ? (
                <img
                  src={pet.image_url}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              ) : pet.type === "dog" ? (
                <Dog className="h-10 w-10 text-primary" />
              ) : pet.type === "cat" ? (
                <Cat className="h-10 w-10 text-primary" />
              ) : pet.type === "bird" ? (
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
                  {pet.name}
                </h2>
              )}
              <p className="text-sm text-muted-foreground mt-0.5">
                @{(pet.name || "pet").toLowerCase().replace(/\s+/g, "_")}
              </p>

              <div className="flex gap-6 mt-2 text-sm">
                <span>
                  <strong className="font-semibold">
                    {petMedia?.length ?? 0}
                  </strong>{" "}
                  <span className="text-muted-foreground">Posts</span>
                </span>
                <span>
                  <strong className="font-semibold">0</strong>{" "}
                  <span className="text-muted-foreground">Followers</span>
                </span>
              </div>

              {isOwner && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingPet(!isEditingPet)}
                    className={cn(
                      "text-xs px-4 cursor-pointer",
                      isEditingPet && "bg-muted",
                    )}
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

        {/* INFO GRID */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {isEditingPet ? (
              <>
                <div>
                  <span className="font-semibold text-muted-foreground block mb-1">
                    Gender:
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
                    DOB:
                  </span>
                  <div className="flex gap-1 w-full">
                    <select
                      className={selectClass}
                      value={editBirthDay}
                      onChange={(e) => setEditBirthDay(e.target.value)}
                    >
                      <option value="" disabled>
                        Day
                      </option>
                      {daysArray.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <select
                      className={selectClass}
                      value={editBirthMonth}
                      onChange={(e) => setEditBirthMonth(e.target.value)}
                    >
                      <option value="" disabled>
                        Mon
                      </option>
                      {monthsArray.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <select
                      className={selectClass}
                      value={editBirthYear}
                      onChange={(e) => setEditBirthYear(e.target.value)}
                    >
                      <option value="" disabled>
                        Year
                      </option>
                      {yearsArray.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-muted-foreground block mb-1">
                    Location:
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
                    {pet.gender || "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">
                    DOB:{" "}
                  </span>
                  <span>{pet.dob || "Unknown"}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-muted-foreground">
                    Location:{" "}
                  </span>
                  <span>{pet.location || "Unknown"}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* MEDIA GRID */}
        {!isEditingPet && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
            {isPetMediaLoading ? (
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-100 rounded-sm animate-pulse"
                  />
                ))}
              </div>
            ) : petMedia && petMedia.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {petMedia.map((item) => (
                  <div
                    key={item.id}
                    className="aspect-square overflow-hidden rounded-sm bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedMedia(item)}
                  >
                    {item.media_type === "video" ? (
                      <video
                        src={item.media_url}
                        className="w-full h-full object-cover pointer-events-none"
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
                {isOwner && (
                  <p className="text-xs">
                    Tap <strong>New Post</strong> to share your first photo.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* PET STATUS TOGGLES */}
        {isEditingPet && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-sm text-gray-900">
              Pet Status{" "}
              <span className="text-muted-foreground font-normal">
                (Optional)
              </span>
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

        {/* MEDIA UPLOAD */}
        {isEditingPet && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#FF6600]" /> Update Pet Media
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
                Selecting new files will replace all existing showcase images.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-500 font-semibold uppercase block items-center gap-1 mb-1">
                <VideoIcon className="w-3 h-3 inline mr-1" /> Profile Video
                (Max 50MB)
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setNewVideoFile(e.target.files?.[0] || null)}
                className="w-full bg-background border border-input rounded px-2 py-1 text-sm cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* SAVE / DELETE BUTTONS */}
        {isEditingPet && (
          <div className="flex flex-col gap-4 pb-8">
            <Button
              onClick={handleUpdatePet}
              className="w-full cursor-pointer bg-[#007699] hover:bg-[#005a75] text-white"
              disabled={isSavingPet}
            >
              {isSavingPet ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading &
                  Saving...
                </>
              ) : (
                "Save Details & Media"
              )}
            </Button>
            <div className="border-t border-red-100 pt-4">
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

      {/* ── LIGHTBOX ── */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            className="fixed top-6 right-6 text-white hover:text-white/70 bg-black/50 rounded-full p-2 cursor-pointer"
            onClick={() => setSelectedMedia(null)}
            aria-label="Close"
          >
            <X className="w-7 h-7" />
          </button>
          <div
            className="flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedMedia.media_type === "video" ? (
              <video
                src={selectedMedia.media_url}
                controls
                autoPlay
                className="max-w-5xl w-[90vw] max-h-[85vh] object-contain rounded-lg"
              />
            ) : (
              <img
                src={selectedMedia.media_url}
                alt="Full size post"
                className="max-w-5xl w-[90vw] max-h-[85vh] object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <div>
            <h2 className="text-xl font-bold text-red-600 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Secure Deletion
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              This action will permanently delete{" "}
              <strong>{pet?.name}</strong>'s profile and media.
            </p>
          </div>

          <div className="space-y-4 py-2">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-bold text-gray-700">
                1. Type{" "}
                <strong className="select-none">{pet?.name}</strong> to confirm:
              </label>
              <input
                type="text"
                placeholder={`Type ${pet?.name} here...`}
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
                deleteConfirmationText !== pet?.name ||
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
    </div>
  );
}
