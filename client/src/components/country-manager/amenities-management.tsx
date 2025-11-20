import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Amenity = {
  id: string;
  category: string;
  name: string;
  slug: string;
};

export default function AmenitiesManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);

  const { data: amenities = [], isLoading } = useQuery<Amenity[]>({
    queryKey: ['/api/catalog/amenities'],
  });

  const [form, setForm] = useState({
    category: "",
    name: "",
    slug: "",
  });

  const amenityMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const endpoint = selectedAmenity ? `/api/catalog/amenities/${selectedAmenity.id}` : '/api/catalog/amenities';
      const method = selectedAmenity ? 'PATCH' : 'POST';
      const res = await apiRequest(method, endpoint, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/catalog/amenities'] });
      setIsDialogOpen(false);
      setSelectedAmenity(null);
      resetForm();
      toast({
        title: selectedAmenity ? "Amenity updated" : "Amenity added",
        description: "Amenity has been saved successfully",
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

  const deleteAmenityMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/catalog/amenities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/catalog/amenities'] });
      toast({ title: "Amenity deleted", description: "Amenity has been removed" });
    },
  });

  const resetForm = () => {
    setForm({
      category: "",
      name: "",
      slug: "",
    });
  };

  const handleEdit = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setForm({
      category: amenity.category,
      name: amenity.name,
      slug: amenity.slug,
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle>Amenities</CardTitle>
          <CardDescription>Manage amenities (WiFi, parking, accessibility features, etc.)</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setSelectedAmenity(null); resetForm(); }} data-testid="button-add-amenity">
              <Plus className="h-4 w-4 mr-2" />
              Add Amenity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedAmenity ? "Edit Amenity" : "Add Amenity"}</DialogTitle>
              <DialogDescription>Enter amenity details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  placeholder="e.g., connectivity, accessibility, comfort"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  data-testid="input-amenity-category"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Amenity Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., WiFi, Wheelchair Access, Air Conditioning"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="input-amenity-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  placeholder="e.g., wifi, wheelchair-access, air-conditioning"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  data-testid="input-amenity-slug"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => amenityMutation.mutate(form)}
                disabled={!form.category || !form.name || !form.slug || amenityMutation.isPending}
                data-testid="button-save-amenity"
              >
                {amenityMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading amenities...</div>
        ) : amenities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No amenities yet. Click "Add Amenity" to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {amenities.map((amenity) => (
                <TableRow key={amenity.id} data-testid={`row-amenity-${amenity.id}`}>
                  <TableCell className="text-sm text-muted-foreground">{amenity.category}</TableCell>
                  <TableCell className="font-medium">{amenity.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{amenity.slug}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(amenity)}
                        data-testid={`button-edit-amenity-${amenity.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAmenityMutation.mutate(amenity.id)}
                        data-testid={`button-delete-amenity-${amenity.id}`}
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
