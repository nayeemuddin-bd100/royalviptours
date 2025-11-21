import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import TenantsPage from "@/pages/admin/tenants-page";
import UsersPage from "@/pages/admin/users-page";
import AuditLogsPage from "@/pages/admin/audit-logs-page";
import ItinerariesPage from "@/pages/itineraries-page";
import QuotesPage from "@/pages/quotes-page";
import AgencyRegistrationPage from "@/pages/agency-registration-page";
import SupplierDashboard from "@/pages/supplier-dashboard";
import AgencyDashboard from "@/pages/agency-dashboard";
import AgencyAccountPage from "@/pages/agency-account-page";
import AgencyItinerariesPage from "@/pages/agency-itineraries-page";
import AgencyItineraryNewPage from "@/pages/agency-itinerary-new-page";
import AgencyItineraryEditPage from "@/pages/agency-itinerary-edit-page";
import AgencyRfqsPage from "@/pages/agency-rfqs-page";
import AgencyRfqDetailPage from "@/pages/agency-rfq-detail-page";
import SupplierRfqInboxPage from "@/pages/supplier-rfq-inbox-page";
import CountryManagerCatalogPage from "@/pages/country-manager-catalog-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/register/agency" component={AgencyRegistrationPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/admin/tenants" component={TenantsPage} />
      <ProtectedRoute path="/admin/users" component={UsersPage} />
      <ProtectedRoute path="/admin/audit" component={AuditLogsPage} />
      <ProtectedRoute path="/supplier" component={SupplierDashboard} />
      <ProtectedRoute path="/supplier/rfq-inbox" component={SupplierRfqInboxPage} />
      <ProtectedRoute path="/country-manager/catalog" component={CountryManagerCatalogPage} />
      <ProtectedRoute path="/agency" component={AgencyDashboard} />
      <ProtectedRoute path="/agency/account" component={AgencyAccountPage} />
      <ProtectedRoute path="/itineraries/new" component={AgencyItineraryNewPage} />
      <ProtectedRoute path="/itineraries/:id" component={AgencyItineraryEditPage} />
      <ProtectedRoute path="/itineraries" component={ItinerariesPage} />
      <ProtectedRoute path="/rfqs/:id" component={AgencyRfqDetailPage} />
      <ProtectedRoute path="/rfqs" component={AgencyRfqsPage} />
      <ProtectedRoute path="/quotes" component={QuotesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Custom sidebar width for B2B application
  const style = {
    "--sidebar-width": "16rem",       // 256px for navigation
    "--sidebar-width-icon": "3rem",   // default icon width
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center gap-4 border-b border-border bg-background px-4 py-3">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                </header>
                <main className="flex-1 overflow-auto bg-background">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
