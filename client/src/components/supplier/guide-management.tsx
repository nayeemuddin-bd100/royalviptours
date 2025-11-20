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

type TourGuide = {
  id: string;
  name: string;
  photoUrl: string | null;
  languages: string[] | null;
  specialty: string | null;
  religion: string | null;
  feePerDay: string | null;
  tipsPerDay: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  workScope: string;
};

export default function GuideManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<TourGuide | null>(null);

  const { data: guides = [], isLoading } = useQuery<TourGuide[]>({
    queryKey: ['/api/guides'],
  });

  const [form, setForm] = useState({
    name: "",
    photoUrl: "",
    languages: "",
    specialty: "",
    religion: "",
    feePerDay: "",
    tipsPerDay: "",
    address: "",
    phone: "",
    email: "",
    workScope: "country",
  });

  const guideMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const endpoint = selectedGuide ? `/api/guides/${selectedGuide.id}` : '/api/guides';
      const method = selectedGuide ? 'PATCH' : 'POST';
      const res = await apiRequest(method, endpoint, {
        ...data,
        languages: data.languages ? data.languages.split(',').map(l => l.trim()) : [],
        feePerDay: data.feePerDay ? parseFloat(data.feePerDay) : null,
        tipsPerDay: data.tipsPerDay ? parseFloat(data.tipsPerDay) : null,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guides'] });
      setIsDialogOpen(false);
      setSelectedGuide(null);
      resetForm();
      toast({
        title: selectedGuide ? "Guide updated" : "Guide added",
        description: "Tour guide has been saved successfully",
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

  const deleteGuideMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/guides/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guides'] });
      toast({ title: "Guide deleted", description: "Tour guide has been removed" });
    },
  });

  const resetForm = () => {
    setForm({
      name: "",
      photoUrl: "",
      languages: "",
      specialty: "",
      religion: "",
      feePerDay: "",
      tipsPerDay: "",
      address: "",
      phone: "",
      email: "",
      workScope: "country",
    });
  };

  const handleEdit = (guide: TourGuide) => {
    setSelectedGuide(guide);
    setForm({
      name: guide.name,
      photoUrl: guide.photoUrl || "",
      languages: guide.languages?.join(', ') || "",
      specialty: guide.specialty || "",
      religion: guide.religion || "",
      feePerDay: guide.feePerDay || "",
      tipsPerDay: guide.tipsPerDay || "",
      address: guide.address || "",
      phone: guide.phone || "",
      email: guide.email || "",
      workScope: guide.workScope,
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle>Tour Guides</CardTitle>
          <CardDescription>Manage your tour guide profiles and daily rates</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setSelectedGuide(null); resetForm(); }} data-testid="button-add-guide">
              <Plus className="h-4 w-4 mr-2" />
              Add Guide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedGuide ? "Edit Guide" : "Add Tour Guide"}</DialogTitle>
              <DialogDescription>Enter tour guide details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="input-guide-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="languages">Languages (comma-separated)</Label>
                <Input
                  id="languages"
                  placeholder="English, Spanish, French"
                  value={form.languages}
                  onChange={(e) => setForm({ ...form, languages: e.target.value })}
                  data-testid="input-guide-languages"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input
                    id="specialty"
                    placeholder="e.g., Ancient History"
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    data-testid="input-guide-specialty"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="religion">Religion</Label>
                  <Input
                    id="religion"
                    value={form.religion}
                    onChange={(e) => setForm({ ...form, religion: e.target.value })}
                    data-testid="input-guide-religion"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fee">Fee Per Day</Label>
                  <Input
                    id="fee"
                    type="number"
                    step="0.01"
                    value={form.feePerDay}
                    onChange={(e) => setForm({ ...form, feePerDay: e.target.value })}
                    data-testid="input-guide-fee"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tips">Expected Tips Per Day</Label>
                  <Input
                    id="tips"
                    type="number"
                    step="0.01"
                    value={form.tipsPerDay}
                    onChange={(e) => setForm({ ...form, tipsPerDay: e.target.value })}
                    data-testid="input-guide-tips"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    data-testid="input-guide-phone"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    data-testid="input-guide-email"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  data-testid="input-guide-address"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => guideMutation.mutate(form)}
                disabled={!form.name || guideMutation.isPending}
                data-testid="button-save-guide"
              >
                {guideMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading guides...</div>
        ) : guides.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tour guides yet. Click "Add Guide" to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Languages</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Fee/Day</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guides.map((guide) => (
                <TableRow key={guide.id} data-testid={`row-guide-${guide.id}`}>
                  <TableCell className="font-medium">{guide.name}</TableCell>
                  <TableCell className="text-sm">
                    {guide.languages?.join(', ') || '-'}
                  </TableCell>
                  <TableCell className="text-sm">{guide.specialty || '-'}</TableCell>
                  <TableCell>{guide.feePerDay ? `$${parseFloat(guide.feePerDay).toFixed(2)}` : '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {guide.phone || guide.email || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(guide)}
                        data-testid={`button-edit-guide-${guide.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteGuideMutation.mutate(guide.id)}
                        data-testid={`button-delete-guide-${guide.id}`}
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
