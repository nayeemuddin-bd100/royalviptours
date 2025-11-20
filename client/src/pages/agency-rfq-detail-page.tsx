import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Users, Package } from "lucide-react";
import { format } from "date-fns";

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

  const { data: rfq, isLoading, error } = useQuery<RfqDetail>({
    queryKey: ["/api/agency/rfqs", rfqId],
    enabled: !!rfqId,
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
          <CardTitle>Quote Summary</CardTitle>
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
                  <div>
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
                        <p className="text-sm text-muted-foreground">Quoted Price</p>
                        <p className="text-2xl font-bold" data-testid={`text-segment-price-${segment.id}`}>
                          ${parseFloat(segment.proposedPrice).toFixed(2)}
                        </p>
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
