import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ClipboardList, Send, Eye } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

const quoteSchema = z.object({
  proposedPrice: z.coerce.number().positive({ message: "Price must be greater than 0" }),
  supplierNotes: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

export default function SupplierRfqInboxPage() {
  const { toast } = useToast();
  const [selectedSegment, setSelectedSegment] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: segments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/supplier/rfq-segments"],
  });

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      proposedPrice: 0,
      supplierNotes: "",
    },
  });

  const submitQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormData & { segmentId: string }) => {
      const response = await fetch(`/api/supplier/rfq-segments/${data.segmentId}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedPrice: data.proposedPrice,
          supplierNotes: data.supplierNotes,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit quote");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/rfq-segments"] });
      toast({
        title: "Quote Submitted",
        description: "Your quote has been submitted successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit quote",
        variant: "destructive",
      });
    },
  });

  const handleSubmitQuote = (data: QuoteFormData) => {
    if (!selectedSegment) return;
    submitQuoteMutation.mutate({
      ...data,
      segmentId: selectedSegment.segment.id,
    });
  };

  const openQuoteDialog = (segment: any) => {
    setSelectedSegment(segment);
    form.reset({
      proposedPrice: segment.segment.proposedPrice ? parseFloat(segment.segment.proposedPrice) : 0,
      supplierNotes: segment.segment.supplierNotes || "",
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      supplier_review: { variant: "outline", label: "In Review" },
      supplier_proposed: { variant: "default", label: "Quote Submitted" },
      accepted: { variant: "default", label: "Accepted" },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    
    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <ClipboardList className="h-8 w-8" />
          <h1 className="text-3xl font-bold">RFQ Inbox</h1>
        </div>
        <div className="text-muted-foreground">Loading quote requests...</div>
      </div>
    );
  }

  if (!segments || segments.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <ClipboardList className="h-8 w-8" />
          <h1 className="text-3xl font-bold">RFQ Inbox</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">No quote requests yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <ClipboardList className="h-8 w-8" />
        <h1 className="text-3xl font-bold" data-testid="heading-rfq-inbox">RFQ Inbox</h1>
      </div>

      <div className="grid gap-4">
        {segments.map((item) => (
          <Card key={item.segment.id} className="hover-elevate" data-testid={`card-segment-${item.segment.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{item.itinerary.tripName}</CardTitle>
                  <CardDescription>
                    {item.agency.tradeName || item.agency.legalName}
                  </CardDescription>
                </div>
                {getStatusBadge(item.segment.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <div className="text-sm text-muted-foreground">Trip Dates</div>
                  <div className="font-medium">
                    {format(new Date(item.itinerary.startDate), "MMM d")} - {format(new Date(item.itinerary.endDate), "MMM d, yyyy")}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Passengers</div>
                  <div className="font-medium">{item.itinerary.passengerCount}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Event Type</div>
                  <div className="font-medium capitalize">{item.segment.supplierType}</div>
                </div>
                {item.segment.proposedPrice && (
                  <div>
                    <div className="text-sm text-muted-foreground">Your Quote</div>
                    <div className="font-medium">${item.segment.proposedPrice}</div>
                  </div>
                )}
              </div>

              {item.segment.eventDetails && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground mb-1">Details</div>
                  <p className="text-sm">{item.segment.eventDetails}</p>
                </div>
              )}

              {item.segment.supplierNotes && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground mb-1">Your Notes</div>
                  <p className="text-sm">{item.segment.supplierNotes}</p>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button
                  variant="default"
                  onClick={() => openQuoteDialog(item)}
                  disabled={submitQuoteMutation.isPending}
                  data-testid={`button-submit-quote-${item.segment.id}`}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {item.segment.status === "supplier_proposed" ? "Update Quote" : "Submit Quote"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-submit-quote">
          <DialogHeader>
            <DialogTitle>Submit Quote</DialogTitle>
            <DialogDescription>
              {selectedSegment && (
                <>
                  {selectedSegment.itinerary.tripName} - {selectedSegment.agency.tradeName || selectedSegment.agency.legalName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitQuote)} className="space-y-4">
              <FormField
                control={form.control}
                name="proposedPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposed Price (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-proposed-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplierNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about your quote..."
                        {...field}
                        data-testid="input-supplier-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitQuoteMutation.isPending}
                  data-testid="button-submit"
                >
                  {submitQuoteMutation.isPending ? "Submitting..." : "Submit Quote"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
