import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Login() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const [resetEmail, setResetEmail] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!resetEmail) return;
    setIsResetLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + '/update-password',
      });
      
      if (error) {
        toast({
          title: "Reset Failed",
          description: error.message || "Failed to send reset link.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Email Sent!",
          description: "Check your email for the reset link!",
        });
        setIsResetDialogOpen(false);
        setResetEmail("");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (authError) {
        setError(authError.message || "Login failed");
        setIsLoading(false);
        return;
      }
      
      setLocation('/chat-interface');
    } catch (err) {
      setError("Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-white font-sans text-foreground overflow-x-hidden flex flex-col relative">

      {/* Header */}
      <header className="fixed w-full top-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm">
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
             {/* No Auth button on login page, or show Sign Up instead */}
            <Link href="/signup">
                <Button 
                variant="default"
                className="font-bold cursor-pointer rounded-full px-6"
                >
                Sign Up
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
            <Link href="/signup">
                <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg">
                Sign Up
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
            <h1 className="text-4xl font-bold text-foreground mb-2">Log In</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <Input 
                id="email" 
                type="email"
                placeholder="Email Address*" 
                required 
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                data-testid="input-email"
                className="rounded-full border border-gray-200 bg-white py-6 px-6 text-base placeholder:text-gray-400 focus:border-primary/50 focus:ring-0 transition-all shadow-sm"
              />

              <div className="space-y-2">
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter Password" 
                  required 
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  data-testid="input-password"
                  className="rounded-full border border-gray-200 bg-white py-6 px-6 text-base placeholder:text-gray-400 focus:border-primary/50 focus:ring-0 transition-all shadow-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center font-medium" data-testid="text-error">
                {error}
              </div>
            )}

            <div className="pt-2 flex justify-center">
              <Button 
                type="submit" 
                className="w-48 py-6 rounded-full text-lg font-bold bg-[#FF6600] hover:bg-[#FF6600]/90 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Logging in..." : "Log In"}
              </Button>
            </div>
          </form>

          <div className="text-center mt-4">
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-sm font-medium text-blue-500 hover:text-blue-600 cursor-pointer underline decoration-blue-500/30 underline-offset-4 bg-transparent border-0"
                  data-testid="link-forgot-password"
                >
                  Forgot your password? Reset it here
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="reset-email" className="text-sm font-medium text-foreground">
                      Email Address
                    </label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResetEmail(e.target.value)}
                      className="rounded-full border border-gray-200 bg-white py-6 px-6 text-base"
                    />
                  </div>
                  <Button
                    onClick={handleResetPassword}
                    disabled={isResetLoading || !resetEmail}
                    className="w-full py-6 rounded-full text-base font-bold bg-[#FF6600] hover:bg-[#FF6600]/90 text-white shadow-md transition-all"
                  >
                    {isResetLoading ? "Sending Link..." : "Send Reset Link"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

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
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              data-testid="button-google-login"
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
            <span>Don't have account? </span>
            <Link href="/signup">
              <span className="text-blue-500 hover:underline cursor-pointer underline-offset-4 decoration-blue-500/30">Create one</span>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-300 pt-20 pb-10 border-t border-gray-900 relative z-10">
        <div className="container px-6 mx-auto">
          <div className="flex flex-col gap-y-10 md:grid md:grid-cols-12 md:gap-12 mb-16">
            <div className="col-span-12 md:col-span-4">
              <Link href="/" className="inline-block mb-6 opacity-90 hover:opacity-100 transition-opacity">
                <img src={logoImage} alt="ScrollPet Logo" className="h-10 w-auto object-contain brightness-0 invert opacity-90" />
              </Link>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Connecting pet lovers worldwide in a safe, trusted environment. Join us in building the most positive pet community on the internet.
              </p>
              <div className="flex gap-3">
                {/* Social Icons */}
                <a
                  href="https://www.instagram.com/scrollpet.com_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] transition-all cursor-pointer group"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a
                    href="https://x.com/Scrollpets"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-black transition-colors cursor-pointer group"
                    aria-label="X (Twitter)"
                  >
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.linkedin.com/company/scrollpet/?viewAsMember=true"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-[#0A66C2] transition-colors cursor-pointer group"
                    aria-label="LinkedIn"
                  >
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                </div>
              </div>

              <div className="col-span-6 md:col-span-2 md:col-start-6">
                <h4 className="font-bold text-white mb-6 text-lg">Platform</h4>
                <ul className="space-y-3">
                  <li><Link href="/" className="hover:text-primary transition-colors cursor-pointer">Home</Link></li>
                  <li><Link href="/chat" className="hover:text-primary transition-colors cursor-pointer">Chat Rooms</Link></li>
                  <li><Link href="/login" className="hover:text-primary transition-colors cursor-pointer text-primary">Login</Link></li>
                  <li><Link href="/signup" className="hover:text-primary transition-colors cursor-pointer">Sign Up</Link></li>
                </ul>
              </div>

              <div className="col-span-6 md:col-span-2">
                <h4 className="font-bold text-white mb-6 text-lg">Company</h4>
                <ul className="space-y-3">
                  <li><Link href="/about" className="hover:text-primary transition-colors cursor-pointer">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-primary transition-colors cursor-pointer">Contact Us</Link></li>
                  <li><Link href="/faq" className="hover:text-primary transition-colors cursor-pointer">FAQ</Link></li>
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
                <span>Made with ❤️ for pet lovers everywhere 🐾</span>
              </div>
            </div>
          </div>
        </footer>
    </div>
  );
}
