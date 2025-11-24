import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, Building2, User, MapPin, AlertCircle, FileText, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TransportManagement from "@/components/supplier/transport-management";
import HotelManagement from "@/components/supplier/hotel-management";
import GuideManagement from "@/components/supplier/guide-management";
import SightManagement from "@/components/supplier/sight-management";

export default function SupplierDashboard() {
  const { user, userTenants, isLoading, isTenantsLoading, activeTenantId, setActiveTenantId } = useAuth();

  const { data: rfqSegments = [], isLoading: segmentsLoading } = useQuery<any[]>({
    queryKey: ["/api/supplier/rfq-segments"],
  });

  if (isLoading || isTenantsLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!userTenants || userTenants.length === 0) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are not assigned to any tenant. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get unique supplier roles across all tenants
  const supplierRoles = Array.from(new Set(
    userTenants.map((ut: any) => ut.tenantRole).filter((role: string) => 
      ['transport', 'hotel', 'guide', 'sight'].includes(role)
    )
  ));

  if (supplierRoles.length === 0) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have any supplier roles assigned. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate statistics from RFQ segments
  const totalRfqs = rfqSegments.length;
  const pendingRfqs = rfqSegments.filter((seg: any) => seg.segment?.status === 'pending').length;
  const quotedRfqs = rfqSegments.filter((seg: any) => seg.segment?.status === 'quoted').length;
  const acceptedRfqs = rfqSegments.filter((seg: any) => seg.segment?.status === 'accepted').length;

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold">Supplier Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your services, pricing, and quote requests
          </p>
        </div>

        {/* Tenant Selector */}
        {userTenants && userTenants.length > 1 && (
          <div className="flex items-center gap-4">
            <Label htmlFor="tenant-select">Active Country:</Label>
            <Select value={activeTenantId || ""} onValueChange={setActiveTenantId}>
              <SelectTrigger className="w-64" id="tenant-select" data-testid="select-active-tenant">
                <SelectValue placeholder="Select country..." />
              </SelectTrigger>
              <SelectContent>
                {userTenants.map((ut) => (
                  <SelectItem key={ut.tenantId} value={ut.tenantId}>
                    {ut.tenantName} ({ut.tenantRole})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RFQs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="text-total-rfqs">{totalRfqs}</div>
            <p className="text-xs text-muted-foreground">
              {totalRfqs === 0 ? "No quote requests yet" : `${totalRfqs} ${totalRfqs === 1 ? 'request' : 'requests'}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="text-pending-quotes">{pendingRfqs}</div>
            <p className="text-xs text-muted-foreground">
              {pendingRfqs === 0 ? "All caught up" : "Awaiting your response"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quoted</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="text-quoted">{quotedRfqs}</div>
            <p className="text-xs text-muted-foreground">
              {quotedRfqs === 0 ? "No quotes submitted" : `${quotedRfqs} ${quotedRfqs === 1 ? 'quote' : 'quotes'} submitted`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="text-accepted">{acceptedRfqs}</div>
            <p className="text-xs text-muted-foreground">
              {acceptedRfqs === 0 ? "No accepted quotes" : `${acceptedRfqs} ${acceptedRfqs === 1 ? 'quote' : 'quotes'} accepted`}
            </p>
          </CardContent>
        </Card>
      </div>

      {supplierRoles.length === 1 ? (
        // Single role - show content directly
        <div>
          {supplierRoles[0] === 'transport' && <TransportManagement />}
          {supplierRoles[0] === 'hotel' && <HotelManagement />}
          {supplierRoles[0] === 'guide' && <GuideManagement />}
          {supplierRoles[0] === 'sight' && <SightManagement />}
        </div>
      ) : (
        // Multiple roles - show tabs
        <Tabs defaultValue={supplierRoles[0]} className="space-y-4">
          <TabsList>
            {supplierRoles.includes('transport') && (
              <TabsTrigger value="transport" className="gap-2">
                <Bus className="h-4 w-4" />
                Transport
              </TabsTrigger>
            )}
            {supplierRoles.includes('hotel') && (
              <TabsTrigger value="hotel" className="gap-2">
                <Building2 className="h-4 w-4" />
                Hotels
              </TabsTrigger>
            )}
            {supplierRoles.includes('guide') && (
              <TabsTrigger value="guide" className="gap-2">
                <User className="h-4 w-4" />
                Guides
              </TabsTrigger>
            )}
            {supplierRoles.includes('sight') && (
              <TabsTrigger value="sight" className="gap-2">
                <MapPin className="h-4 w-4" />
                Sights
              </TabsTrigger>
            )}
          </TabsList>

          {supplierRoles.includes('transport') && (
            <TabsContent value="transport">
              <TransportManagement />
            </TabsContent>
          )}
          {supplierRoles.includes('hotel') && (
            <TabsContent value="hotel">
              <HotelManagement />
            </TabsContent>
          )}
          {supplierRoles.includes('guide') && (
            <TabsContent value="guide">
              <GuideManagement />
            </TabsContent>
          )}
          {supplierRoles.includes('sight') && (
            <TabsContent value="sight">
              <SightManagement />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
