import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Country, State } from "country-state-city";
import { INDIA_LOCATIONS } from "@/data/indiaLocations";
import { PET_CATEGORIES } from "@/constants/config";
import { ChevronDown, Loader2, UploadCloud, X, ImageIcon, VideoIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const INTENT_OPTIONS = [
  "For Adoption",
  "For Sale",
  "His/Her pups for Adoption",
  "His/Her pups for Sale",
  "Available for Mating",
  "Open for Exchange",
  "Lost",
  "Dead",
];

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  postToEdit?: any | null;
}

export function CreatePostModal({ isOpen, onClose, onSuccess, postToEdit }: CreatePostModalProps) {
  const isEditing = !!postToEdit;
  const { user } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [intent, setIntent] = useState("");
  const [category, setCategory] = useState("");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("IN");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [ageValue, setAgeValue] = useState("");
  const [ageUnit, setAgeUnit] = useState("Months");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill user location
  useEffect(() => {
    const fetchUserLoc = async () => {
      if (!user?.id || isEditing) return;
      const { data } = await supabase.from("users").select("country, state").eq("id", user.id).single();
      if (data) {
        if (data.country) {
          const c = Country.getAllCountries().find(x => x.name === data.country);
          if (c) {
            setCountry(c.isoCode);
            if (data.state) {
              const s = State.getStatesOfCountry(c.isoCode).find(x => x.name === data.state);
              if (s) {
                setState(s.isoCode);
              }
            }
          }
        }
      }
    };
    if (isOpen) {
      fetchUserLoc();
    }
  }, [user?.id, isOpen, isEditing]);

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["explore-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  const categoryId: string | null = category 
    ? ((dbCategories.find((c: any) => c.name.toLowerCase() === category.toLowerCase()) as any)?.id ?? null)
    : null;

  const { data: availableBreeds = [] } = useQuery({
    queryKey: ["explore-breeds", categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const { data, error } = await supabase.from("breeds").select("id, name").eq("category_id", categoryId).order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!categoryId && isOpen,
  });

  const availableStates = country ? State.getStatesOfCountry(country) : [];
  const selectedStateName = state ? (availableStates.find((s) => s.isoCode === state)?.name ?? "") : "";
  const availableDistricts = selectedStateName ? (INDIA_LOCATIONS.find((s) => s.name === selectedStateName)?.districts ?? []) : [];

  useEffect(() => {
    if (postToEdit) {
      setIntent(postToEdit.intent_status || "");
      setCategory(postToEdit.pet_type || postToEdit.category || "");
      setGender(postToEdit.gender || "");
      
      const match = (postToEdit.age || "").match(/^(\d+)\s+(Days?|Months?|Years?)$/i);
      if (match) {
        setAgeValue(match[1]);
        setAgeUnit(match[2].endsWith('s') ? match[2] : match[2] + 's');
      } else {
        setAgeValue("");
        setAgeUnit("Months");
      }
      
      setPrice(postToEdit.price ? postToEdit.price.toString() : "");
      setDescription(postToEdit.text_content || "");
      setPreviewUrl(postToEdit.display_image || null);
      
      if (postToEdit.crosspost_rooms && Array.isArray(postToEdit.crosspost_rooms) && postToEdit.crosspost_rooms.length > 0) {
        const room = postToEdit.crosspost_rooms.find((r: string) => r.startsWith("city:") || r.startsWith("state:") || r.startsWith("country:"));
        if (room) {
          const locPart = room.split("::")[0];
          const parts = locPart.split(":");
          if (parts[1]) setCountry(parts[1]);
          if (parts[2]) setState(parts[2]);
          if (parts[3]) setDistrict(parts[3]);
        }
      }
    }
  }, [postToEdit]);

  useEffect(() => {
    if (postToEdit && postToEdit.breed && availableBreeds.length > 0 && !breed) {
      const breedMatch = availableBreeds.find((b: any) => b.name.toLowerCase().replace(/\s+/g, '-') === postToEdit.breed);
      if (breedMatch) {
        setBreed(breedMatch.id);
      }
    }
  }, [postToEdit, availableBreeds, breed]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleRemoveMedia = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({ description: "You must be logged in to post.", variant: "destructive" });
      return;
    }
    if (!intent) {
      toast({ description: "Please select an Intent.", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ description: "Please select a Category.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      let mediaUrl = null;
      let mediaType = 'text';

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('pet_media')
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload Error:", uploadError);
          toast({ 
            description: "Failed to upload media. Please ensure the 'pet_media' bucket exists in your Supabase dashboard and is set to Public.", 
            variant: "destructive",
            duration: 7000
          });
          setIsSubmitting(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('pet_media')
          .getPublicUrl(filePath);
          
        mediaUrl = publicUrl;
        mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      }

      const selectedBreed = availableBreeds.find(b => b.id === breed);
      const breedSlug = selectedBreed ? selectedBreed.name.toLowerCase().replace(/\s+/g, '-') : null;

      let locPrefix = "global";
      if (country && country !== "all") {
        if (state && state !== "all") {
          if (district && district !== "all") {
            locPrefix = `city:${country}:${state}:${district}`;
          } else {
            locPrefix = `state:${country}:${state}`;
          }
        } else {
          locPrefix = `country:${country}`;
        }
      }

      const finalAge = ageValue && ageUnit ? `${ageValue} ${ageUnit}` : null;

      const selectedCountryName = country && country !== "all" ? (Country.getAllCountries().find(c => c.isoCode === country)?.name ?? "") : "";
      const locationString = [
        district && district !== "all" ? district : "", 
        selectedStateName, 
        selectedCountryName
      ].filter(Boolean).join(", ");

      const postData: any = {
        user_id: user.id,
        content: description || "",
        message_type: mediaType,
        media_url: mediaUrl,
        intent_status: intent,
        pet_type: category,
        breed: breedSlug,
        gender: gender || null,
        age: finalAge,
        price: price ? parseInt(price, 10) : null,
        location: locationString || "explore_feed",
        crosspost_rooms: [`${locPrefix}::explore_feed::explore_feed`]
      };

      if (postToEdit) {
        if (!mediaUrl && !file) {
          delete postData.media_url;
          delete postData.message_type;
        }
        
        postData.created_at = new Date().toISOString();
        const { error: dbError } = await supabase
          .from("messages")
          .update(postData)
          .eq('id', postToEdit.id)
          .eq('user_id', user.id);

        if (dbError) throw dbError;
        toast({ description: "Post updated successfully!" });
      } else {
        const { error: dbError } = await supabase.from("messages").insert(postData);
        if (dbError) throw dbError;
        toast({ description: "Post created successfully!" });
      }

      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      console.error("Post creation error:", err);
      toast({ description: err.message || "Failed to save post.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewUrl(null);
    setIntent("");
    setCategory("");
    setBreed("");
    setGender("");
    setAgeValue("");
    setAgeUnit("Months");
    setPrice("");
    setDistrict("");
    setDescription("");
    // We intentionally don't reset country and state, they can stay as the auto-filled defaults
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white border border-gray-100 shadow-xl">
        <DialogHeader className="p-4 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-10">
          <DialogTitle className="text-xl font-bold text-gray-900">
            {isEditing ? "Edit Post" : "Create Post"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Media Upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Media</label>
            {!previewUrl ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 hover:border-[#007699] hover:bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <ImageIcon className="w-6 h-6" />
                  <VideoIcon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-600">Upload Photo or Video</span>
                <span className="text-xs text-gray-400 mt-1">Maximum size 50MB</span>
              </div>
            ) : (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
                {file?.type.startsWith('video/') ? (
                  <video src={previewUrl} className="max-w-full max-h-full" controls playsInline />
                ) : (
                  <img src={previewUrl} className="max-w-full max-h-full object-contain" alt="Preview" />
                )}
                <button
                  onClick={handleRemoveMedia}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*,video/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Intent */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-semibold text-gray-700">Intent / Tag *</label>
              <div className="relative">
                <select
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="w-full text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors"
                >
                  <option value="" disabled>Select Intent</option>
                  {INTENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Category *</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setBreed(""); }}
                  className="w-full text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors"
                >
                  <option value="" disabled>Select Category</option>
                  {PET_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Breed */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Breed</label>
              <div className="relative">
                <select
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  disabled={availableBreeds.length === 0}
                  className="w-full text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Select Breed</option>
                  {availableBreeds.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Gender</label>
              <div className="relative">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors"
                >
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Pair">Pair</option>
                  <option value="Lot">Lot</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Age - Compound Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Age</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={ageValue}
                  onChange={(e) => setAgeValue(e.target.value)}
                  placeholder="0"
                  className="w-1/2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none hover:border-[#007699] focus:border-[#007699] transition-colors"
                />
                <div className="relative w-1/2">
                  <select
                    value={ageUnit}
                    onChange={(e) => setAgeUnit(e.target.value)}
                    className="w-full text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors"
                  >
                    <option value="Days">Days</option>
                    <option value="Months">Months</option>
                    <option value="Years">Years</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Price (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none hover:border-[#007699] focus:border-[#007699] transition-colors"
                min="0"
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Country</label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => { setCountry(e.target.value); setState(""); setDistrict(""); }}
                  className="w-full text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors"
                >
                  <option value="" disabled>Select Country</option>
                  <option value="IN">India</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">State</label>
              <div className="relative">
                <select
                  value={state}
                  onChange={(e) => { setState(e.target.value); setDistrict(""); }}
                  disabled={!country}
                  className="w-full text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Select State</option>
                  {availableStates.map((s) => (
                    <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* District */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-semibold text-gray-700">District / City</label>
              <div className="relative">
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={availableDistricts.length === 0}
                  className="w-full text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 outline-none cursor-pointer appearance-none hover:border-[#007699] focus:border-[#007699] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Select District</option>
                  {availableDistricts.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about your post..."
                className="w-full min-h-[100px] text-sm text-gray-700 bg-white border border-gray-200 rounded-xl p-3 outline-none resize-y hover:border-[#007699] focus:border-[#007699] transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/80 rounded-b-2xl">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="rounded-xl">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !intent || !category} 
            className="rounded-xl bg-[#007699] hover:bg-[#005a75] text-white font-semibold flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {isEditing ? "Save Changes" : "Post to Explore"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
