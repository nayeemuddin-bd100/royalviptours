import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, FileText, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your quote requests and performance
        </p>
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
    </div>
  );
}
