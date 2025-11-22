import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Users, Package, Check, X, FileCheck } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface RfqSegment {
  id: string;
  rfqId: string;
  supplierType: string;
  supplierId: string;
  payload: any;
  status: string;
  supplierNotes: string | null;
  proposedPrice: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ItineraryData {
  id: string;
  title: string;
  paxAdults: number;
  paxChildren: number;
  startDate: string;
  endDate: string;
  notes: string | null;
  status: string;
}

interface RfqDetail {
  id: string;
  tenantId: string;
  itineraryId: string;
  agencyId: string;
  requestedByContactId: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  segments: RfqSegment[];
  itinerary: ItineraryData;
}

export default function AgencyRfqDetailPage() {
  const [, params] = useRoute("/rfqs/:id");
  const rfqId = params?.id;
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: rfq, isLoading, error } = useQuery<RfqDetail>({
    queryKey: ["/api/rfqs", rfqId],
    enabled: !!rfqId,
  });

  const updateSegmentStatusMutation = useMutation({
    mutationFn: async ({ segmentId, status }: { segmentId: string; status: "accepted" | "rejected" }) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/agency/rfq-segments/${segmentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update quote status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs", rfqId] });
      toast({
        title: "Quote Updated",
        description: "Quote status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quote status",
        variant: "destructive",
      });
    },
  });

  const compileQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!rfq) return;
      
      // Get all accepted segments
      const acceptedSegments = rfq.segments.filter(s => s.status === "accepted");
      
      // Calculate totals
      const items = acceptedSegments.map(segment => ({
        segmentId: segment.id,
        supplierType: segment.supplierType,
        description: `${segment.supplierType} service`,
        price: parseFloat(segment.proposedPrice || "0"),
        notes: segment.supplierNotes || "",
      }));
      
      const subtotal = items.reduce((sum, item) => sum + item.price, 0);
      const total = subtotal; // Can add taxes/fees later
      
      const res = await apiRequest("POST", "/api/quotes/compile", {
        rfqId: rfq.id,
        items,
        currency: "USD",
        subtotal: subtotal.toString(),
        total: total.toString(),
      });
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Quote Compiled!",
        description: "Your quote has been created successfully.",
      });
      setLocation("/quotes");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to compile quote",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "supplier_review":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "supplier_proposed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "accepted":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-64 bg-muted rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive mb-2">Failed to load RFQ</p>
        <p className="text-muted-foreground text-sm mb-4">{(error as Error).message || "An error occurred"}</p>
        <Link href="/rfqs">
          <Button>Back to RFQs</Button>
        </Link>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">RFQ not found</p>
        <Link href="/rfqs">
          <Button className="mt-4">Back to RFQs</Button>
        </Link>
      </div>
    );
  }

  // Group segments by supplier type
  const segmentsByType = rfq.segments.reduce((acc, segment) => {
    if (!acc[segment.supplierType]) {
      acc[segment.supplierType] = [];
    }
    acc[segment.supplierType].push(segment);
    return acc;
  }, {} as Record<string, RfqSegment[]>);

  // Calculate total quoted amount
  const totalQuoted = rfq.segments
    .filter(s => s.proposedPrice)
    .reduce((sum, s) => sum + parseFloat(s.proposedPrice!), 0);

  const quotedCount = rfq.segments.filter(s => s.proposedPrice).length;
  const acceptedCount = rfq.segments.filter(s => s.status === "accepted").length;
  const canCompileQuote = acceptedCount > 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/rfqs">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-to-rfqs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to RFQs
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-rfq-title">{rfq.itinerary.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(rfq.itinerary.startDate), "MMM d")} - {format(new Date(rfq.itinerary.endDate), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>
              {rfq.itinerary.paxAdults} Adults
              {rfq.itinerary.paxChildren > 0 && `, ${rfq.itinerary.paxChildren} Children`}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quote Summary</CardTitle>
            {canCompileQuote && (
              <Button
                onClick={() => compileQuoteMutation.mutate()}
                disabled={compileQuoteMutation.isPending}
                data-testid="button-compile-quote"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Compile Quote
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Segments</p>
              <p className="text-2xl font-bold" data-testid="text-total-segments">{rfq.segments.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Quotes Received</p>
              <p className="text-2xl font-bold" data-testid="text-quotes-received">
                {quotedCount} / {rfq.segments.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Quoted</p>
              <p className="text-2xl font-bold" data-testid="text-total-quoted">
                ${totalQuoted.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segments List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Supplier Quotes</h2>
        {rfq.segments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No segments found for this RFQ</p>
            </CardContent>
          </Card>
        ) : (
          rfq.segments.map((segment) => (
            <Card key={segment.id} data-testid={`card-segment-${segment.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold capitalize">
                        {segment.supplierType} Supplier
                      </h3>
                      <Badge className={getStatusColor(segment.status)} data-testid={`badge-segment-status-${segment.id}`}>
                        {segment.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {segment.payload?.events?.length || 0} event(s)
                    </p>
                  </div>
                  <div className="text-right">
                    {segment.proposedPrice ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-1">Quoted Price</p>
                        <p className="text-2xl font-bold mb-3" data-testid={`text-segment-price-${segment.id}`}>
                          ${parseFloat(segment.proposedPrice).toFixed(2)}
                        </p>
                        {segment.status === "supplier_proposed" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updateSegmentStatusMutation.mutate({ segmentId: segment.id, status: "accepted" })}
                              disabled={updateSegmentStatusMutation.isPending}
                              data-testid={`button-accept-${segment.id}`}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateSegmentStatusMutation.mutate({ segmentId: segment.id, status: "rejected" })}
                              disabled={updateSegmentStatusMutation.isPending}
                              data-testid={`button-reject-${segment.id}`}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Awaiting quote</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              {segment.supplierNotes && (
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-1">Supplier Notes:</p>
                  <p className="text-sm" data-testid={`text-segment-notes-${segment.id}`}>{segment.supplierNotes}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
