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

type Airport = {
  id: string;
  code: string;
  name: string;
  cityId: string | null;
  lat: string | null;
  lng: string | null;
};

export default function AirportsManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);

  const { data: airports = [], isLoading } = useQuery<Airport[]>({
    queryKey: ['/api/catalog/airports'],
  });

  const { data: cities = [] } = useQuery<Array<{ id: string; nameEn: string }>>({
    queryKey: ['/api/catalog/cities'],
  });

  const [form, setForm] = useState({
    code: "",
    name: "",
    cityId: "",
    lat: "",
    lng: "",
  });

  const airportMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const endpoint = selectedAirport ? `/api/catalog/airports/${selectedAirport.id}` : '/api/catalog/airports';
      const method = selectedAirport ? 'PATCH' : 'POST';
      const res = await apiRequest(method, endpoint, {
        ...data,
        cityId: data.cityId || null,
        lat: data.lat || null,
        lng: data.lng || null,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/catalog/airports'] });
      setIsDialogOpen(false);
      setSelectedAirport(null);
      resetForm();
      toast({
        title: selectedAirport ? "Airport updated" : "Airport added",
        description: "Airport has been saved successfully",
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

  const deleteAirportMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/catalog/airports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/catalog/airports'] });
      toast({ title: "Airport deleted", description: "Airport has been removed" });
    },
  });

  const resetForm = () => {
    setForm({
      code: "",
      name: "",
      cityId: "",
      lat: "",
      lng: "",
    });
  };

  const handleEdit = (airport: Airport) => {
    setSelectedAirport(airport);
    setForm({
      code: airport.code,
      name: airport.name,
      cityId: airport.cityId || "",
      lat: airport.lat || "",
      lng: airport.lng || "",
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle>Airports</CardTitle>
          <CardDescription>Manage airports in your country</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setSelectedAirport(null); resetForm(); }} data-testid="button-add-airport">
              <Plus className="h-4 w-4 mr-2" />
              Add Airport
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedAirport ? "Edit Airport" : "Add Airport"}</DialogTitle>
              <DialogDescription>Enter airport details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Airport Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., AMM"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    data-testid="input-airport-code"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cityId">City</Label>
                  <select
                    id="cityId"
                    value={form.cityId}
                    onChange={(e) => setForm({ ...form, cityId: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    data-testid="select-airport-city"
                  >
                    <option value="">Select city...</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Airport Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Queen Alia International Airport"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="input-airport-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="0.0000001"
                    value={form.lat}
                    onChange={(e) => setForm({ ...form, lat: e.target.value })}
                    data-testid="input-airport-lat"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="0.0000001"
                    value={form.lng}
                    onChange={(e) => setForm({ ...form, lng: e.target.value })}
                    data-testid="input-airport-lng"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => airportMutation.mutate(form)}
                disabled={!form.code || !form.name || airportMutation.isPending}
                data-testid="button-save-airport"
              >
                {airportMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading airports...</div>
        ) : airports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No airports yet. Click "Add Airport" to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {airports.map((airport) => (
                <TableRow key={airport.id} data-testid={`row-airport-${airport.id}`}>
                  <TableCell className="font-medium">{airport.code}</TableCell>
                  <TableCell>{airport.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {airport.lat && airport.lng ? `${airport.lat}, ${airport.lng}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(airport)}
                        data-testid={`button-edit-airport-${airport.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAirportMutation.mutate(airport.id)}
                        data-testid={`button-delete-airport-${airport.id}`}
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
