import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PawPrint,
  Dog,
  Cat,
  Bird,
  MapPin,
  Calendar as CalendarIcon,
  Sparkles,
  Heart,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Video as VideoIcon,
} from "lucide-react";

import { format } from "date-fns";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const categoryIcons: Record<string, React.ReactNode> = {
  dog: <Dog className="h-4 w-4" />,
  cat: <Cat className="h-4 w-4" />,
  bird: <Bird className="h-4 w-4" />,
  other: <PawPrint className="h-4 w-4" />,
};

interface DbCategory {
  id: string;
  name: string;
}

interface DbBreed {
  id: string;
  name: string;
  category_id: string;
}

const fadeUp: any = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: "easeOut" },
  }),
};

interface ProfileProps {
  onClose?: () => void;
}

export default function Profile({ onClose }: any) {
  const [petName, setPetName] = useState("");
  const [category, setCategory] = useState("");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [location, setLocation] = useState("");

  // Media States
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [showcaseImages, setShowcaseImages] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Dynamic categories from Supabase
  const { data: dbCategories = [] } = useQuery({
    queryKey: ["pet-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as DbCategory[];
    },
  });

  // Find the selected category object to get its proper ID
  const selectedCategoryObj = dbCategories.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "-") === category
  );

  // Dynamic breeds from Supabase based on selected category
  const { data: dbBreeds = [], isLoading: isLoadingBreeds } = useQuery({
    queryKey: ["pet-breeds", selectedCategoryObj?.id],
    queryFn: async () => {
      if (!selectedCategoryObj?.id) return [];
      const { data, error } = await supabase
        .from("breeds")
        .select("*")
        .eq("category_id", selectedCategoryObj.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as DbBreed[];
    },
    enabled: !!selectedCategoryObj?.id,
  });

  const handleShowcaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 3) {
        setError("Maximum 3 showcase images allowed.");
        return;
      }
      setShowcaseImages(files);
      setError(null);
    }
  };

  const uploadFile = async (file: File, folder: string) => {
    // Safety check for file sizes (5MB for images, 50MB for video)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to register a pet.");
      return;
    }

    if (!petName || !category || !breed || !gender || !birthDay || !birthMonth || !birthYear || !location) {
      setError("Please fill out all required text fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let profileUrl = null;
      let showcase1 = null;
      let showcase2 = null;
      let showcase3 = null;
      let vidUrl = null;

      // Upload media if provided
      if (profileImage)
        profileUrl = await uploadFile(profileImage, "pets/profiles");
      if (showcaseImages[0])
        showcase1 = await uploadFile(showcaseImages[0], "pets/showcase");
      if (showcaseImages[1])
        showcase2 = await uploadFile(showcaseImages[1], "pets/showcase");
      if (showcaseImages[2])
        showcase3 = await uploadFile(showcaseImages[2], "pets/showcase");
      if (videoFile) vidUrl = await uploadFile(videoFile, "pets/videos");

      const insertData = {
        user_id: user.id,
        name: petName,
        type: category,
        breed: breed,
        gender: gender,
        dob: `${birthYear}-${birthMonth}-${birthDay}`,
        location: location,
        image_url: profileUrl,
        showcase_image_1: showcase1,
        showcase_image_2: showcase2,
        showcase_image_3: showcase3,
        video_url: vidUrl,
      };

      const { error: insertError } = await supabase
        .from("pets")
        .insert(insertData);
      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["pets", user.id] });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose?.();
      }, 2400);
    } catch (err: any) {
      console.error("Error registering pet:", err);
      setError(err.message || "Failed to register pet. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isModal = !!onClose;

  const formContent = (
    <Card
      className={`border-border/60 shadow-2xl backdrop-blur-md bg-white ${isModal ? "border-0 shadow-none bg-white rounded-3xl text-slate-900 overflow-hidden" : ""}`}
    >
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 p-6 text-white relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute left-4 top-4 flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        <div className="flex flex-col items-center relative z-10 text-center space-y-2 mt-4">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 18,
              delay: 0.15,
            }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-indigo-600 shadow-xl border-4 border-indigo-200/30"
          >
            <PawPrint className="h-8 w-8" />
          </motion.div>

          <CardTitle className="text-2xl font-extrabold tracking-tight pt-2">Create Pet Profile</CardTitle>
          <CardDescription className="text-indigo-100 max-w-xs mx-auto text-sm font-medium">
            Build a dedicated digital passport for your own pet.
          </CardDescription>
        </div>
      </div>

      <CardContent className="max-h-[65vh] overflow-y-auto no-scrollbar p-6 bg-slate-50/50">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 sticky top-0 z-10 shadow-sm">
            <Sparkles className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity Section */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="space-y-2 bg-white p-4 rounded-2xl border border-indigo-50 shadow-sm"
          >
            <Label htmlFor="pet-name" className="flex items-center gap-1.5 font-bold text-indigo-900">
              <Sparkles className="h-4 w-4 text-fuchsia-500" /> Pet Name
            </Label>
            <Input
              id="pet-name"
              placeholder="e.g. Luna, Milo..."
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              className="h-12 bg-slate-50/50 border-indigo-100 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 rounded-xl text-lg font-medium"
            />
          </motion.div>

          <div className="bg-white p-4 rounded-2xl border border-indigo-50 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="space-y-2"
              >
                <Label htmlFor="category" className="flex items-center gap-1.5 font-semibold text-slate-700">
                  {category ? (
                    categoryIcons[category]
                  ) : (
                    <PawPrint className="h-4 w-4 text-indigo-500" />
                  )}{" "}
                  Category
                </Label>
                <Select
                  value={category}
                  onValueChange={(val: string) => {
                    setCategory(val);
                    setBreed("");
                  }}
                >
                  <SelectTrigger id="category" className="h-11 bg-slate-50/50 border-indigo-100 rounded-xl">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {dbCategories.length > 0 ? (
                      dbCategories.map((cat) => (
                        <SelectItem
                          key={cat.id}
                          value={cat.name.toLowerCase().replace(/\s+/g, "-")}
                        >
                          {cat.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="dog">🐕 Dog</SelectItem>
                        <SelectItem value="cat">🐈 Cat</SelectItem>
                        <SelectItem value="bird">🐦 Bird</SelectItem>
                        <SelectItem value="fish">🐟 Fish</SelectItem>
                        <SelectItem value="rabbit">🐰 Rabbit</SelectItem>
                        <SelectItem value="hamster">🐹 Hamster</SelectItem>
                        <SelectItem value="turtle">🐢 Turtle</SelectItem>
                        <SelectItem value="guinea-pig">🐹 Guinea Pig</SelectItem>
                        <SelectItem value="horse">🐎 Horse</SelectItem>
                        <SelectItem value="other">🐾 Other</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
                className="space-y-2"
              >
                <Label htmlFor="breed" className="font-semibold text-slate-700">Breed</Label>
                {category === "other" ? (
                  <Input
                    id="breed"
                    placeholder="Enter breed..."
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="h-11 bg-slate-50/50 border-indigo-100 rounded-xl"
                  />
                ) : (
                  <Select
                    value={breed}
                    onValueChange={setBreed}
                    disabled={!category || isLoadingBreeds}
                  >
                    <SelectTrigger id="breed" className="h-11 bg-slate-50/50 border-indigo-100 rounded-xl">
                      <SelectValue
                        placeholder={
                          isLoadingBreeds
                            ? "Loading..."
                            : category
                            ? "Select Breed"
                            : "Category First"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {dbBreeds.length > 0 ? (
                        dbBreeds.map((b) => (
                          <SelectItem key={b.id} value={b.name}>
                            {b.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                          No breeds found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3}
                className="space-y-2"
              >
                <Label htmlFor="gender" className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Heart className="h-4 w-4 text-rose-500" /> Gender
                </Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender" className="h-11 bg-slate-50/50 border-indigo-100 rounded-xl">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="unknown">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={4}
                className="space-y-2"
              >
                <Label htmlFor="dob" className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <CalendarIcon className="h-4 w-4 text-indigo-500" /> Birthday
                </Label>
                <div className="flex gap-2 w-full">
                  <select
                    className="flex h-11 w-full rounded-xl border border-indigo-100 bg-slate-50/50 px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                  >
                    <option value="" disabled>DD</option>
                    {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    className="flex h-11 w-full rounded-xl border border-indigo-100 bg-slate-50/50 px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                  >
                    <option value="" disabled>MM</option>
                    {[
                      { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' }, { value: '03', label: 'Mar' },
                      { value: '04', label: 'Apr' }, { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
                      { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' }, { value: '09', label: 'Sep' },
                      { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' }
                    ].map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <select
                    className="flex h-11 w-full rounded-xl border border-indigo-100 bg-slate-50/50 px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                  >
                    <option value="" disabled>YYYY</option>
                    {Array.from({ length: new Date().getFullYear() - 1980 + 1 }, (_, i) => String(new Date().getFullYear() - i)).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            </div>
            
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={5}
              className="space-y-2 pt-2 border-t border-indigo-50"
            >
              <Label htmlFor="location" className="flex items-center gap-1.5 font-semibold text-slate-700">
                <MapPin className="h-4 w-4 text-emerald-500" /> Home Location
              </Label>
              <Input
                id="location"
                placeholder="City, State or Country"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11 bg-slate-50/50 border-indigo-100 rounded-xl focus-visible:ring-indigo-500"
              />
            </motion.div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-indigo-50 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-indigo-900 flex items-center gap-2 border-b border-indigo-50 pb-2">
              <ImageIcon className="w-4 h-4 text-indigo-500" /> Digital Passport Media
            </h3>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={6}
              className="space-y-2"
            >
              <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Profile Avatar
              </Label>
              <div className="flex items-center w-full">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                  className="bg-slate-50 border-indigo-100 text-sm cursor-pointer file:bg-indigo-100 file:text-indigo-700 file:border-0 file:rounded-lg file:px-4 file:py-1.5 file:mr-4 hover:file:bg-indigo-200 file:font-semibold rounded-xl h-12"
                />
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={7}
              className="space-y-2"
            >
              <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Gallery Images (Max 3)
              </Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleShowcaseChange}
                className="bg-slate-50 border-indigo-100 text-sm cursor-pointer file:bg-purple-100 file:text-purple-700 file:border-0 file:rounded-lg file:px-4 file:py-1.5 file:mr-4 hover:file:bg-purple-200 file:font-semibold rounded-xl h-12"
              />
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={8}
              className="space-y-2"
            >
              <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <VideoIcon className="w-3 h-3" /> Profile Video (Max 50MB)
              </Label>
              <Input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="bg-slate-50 border-indigo-100 text-sm cursor-pointer file:bg-fuchsia-100 file:text-fuchsia-700 file:border-0 file:rounded-lg file:px-4 file:py-1.5 file:mr-4 hover:file:bg-fuchsia-200 file:font-semibold rounded-xl h-12"
              />
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={9}
            className="pt-2 pb-4"
          >
            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
              disabled={submitted || isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Creating Passport...
                </span>
              ) : submitted ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" /> Passport Created!
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <PawPrint className="h-5 w-5" /> Create Pet Passport
                </span>
              )}
            </Button>
          </motion.div>
        </form>
      </CardContent>
    </Card>
  );

  if (!isModal) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-lg relative z-10"
        >
          {formContent}
        </motion.div>
      </div>
    );
  }

  return formContent;
}
