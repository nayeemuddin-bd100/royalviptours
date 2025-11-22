import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Calendar, Building, ExternalLink, Plus } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface RfqData {
  id: string;
  tenantId: string;
  itineraryId: string;
  agencyId: string | null;
  userId: string | null;
  requestedByContactId: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  itineraryTitle: string | null;
  itineraryStartDate: string | null;
  itineraryEndDate: string | null;
  tenantName: string | null;
}

interface ItineraryData {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
}

export default function AgencyRfqsPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const from_itinerary = searchParams.get('from_itinerary');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItineraryId, setSelectedItineraryId] = useState<string>("");

  const { data: rfqs, isLoading } = useQuery<RfqData[]>({
    queryKey: ["/api/rfqs"],
  });

  const { data: itineraries } = useQuery<ItineraryData[]>({
    queryKey: ["/api/itineraries"],
  });

  const createRfqMutation = useMutation({
    mutationFn: async (itineraryId: string) => {
      const res = await apiRequest("POST", "/api/rfqs", { itineraryId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs"] });
      setIsDialogOpen(false);
      setSelectedItineraryId("");
      toast({
        title: "RFQ Created",
        description: "Quote request has been sent to suppliers",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create RFQ",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Auto-create RFQ when coming from itinerary page
  useEffect(() => {
    if (from_itinerary && !createRfqMutation.isPending && rfqs !== undefined) {
      // Check if RFQ already exists for this itinerary
      const existingRfq = rfqs.find((rfq) => rfq.itineraryId === from_itinerary);
      if (!existingRfq) {
        createRfqMutation.mutate(from_itinerary);
      }
    }
  }, [from_itinerary, rfqs]);

  const handleCreateRfq = () => {
    if (selectedItineraryId) {
      createRfqMutation.mutate(selectedItineraryId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "quoted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "declined":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Filter out itineraries that already have RFQs
  const availableItineraries = itineraries?.filter(
    (itinerary) => !rfqs?.some((rfq) => rfq.itineraryId === itinerary.id)
  ) || [];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-64 bg-muted rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
            RFQs (Requests for Quote)
          </h1>
          <p className="text-muted-foreground">
            View and manage quote requests sent to suppliers
          </p>
        </div>
        {availableItineraries.length > 0 && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-rfq">
                <Plus className="h-4 w-4 mr-2" />
                Create RFQ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Quote Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Select Itinerary
                  </label>
                  <Select
                    value={selectedItineraryId}
                    onValueChange={setSelectedItineraryId}
                  >
                    <SelectTrigger data-testid="select-itinerary">
                      <SelectValue placeholder="Choose an itinerary" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableItineraries.map((itinerary) => (
                        <SelectItem key={itinerary.id} value={itinerary.id}>
                          {itinerary.title} ({format(new Date(itinerary.startDate), "MMM d")} - {format(new Date(itinerary.endDate), "MMM d, yyyy")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-rfq"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateRfq}
                    disabled={!selectedItineraryId || createRfqMutation.isPending}
                    data-testid="button-submit-rfq"
                  >
                    {createRfqMutation.isPending ? "Creating..." : "Create RFQ"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!rfqs || rfqs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No RFQs yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              {availableItineraries.length > 0
                ? "Create a quote request from one of your itineraries"
                : "Create an itinerary first, then request quotes from suppliers"}
            </p>
            {availableItineraries.length > 0 ? (
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-rfq">
                <Plus className="h-4 w-4 mr-2" />
                Create RFQ
              </Button>
            ) : (
              <Link href="/itineraries">
                <Button data-testid="button-go-to-itineraries">Go to Itineraries</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rfqs.map((rfq) => (
            <Card key={rfq.id} className="hover-elevate" data-testid={`card-rfq-${rfq.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold" data-testid={`text-rfq-title-${rfq.id}`}>
                      {rfq.itineraryTitle || "Untitled Itinerary"}
                    </h3>
                    <Badge className={getStatusColor(rfq.status)} data-testid={`badge-rfq-status-${rfq.id}`}>
                      {rfq.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {rfq.tenantName && (
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        <span>{rfq.tenantName}</span>
                      </div>
                    )}
                    {rfq.itineraryStartDate && rfq.itineraryEndDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(rfq.itineraryStartDate), "MMM d")} - {format(new Date(rfq.itineraryEndDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-xs">Created {format(new Date(rfq.createdAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/rfqs/${rfq.id}`}>
                    <Button size="sm" data-testid={`button-view-rfq-${rfq.id}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
