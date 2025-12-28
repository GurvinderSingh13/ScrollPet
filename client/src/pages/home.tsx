import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  MessageCircle, 
  ShieldCheck, 
  Users, 
  PawPrint, 
  Menu,
  X,
  Heart
} from "lucide-react";
import { useState } from "react";
import heroImage from "@assets/generated_images/happy_community_of_pet_lovers_in_a_park.png";
import introImage from "@assets/generated_images/minimalist_pet_chat_concept_illustration.png";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    <div className="min-h-screen bg-background font-sans text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PawPrint className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold font-heading tracking-tight text-primary">ScrollPet</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Home</Link>
            <Link href="/chat" className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Chat Rooms</Link>
            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">About Us</Link>
            <Link href="/faq" className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">FAQ</Link>
            <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Contact Us</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant={isLoggedIn ? "outline" : "default"}
              onClick={() => setIsLoggedIn(!isLoggedIn)}
              className="font-bold cursor-pointer"
            >
              {isLoggedIn ? "Logout" : "Login"}
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t p-4 space-y-4 bg-background animate-in slide-in-from-top-5">
            <Link href="/" className="block text-sm font-medium py-2 cursor-pointer">Home</Link>
            <Link href="/chat" className="block text-sm font-medium py-2 cursor-pointer">Chat Rooms</Link>
            <Link href="/about" className="block text-sm font-medium py-2 cursor-pointer">About Us</Link>
            <Link href="/faq" className="block text-sm font-medium py-2 cursor-pointer">FAQ</Link>
            <Link href="/contact" className="block text-sm font-medium py-2 cursor-pointer">Contact Us</Link>
            <Button className="w-full mt-4 cursor-pointer" onClick={() => setIsLoggedIn(!isLoggedIn)}>
              {isLoggedIn ? "Logout" : "Login"}
            </Button>
          </div>
        )}
      </header>

      <main>
        {/* 1. Hero Section */}
        <section className="relative pt-16 pb-24 lg:pt-32 lg:pb-32 overflow-hidden">
          <div className="container px-4 mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl"
              >
                <h1 className="text-4xl lg:text-6xl font-bold font-heading leading-tight mb-6">
                  A Community for <span className="text-primary">Pet Lovers</span>, Built Around Trust and Care
                </h1>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Join a safe, friendly space where you can connect with other pet owners, share advice, and make new furry friends.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {isLoggedIn ? (
                     <Button size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer">
                       Go to Chat Rooms
                     </Button>
                  ) : (
                    <Button size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer">
                      Join the Community
                    </Button>
                  )}
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-full cursor-pointer">
                    Learn More
                  </Button>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] transform rotate-2 hover:rotate-0 transition-transform duration-500">
                  <img 
                    src={heroImage} 
                    alt="Happy people with pets in a park" 
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                {/* Decorative blob */}
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-secondary/10 rounded-full blur-3xl"></div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 2. What Is ScrollPet? */}
        <section className="py-20 bg-muted/30">
          <div className="container px-4 mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <img 
                  src={introImage} 
                  alt="Pet chat concept" 
                  className="w-full max-w-md mx-auto drop-shadow-xl"
                />
              </div>
              <div className="order-1 lg:order-2">
                <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary font-bold text-sm mb-6">
                  About Us
                </span>
                <h2 className="text-3xl lg:text-4xl font-bold mb-6">What is ScrollPet?</h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  ScrollPet is a chat-first community platform designed specifically for pet lovers like you. We believe that every pet deserves a loving community, and every owner deserves a trusted space to share.
                </p>
                <ul className="space-y-4">
                  {[
                    "Connect based on pet type, breed, or location",
                    "Focused on respectful discussion",
                    "Trusted information from experienced owners"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <Heart size={14} fill="currentColor" />
                      </div>
                      <span className="font-medium text-foreground/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 3. How It Works */}
        <section className="py-24">
          <div className="container px-4 mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground">Join our community in four simple steps</p>
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
                  className="bg-card p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow text-center group"
                >
                  <div className="h-16 w-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    <step.icon size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 4. Community & Safety */}
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 pattern-dots"></div>
          
          <div className="container px-4 mx-auto relative z-10 text-center">
            <ShieldCheck className="h-16 w-16 mx-auto mb-6 text-accent" />
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">Safe, Secure, and Moderated</h2>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-12">
              We take safety seriously. Our community is built on trust, with tools to ensure respectful interactions for everyone.
            </p>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto text-left">
              {[
                "Moderated Chat Rooms",
                "Clear Community Rules",
                "Reporting Features",
                "Admin News & Updates"
              ].map((feature, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 hover:bg-white/15 transition-colors">
                  <div className="font-bold text-lg mb-2">{feature}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Footer */}
        <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
          <div className="container px-4 mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-1 md:col-span-1">
                <div className="flex items-center gap-2 mb-4 text-white">
                  <PawPrint className="h-6 w-6" />
                  <span className="text-xl font-bold font-heading">ScrollPet</span>
                </div>
                <p className="text-sm text-gray-400">
                  Connecting pet lovers worldwide in a safe, trusted environment.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-white mb-4">Platform</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/" className="hover:text-primary transition-colors cursor-pointer">Home</Link></li>
                  <li><Link href="/chat" className="hover:text-primary transition-colors cursor-pointer">Chat Rooms</Link></li>
                  <li><Link href="/login" className="hover:text-primary transition-colors cursor-pointer">Login</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-4">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/about" className="hover:text-primary transition-colors cursor-pointer">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-primary transition-colors cursor-pointer">Contact Us</Link></li>
                  <li><Link href="/privacy" className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-4">Help</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/faq" className="hover:text-primary transition-colors cursor-pointer">FAQ</Link></li>
                  <li><Link href="/support" className="hover:text-primary transition-colors cursor-pointer">Support Center</Link></li>
                  <li><Link href="/rules" className="hover:text-primary transition-colors cursor-pointer">Community Rules</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
              © {new Date().getFullYear()} ScrollPet – Built for pet lovers
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
