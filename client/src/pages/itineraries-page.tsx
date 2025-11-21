import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Calendar, MapPin, Users, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface Tenant {
  id: string;
  name: string;
  countryCode: string;
}

export default function ItinerariesPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tenantId: "",
    title: "",
    paxAdults: 2,
    paxChildren: 0,
    startDate: "",
    endDate: "",
    notes: "",
  });

  const { data: itineraries, isLoading } = useQuery<any[]>({
    queryKey: ["/api/itineraries"],
    initialData: [],
  });

  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["/api/user/tenants"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/itineraries", data);
      return await response.json();
    },
    onSuccess: (itinerary) => {
      queryClient.invalidateQueries({ queryKey: ["/api/itineraries"] });
      toast({
        title: "Success",
        description: "Itinerary created successfully",
      });
      setIsDialogOpen(false);
      setFormData({
        tenantId: "",
        title: "",
        paxAdults: 2,
        paxChildren: 0,
        startDate: "",
        endDate: "",
        notes: "",
      });
      setLocation(`/itineraries/${itinerary.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create itinerary",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tenantId || !formData.title || !formData.startDate || !formData.endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "draft":
        return "outline";
      case "requested":
        return "default";
      case "quoted":
        return "default";
      case "expired":
        return "secondary";
      case "canceled":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Itineraries</h1>
          <p className="text-sm text-muted-foreground">Manage your travel itineraries and request quotes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-itinerary">
              <Plus className="h-4 w-4 mr-2" />
              Create Itinerary
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Itinerary</DialogTitle>
              <DialogDescription>
                Start building a new travel itinerary for your clients
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenant">Country</Label>
                <Select
                  value={formData.tenantId}
                  onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
                >
                  <SelectTrigger data-testid="select-tenant">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants?.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Itinerary Title</Label>
                <Input
                  id="title"
                  placeholder="cox toures"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  data-testid="input-title"
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adults">Adults</Label>
                  <Input
                    id="adults"
                    type="number"
                    min="1"
                    value={formData.paxAdults}
                    onChange={(e) => setFormData({ ...formData, paxAdults: Number(e.target.value) })}
                    data-testid="input-adults"
                    disabled={createMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="children">Children</Label>
                  <Input
                    id="children"
                    type="number"
                    min="0"
                    value={formData.paxChildren}
                    onChange={(e) => setFormData({ ...formData, paxChildren: Number(e.target.value) })}
                    data-testid="input-children"
                    disabled={createMutation.isPending}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    data-testid="input-start-date"
                    disabled={createMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    data-testid="input-end-date"
                    disabled={createMutation.isPending}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Special requirements or preferences"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  data-testid="input-notes"
                  disabled={createMutation.isPending}
                />
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  data-testid="button-save-itinerary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create Itinerary"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Itineraries</CardTitle>
          <CardDescription>View and manage all travel itineraries</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading itineraries...</div>
            </div>
          ) : itineraries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">No itineraries yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                Create your first itinerary to start building travel packages and requesting quotes
              </p>
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-itinerary">
                <Plus className="h-4 w-4 mr-2" />
                Create First Itinerary
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Passengers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itineraries.map((itinerary) => (
                  <TableRow key={itinerary.id} data-testid={`row-itinerary-${itinerary.id}`}>
                    <TableCell className="font-medium">{itinerary.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {format(new Date(itinerary.startDate), "MMM d")} - {format(new Date(itinerary.endDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{itinerary.paxAdults} adults{itinerary.paxChildren > 0 ? `, ${itinerary.paxChildren} children` : ""}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(itinerary.status)}>
                        {itinerary.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(itinerary.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" data-testid={`button-view-${itinerary.id}`}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
