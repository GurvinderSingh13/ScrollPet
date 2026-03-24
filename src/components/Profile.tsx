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
  Loader2
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

/* ────────────────────────────────────────────
   Category icon map — shows a contextual icon
   next to the dropdown once selected.
   ──────────────────────────────────────────── */
const categoryIcons: Record<string, React.ReactNode> = {
  dog: <Dog className="h-4 w-4" />,
  cat: <Cat className="h-4 w-4" />,
  bird: <Bird className="h-4 w-4" />,
  other: <PawPrint className="h-4 w-4" />,
};

/* ────────────────────────────────────────────
   Dynamic Breed Mapping based on Category
   ──────────────────────────────────────────── */
const CATEGORY_BREEDS: Record<string, string[]> = {
  dog: ["Labrador Retriever", "German Shepherd", "Golden Retriever", "French Bulldog", "Poodle", "Beagle", "Rottweiler", "Bulldog", "Dachshund", "Siberian Husky", "Mixed/Other"],
  cat: ["Persian", "Maine Coon", "Siamese", "Ragdoll", "Bengal", "Sphynx", "British Shorthair", "Scottish Fold", "Abyssinian", "Mixed/Other"],
  bird: ["Parakeet", "Cockatiel", "Macaw", "Canary", "Finch", "Cockatoo", "African Grey", "Lovebird", "Other"],
  fish: ["Betta", "Goldfish", "Guppy", "Tetra", "Angelfish", "Corydoras", "Oscar", "Molly", "Pleco", "Other"],
  rabbit: ["Holland Lop", "Mini Rex", "Netherland Dwarf", "Lionhead", "Flemish Giant", "New Zealand", "Other"],
  hamster: ["Syrian", "Roborovski", "Campbell's Dwarf", "Winter White", "Chinese", "Other"],
  turtle: ["Red-Eared Slider", "Box Turtle", "Painted Turtle", "Russian Tortoise", "Sulcata Tortoise", "Other"],
  "guinea-pig": ["American", "Abyssinian", "Peruvian", "Silkie", "Teddy", "Skinny Pig", "Other"],
  horse: ["Arabian", "Quarter Horse", "Thoroughbred", "Appaloosa", "Paint", "Clydesdale", "Morgan", "Friesian", "Pony", "Other"]
};

/* ──────────── Framer Motion helpers ──────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: "easeOut" },
  }),
};

interface ProfileProps {
  /** When provided, renders a close/back button and suppresses the full-page background. */
  onClose?: () => void;
}

export default function Profile({ onClose }: ProfileProps) {
  /* ── Local form state (no backend wiring yet) ── */
  const [petName, setPetName] = useState("");
  const [category, setCategory] = useState("");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [location, setLocation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to register a pet.");
      return;
    }

    if (!petName || !category || !breed || !gender || !dob || !location) {
      setError("Please fill out all fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const insertData = {
        user_id: user.id,
        name: petName,
        type: category, // dog, cat, etc
        breed: breed,
        gender: gender,
        dob: dob,
        location: location,
      };

      const { error: insertError } = await supabase.from('pets').insert(insertData);

      if (insertError) {
        throw insertError;
      }

      // Invalidate the query to trigger a refetch in UserProfile
      queryClient.invalidateQueries({ queryKey: ['pets', user.id] });

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

  /* When used inside a Dialog modal, skip the full-page wrapper */
  const isModal = !!onClose;

  const formContent = (
    <Card className={`border-border/60 shadow-xl backdrop-blur-sm bg-card/80 ${isModal ? "border-0 shadow-lg bg-white rounded-2xl text-slate-900" : ""}`}>
      {/* ───────── Header ───────── */}
      <CardHeader className="text-center space-y-3 pb-2 relative">
        {/* Back / Close button */}
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
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg"
        >
          <PawPrint className="h-7 w-7" />
        </motion.div>

        <CardTitle className="text-2xl">Register Your Pet</CardTitle>
        <CardDescription className="text-muted-foreground max-w-xs mx-auto">
          Add a new furry (or feathery!) friend to the ScrollPet community.
        </CardDescription>
      </CardHeader>

      {/* ───────── Form ───────── */}
      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Pet Name */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="space-y-2"
          >
            <Label htmlFor="pet-name" className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Pet Name
            </Label>
            <Input
              id="pet-name"
              placeholder="e.g. Luna, Milo, Kiwi…"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              className="h-10 bg-background/60 focus-visible:bg-background transition-colors"
            />
          </motion.div>

          {/* Category & Breed — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="space-y-2"
            >
              <Label htmlFor="category" className="flex items-center gap-1.5">
                {category ? categoryIcons[category] : <PawPrint className="h-3.5 w-3.5 text-primary" />}
                Category
              </Label>
              <Select
                value={category}
                onValueChange={(val: string) => {
                  setCategory(val);
                  setBreed(""); // Reset breed when category changes
                }}
              >
                <SelectTrigger id="category" className="h-10 bg-background/60">
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBreed(e.target.value)}
                  className="h-10 bg-background/60 focus-visible:bg-background transition-colors"
                />
              ) : (
                <Select value={breed} onValueChange={setBreed} disabled={!category}>
                  <SelectTrigger id="breed" className="h-10 bg-background/60">
                    <SelectValue placeholder={category ? "Select Breed" : "Select Category First"} />
                  </SelectTrigger>
                  <SelectContent>
                    {category && CATEGORY_BREEDS[category]?.map((b) => (
                      <SelectItem key={b} value={b.toLowerCase().replace(/[\s/]/g, '-')}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </motion.div>
          </div>

          {/* Gender & Age — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="space-y-2"
            >
              <Label htmlFor="gender" className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-primary" />
                Gender
              </Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender" className="h-10 bg-background/60">
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
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Date of Birth
              </Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="h-10 bg-background/60 focus-visible:bg-background transition-colors"
                max={new Date().toISOString().split("T")[0]}
              />
            </motion.div>
          </div>

          {/* Location */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
            className="space-y-2"
          >
            <Label htmlFor="location" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="City, State or Country"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-10 bg-background/60 focus-visible:bg-background transition-colors"
            />
          </motion.div>

          {/* Submit */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={6}
            className="pt-2"
          >
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold gap-2 transition-all duration-300"
              disabled={submitted || isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registering...
                </span>
              ) : submitted ? (
                <motion.span
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Pet Registered!
                </motion.span>
              ) : (
                <span className="flex items-center gap-2">
                  <PawPrint className="h-4 w-4" />
                  Register Pet
                </span>
              )}
            </Button>
          </motion.div>
        </form>

        {/* Footer hint */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={7}
          className="text-xs text-muted-foreground text-center mt-5"
        >
          Your pet's profile will be visible to the ScrollPet community.
        </motion.p>
      </CardContent>
    </Card>
  );

  /* ── Full-page mode (standalone /profile route) ── */
  if (!isModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-background flex items-center justify-center px-4 py-12">
        {/* Decorative floating shapes */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl"
            animate={{ y: [0, 30, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-secondary/5 blur-3xl"
            animate={{ y: [0, -25, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

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

  /* ── Modal mode (inside Dialog) ── */
  return formContent;
}
