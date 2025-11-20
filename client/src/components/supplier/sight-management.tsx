import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Sight = {
  id: string;
  name: string;
  locationText: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  entryFees: any;
  hours: any;
};

export default function SightManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSight, setSelectedSight] = useState<Sight | null>(null);

  const { data: sights = [], isLoading } = useQuery<Sight[]>({
    queryKey: ['/api/sights'],
  });

  const [form, setForm] = useState({
    name: "",
    locationText: "",
    description: "",
    phone: "",
    email: "",
    entryFees: "",
    hours: "",
  });

  const sightMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const endpoint = selectedSight ? `/api/sights/${selectedSight.id}` : '/api/sights';
      const method = selectedSight ? 'PATCH' : 'POST';
      const res = await apiRequest(method, endpoint, {
        ...data,
        entryFees: data.entryFees ? JSON.parse(data.entryFees) : null,
        hours: data.hours ? JSON.parse(data.hours) : null,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sights'] });
      setIsDialogOpen(false);
      setSelectedSight(null);
      resetForm();
      toast({
        title: selectedSight ? "Sight updated" : "Sight added",
        description: "Attraction has been saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSightMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/sights/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sights'] });
      toast({ title: "Sight deleted", description: "Attraction has been removed" });
    },
  });

  const resetForm = () => {
    setForm({
      name: "",
      locationText: "",
      description: "",
      phone: "",
      email: "",
      entryFees: "",
      hours: "",
    });
  };

  const handleEdit = (sight: Sight) => {
    setSelectedSight(sight);
    setForm({
      name: sight.name,
      locationText: sight.locationText || "",
      description: sight.description || "",
      phone: sight.phone || "",
      email: sight.email || "",
      entryFees: sight.entryFees ? JSON.stringify(sight.entryFees, null, 2) : "",
      hours: sight.hours ? JSON.stringify(sight.hours, null, 2) : "",
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle>Sights & Attractions</CardTitle>
          <CardDescription>Manage visitor attractions and their entry fees</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setSelectedSight(null); resetForm(); }} data-testid="button-add-sight">
              <Plus className="h-4 w-4 mr-2" />
              Add Sight
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedSight ? "Edit Sight" : "Add Sight"}</DialogTitle>
              <DialogDescription>Enter attraction details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="input-sight-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Downtown Amman"
                  value={form.locationText}
                  onChange={(e) => setForm({ ...form, locationText: e.target.value })}
                  data-testid="input-sight-location"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  data-testid="input-sight-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    data-testid="input-sight-phone"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    data-testid="input-sight-email"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fees">Entry Fees (JSON)</Label>
                <Textarea
                  id="fees"
                  placeholder='{"adult": 10, "child": 5}'
                  value={form.entryFees}
                  onChange={(e) => setForm({ ...form, entryFees: e.target.value })}
                  rows={2}
                  data-testid="input-sight-fees"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hours">Operating Hours (JSON)</Label>
                <Textarea
                  id="hours"
                  placeholder='{"weekday": "9:00-17:00", "weekend": "10:00-16:00"}'
                  value={form.hours}
                  onChange={(e) => setForm({ ...form, hours: e.target.value })}
                  rows={2}
                  data-testid="input-sight-hours"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => sightMutation.mutate(form)}
                disabled={!form.name || sightMutation.isPending}
                data-testid="button-save-sight"
              >
                {sightMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading sights...</div>
        ) : sights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sights yet. Click "Add Sight" to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Entry Fees</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sights.map((sight) => (
                <TableRow key={sight.id} data-testid={`row-sight-${sight.id}`}>
                  <TableCell className="font-medium">{sight.name}</TableCell>
                  <TableCell className="text-sm">{sight.locationText || '-'}</TableCell>
                  <TableCell className="text-sm">
                    {sight.entryFees ? JSON.stringify(sight.entryFees) : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sight.phone || sight.email || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(sight)}
                        data-testid={`button-edit-sight-${sight.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSightMutation.mutate(sight.id)}
                        data-testid={`button-delete-sight-${sight.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
