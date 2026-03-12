import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { 
  Menu,
  X,
  Facebook,
  Chrome
} from "lucide-react";
import { useState } from "react";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";

// Mock data for countries and states
const COUNTRIES = ["United States", "United Kingdom", "Canada", "Australia", "India", "Germany", "France", "Japan"];
const STATES = ["California", "New York", "Texas", "Florida", "Illinois", "Washington", "Oregon", "Nevada"];

export default function Signup() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          username, 
          email, 
          password,
          country: country || undefined,
          state: state || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }
      
      setLocation('/chat-interface');
    } catch (err) {
      setError("Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-foreground overflow-x-hidden flex flex-col relative">

      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="cursor-pointer">
            <img 
              src={logoImage} 
              alt="ScrollPet Logo" 
              className="h-10 md:h-12 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 bg-muted/50 px-6 py-2 rounded-full border border-border/50">
            <Link href="/" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Home</Link>
            <Link href="/chat" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Chat Rooms</Link>
            <Link href="/about" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">About Us</Link>
            <Link href="/faq" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">FAQ</Link>
            <Link href="/contact" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Contact Us</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
                <Button 
                variant="default"
                className="font-bold cursor-pointer rounded-full px-6"
                >
                Log In
                </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden cursor-pointer p-2 hover:bg-muted rounded-full transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t p-4 space-y-4 bg-background animate-in slide-in-from-top-5 shadow-2xl">
            <Link href="/" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Home</Link>
            <Link href="/chat" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Chat Rooms</Link>
            <Link href="/about" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">About Us</Link>
            <Link href="/faq" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">FAQ</Link>
            <Link href="/contact" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Contact Us</Link>
            <Link href="/login">
                <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg">
                Log In
                </Button>
            </Link>
          </div>
        )}
      </header>

      <main className="flex-grow flex items-center justify-center py-20 relative z-10 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-foreground mb-2">Sign Up</h1>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <Input 
              placeholder="Username" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              data-testid="input-username"
              className="rounded-full border border-gray-200 bg-white py-6 px-6 text-base placeholder:text-gray-400 focus:border-primary/50 focus:ring-0 transition-all shadow-sm"
            />

            <Input 
              type="email"
              placeholder="Email Address" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-email"
              className="rounded-full border border-gray-200 bg-white py-6 px-6 text-base placeholder:text-gray-400 focus:border-primary/50 focus:ring-0 transition-all shadow-sm"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="rounded-full border-gray-200 bg-white py-6 px-6 text-base text-gray-400 focus:ring-0 shadow-sm h-14" data-testid="select-country">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="rounded-full border-gray-200 bg-white py-6 px-6 text-base text-gray-400 focus:ring-0 shadow-sm h-14" data-testid="select-state">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {STATES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input 
              type="password" 
              placeholder="Enter Password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-password"
              className="rounded-full border border-gray-200 bg-white py-6 px-6 text-base placeholder:text-gray-400 focus:border-primary/50 focus:ring-0 transition-all shadow-sm"
            />

            <Input 
              type="password" 
              placeholder="Confirm Password" 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              data-testid="input-confirm-password"
              className="rounded-full border border-gray-200 bg-white py-6 px-6 text-base placeholder:text-gray-400 focus:border-primary/50 focus:ring-0 transition-all shadow-sm"
            />

            {error && (
              <div className="text-red-500 text-sm text-center font-medium" data-testid="text-error">
                {error}
              </div>
            )}

            <div className="pt-4 flex justify-center">
              <Button 
                type="submit" 
                className="w-48 py-6 rounded-full text-lg font-bold bg-[#FF6600] hover:bg-[#FF6600]/90 text-white shadow-md hover:shadow-lg transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Signing up..." : "Log In"}
              </Button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
            <Button className="flex-1 max-w-[240px] py-6 rounded-full bg-[#3b5998] hover:bg-[#3b5998]/90 text-white font-medium shadow-sm transition-all gap-3">
              <Facebook size={20} fill="white" className="text-white" />
              <span className="text-sm">Log In with Facebook</span>
            </Button>
            <Button variant="outline" className="flex-1 max-w-[240px] py-6 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium shadow-sm transition-all gap-3">
               {/* Using Chrome icon as Google placeholder since Lucide doesn't have Google */}
               <div className="relative flex items-center justify-center w-5 h-5">
                 <span className="text-lg font-bold">G</span>
               </div>
              <span className="text-sm">Log In with Google</span>
            </Button>
          </div>

          <div className="text-center text-sm font-medium mt-10 text-gray-500">
            <span>Already have account? </span>
            <Link href="/login">
              <span className="text-blue-500 hover:underline cursor-pointer underline-offset-4 decoration-blue-500/30">Log In</span>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-300 py-20 border-t border-gray-900 relative z-10">
        <div className="container px-6 mx-auto">
          <div className="grid md:grid-cols-12 gap-12 mb-16">
            <div className="col-span-12 md:col-span-4">
              <Link href="/" className="inline-block mb-6 opacity-90 hover:opacity-100 transition-opacity">
                 <img 
                  src={logoImage} 
                  alt="ScrollPet Logo" 
                  className="h-10 w-auto object-contain brightness-0 invert opacity-90"
                />
              </Link>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Connecting pet lovers worldwide in a safe, trusted environment. Join us in building the most positive pet community on the internet.
              </p>
              <div className="flex gap-4">
                {/* Social placeholders */}
                {[1,2,3].map(i => (
                  <div key={i} className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer">
                    <div className="w-5 h-5 bg-current rounded-sm opacity-50"></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-2 md:col-start-6">
              <h4 className="font-bold text-white mb-6 text-lg">Platform</h4>
              <ul className="space-y-3">
                <li><Link href="/" className="hover:text-primary transition-colors cursor-pointer">Home</Link></li>
                <li><Link href="/chat" className="hover:text-primary transition-colors cursor-pointer">Chat Rooms</Link></li>
                <li><Link href="/login" className="hover:text-primary transition-colors cursor-pointer">Login</Link></li>
                <li><Link href="/signup" className="hover:text-primary transition-colors cursor-pointer text-primary">Sign Up</Link></li>
              </ul>
            </div>

            <div className="col-span-6 md:col-span-2">
              <h4 className="font-bold text-white mb-6 text-lg">Company</h4>
              <ul className="space-y-3">
                <li><Link href="/about" className="hover:text-primary transition-colors cursor-pointer">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors cursor-pointer">Contact Us</Link></li>
                <li><Link href="/careers" className="hover:text-primary transition-colors cursor-pointer">Careers</Link></li>
                <li><Link href="/press" className="hover:text-primary transition-colors cursor-pointer">Press</Link></li>
              </ul>
            </div>

            <div className="col-span-6 md:col-span-2">
              <h4 className="font-bold text-white mb-6 text-lg">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="/privacy" className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors cursor-pointer">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-primary transition-colors cursor-pointer">Cookie Policy</Link></li>
                <li><Link href="/community-guidelines" className="hover:text-primary transition-colors cursor-pointer">Community Guidelines</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 gap-4">
            <div>© {new Date().getFullYear()} ScrollPet. All rights reserved.</div>
            <div className="flex gap-8">
              <span>Built for pet lovers 🐾</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
