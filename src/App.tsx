import PrivacyPolicy from "@/pages/privacy";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import HomeFeed from "@/pages/HomeFeed";
import ChatRooms from "@/pages/chat-rooms";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ChatInterface from "@/pages/chat-interface";
import CommunityGuidelines from "@/pages/community-guidelines";
import FAQ from "@/pages/faq";
import Profile from "@/components/Profile";
import UserProfile from "@/pages/user-profile";
import PublicProfile from "@/pages/public-profile";
import AdminDashboard from "@/pages/admin-dashboard";
import TermsOfService from "@/pages/terms";
import CookiesPolicy from "@/pages/cookies";
import About from "@/pages/about";
import ContactUs from "@/pages/contact";

import UpdatePassword from "@/pages/update-password";
import PetProfilePage from "@/pages/pet-profile";
import ExplorePage from "@/pages/explore";
import FeedPage from "@/pages/feed";
import CommunityDirectory from "@/pages/community";
import GlobalLocationDetector from "@/components/GlobalLocationDetector";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileHelpFAB from "@/components/MobileHelpFAB";
import ErrorBoundary from "@/components/ErrorBoundary";
import { usePresence } from "@/hooks/use-presence";
import { useAuth } from "@/hooks/use-auth";

function PresenceTracker() {
  usePresence();
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeFeed} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/chat" component={ChatRooms} />
      <Route path="/chat-rooms" component={ChatRooms} />
      <Route path="/chat-interface" component={ChatInterface} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/community-guidelines" component={CommunityGuidelines} />
      <Route path="/faq" component={FAQ} />
      <Route path="/profile" component={Profile} />
      <Route path="/user-profile" component={UserProfile} />
      <Route path="/profile/:username" component={PublicProfile} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/cookies" component={CookiesPolicy} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={ContactUs} />
      <Route path="/contact-us" component={ContactUs} />
      <Route path="/update-password" component={UpdatePassword} />
      <Route path="/pet/:petId" component={PetProfilePage} />
      <Route path="/explore" component={ExplorePage} />
      <Route path="/community" component={CommunityDirectory} />
      <Route path="/feed" component={FeedPage} />
      <Route path="/inbox" component={ChatInterface} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GlobalLocationDetector />
        <PresenceTracker />
        <TooltipProvider>
          <Navbar />
          <div className="pb-16 md:pb-0">
            <Router />
          </div>
          <MobileBottomNav />
          <MobileHelpFAB />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
