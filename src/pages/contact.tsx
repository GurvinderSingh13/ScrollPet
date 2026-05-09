import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, MapPin, Send } from "lucide-react";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function ContactUs() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      toast({
        title: "Message Sent",
        description: "We've received your message and will get back to you soon.",
      });
      setIsSubmitting(false);
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className="min-h-screen pt-16 md:pt-20 flex flex-col bg-background font-sans">
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-4">Contact Us</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Have questions, feedback, or need support? We're here to help our community thrive.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="p-2 rounded-lg bg-[#007699]/10 text-[#007699]">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Email</h3>
                  <p className="text-muted-foreground text-sm">support@scrollpet.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="p-2 rounded-lg bg-[#007699]/10 text-[#007699]">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Phone</h3>
                  <p className="text-muted-foreground text-sm">+91 95017 69649</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="p-2 rounded-lg bg-[#007699]/10 text-[#007699]">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Location</h3>
                  <p className="text-muted-foreground text-sm">Chandigarh, India</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl shadow-primary/5">
            <h2 className="text-2xl font-semibold mb-6">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <input required className="w-full h-10 px-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input required type="email" className="w-full h-10 px-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <input required className="w-full h-10 px-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea required rows={4} className="w-full p-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl font-bold gap-2">
                {isSubmitting ? "Sending..." : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>

      <footer className="flex-none bg-gray-950 text-gray-300 py-8 border-t border-gray-900 mt-12">
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
              <Link href="/community-guidelines" className="hover:text-white transition-colors">Guidelines</Link>
              <Link href="/contact" className="hover:text-white transition-colors text-white">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
