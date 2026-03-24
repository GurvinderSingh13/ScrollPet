import { useState } from "react";
import { motion } from "framer-motion";
import {
  PawPrint,
  Dog,
  Cat,
  Bird,
  MapPin,
  Calendar,
  Sparkles,
  Heart,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Video as VideoIcon,
} from "lucide-react";

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
import { useQueryClient } from "@tanstack/react-query";

const categoryIcons: Record<string, React.ReactNode> = {
  dog: <Dog className="h-4 w-4" />,
  cat: <Cat className="h-4 w-4" />,
  bird: <Bird className="h-4 w-4" />,
  other: <PawPrint className="h-4 w-4" />,
};

const CATEGORY_BREEDS: Record<string, string[]> = {
  dog: [
    "Labrador Retriever",
    "German Shepherd",
    "Golden Retriever",
    "French Bulldog",
    "Poodle",
    "Beagle",
    "Rottweiler",
    "Bulldog",
    "Dachshund",
    "Siberian Husky",
    "Mixed/Other",
  ],
  cat: [
    "Persian",
    "Maine Coon",
    "Siamese",
    "Ragdoll",
    "Bengal",
    "Sphynx",
    "British Shorthair",
    "Scottish Fold",
    "Abyssinian",
    "Mixed/Other",
  ],
  bird: [
    "Parakeet",
    "Cockatiel",
    "Macaw",
    "Canary",
    "Finch",
    "Cockatoo",
    "African Grey",
    "Lovebird",
    "Other",
  ],
  fish: [
    "Betta",
    "Goldfish",
    "Guppy",
    "Tetra",
    "Angelfish",
    "Corydoras",
    "Oscar",
    "Molly",
    "Pleco",
    "Other",
  ],
  rabbit: [
    "Holland Lop",
    "Mini Rex",
    "Netherland Dwarf",
    "Lionhead",
    "Flemish Giant",
    "New Zealand",
    "Other",
  ],
  hamster: [
    "Syrian",
    "Roborovski",
    "Campbell's Dwarf",
    "Winter White",
    "Chinese",
    "Other",
  ],
  turtle: [
    "Red-Eared Slider",
    "Box Turtle",
    "Painted Turtle",
    "Russian Tortoise",
    "Sulcata Tortoise",
    "Other",
  ],
  "guinea-pig": [
    "American",
    "Abyssinian",
    "Peruvian",
    "Silkie",
    "Teddy",
    "Skinny Pig",
    "Other",
  ],
  horse: [
    "Arabian",
    "Quarter Horse",
    "Thoroughbred",
    "Appaloosa",
    "Paint",
    "Clydesdale",
    "Morgan",
    "Friesian",
    "Pony",
    "Other",
  ],
};

const fadeUp = {
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

export default function Profile({ onClose }: ProfileProps) {
  const [petName, setPetName] = useState("");
  const [category, setCategory] = useState("");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
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

    if (!petName || !category || !breed || !gender || !dob || !location) {
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
        dob: dob,
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
      className={`border-border/60 shadow-xl backdrop-blur-sm bg-card/80 ${isModal ? "border-0 shadow-lg bg-white rounded-2xl text-slate-900" : ""}`}
    >
      <CardHeader className="text-center space-y-3 pb-2 relative">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute left-6 top-6 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 18,
            delay: 0.15,
          }}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#007699] to-[#007699]/70 text-white shadow-lg"
        >
          <PawPrint className="h-7 w-7" />
        </motion.div>

        <CardTitle className="text-2xl">Register Your Pet</CardTitle>
        <CardDescription className="text-muted-foreground max-w-xs mx-auto">
          Add a new furry friend to the ScrollPet community.
        </CardDescription>
      </CardHeader>

      <CardContent className="max-h-[70vh] overflow-y-auto no-scrollbar pb-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2 sticky top-0 z-10">
            <Sparkles className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5 px-1">
          {/* Identity Section */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="space-y-2"
          >
            <Label htmlFor="pet-name" className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#FF6600]" /> Pet Name
            </Label>
            <Input
              id="pet-name"
              placeholder="e.g. Luna, Milo..."
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              className="h-10 bg-gray-50 focus-visible:bg-white transition-colors"
            />
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="space-y-2"
            >
              <Label htmlFor="category" className="flex items-center gap-1.5">
                {category ? (
                  categoryIcons[category]
                ) : (
                  <PawPrint className="h-3.5 w-3.5 text-[#007699]" />
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
                <SelectTrigger id="category" className="h-10 bg-gray-50">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
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
              <Label htmlFor="breed">Breed</Label>
              {category === "other" ? (
                <Input
                  id="breed"
                  placeholder="Enter breed..."
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="h-10 bg-gray-50"
                />
              ) : (
                <Select
                  value={breed}
                  onValueChange={setBreed}
                  disabled={!category}
                >
                  <SelectTrigger id="breed" className="h-10 bg-gray-50">
                    <SelectValue
                      placeholder={category ? "Select Breed" : "Category First"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {category &&
                      CATEGORY_BREEDS[category]?.map((b) => (
                        <SelectItem
                          key={b}
                          value={b.toLowerCase().replace(/[\s/]/g, "-")}
                        >
                          {b}
                        </SelectItem>
                      ))}
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
              <Label htmlFor="gender" className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-red-500" /> Gender
              </Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender" className="h-10 bg-gray-50">
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
              <Label htmlFor="dob" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#007699]" /> Date of
                Birth
              </Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="h-10 bg-gray-50"
                max={new Date().toISOString().split("T")[0]}
              />
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
            className="space-y-2"
          >
            <Label htmlFor="location" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-green-600" /> Location
            </Label>
            <Input
              id="location"
              placeholder="City, State or Country"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-10 bg-gray-50"
            />
          </motion.div>

          <div className="border-t border-gray-100 pt-5 mt-5 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#FF6600]" /> Pet Media
              Showcase (Optional)
            </h3>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={6}
              className="space-y-2"
            >
              <Label className="text-xs text-gray-500 font-semibold uppercase">
                Profile Avatar
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                className="bg-gray-50 text-sm cursor-pointer file:bg-[#007699] file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 hover:file:bg-[#005a75]"
              />
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={7}
              className="space-y-2"
            >
              <Label className="text-xs text-gray-500 font-semibold uppercase">
                Showcase Images (Max 3)
              </Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleShowcaseChange}
                className="bg-gray-50 text-sm cursor-pointer file:bg-[#007699] file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 hover:file:bg-[#005a75]"
              />
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={8}
              className="space-y-2"
            >
              <Label className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-1">
                <VideoIcon className="w-3 h-3" /> Profile Video (Max 50MB)
              </Label>
              <Input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="bg-gray-50 text-sm cursor-pointer file:bg-[#FF6600] file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 hover:file:bg-[#e65c00]"
              />
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={9}
            className="pt-4"
          >
            <Button
              type="submit"
              className="w-full h-12 text-base font-bold bg-[#007699] hover:bg-[#005a75] text-white rounded-xl shadow-md"
              disabled={submitted || isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Uploading
                  Media...
                </span>
              ) : submitted ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" /> Registered!
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <PawPrint className="h-5 w-5" /> Complete Registration
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
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
