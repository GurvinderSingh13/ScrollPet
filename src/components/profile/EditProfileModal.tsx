import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { User, Loader2, Clock, LocateFixed, ChevronsUpDown, Check, AlertTriangle, Trash2 } from "lucide-react";
import { Country, State } from "country-state-city";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  dbUser: any;
  onLogout: () => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  user,
  dbUser,
  onLogout
}: EditProfileModalProps) {
  const queryClient = useQueryClient();

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

  // Account Deletion States
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const countries = Country.getAllCountries();
  const states = editProfileForm.country
    ? State.getStatesOfCountry(editProfileForm.country)
    : [];

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

  useEffect(() => {
    if (isOpen && dbUser) {
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
  }, [isOpen, dbUser, user]);

  const handleAutoDetectLocation = async () => {
    setIsAutoDetecting(true);
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (!res.ok) throw new Error("Location service unavailable.");
      const data = await res.json();

      const detectedCountryName = data.country_name;
      const detectedRegion = data.region;

      if (!detectedCountryName) throw new Error("Could not detect your country.");

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

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
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
        const publicUrl = await uploadFile(
          newAvatarFile,
          "avatars",
          "avatars"
        );
        updatePayload.profile_image_url = publicUrl;
      }

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
        updatePayload.location_last_updated = new Date().toISOString();
      }

      const { error } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("id", user.id);

      if (error) throw error;

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

      await supabase.auth.refreshSession();

      toast({ description: "Profile updated successfully!" });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["db-user", user.id] });
        queryClient.invalidateQueries({ queryKey: ["user", user.id] });
      }
      
      onClose();
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

  const handleDeleteAccount = async () => {
    if (!user?.id || deleteAccountConfirmText !== "DELETE") return;
    setIsDeletingAccount(true);
    try {
      const { error: dbError } = await supabase
        .from("users")
        .delete()
        .eq("id", user.id);
      if (dbError) throw dbError;

      onLogout();
    } catch (err: any) {
      toast({
        description: err.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
      setIsDeletingAccount(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[450px] p-0 flex flex-col max-h-[90vh] overflow-hidden">
          <div className="p-6 pb-4 shrink-0 border-b border-gray-100 bg-white">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Edit Profile
            </h2>
            <p className="text-sm text-gray-500">
              Update your public account information.
            </p>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-gray-50/30">
            {!canChangeLocation && (
              <div className="p-3 text-xs bg-amber-50 text-amber-700 rounded-lg border border-amber-200 flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Location changes are limited. You can change your location again in{" "}
                  <strong>{daysLeft} days</strong>.
                </p>
              </div>
            )}

            {/* Avatar Upload */}
            <div className="flex flex-col md:flex-row items-center gap-4 p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
              <div className="h-20 w-20 rounded-full border-4 border-gray-50 bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col space-y-2 flex-1 w-full text-center md:text-left">
                <label className="text-sm font-bold text-gray-800">Profile Picture</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="file:bg-[#007699] file:text-white file:border-0 file:rounded-full file:px-4 file:py-1.5 file:mr-3 file:cursor-pointer file:font-semibold file:text-xs cursor-pointer bg-transparent text-sm h-10 border-none pl-0 shadow-none"
                  title="Choose Image"
                />
              </div>
            </div>

            {/* Display Name */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-bold text-gray-700">Display Name</label>
              <Input
                placeholder="Choose a display name"
                value={editProfileForm.display_name}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, display_name: e.target.value })}
                className="bg-white focus-visible:ring-[#007699] h-11 rounded-xl"
              />
            </div>

            {/* Bio */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-bold text-gray-700">About Me (Bio)</label>
              <Textarea
                className="w-full bg-white border-gray-200 rounded-xl focus-visible:ring-[#007699] min-h-[90px]"
                placeholder="Tell the community about yourself and your pets..."
                value={editProfileForm.bio}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })}
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col space-y-2">
              <div>
                <label className="text-sm font-bold text-gray-700">WhatsApp Number</label>
                <p className="text-xs text-gray-400 mt-0.5">Used to display a WhatsApp button on your public profile.</p>
              </div>
              <Input
                type="tel"
                className="w-full bg-white border-gray-200 rounded-xl focus-visible:ring-[#007699] h-11"
                placeholder="+91 9876543210"
                value={editProfileForm.phone}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
              />
            </div>

            {/* Location */}
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-700">Location</label>
                {canChangeLocation && (
                  <button
                    type="button"
                    onClick={handleAutoDetectLocation}
                    disabled={isAutoDetecting}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#007699] hover:text-[#005a75] hover:bg-[#007699]/5 px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isAutoDetecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
                    Auto-detect
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className={cn("text-xs font-semibold uppercase tracking-wider", canChangeLocation ? "text-gray-500" : "text-gray-400")}>Country</label>
                  <Popover open={openCountry} onOpenChange={setOpenCountry}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCountry}
                        disabled={!canChangeLocation}
                        className="justify-between bg-white border-gray-200 focus:ring-2 focus:ring-[#007699]/20 w-full font-normal disabled:opacity-60 disabled:bg-gray-50 h-11 rounded-xl"
                      >
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
                              <CommandItem
                                key={c.isoCode}
                                value={c.name}
                                onSelect={() => {
                                  setEditProfileForm({
                                    ...editProfileForm,
                                    country: c.isoCode === editProfileForm.country ? "" : c.isoCode,
                                    state: "",
                                  });
                                  setOpenCountry(false);
                                }}
                              >
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

                <div className="flex flex-col space-y-1.5">
                  <label className={cn("text-xs font-semibold uppercase tracking-wider", canChangeLocation ? "text-gray-500" : "text-gray-400")}>State / Region</label>
                  <Popover open={openState} onOpenChange={setOpenState}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openState}
                        disabled={!canChangeLocation || !editProfileForm.country || states.length === 0}
                        className="justify-between bg-white border-gray-200 focus:ring-2 focus:ring-[#007699]/20 w-full font-normal disabled:opacity-60 disabled:bg-gray-50 h-11 rounded-xl"
                      >
                        {editProfileForm.state
                          ? states.find((s) => s.isoCode === editProfileForm.state)?.name
                          : !editProfileForm.country ? "Select Country First" : states.length === 0 ? "No States Available" : "Select State"}
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
                              <CommandItem
                                key={s.isoCode}
                                value={s.name}
                                onSelect={() => {
                                  setEditProfileForm((prev) => ({ ...prev, state: s.isoCode === editProfileForm.state ? "" : s.isoCode }));
                                  setOpenState(false);
                                }}
                              >
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

            {/* Danger Zone */}
            <div className="bg-red-50/50 rounded-xl border border-red-100 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="text-center sm:text-left">
                <p className="text-sm font-bold text-red-600 flex items-center justify-center sm:justify-start gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Danger Zone
                </p>
                <p className="text-xs text-red-500 mt-1">Permanently delete your account.</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => { setDeleteAccountConfirmText(""); setIsDeleteAccountDialogOpen(true); }} className="shrink-0 bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer font-semibold w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-1.5" /> Delete Account
              </Button>
            </div>
          </div>

          <div className="flex justify-end p-5 border-t border-gray-100 bg-white mt-auto shrink-0 z-10 gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSavingProfile} className="rounded-xl px-6">Cancel</Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={isSavingProfile}
              className="cursor-pointer bg-[#007699] hover:bg-[#005a75] text-white rounded-xl px-8"
            >
              {isSavingProfile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Deletion Dialog */}
      <Dialog open={isDeleteAccountDialogOpen} onOpenChange={(open) => { if (!isDeletingAccount) { setIsDeleteAccountDialogOpen(open); if (!open) setDeleteAccountConfirmText(""); } }}>
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
            <Input
              placeholder="DELETE"
              value={deleteAccountConfirmText}
              onChange={(e) => setDeleteAccountConfirmText(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg focus-visible:ring-red-500"
              autoComplete="off"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => { setIsDeleteAccountDialogOpen(false); setDeleteAccountConfirmText(""); }} disabled={isDeletingAccount}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteAccountConfirmText !== "DELETE" || isDeletingAccount} className="bg-red-600 hover:bg-red-700">
              {isDeletingAccount ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              {isDeletingAccount ? "Deleting…" : "Delete My Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
