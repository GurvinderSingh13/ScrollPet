import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";

const faqData = [
  {
    id: "1",
    question: "What is ScrollPet?",
    answer: "ScrollPet is a community platform where pet lovers, breeders, and pet owners can connect with each other. It offers chat rooms based on different pets, breeds, and locations, making it easy to join discussions about pets you care about."
  },
  {
    id: "2",
    question: "How do I join chat rooms?",
    answer: "You can join chat rooms based on your pet type (e.g., dog, cat) and even by breed (e.g., Pug, Siamese). You can also join rooms for your country, state, or local district, as well as a global chat room where users from all over the world can chat."
  },
  {
    id: "3",
    question: "What is the News Room?",
    answer: "Each chat room (based on pet or breed) has its own News Room, where the ScrollPet team posts updates. These could include:",
    bullets: [
      "Pet-related news and updates",
      "Announcements about the platform",
      "Promotions or special offers on pet products or services"
    ],
    afterBullets: "Only the ScrollPet team can post in the News Room; users can only read or view the posts."
  },
  {
    id: "4",
    question: "What content can I share?",
    answer: "You can share text messages, images, videos, and voice notes in the chat rooms. However, everything shared must be related to pets and must follow the community guidelines."
  },
  {
    id: "5",
    question: "Who moderates the chat rooms?",
    answer: "Both Company Moderators and Community Moderators manage the chat rooms:",
    bullets: [
      "Company Moderators can permanently ban users who break the rules.",
      "Community Moderators can issue temporary bans and help manage discussions."
    ]
  },
  {
    id: "6",
    question: "What happens if I break the rules?",
    answer: "Violating the rules may lead to a temporary ban from posting in chat rooms. You'll still be able to read the chat but won't be able to participate. Repeated violations could result in a permanent ban."
  },
  {
    id: "7",
    question: "How can I report or block a user?",
    answer: "To report or block someone, click on their message or profile and choose from the available report options. This helps keep the community safe and respectful."
  },
  {
    id: "8",
    question: "What pet categories are available?",
    answer: "ScrollPet has nine main pet categories: Dogs, Cats, Horses, Fish, Rabbits, Birds, Hamsters, Turtles, and Other Pets. Each category has sub-categories for different breeds."
  },
  {
    id: "9",
    question: "Can I delete my account?",
    answer: "Currently, account deletion is not available, but this feature will be added in the future."
  },
  {
    id: "10",
    question: "What languages are supported?",
    answer: "",
    bullets: [
      "Global chat: Only English",
      "National chats: National language (e.g., Hindi for India)",
      "State/District chats: Both national and regional languages are allowed"
    ],
    afterBullets: "English can be used in any chat room."
  },
  {
    id: "11",
    question: "How do I become a Community Moderator?",
    answer: "Active, helpful, and respectful users may be invited by the ScrollPet team to become Community Moderators."
  },
  {
    id: "12",
    question: "Can I switch between chat rooms?",
    answer: "Yes, you can switch between chat rooms any time. You can choose different rooms based on the pet category, breed, or location that interests you."
  },
  {
    id: "13",
    question: "What should I do if I see inappropriate content?",
    answer: "You can report inappropriate content by clicking on the message and selecting the report option. This helps keep the community safe and enjoyable for everyone."
  },
  {
    id: "14",
    question: "Can I suggest new pet categories?",
    answer: "Yes, if there's a pet category or breed you'd like to see added, you can suggest it. The ScrollPet team will review your suggestion."
  },
  {
    id: "15",
    question: "What should I do if I'm banned from a chat room?",
    answer: "If you're banned, review the community guidelines and wait until the ban is lifted. You can contact support if you think the ban was unfair."
  },
  {
    id: "16",
    question: "How do I update my profile?",
    answer: "You can update your profile information in the account settings section."
  },
  {
    id: "17",
    question: "How can I provide feedback?",
    answer: "You can share your feedback or suggestions through the feedback section or by contacting customer support. Your feedback helps improve ScrollPet."
  }
];

export default function FAQ() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header className="flex-none bg-background/80 backdrop-blur-md border-b border-border/40 z-30 sticky top-0">
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
            <Link href="/faq" className="text-sm font-semibold text-primary transition-colors cursor-pointer">FAQ</Link>
            <Link href="/contact" className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">Contact Us</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/chat">
              <Button className="font-bold cursor-pointer rounded-full px-6">
                Start Chatting
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
            <Link href="/faq" className="block text-base font-semibold py-3 px-4 rounded-lg bg-muted text-primary cursor-pointer">FAQ</Link>
            <Link href="/contact" className="block text-base font-semibold py-3 px-4 rounded-lg hover:bg-muted cursor-pointer">Contact Us</Link>
            <Link href="/chat">
              <Button className="w-full mt-4 cursor-pointer rounded-full py-6 text-lg">
                Start Chatting
              </Button>
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8" data-testid="text-page-title">
          ScrollPet FAQ
        </h1>

        <Accordion type="single" collapsible className="space-y-4">
          {faqData.map((faq) => (
            <AccordionItem 
              key={faq.id} 
              value={faq.id}
              className="bg-card rounded-xl border shadow-sm px-6"
              data-testid={`faq-item-${faq.id}`}
            >
              <AccordionTrigger className="text-left py-5 hover:no-underline">
                <span className="flex items-start gap-3">
                  <span className="bg-[#007699] text-white min-w-[28px] h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {faq.id}
                  </span>
                  <span className="font-semibold text-foreground">{faq.question}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pl-10 text-muted-foreground">
                {faq.answer && <p className="mb-3">{faq.answer}</p>}
                {faq.bullets && (
                  <ul className="space-y-2 mb-3">
                    {faq.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#007699] mt-1">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {faq.afterBullets && <p>{faq.afterBullets}</p>}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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
              <Link href="/community-guidelines" className="hover:text-white transition-colors">Guidelines</Link>
              <Link href="/faq" className="hover:text-white transition-colors text-white">FAQ</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
