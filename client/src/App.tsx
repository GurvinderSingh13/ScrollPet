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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat" component={ChatRooms} />
      <Route path="/chat-interface" component={ChatInterface} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/community-guidelines" component={CommunityGuidelines} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
