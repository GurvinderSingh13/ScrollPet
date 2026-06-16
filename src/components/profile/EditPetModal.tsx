import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, AlertTriangle, Fingerprint, Check, ChevronsUpDown, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Country, State, City } from "country-state-city";

import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface EditPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: any;
}

export default function EditPetModal({ isOpen, onClose, pet }: EditPetModalProps) {
  const queryClient = useQueryClient();
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [breed, setBreed] = useState("");
  const [openCategory, setOpenCategory] = useState(false);
  const [openBreed, setOpenBreed] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [selectedCityName, setSelectedCityName] = useState("");
  
  const [status, setStatus] = useState({
    status_mating: false,
    status_pups_sell: false,
    status_pups_adoption: false,
    status_for_sell: false,
    status_for_adoption: false,
    status_lost: false,
    status_dead: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: ownerCountry } = useQuery({
    queryKey: ["pet-owner-country", pet?.user_id],
    queryFn: async () => {
      if (!pet?.user_id) return null;
      const { data } = await supabase.from("users").select("country").eq("id", pet.user_id).single();
      if (data?.country) {
        const c = Country.getAllCountries().find(x => x.name.toLowerCase() === data.country.toLowerCase());
        return c?.isoCode || null;
      }
      return null;
    },
    enabled: !!pet?.user_id
  });

  const availableStates = ownerCountry ? State.getStatesOfCountry(ownerCountry) : [];
  const availableCities = selectedStateCode && ownerCountry ? City.getCitiesOfState(ownerCountry, selectedStateCode) : [];
  
  // If the pet's handle has already been updated once, they cannot change it.
  const isHandleLocked = pet?.handle_updated;

  useEffect(() => {
    if (isOpen && pet) {
      setHandle(pet.handle || "");
      setName(pet.name || "");
      setType(pet.type || "");
      setBreed(pet.breed || "");
      setGender(pet.gender || "");
      setDob(pet.dob || "");
      setAvatarPreview(pet.image_url || null);
      setProfileImage(null);
      setStatus({
        status_mating: !!pet.status_mating,
        status_pups_sell: !!pet.status_pups_sell,
        status_pups_adoption: !!pet.status_pups_adoption,
        status_for_sell: !!pet.status_for_sell,
        status_for_adoption: !!pet.status_for_adoption,
        status_lost: !!pet.status_lost,
        status_dead: !!pet.status_dead,
      });
      setError(null);
    }
  }, [isOpen, pet]);

  useEffect(() => {
    if (isOpen && pet && ownerCountry) {
      if (pet.location) {
        const parts = pet.location.split(",").map((s: string) => s.trim());
        if (parts.length === 2) {
          const cName = parts[0];
          const sName = parts[1];
          const st = State.getStatesOfCountry(ownerCountry).find(s => s.name.toLowerCase() === sName.toLowerCase());
          if (st) {
            setSelectedStateCode(st.isoCode);
            setSelectedCityName(cName);
          }
        } else {
          const st = State.getStatesOfCountry(ownerCountry).find(s => s.name.toLowerCase() === pet.location.toLowerCase());
          if (st) {
            setSelectedStateCode(st.isoCode);
          }
        }
      }
    }
  }, [isOpen, pet, ownerCountry]);

  const uploadFile = async (file: File, folder: string) => {
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
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const handleSave = async () => {
    if (!pet?.id) return;
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    
    // Validate handle format
    const handleRegex = /^[a-zA-Z0-9_]+$/;
    if (handle && !handleRegex.test(handle)) {
      setError("Handle can only contain letters, numbers, and underscores.");
      return;
    }
    
    setIsSaving(true);
    setError(null);

    try {
      if (handle && handle !== pet.handle && !isHandleLocked) {
        // Check uniqueness
        const { data: existing } = await supabase
          .from("pets")
          .select("id")
          .eq("handle", handle)
          .single();

        if (existing && existing.id !== pet.id) {
          setError("This handle is already taken. Please choose another one.");
          setIsSaving(false);
          return;
        }
      }

      const finalStateName = selectedStateCode && ownerCountry ? State.getStateByCodeAndCountry(selectedStateCode, ownerCountry)?.name : "";
      const locationString = selectedCityName && finalStateName ? `${selectedCityName}, ${finalStateName}` : finalStateName || "";

      let newImageUrl = pet.image_url;
      if (profileImage) {
        newImageUrl = await uploadFile(profileImage, "pets/profiles");
      }

      const updatePayload: any = {
        name,
        type,
        breed,
        gender,
        dob,
        location: locationString,
        image_url: newImageUrl,
        ...status
      };
      
      if (!isHandleLocked && handle !== pet.handle) {
        updatePayload.handle = handle;
        updatePayload.handle_updated = true; // Lock it after first successful save
      }

      const { error: updateError } = await supabase
        .from("pets")
        .update(updatePayload)
        .eq("id", pet.id);

      if (updateError) throw updateError;
      
      toast({ description: "Pet details updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["pet", pet.id] });
      queryClient.invalidateQueries({ queryKey: ["user_pets", pet.user_id] });
      
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update pet details");
    } finally {
      setIsSaving(false);
    }
  };

  // Dynamic categories from Supabase
  const { data: dbCategories = [] } = useQuery({
    queryKey: ["pet-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const selectedCategoryObj = dbCategories.find(
    (c: any) => c.name.toLowerCase() === type.toLowerCase()
  );

  // Dynamic breeds from Supabase
  const { data: dbBreeds = [] } = useQuery({
    queryKey: ["pet-breeds", selectedCategoryObj?.id],
    queryFn: async () => {
      if (!selectedCategoryObj?.id) return [];
      const { data, error } = await supabase
        .from("breeds")
        .select("*")
        .eq("category_id", selectedCategoryObj.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCategoryObj?.id,
  });

  const categoriesList = [...dbCategories.map((c: any) => c.name), "Others"];
  const availableBreeds = dbBreeds.map((b: any) => ({ id: b.name, name: b.name }));

  const statusOptions = [
    { key: "status_mating", label: "Available for Mating" },
    { key: "status_pups_sell", label: "Pups for Sale" },
    { key: "status_pups_adoption", label: "Pups for Adoption" },
    { key: "status_for_sell", label: "For Sale" },
    { key: "status_for_adoption", label: "For Adoption" },
    { key: "status_lost", label: "Lost" },
    { key: "status_dead", label: "Dead" },
  ] as const;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-6 pb-4 shrink-0 border-b border-gray-100 bg-white">
          <DialogTitle className="text-2xl font-bold text-center text-gray-900 mt-2">
            Edit Pet Profile
          </DialogTitle>
          <p className="text-sm text-gray-500">
            Update your pet's details and statuses.
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-gray-50/30">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex flex-col items-center justify-center mb-2">
            <label htmlFor="pet-avatar-upload" className="cursor-pointer relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-gray-300 group-hover:border-[#007699] transition-colors flex flex-col items-center justify-center bg-white relative">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Pet Avatar" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-[#007699] transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold">Change</span>
                </div>
              </div>
              <input
                id="pet-avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setProfileImage(file);
                    setAvatarPreview(URL.createObjectURL(file));
                  }
                }}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">Tap to update avatar</p>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <Fingerprint className="w-4 h-4 text-[#007699]" />
              Unique Handle (@pet_id)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              {isHandleLocked 
                ? "Your pet's handle has been set and cannot be changed again." 
                : "You can only set this handle once. Choose carefully!"}
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
              <Input
                placeholder="pet_handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                disabled={isHandleLocked}
                className="bg-white focus-visible:ring-[#007699] h-11 rounded-xl pl-8 font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Name *</label>
            <Input
              placeholder="Pet Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white focus-visible:ring-[#007699] h-11 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Category</label>
              <Popover open={openCategory} onOpenChange={setOpenCategory} modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCategory}
                    className="w-full justify-between bg-white focus-visible:ring-[#007699] h-11 rounded-xl font-normal"
                  >
                    {type
                      ? categoriesList.find((c) => c.toLowerCase() === type.toLowerCase()) || type
                      : "Select Category"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                  <Command>
                    <CommandInput placeholder="Search category..." />
                    <CommandList className="max-h-[250px] overflow-y-auto touch-auto overscroll-contain pointer-events-auto">
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        {categoriesList.map((c) => (
                          <CommandItem
                            key={c}
                            value={c}
                            onSelect={() => {
                              setType(c);
                              setBreed("");
                              setOpenCategory(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                type.toLowerCase() === c.toLowerCase() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {c.charAt(0).toUpperCase() + c.slice(1)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Breed</label>
              <Popover open={openBreed} onOpenChange={setOpenBreed} modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openBreed}
                    disabled={!type}
                    className="w-full justify-between bg-white focus-visible:ring-[#007699] h-11 rounded-xl font-normal"
                  >
                    {breed
                      ? availableBreeds.find((b) => b.name === breed)?.name || breed
                      : type ? "Select Breed" : "Category First"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                  <Command>
                    <CommandInput placeholder="Search breed..." />
                    <CommandList className="max-h-[250px] overflow-y-auto touch-auto overscroll-contain pointer-events-auto">
                      <CommandEmpty>No breeds found.</CommandEmpty>
                      <CommandGroup>
                        {availableBreeds.map((b) => (
                          <CommandItem
                            key={b.id}
                            value={b.name}
                            onSelect={() => {
                              setBreed(b.name);
                              setOpenBreed(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                breed === b.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {b.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Gender</label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="bg-white focus-visible:ring-[#007699] h-11 rounded-xl">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Date of Birth</label>
              <Input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="bg-white focus-visible:ring-[#007699] h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">State</label>
              <Select value={selectedStateCode} onValueChange={setSelectedStateCode}>
                <SelectTrigger className="bg-white focus-visible:ring-[#007699] h-11 rounded-xl">
                  <SelectValue placeholder={ownerCountry ? "Select State" : "Owner country not set"} />
                </SelectTrigger>
                <SelectContent>
                  {availableStates.map(st => (
                    <SelectItem key={st.isoCode} value={st.isoCode}>{st.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">District / City</label>
              <Select value={selectedCityName} onValueChange={setSelectedCityName} disabled={!selectedStateCode}>
                <SelectTrigger className="bg-white focus-visible:ring-[#007699] h-11 rounded-xl">
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map(city => (
                    <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 pt-2 pb-2">
            <h3 className="font-bold text-sm text-gray-900">
              Pet Status <span className="text-muted-foreground font-normal">(Optional)</span>
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {statusOptions.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-input bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[#007699] cursor-pointer rounded"
                    checked={status[key]}
                    onChange={(e) => setStatus({ ...status, [key]: e.target.checked })}
                  />
                </label>
              ))}
            </div>
          </div>

        </div>

        <div className="flex justify-end p-5 border-t border-gray-100 bg-white mt-auto shrink-0 z-10 gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="rounded-xl px-6 h-11">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="cursor-pointer bg-[#007699] hover:bg-[#005a75] text-white rounded-xl px-8 h-11"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
