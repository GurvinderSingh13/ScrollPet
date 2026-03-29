import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, HelpCircle, MessageSquare, Shield, Settings, Globe, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  bullets?: string[];
  afterBullets?: string;
}

interface FAQCategory {
  title: string;
  icon: React.ReactNode;
  description: string;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    title: "Getting Started",
    icon: <HelpCircle className="w-5 h-5" />,
    description: "Learn the basics of ScrollPet and how to get started.",
    items: [
      {
        id: "1",
        question: "What is ScrollPet?",
        answer: "ScrollPet is a dedicated online community platform designed for pet lovers, breeders, veterinarians, and pet owners to connect, share knowledge, and build meaningful relationships. Unlike general social media, ScrollPet is built exclusively around pets — offering specialized chat rooms organized by pet type, breed, and geographical location so you can find the most relevant conversations instantly."
      },
      {
        id: "2",
        question: "Is ScrollPet free to use?",
        answer: "Yes! ScrollPet is completely free to join and use. You can create an account, join chat rooms, share content, and connect with other pet enthusiasts at no cost. We believe every pet lover deserves access to a supportive community without any financial barriers."
      },
      {
        id: "3",
        question: "How do I create an account on ScrollPet?",
        answer: "Creating an account is quick and easy:",
        bullets: [
          "Click the 'Sign Up' button on the homepage or navigation bar.",
          "Enter your username, email address, and a secure password.",
          "Select your country and state/region (optional but recommended for local chats).",
          "Agree to the Terms of Service and Privacy Policy.",
          "You can also sign up instantly using your Google account for one-click registration."
        ],
        afterBullets: "Once registered, you'll have immediate access to all chat rooms and community features."
      },
      {
        id: "4",
        question: "How do I join chat rooms?",
        answer: "ScrollPet offers a rich variety of chat rooms you can join based on your interests:",
        bullets: [
          "Pet Type Rooms: Join rooms dedicated to dogs, cats, horses, fish, rabbits, birds, hamsters, turtles, or other pets.",
          "Breed-Specific Rooms: Dive deeper into breed-level discussions (e.g., Golden Retriever, Siamese Cat, Pug).",
          "Location-Based Rooms: Connect with pet owners in your country, state, or local district.",
          "Global Chat Room: A worldwide room where pet lovers from every corner of the planet can interact."
        ],
        afterBullets: "You can switch between rooms freely at any time — there's no limit to how many rooms you can join."
      }
    ]
  },
  {
    title: "Features & Content",
    icon: <MessageSquare className="w-5 h-5" />,
    description: "Explore what you can do on the platform.",
    items: [
      {
        id: "5",
        question: "What type of content can I share in chat rooms?",
        answer: "ScrollPet supports multiple content formats to make your conversations rich and engaging:",
        bullets: [
          "Text Messages: Share stories, ask questions, and give advice.",
          "Images: Post photos of your pets, their habitat, or pet-related content.",
          "Videos: Share clips of your pets' funny moments, training routines, or care tips.",
          "Voice Notes: Record and send voice messages for a more personal touch."
        ],
        afterBullets: "All shared content must be pet-related and follow our Community Guidelines. Off-topic, promotional, or inappropriate content may be removed by moderators."
      },
      {
        id: "6",
        question: "What is the News Room?",
        answer: "Each pet type and breed chat room includes a dedicated News Room — a curated feed managed exclusively by the ScrollPet team. News Rooms may include:",
        bullets: [
          "Pet health alerts and veterinary updates relevant to that breed or species.",
          "Platform announcements about new features, events, or community milestones.",
          "Curated articles, tips, and educational content about pet care.",
          "Special promotions or partnerships with trusted pet product brands."
        ],
        afterBullets: "Users can read and view News Room posts but cannot post in them. This ensures the feed remains a reliable, high-quality source of information."
      },
      {
        id: "7",
        question: "What pet categories are available on ScrollPet?",
        answer: "ScrollPet currently supports nine primary pet categories, each with multiple breed-specific sub-categories:",
        bullets: [
          "🐕 Dogs — Labrador, Pug, German Shepherd, Bulldog, and many more.",
          "🐈 Cats — Persian, Siamese, Maine Coon, British Shorthair, etc.",
          "🐴 Horses — Thoroughbred, Arabian, Quarter Horse, and others.",
          "🐟 Fish — Betta, Goldfish, Clownfish, Guppy, etc.",
          "🐇 Rabbits — Holland Lop, Netherland Dwarf, Lionhead, and more.",
          "🐦 Birds — Budgerigar, Cockatiel, African Grey, Macaw, etc.",
          "🐹 Hamsters — Syrian, Dwarf, Roborovski, Chinese, and others.",
          "🐢 Turtles — Red-Eared Slider, Box Turtle, Painted Turtle, etc.",
          "🐾 Other Pets — Guinea Pigs, Ferrets, Reptiles, and more unique pets."
        ],
        afterBullets: "Don't see your pet's breed? You can suggest new categories and the ScrollPet team will review additions regularly."
      },
      {
        id: "8",
        question: "Can I buy or sell pets on ScrollPet?",
        answer: "Yes! ScrollPet allows users to buy and sell pets on the platform. We believe in connecting pet lovers with responsible breeders and pet owners who are looking to rehome their pets. Here's how it works:",
        bullets: [
          "You can post about pets available for sale or adoption in the relevant chat rooms.",
          "Always provide accurate details about the pet's breed, age, health status, and any vaccinations.",
          "Both buyers and sellers are encouraged to meet in safe, public locations and verify all information before completing a transaction.",
          "ScrollPet is not responsible for any transactions between users — all deals are made at the users' own discretion and risk.",
          "Any fraudulent listings, scams, or misleading information will result in immediate account suspension."
        ],
        afterBullets: "We encourage responsible pet ownership and urge all users to follow local laws and regulations regarding pet sales, breeding, and adoption in their region."
      }
    ]
  },
  {
    title: "Safety & Moderation",
    icon: <Shield className="w-5 h-5" />,
    description: "How we keep the community safe and respectful.",
    items: [
      {
        id: "9",
        question: "Can I delete my account and all my data from ScrollPet?",
        answer: "Yes, absolutely. ScrollPet fully supports your right to delete your profile and account along with all related data from the platform. Here is how account deletion works:",
        bullets: [
          "Navigate to your Account Settings page.",
          "Select the 'Delete Account' option.",
          "Confirm your decision — you may be asked to re-enter your password for security.",
          "Upon confirmation, your account, profile information, chat messages, shared media, and all related data will be permanently and irreversibly deleted from ScrollPet's servers.",
          "This process is in compliance with applicable data privacy regulations."
        ],
        afterBullets: "Please note that once your account is deleted, it cannot be recovered. If you have any concerns about your data or need assistance, contact our support team before proceeding."
      },
      {
        id: "10",
        question: "Who moderates the chat rooms?",
        answer: "ScrollPet uses a dual-layer moderation system to ensure every chat room remains safe, respectful, and on-topic:",
        bullets: [
          "Company Moderators: Official ScrollPet staff members who have the authority to permanently ban users who seriously or repeatedly violate community guidelines.",
          "Community Moderators: Trusted, experienced community members who help manage day-to-day discussions. They can issue temporary bans and escalate issues to Company Moderators."
        ],
        afterBullets: "Both types of moderators are committed to maintaining a positive, inclusive, and pet-focused environment."
      },
      {
        id: "11",
        question: "What happens if I break the community rules?",
        answer: "ScrollPet takes community guidelines seriously. Depending on the severity and frequency of violations, consequences may include:",
        bullets: [
          "First Offense: A warning from a moderator explaining the violation.",
          "Repeated Offenses: A temporary ban from posting in chat rooms. During a temporary ban, you can still read messages but cannot participate.",
          "Severe or Persistent Violations: A permanent ban from the platform, including potential account deletion.",
          "Illegal Content: Immediate account termination and, if necessary, reporting to relevant authorities."
        ],
        afterBullets: "We encourage all members to review our Community Guidelines and Terms of Service to ensure a smooth experience."
      },
      {
        id: "12",
        question: "How can I report or block a user?",
        answer: "If you encounter inappropriate behavior or content, here's what you can do:",
        bullets: [
          "Report: In any chat room, click on the user's message or profile and select 'Report'. Choose the reason for your report (spam, harassment, inappropriate content, etc.) and submit it. Reporting is available in both chat rooms and private messages.",
          "Block: The block feature is available only in private messages. Open the private conversation with the user, click on their profile, and select 'Block'. This will prevent them from sending you further private messages. Please note that you cannot block users in public chat rooms — if someone is being disruptive in a chat room, use the Report feature instead so moderators can take action."
        ],
        afterBullets: "All reports are reviewed by our moderation team promptly. Your identity is kept confidential during the review process."
      },
      {
        id: "13",
        question: "What should I do if I see inappropriate content?",
        answer: "If you come across any content that violates our Community Guidelines — including harassment, spam, offensive material, or pet-buying/selling attempts — please report it immediately using the report feature on the message. Our moderation team reviews all reports and takes swift action. Reporting helps us keep the community safe, positive, and enjoyable for everyone."
      }
    ]
  },
  {
    title: "Account & Settings",
    icon: <Settings className="w-5 h-5" />,
    description: "Manage your account, profile, and preferences.",
    items: [
      {
        id: "14",
        question: "How do I update my profile?",
        answer: "You can update your profile at any time by navigating to your Account Settings. From there, you can change your:",
        bullets: [
          "Display name and username",
          "Profile photo",
          "Country and state/region",
          "Password and security settings"
        ],
        afterBullets: "Keeping your profile updated helps other community members connect with you more easily."
      },
      {
        id: "15",
        question: "I forgot my password. How do I reset it?",
        answer: "Resetting your password is simple and secure:",
        bullets: [
          "Go to the Login page and click 'Forgot your password? Reset it here'.",
          "Enter the email address associated with your ScrollPet account.",
          "You'll receive an email with a secure password reset link.",
          "Click the link, set a new password (minimum 6 characters), and you're back in."
        ],
        afterBullets: "If you don't see the email, check your spam or junk folder. The reset link expires after a limited time for security."
      },
      {
        id: "16",
        question: "How do I become a Community Moderator?",
        answer: "Community Moderators are selected by the ScrollPet team based on their positive contributions to the platform. To be considered:",
        bullets: [
          "Be an active and consistent member of the community.",
          "Demonstrate helpfulness, respect, and a deep understanding of the guidelines.",
          "Report violations and help newer members navigate the platform.",
          "The ScrollPet team may reach out to invite you based on your activity and reputation."
        ],
        afterBullets: "There is no formal application process — your actions within the community speak for themselves."
      },
      {
        id: "17",
        question: "What should I do if I'm banned from a chat room?",
        answer: "If you receive a temporary ban:",
        bullets: [
          "Review the Community Guidelines carefully to understand which rule was violated.",
          "Wait for the ban period to expire — you can still read messages during this time.",
          "If you believe the ban was issued unfairly, contact our support team through the Contact Us page with details of the situation.",
          "For permanent bans, you may submit an appeal to our support team, though reinstatement is not guaranteed."
        ]
      }
    ]
  },
  {
    title: "Language & Global Community",
    icon: <Globe className="w-5 h-5" />,
    description: "How language and localization work on ScrollPet.",
    items: [
      {
        id: "18",
        question: "What languages are supported on ScrollPet?",
        answer: "ScrollPet supports multilingual communication with the following language guidelines:",
        bullets: [
          "Global Chat Room: English only, to ensure universal understanding.",
          "Country-Level Chats: The national language of that country is used (e.g., Hindi for India, Spanish for Spain).",
          "State/District-Level Chats: Both the national language and regional/local languages are encouraged.",
          "English is universally accepted: You can use English in any chat room on the platform, regardless of location."
        ],
        afterBullets: "This approach ensures that local communities thrive while keeping ScrollPet accessible to users worldwide."
      },
      {
        id: "19",
        question: "Can I suggest new pet categories or breeds?",
        answer: "Absolutely! We love hearing from our community. If there's a pet category, breed, or species you'd like to see represented on ScrollPet:",
        bullets: [
          "Head to the Contact Us page and select 'Feature Request' as your subject.",
          "Describe the pet category or breed you'd like to see added.",
          "Our team reviews all suggestions regularly and prioritizes based on community demand."
        ],
        afterBullets: "Many of our current breed categories were added thanks to user suggestions!"
      },
      {
        id: "20",
        question: "How can I provide feedback or report a bug?",
        answer: "Your feedback is incredibly valuable in making ScrollPet better for everyone. You can share your feedback, feature ideas, or bug reports through:",
        bullets: [
          "The Contact Us page — select the appropriate subject category.",
          "Directly messaging a Community Moderator in any chat room.",
          "Emailing our support team at the address listed on the Contact page."
        ],
        afterBullets: "We read every single piece of feedback and use it to continuously improve the platform."
      }
    ]
  }
];

