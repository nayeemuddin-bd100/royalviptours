import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Calendar, Users, Trash2, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface Itinerary {
  id: string;
  tenantId: string;
  agencyId: string;
  title: string;
  paxAdults: number;
  paxChildren: number;
  startDate: string;
  endDate: string;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AgencyItinerariesPage() {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: itineraries, isLoading } = useQuery<Itinerary[]>({
    queryKey: ["/api/agency/itineraries"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/agency/itineraries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency/itineraries"] });
      setDeleteId(null);
      toast({
        title: "Itinerary deleted",
        description: "The itinerary has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete itinerary",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      draft: "secondary",
      requested: "default",
      quoted: "outline",
      expired: "secondary",
      canceled: "secondary",
    };
    return (
      <Badge variant={variants[status] || "default"} data-testid={`badge-status-${status}`}>
        {status}
      </Badge>
    );
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-itineraries">
            My Itineraries
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage trip itineraries for your clients
          </p>
        </div>
        <Link href="/itineraries/new">
          <Button data-testid="button-create-itinerary">
            <Plus className="h-4 w-4 mr-2" />
            New Itinerary
          </Button>
        </Link>
      </div>

      {!itineraries || itineraries.length === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No itineraries yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first itinerary to start planning trips for your clients
            </p>
            <Link href="/itineraries/new">
              <Button data-testid="button-create-first-itinerary">
                <Plus className="h-4 w-4 mr-2" />
                Create Itinerary
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {itineraries.map((itinerary) => (
            <Card key={itinerary.id} data-testid={`card-itinerary-${itinerary.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl" data-testid={`text-title-${itinerary.id}`}>
                      {itinerary.title}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(itinerary.startDate), "MMM d, yyyy")} - {format(new Date(itinerary.endDate), "MMM d, yyyy")}
                        <span className="ml-1">({calculateDuration(itinerary.startDate, itinerary.endDate)} days)</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {itinerary.paxAdults} adult{itinerary.paxAdults !== 1 ? "s" : ""}
                        {itinerary.paxChildren > 0 && `, ${itinerary.paxChildren} child${itinerary.paxChildren !== 1 ? "ren" : ""}`}
                      </span>
                    </CardDescription>
                  </div>
                  <div>{getStatusBadge(itinerary.status)}</div>
                </div>
                {itinerary.notes && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {itinerary.notes}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Link href={`/itineraries/${itinerary.id}`}>
                    <Button variant="default" size="sm" data-testid={`button-view-${itinerary.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View & Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(itinerary.id)}
                    data-testid={`button-delete-${itinerary.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Itinerary</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this itinerary? This action cannot be undone and will delete all days and events associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
