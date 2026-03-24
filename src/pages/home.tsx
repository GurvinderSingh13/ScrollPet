import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MessageCircle, 
  ShieldCheck, 
  Users, 
  PawPrint, 
  Menu,
  X,
  Heart,
  ArrowRight,
  User
} from "lucide-react";
import { useState } from "react";
import heroImage from "@assets/generated_images/happy_community_of_pet_lovers_in_a_park.png";
import introImage from "@assets/generated_images/minimalist_pet_chat_concept_illustration.png";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  const handleAuthClick = () => {
    if (isAuthenticated) {
      logout();
    } else {
      window.location.href = '/login';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 50 } as const
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground overflow-x-hidden selection:bg-primary/20">
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
            {isLoading ? (
               <Button variant="ghost" disabled>...</Button>
            ) : isAuthenticated ? (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <button className="h-10 w-10 rounded-full border border-border bg-muted flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
                     {user?.id ? (
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} alt="User Avatar" className="h-full w-full object-cover" />
                     ) : (
                       <User className="h-5 w-5 text-muted-foreground" />
                     )}
                   </button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-56 mt-2">
                   <div className="px-3 py-2 border-b border-border/50 mb-1">
                     <p className="font-medium text-sm text-foreground truncate">{user?.displayName || user?.username || 'User'}</p>
                     <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                   </div>
                   <DropdownMenuItem asChild>
                     <Link href="/user-profile" className="w-full cursor-pointer flex items-center">Profile Dashboard</Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer flex items-center font-medium">
                     Log Out
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
            ) : (
               <Button onClick={() => window.location.href = '/login'} className="font-bold cursor-pointer rounded-full px-6">
                 Login
               </Button>
            )}
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
            {isLoading ? (
               <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" disabled>...</Button>
            ) : isAuthenticated ? (
               <>
                 <Link href="/user-profile" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer text-primary">Profile Dashboard</Link>
                 <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" variant="destructive" onClick={logout}>
                   Log Out
                 </Button>
               </>
            ) : (
               <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg" onClick={() => window.location.href = '/login'}>
                 Login
               </Button>
            )}
          </div>
        )}
      </header>

      <main>
        {/* 1. Hero Section */}
        <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
          <div className="container px-6 mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-2xl"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6 border border-primary/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Join 10,000+ Pet Lovers
                </div>
                <h1 className="text-5xl lg:text-7xl font-extrabold font-heading leading-tight mb-8 tracking-tight text-foreground">
                  Where Pets Find Their <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">People</span>
                </h1>
                <p className="text-lg lg:text-xl text-muted-foreground mb-10 leading-relaxed font-medium">
                  A safe, friendly community built around trust and care. Connect with other owners, share stories, and find the support you need.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {isAuthenticated ? (
                    <Link href="/chat">
                      <Button size="lg" className="text-lg px-8 py-7 rounded-full shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all cursor-pointer">
                        Go to Chat Rooms
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  ) : (
                    <Button size="lg" className="text-lg px-8 py-7 rounded-full shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all cursor-pointer" onClick={() => window.location.href = '/api/login'}>
                      Join the Community
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                  <Button variant="outline" size="lg" className="text-lg px-8 py-7 rounded-full border-2 hover:bg-muted transition-all cursor-pointer">
                    Learn More
                  </Button>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="relative"
              >
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl ring-8 ring-background aspect-[4/3] group">
                  <img 
                    src={heroImage} 
                    alt="Happy people with pets in a park" 
                    className="object-cover w-full h-full transform transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent"></div>
                  
                  {/* Floating Card */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="absolute bottom-6 left-6 right-6 bg-background/95 backdrop-blur p-4 rounded-2xl shadow-lg border border-border/50 hidden sm:block"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="h-10 w-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-bold text-muted-foreground overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="Avatar" />
                          </div>
                        ))}
                      </div>
                      <div className="text-sm">
                        <p className="font-bold text-foreground">Active Community</p>
                        <p className="text-muted-foreground">Join local meetups today</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Decorative blob */}
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl opacity-60"></div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 2. What Is ScrollPet? */}
        <section className="py-24 bg-muted/40 relative">
           <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
          <div className="container px-6 mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="absolute -z-10 inset-4 bg-secondary/20 rounded-full blur-3xl"></div>
                <img 
                  src={introImage} 
                  alt="Pet chat concept" 
                  className="w-full max-w-lg mx-auto drop-shadow-2xl rounded-2xl"
                />
              </div>
              <div className="order-1 lg:order-2">
                <span className="inline-block px-4 py-1.5 rounded-full bg-secondary text-white font-bold text-xs uppercase tracking-wider mb-6 shadow-lg shadow-secondary/20">
                  Our Mission
                </span>
                <h2 className="text-4xl lg:text-5xl font-extrabold mb-8 tracking-tight">What is <span className="text-primary">ScrollPet</span>?</h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed font-medium">
                  ScrollPet isn't just another social network. It's a purpose-built haven for pet owners who value meaningful connections over mindless scrolling.
                </p>
                <div className="space-y-6">
                  {[
                    { title: "Connect by Category", desc: "Find your tribe based on pet type, breed, or interest." },
                    { title: "Respectful Discussion", desc: "A moderated space where kindness comes first." },
                    { title: "Trusted Information", desc: "Learn from experienced owners and verified experts." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="h-12 w-12 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <Heart size={20} fill="currentColor" className="opacity-80" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                        <p className="text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. How It Works */}
        <section className="py-32">
          <div className="container px-6 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight">How It Works</h2>
              <p className="text-xl text-muted-foreground">Join our thriving community in four simple steps and start connecting immediately.</p>
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-4 gap-8"
            >
              {[
                { icon: Users, title: "Sign Up", desc: "Create your free account in seconds" },
                { icon: PawPrint, title: "Choose Category", desc: "Select your pet type or breed" },
                { icon: MessageCircle, title: "Join Chat Rooms", desc: "Enter local or global discussions" },
                { icon: Heart, title: "Connect", desc: "Learn and grow with others" },
              ].map((step, i) => (
                <motion.div 
                  key={i} 
                  variants={itemVariants}
                  className="relative p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center group z-10"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  <div className="h-20 w-20 mx-auto bg-muted rounded-full flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <step.icon size={36} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 4. Community & Safety */}
        <section className="py-24 bg-primary relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary rounded-full blur-3xl opacity-20"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary rounded-full blur-3xl opacity-20"></div>
          
          <div className="container px-6 mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white font-bold text-sm mb-6">
                  <ShieldCheck className="h-4 w-4" />
                  Safety First
                </div>
                <h2 className="text-4xl lg:text-6xl font-extrabold mb-6 tracking-tight">Safe, Secure, and <br/>Moderated</h2>
                <p className="text-xl text-primary-foreground/90 max-w-xl mb-10 font-medium">
                  We take safety seriously. Our community is built on trust, with tools to ensure respectful interactions for everyone.
                </p>
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 rounded-full px-8 py-6 text-lg font-bold shadow-xl border-none">
                  Read Community Guidelines
                </Button>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: "Moderated Chat", desc: "24/7 active moderation" },
                  { title: "Verified Users", desc: "Identity verification badges" },
                  { title: "Reporting Tools", desc: "Easy to use report system" },
                  { title: "Safe Content", desc: "Strict anti-spam filters" }
                ].map((feature, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                    <h3 className="font-bold text-xl mb-2">{feature.title}</h3>
                    <p className="text-white/70">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. Footer */}
        <footer className="bg-gray-950 text-gray-300 py-20 border-t border-gray-900">
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
                  <li><Link href="/signup" className="hover:text-primary transition-colors cursor-pointer">Sign Up</Link></li>
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
      </main>
    </div>
  );
}