// Flatten all items for search
const allFAQItems = faqCategories.flatMap(cat => cat.items);

export default function FAQ() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return faqCategories;

    const query = searchQuery.toLowerCase();
    return faqCategories
      .map(category => ({
        ...category,
        items: category.items.filter(
          item =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query) ||
            (item.bullets && item.bullets.some(b => b.toLowerCase().includes(query))) ||
            (item.afterBullets && item.afterBullets.toLowerCase().includes(query))
        )
      }))
      .filter(category => category.items.length > 0);
  }, [searchQuery]);

  const totalResults = filteredCategories.reduce((acc, cat) => acc + cat.items.length, 0);

  // Build FAQ structured data for SEO
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFAQItems.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: [
          item.answer,
          ...(item.bullets || []),
          item.afterBullets || ""
        ].filter(Boolean).join(" ")
      }
    }))
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      {/* Header */}
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

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#007699]/5 via-white to-[#FF6600]/5 py-16 md:py-24">
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-48 h-48 bg-[#007699]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-[#FF6600]/8 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 bg-[#007699]/10 text-[#007699] px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <HelpCircle className="w-4 h-4" />
                <span>Frequently Asked Questions</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight" data-testid="text-page-title">
                How Can We <span className="text-[#007699]">Help</span> You?
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
                Find answers to common questions about ScrollPet — from getting started and joining chat rooms, to account management, moderation, and platform policies.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search questions... (e.g. 'delete account', 'buy pets', 'moderator')"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-200 bg-white shadow-lg text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007699]/30 focus:border-[#007699]/50 transition-all"
                  data-testid="input-faq-search"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {searchQuery && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {totalResults === 0
                    ? "No results found. Try a different search term."
                    : `Found ${totalResults} result${totalResults !== 1 ? 's' : ''} across ${filteredCategories.length} categor${filteredCategories.length !== 1 ? 'ies' : 'y'}`}
                </p>
              )}
            </motion.div>
          </div>
        </section>

        {/* Category Chips (shown when no search) */}
        {!searchQuery && (
          <section className="container mx-auto px-4 md:px-6 -mt-6 relative z-20">
            <div className="flex flex-wrap justify-center gap-3">
              {faqCategories.map((category, idx) => (
                <motion.button
                  key={category.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  onClick={() => {
                    setActiveCategory(activeCategory === category.title ? null : category.title);
                    const el = document.getElementById(`faq-category-${idx}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all cursor-pointer shadow-sm hover:shadow-md ${
                    activeCategory === category.title
                      ? 'bg-[#007699] text-white border-[#007699]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#007699]/40 hover:text-[#007699]'
                  }`}
                >
                  {category.icon}
                  {category.title}
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* FAQ Content */}
        <section className="container mx-auto px-4 md:px-6 py-12 md:py-16 max-w-4xl">
          <div className="space-y-12">
            {filteredCategories.map((category, catIdx) => (
              <motion.div
                key={category.title}
                id={`faq-category-${catIdx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: catIdx * 0.1 }}
                className="scroll-mt-28"
              >
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#007699]/10 text-[#007699]">
                    {category.icon}
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">{category.title}</h2>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>

                <Accordion type="single" collapsible className="space-y-3">
                  {category.items.map((faq) => (
                    <AccordionItem 
                      key={faq.id} 
                      value={faq.id}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow px-5 md:px-6"
                      data-testid={`faq-item-${faq.id}`}
                    >
                      <AccordionTrigger className="text-left py-5 hover:no-underline">
                        <span className="flex items-start gap-3">
                          <span className="bg-[#007699] text-white min-w-[28px] h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {faq.id}
                          </span>
                          <span className="font-semibold text-foreground text-[15px] leading-snug">{faq.question}</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-5 pl-10 text-muted-foreground leading-relaxed">
                        {faq.answer && <p className="mb-3">{faq.answer}</p>}
                        {faq.bullets && (
                          <ul className="space-y-2.5 mb-3">
                            {faq.bullets.map((bullet, idx) => (
                              <li key={idx} className="flex items-start gap-2.5">
                                <span className="text-[#007699] mt-1.5 text-xs">●</span>
                                <span className="text-sm leading-relaxed">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {faq.afterBullets && <p className="text-sm font-medium text-foreground/80 bg-gray-50 rounded-lg p-3 border-l-2 border-[#007699]/30">{faq.afterBullets}</p>}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-[#007699] to-[#005a75] py-16 md:py-20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Still Have Questions?</h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Can't find what you're looking for? Our support team is always happy to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button className="bg-white text-[#007699] hover:bg-gray-100 font-bold rounded-full px-8 py-6 text-base shadow-lg cursor-pointer">
                    Contact Support
                  </Button>
                </Link>
                <Link href="/community-guidelines">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold rounded-full px-8 py-6 text-base cursor-pointer">
                    Community Guidelines
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer — matches Home page */}
      <footer className="bg-gray-950 text-gray-300 pt-20 pb-10 border-t border-gray-900">
        <div className="container px-6 mx-auto">
          <div className="flex flex-col gap-y-10 md:grid md:grid-cols-12 md:gap-12 mb-16">
            <div className="col-span-12 md:col-span-4 flex flex-col items-center text-center md:items-start md:text-left">
              <Link href="/" className="inline-block mb-6 opacity-90 hover:opacity-100 transition-opacity">
                <img src={logoImage} alt="ScrollPet Logo" className="h-10 w-auto object-contain brightness-0 invert opacity-90" />
              </Link>
              <p className="text-gray-400 mb-6 leading-relaxed max-w-sm">
                Connecting pet lovers worldwide in a safe, trusted environment. Join us in building the most positive pet community on the internet.
              </p>
              <div className="flex gap-3 justify-center md:justify-start">
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

            <div className="flex gap-8 justify-center md:col-span-8 md:grid md:grid-cols-3 md:gap-8">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <h4 className="font-bold text-white mb-6 text-lg">Platform</h4>
                <ul className="space-y-3">
                  <li><Link href="/" className="hover:text-primary transition-colors cursor-pointer text-gray-400 hover:text-white">Home</Link></li>
                  <li><Link href="/chat" className="hover:text-primary transition-colors cursor-pointer text-gray-400 hover:text-white">Chat Rooms</Link></li>
                  <li><Link href="/login" className="hover:text-primary transition-colors cursor-pointer text-gray-400 hover:text-white">Login</Link></li>
                  <li><Link href="/signup" className="hover:text-primary transition-colors cursor-pointer text-gray-400 hover:text-white">Sign Up</Link></li>
                </ul>
              </div>

              <div className="hidden md:flex md:flex-col items-center md:items-start text-center md:text-left">
                <h4 className="font-bold text-white mb-6 text-lg">Company</h4>
                <ul className="space-y-3">
                  <li><Link href="/about" className="hover:text-primary transition-colors cursor-pointer text-gray-400 hover:text-white">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-primary transition-colors cursor-pointer text-gray-400 hover:text-white">Contact Us</Link></li>
                  <li><Link href="/faq" className="text-primary cursor-pointer">FAQ</Link></li>
                </ul>
              </div>

              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <h4 className="font-bold text-white mb-6 text-lg">Legal</h4>
                <ul className="space-y-3">
                  <li><Link href="/privacy" className="hover:text-primary transition-colors cursor-pointer text-gray-400 hover:text-white">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-primary transition-colors cursor-pointer text-gray-400 hover:text-white">Terms of Service</Link></li>
                  <li><Link href="/community-guidelines" className="hover:text-primary transition-colors cursor-pointer text-gray-400 hover:text-white">Guidelines</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 gap-4 text-center md:text-left">
            <div>© {new Date().getFullYear()} ScrollPet. All rights reserved.</div>
            <div className="flex gap-4 sm:gap-8 flex-wrap justify-center">
              <span>Made with ❤️ for pet lovers everywhere 🐾</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
