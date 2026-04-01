import PrivacyPolicy from "@/pages/privacy";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
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
import GlobalLocationDetector from "@/components/GlobalLocationDetector";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
      <Route path="/update-password" component={UpdatePassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalLocationDetector />
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>

    </QueryClientProvider>
  );
}

export default App;
