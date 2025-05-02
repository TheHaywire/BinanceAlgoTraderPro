import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/dashboard";
import DashboardEnhanced from "@/pages/dashboard-enhanced";
import Strategies from "@/pages/strategies";
import Markets from "@/pages/markets";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardEnhanced} />
      <Route path="/dashboard-enhanced">
        <Layout>
          <DashboardEnhanced />
        </Layout>
      </Route>
      <Route path="/old-dashboard">
        <Layout>
          <Dashboard />
        </Layout>
      </Route>
      <Route path="/strategies">
        <Layout>
          <Strategies />
        </Layout>
      </Route>
      <Route path="/markets">
        <Layout>
          <Markets />
        </Layout>
      </Route>
      <Route path="/analytics">
        <Layout>
          <Analytics />
        </Layout>
      </Route>
      <Route path="/settings">
        <Layout>
          <Settings />
        </Layout>
      </Route>
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
