import {
  Building2,
  Plane,
  Hotel,
  Users,
  MapPin,
  Calendar,
  FileText,
  Settings,
  LogOut,
  LayoutDashboard,
  Car,
  UserCircle,
  Landmark,
  Globe,
  ClipboardList,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";

// Admin navigation items
const adminItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Tenants", url: "/admin/tenants", icon: Globe },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Audit Logs", url: "/admin/audit", icon: FileText },
];

// Country Manager navigation items
const managerItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Cities & Airports", url: "/catalog/cities", icon: MapPin },
  { title: "Event Categories", url: "/catalog/events", icon: ClipboardList },
  { title: "Suppliers", url: "/suppliers", icon: Building2 },
  { title: "Pending RFQs", url: "/rfqs", icon: FileText },
];

// Transport Company navigation items
const transportItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Company", url: "/transport/profile", icon: Building2 },
  { title: "Fleet", url: "/transport/fleet", icon: Car },
  { title: "Products", url: "/transport/products", icon: Plane },
  { title: "Incoming RFQs", url: "/transport/rfqs", icon: FileText },
];

// Hotel navigation items
const hotelItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Hotel", url: "/hotel/profile", icon: Hotel },
  { title: "Room Types", url: "/hotel/rooms", icon: Building2 },
  { title: "Rates", url: "/hotel/rates", icon: FileText },
  { title: "Incoming RFQs", url: "/hotel/rfqs", icon: ClipboardList },
];

// Tour Guide navigation items
const guideItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Profile", url: "/guide/profile", icon: UserCircle },
  { title: "Rates & Availability", url: "/guide/rates", icon: Calendar },
  { title: "Incoming RFQs", url: "/guide/rfqs", icon: FileText },
];

// Agency navigation items
const agencyItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Itineraries", url: "/itineraries", icon: Calendar },
  { title: "Quotes", url: "/quotes", icon: FileText },
  { title: "Account", url: "/agency/profile", icon: Building2 },
];

export function AppSidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  // Determine navigation items based on user role
  const getNavigationItems = () => {
    if (!user) return [];
    
    // For now, we'll default to agency items
    // In a real app, you'd check user.role and user_tenants to determine the correct nav
    if (user.role === "admin") {
      return adminItems;
    }
    
    // Default to agency
    return agencyItems;
  };

  const items = getNavigationItems();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Sidebar data-testid="app-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-sidebar-primary" />
          <span className="font-semibold text-sidebar-foreground">Royal VIP Tours</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatarUrl || undefined} />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || user?.email}
              </p>
              <p className="text-xs text-muted-foreground capitalize truncate">
                {user?.role || "User"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
