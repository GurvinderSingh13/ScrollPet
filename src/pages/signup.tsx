import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Menu, X, Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { supabase } from "@/lib/supabase";

import { Country, State } from 'country-state-city';

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
  const [openCountry, setOpenCountry] = useState(false);
  const [openState, setOpenState] = useState(false);
  const [error, setError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const countries = Country.getAllCountries();

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/chat-interface` },
    });
    if (oauthError) {
      setError(oauthError.message || "Google sign-in failed.");
      setIsGoogleLoading(false);
    }
  };

  const states = country ? State.getStatesOfCountry(country) : [];

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
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username,
            country: country ? Country.getCountryByCode(country)?.name : undefined,
            state: state && country ? State.getStateByCodeAndCountry(state, country)?.name : undefined,
          },
        },
      });
      
      if (authError) {
        setError(authError.message || "Registration failed");
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
              <Popover open={openCountry} onOpenChange={setOpenCountry}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCountry}
                    className="justify-between rounded-full border-gray-200 bg-white py-6 px-6 text-base text-gray-500 hover:text-gray-500 focus:ring-0 shadow-sm h-14 w-full"
                  >
                    {country
                      ? countries.find((c) => c.isoCode === country)?.name
                      : "Select Country"}
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
                              setCountry(c.isoCode === country ? "" : c.isoCode);
                              setState("");
                              setOpenCountry(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                country === c.isoCode ? "opacity-100" : "opacity-0"
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

              <Popover open={openState} onOpenChange={setOpenState}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openState}
                    disabled={!country || states.length === 0}
                    className="justify-between rounded-full border-gray-200 bg-white py-6 px-6 text-base text-gray-500 hover:text-gray-500 focus:ring-0 shadow-sm h-14 w-full"
                  >
                    {state
                      ? states.find((s) => s.isoCode === state)?.name
                      : !country 
                        ? "Select Country First" 
                        : states.length === 0 
                          ? "No States Available" 
                          : "Select State"}
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
                              setState(s.isoCode === state ? "" : s.isoCode);
                              setOpenState(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                state === s.isoCode ? "opacity-100" : "opacity-0"
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

            {/* Legal checkbox */}
            <label className="flex items-start gap-3 cursor-pointer select-none" data-testid="label-terms-agree">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#FF6600] cursor-pointer shrink-0"
                data-testid="checkbox-terms"
              />
              <span className="text-sm text-gray-500 leading-snug">
                I agree to the{" "}
                <Link href="/terms">
                  <span className="font-semibold text-[#FF6600] hover:underline cursor-pointer underline-offset-4">Terms of Service</span>
                </Link>
                {" "}and{" "}
                <Link href="/privacy">
                  <span className="font-semibold text-[#FF6600] hover:underline cursor-pointer underline-offset-4">Privacy Policy</span>
                </Link>
              </span>
            </label>

            <div className="pt-2 flex justify-center">
              <Button 
                type="submit" 
                className="w-48 py-6 rounded-full text-lg font-bold bg-[#FF6600] hover:bg-[#FF6600]/90 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !agreedToTerms}
                data-testid="button-signup"
              >
                {isLoading ? "Signing up..." : "Sign Up"}
              </Button>
            </div>
          </form>

          {/* OR divider */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google OAuth button */}
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading}
              data-testid="button-google-signup"
              className="w-full max-w-sm py-6 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold shadow-sm transition-all gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <svg className="w-5 h-5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              <span>{isGoogleLoading ? "Redirecting…" : "Continue with Google"}</span>
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
