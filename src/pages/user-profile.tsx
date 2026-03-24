import { useState, useMemo } from "react";
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
import ProfileForm from "@/components/Profile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Pet } from "@shared/schema";

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

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    country: "",
    state: "",
    bio: "",
    phone: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [openCountry, setOpenCountry] = useState(false);
  const [openState, setOpenState] = useState(false);

  // Delete Confirmation States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isVerifyingDelete, setIsVerifyingDelete] = useState(false);

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
    });
    setIsEditProfileModalOpen(true);
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
      };

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
      if (isLocationChanged) {
        await supabase.auth.updateUser({
          data: { country: countryName, state: stateName },
        });
      }

      toast({ description: "Profile updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["db-user", user.id] });
      queryClient.invalidateQueries({ queryKey: ["db-user-chat", user.id] }); // Tell the chat rooms to reload too!
      setIsEditProfileModalOpen(false);
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
    });
  };

  const uploadFile = async (file: File, folder: string) => {
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
      .from("chat-uploads")
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("chat-uploads")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleUpdatePet = async () => {
    if (!selectedPet || !user) return;
    setIsSavingPet(true);

    try {
      const updatePayload: any = { ...editForm };

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="cursor-pointer">
            <img
              src={logoImage}
              alt="ScrollPet Logo"
              className="h-10 md:h-12 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8 bg-muted/50 px-6 py-2 rounded-full border border-border/50">
            <Link
              href="/"
              className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
            >
              Home
            </Link>
            <Link
              href="/chat"
              className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
            >
              Chat Rooms
            </Link>
            <Link
              href="/about"
              className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
            >
              About Us
            </Link>
            <Link
              href="/faq"
              className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
            >
              Contact Us
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <Button variant="ghost" disabled>
                ...
              </Button>
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-10 w-10 rounded-full border border-border bg-muted flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
                    {user?.id ? (
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                        alt="User Avatar"
                        className="h-full w-full object-cover"
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
                    <Link
                      href="/user-profile"
                      className="w-full cursor-pointer flex items-center"
                    >
                      Profile Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleAuthClick}
                    className="text-destructive cursor-pointer flex items-center font-medium"
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
          <div className="md:hidden border-t p-4 space-y-4 bg-background animate-in slide-in-from-top-5 shadow-2xl absolute w-full z-50">
            <Link
              href="/"
              className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer"
            >
              Home
            </Link>
            <Link
              href="/chat"
              className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer"
            >
              Chat Rooms
            </Link>
            <Link
              href="/about"
              className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer"
            >
              About Us
            </Link>
            <Link
              href="/faq"
              className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer"
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer"
            >
              Contact Us
            </Link>
            {isLoading ? (
              <Button
                className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg"
                disabled
              >
                ...
              </Button>
            ) : isAuthenticated ? (
              <>
                <Link
                  href="/user-profile"
                  className="block text-base font-semibold py-3 px-4 rounded-lg bg-muted text-primary cursor-pointer"
                >
                  Profile Dashboard
                </Link>
                <Button
                  className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg"
                  variant="destructive"
                  onClick={handleAuthClick}
                >
                  Log Out
                </Button>
              </>
            ) : (
              <Button
                className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg"
                onClick={() => (window.location.href = "/login")}
              >
                Login
              </Button>
            )}
          </div>
        )}
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3">
            <Card className="shadow-lg border-primary/10 overflow-hidden sticky top-28">
              <div className="h-24 bg-gradient-to-r from-[#007699]/80 to-[#FF6600]/80"></div>
              <CardContent className="pt-0 relative px-6 pb-6">
                <div className="flex justify-center -mt-12 mb-4">
                  <div className="h-24 w-24 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden shadow-md">
                    {user?.id ? (
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                        alt="User Avatar"
                      />
                    ) : (
                      <User className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <div className="text-center space-y-1 mb-6">
                  <h3 className="text-2xl font-bold text-foreground">
                    {user?.displayName || user?.username || "Guest User"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.email || "Sign in to access all features"}
                  </p>
                </div>

                <div className="space-y-3">
                  <Link href={`/profile/${user?.username}`}>
                    <Button
                      variant="outline"
                      className="w-full justify-start cursor-pointer hover:bg-primary/5 hover:text-primary transition-colors border-[#007699] text-[#007699] mb-3"
                    >
                      <User className="mr-2 h-4 w-4" /> View Public Profile
                    </Button>
                  </Link>

                  <Button
                    onClick={openEditProfile}
                    variant="outline"
                    className="w-full justify-start cursor-pointer hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start cursor-pointer hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <Settings className="mr-2 h-4 w-4" /> Account Settings
                  </Button>
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-destructive hover:bg-destructive/5 hover:text-destructive cursor-pointer transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="w-full md:w-2/3 space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                My Pets
              </h1>
              <Button
                onClick={() => setIsProfileModalOpen(true)}
                className="rounded-full px-6 shadow-md hover:shadow-lg transition-all cursor-pointer bg-[#007699] hover:bg-[#005a75]"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Pet
              </Button>
            </div>

            {isPetsLoading ? (
              <Card className="border-dashed border-2 bg-transparent shadow-none border-gray-200">
                <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Loading your pets...</p>
                </CardContent>
              </Card>
            ) : userPets && userPets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userPets.map((pet) => (
                  <Card
                    key={pet.id}
                    className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openPetDetails(pet)}
                  >
                    <div className="h-24 bg-gradient-to-br from-[#007699]/10 to-[#FF6600]/10 flex items-center justify-center relative border-b border-gray-100">
                      {pet.type === "dog" && (
                        <Dog className="h-12 w-12 text-[#007699]/20 absolute -bottom-4 -right-4" />
                      )}
                      {pet.type === "cat" && (
                        <Cat className="h-12 w-12 text-[#007699]/20 absolute -bottom-4 -right-4" />
                      )}
                      {pet.type === "bird" && (
                        <Bird className="h-12 w-12 text-[#007699]/20 absolute -bottom-4 -right-4" />
                      )}

                      <div className="h-16 w-16 bg-white rounded-full border-4 border-white shadow-sm flex items-center justify-center translate-y-6">
                        {pet.image_url ? (
                          <img
                            src={pet.image_url}
                            alt={pet.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : pet.type === "dog" ? (
                          <Dog className="h-8 w-8 text-[#007699]" />
                        ) : pet.type === "cat" ? (
                          <Cat className="h-8 w-8 text-[#007699]" />
                        ) : pet.type === "bird" ? (
                          <Bird className="h-8 w-8 text-[#007699]" />
                        ) : (
                          <Activity className="h-8 w-8 text-[#007699]" />
                        )}
                      </div>
                    </div>
                    <CardContent className="pt-10 pb-4 text-center">
                      <h3 className="font-bold text-xl text-foreground capitalize">
                        {pet.name}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium capitalize mt-1">
                        {pet.breed || pet.type}
                      </p>

                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {pet.gender && (
                          <span className="text-xs bg-muted px-2 py-1 rounded-full text-foreground capitalize">
                            {pet.gender}
                          </span>
                        )}
                        {pet.dob && (
                          <span className="text-xs bg-muted px-2 py-1 rounded-full text-foreground">
                            DOB: {pet.dob}
                          </span>
                        )}
                        {pet.location && (
                          <span className="text-xs bg-muted px-2 py-1 rounded-full text-foreground truncate max-w-[120px]">
                            {pet.location}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 bg-transparent shadow-none border-gray-200">
                <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="h-16 w-16 bg-[#007699]/10 rounded-full flex items-center justify-center text-[#007699] mb-4">
                    <PlusCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">
                    No pets added yet
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    Register your first pet to connect with other owners and
                    join communities specific to your furry friend.
                  </p>
                  <Button
                    onClick={() => setIsProfileModalOpen(true)}
                    variant="outline"
                    className="rounded-full px-8 border-[#007699] text-[#007699] hover:bg-[#007699]/5 cursor-pointer"
                  >
                    Register a Pet
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
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
              <div className="flex items-start justify-between sticky top-0 bg-white z-10 pb-3 border-b border-gray-100 -mx-6 px-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                    {selectedPet.image_url ? (
                      <img
                        src={selectedPet.image_url}
                        alt={selectedPet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : selectedPet.type === "dog" ? (
                      <Dog className="h-8 w-8 text-primary" />
                    ) : selectedPet.type === "cat" ? (
                      <Cat className="h-8 w-8 text-primary" />
                    ) : selectedPet.type === "bird" ? (
                      <Bird className="h-8 w-8 text-primary" />
                    ) : (
                      <Activity className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    {isEditingPet ? (
                      <input
                        className="text-2xl font-bold bg-background border border-input rounded px-2 py-1 mb-1 w-full"
                        value={editForm.name || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    ) : (
                      <h2 className="text-2xl font-bold capitalize">
                        {selectedPet.name}
                      </h2>
                    )}
                    <p className="text-muted-foreground capitalize">
                      {selectedPet.breed || selectedPet.type}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditingPet(!isEditingPet)}
                    title="Edit Pet"
                    className={cn("cursor-pointer", isEditingPet && "bg-muted")}
                  >
                    <Edit3 className="h-5 w-5" />
                  </Button>
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
                      <input
                        type="date"
                        className="w-full bg-background border border-input rounded px-2 py-1"
                        value={editForm.dob || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, dob: e.target.value })
                        }
                      />
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

            <div className="flex flex-col space-y-2">
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
    </div>
  );

  function handleLogout() {
    logout();
    window.location.href = "/login";
  }
}
