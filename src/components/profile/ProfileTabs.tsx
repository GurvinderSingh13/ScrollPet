import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProfileTab {
  id: "posts" | "pets" | "gallery";
  label: string;
}

interface ProfileTabsProps {
  activeTab: "posts" | "pets" | "gallery";
  setActiveTab: (tab: "posts" | "pets" | "gallery") => void;
  tabs?: ProfileTab[];
}

export default function ProfileTabs({ activeTab, setActiveTab, tabs }: ProfileTabsProps) {
  const defaultTabs: ProfileTab[] = [
    { id: "posts", label: "Posts" },
    { id: "pets", label: "Pets" },
  ];
  
  const displayTabs = tabs || defaultTabs;

  return (
    <div className="border-b border-gray-100/50 mb-6 sm:mb-8 sticky top-16 bg-white/80 backdrop-blur-xl z-20">
      <div className="flex gap-6 sm:gap-10 px-2 max-w-2xl mx-auto">
        {displayTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "posts" | "pets" | "gallery")}
            className={`pb-4 text-sm sm:text-base font-semibold relative transition-colors ${
              activeTab === tab.id
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabProfile"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-t-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
