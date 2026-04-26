import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu, X } from "lucide-react";
import { useState } from "react";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";

export default function CommunityGuidelines() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen pt-16 md:pt-20 flex flex-col bg-background font-sans">
      <header className="fixed w-full top-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="cursor-pointer">
            <img 
              src={logoImage} 
              alt="ScrollPet Logo" 
              className="h-8 md:h-12 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8 bg-muted/50 px-6 py-2 rounded-full border border-border/50">
            <Link href="/" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Home</Link>
            <Link href="/chat" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Chat Rooms</Link>
            <Link href="/about" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">About Us</Link>
            <Link href="/faq" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">FAQ</Link>
            <Link href="/contact" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Contact Us</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/chat">
              <Button className="font-bold cursor-pointer rounded-full px-6">
                Back to Chat
              </Button>
            </Link>
          </div>

          <button className="md:hidden cursor-pointer p-2 hover:bg-muted rounded-full transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t p-4 space-y-4 bg-background animate-in slide-in-from-top-5 shadow-2xl">
            <Link href="/" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Home</Link>
            <Link href="/chat" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Chat Rooms</Link>
            <Link href="/about" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">About Us</Link>
            <Link href="/faq" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">FAQ</Link>
            <Link href="/contact" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Contact Us</Link>
            <Link href="/chat">
              <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg">
                Back to Chat
              </Button>
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-4xl">
        <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6" data-testid="text-page-title">
          ScrollPet Community Guidelines
        </h1>

        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
          ScrollPet is designed for pet lovers to connect with others who share the same interests and needs. To maintain a focused and respectful environment, please ensure that every post and discussion revolves around pets.
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b">
            Main Rules
          </h2>

          <div className="space-y-8">
            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="bg-[#007699] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                Stay on Topic
              </h3>
              <ul className="space-y-2 text-muted-foreground ml-10">
                <li className="flex items-start gap-2">
                  <span className="text-[#007699] mt-1">•</span>
                  <span>Only discuss topics related to pets.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#007699] mt-1">•</span>
                  <span>Non-pet-related discussions are not allowed.</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="bg-[#007699] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                Language Guidelines
              </h3>
              <ul className="space-y-2 text-muted-foreground ml-10">
                <li className="flex items-start gap-2">
                  <span className="text-[#007699] mt-1">•</span>
                  <span><strong>Global Chat Room:</strong> English only.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#007699] mt-1">•</span>
                  <span><strong>Nation's Chat:</strong> National language only (e.g., Hindi for India).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#007699] mt-1">•</span>
                  <span><strong>State & District Chats:</strong> National and regional languages are allowed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#007699] mt-1">•</span>
                  <span>English is permitted in any Nation or State chat room.</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="bg-[#007699] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                Respectful Communication
              </h3>
              <ul className="space-y-2 text-muted-foreground ml-10">
                <li className="flex items-start gap-2">
                  <span className="text-[#007699] mt-1">•</span>
                  <span>No abusive or harassing language.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#007699] mt-1">•</span>
                  <span>Block users if you cannot engage civilly.</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="bg-[#007699] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                Moderator Authority
              </h3>
              <ul className="space-y-2 text-muted-foreground ml-10">
                <li className="flex items-start gap-2">
                  <span className="text-[#007699] mt-1">•</span>
                  <span>If a moderator (Staff Member or Authority Person) requests that you drop a topic or argument, you must comply.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#007699] mt-1">•</span>
                  <span>If you wish to continue the discussion, move it to private messages.</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="bg-[#007699] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">5</span>
                Permitted Content
              </h3>
              <ul className="space-y-2 text-muted-foreground ml-10">
                <li className="flex items-start gap-2">
                  <span className="text-[#007699] mt-1">•</span>
                  <span>Spam, roleplay, or unrelated content is not allowed.</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="bg-[#007699] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">6</span>
                Respect Pet Categories
              </h3>
              <ul className="space-y-2 text-muted-foreground ml-10">
                <li className="flex items-start gap-2">
                  <span className="text-[#007699] mt-1">•</span>
                  <span>Each pet and breed has its designated chat room.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#007699] mt-1">•</span>
                  <span>Do not discuss other pets or breeds in the wrong chat rooms.</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="bg-[#007699] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">7</span>
                Competitor Discussion
              </h3>
              <ul className="space-y-2 text-muted-foreground ml-10">
                <li className="flex items-start gap-2">
                  <span className="text-[#007699] mt-1">•</span>
                  <span>Discussing or posting about ScrollPet's competitors is prohibited.</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="bg-[#007699] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">8</span>
                Fair Trading
              </h3>
              <ul className="space-y-2 text-muted-foreground ml-10">
                <li className="flex items-start gap-2">
                  <span className="text-[#007699] mt-1">•</span>
                  <span>Do not pressure anyone into giving away their pets for free or at a low price.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#007699] mt-1">•</span>
                  <span>For negotiations, use private messaging.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex-none bg-gray-950 text-gray-300 py-8 border-t border-gray-900">
        <div className="container px-6 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 gap-4">
            <div className="flex items-center gap-2 opacity-80">
              <img 
                src={logoImage} 
                alt="ScrollPet Logo" 
                className="h-6 w-auto object-contain brightness-0 invert"
              />
              <span>© {new Date().getFullYear()} ScrollPet. All rights reserved.</span>
            </div>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/community-guidelines" className="hover:text-white transition-colors text-white">Guidelines</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
