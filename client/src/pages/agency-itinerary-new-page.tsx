import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { Link } from "wouter";

interface Tenant {
  id: string;
  name: string;
  countryCode: string;
}

export default function AgencyItineraryNewPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    tenantId: "",
    title: "",
    paxAdults: 2,
    paxChildren: 0,
    startDate: "",
    endDate: "",
    notes: "",
  });

  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
    queryFn: async () => {
      const res = await fetch("/api/tenants", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token") || ""}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch tenants");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/itineraries", data);
      return await response.json();
    },
    onSuccess: (itinerary) => {
      queryClient.invalidateQueries({ queryKey: ["/api/itineraries"] });
      toast({
        title: "Itinerary created",
        description: "Your itinerary has been successfully created.",
      });
      setLocation(`/itineraries/${itinerary.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create itinerary",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tenantId || !formData.title || !formData.startDate || !formData.endDate) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast({
        title: "Validation error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    // Ensure passenger counts are numbers
    const submitData = {
      ...formData,
      paxAdults: Number(formData.paxAdults),
      paxChildren: Number(formData.paxChildren),
    };

    createMutation.mutate(submitData);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/itineraries">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Itineraries
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Itinerary</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tenantId">Destination Country *</Label>
              <Select
                value={formData.tenantId}
                onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
              >
                <SelectTrigger id="tenantId" data-testid="select-tenant">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {tenants?.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.countryCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Itinerary Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Jordan Explorer - 7 Days"
                data-testid="input-title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="pl-10"
                    data-testid="input-start-date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="pl-10"
                    data-testid="input-end-date"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paxAdults">Adults *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="paxAdults"
                    type="number"
                    min="1"
                    value={formData.paxAdults}
                    onChange={(e) => setFormData({ ...formData, paxAdults: parseInt(e.target.value) || 0 })}
                    className="pl-10"
                    data-testid="input-adults"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paxChildren">Children</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="paxChildren"
                    type="number"
                    min="0"
                    value={formData.paxChildren}
                    onChange={(e) => setFormData({ ...formData, paxChildren: parseInt(e.target.value) || 0 })}
                    className="pl-10"
                    data-testid="input-children"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any special notes or requirements for this itinerary..."
                rows={4}
                data-testid="input-notes"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-create"
              >
                {createMutation.isPending ? "Creating..." : "Create Itinerary"}
              </Button>
              <Link href="/itineraries">
                <Button type="button" variant="outline" data-testid="button-cancel">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
