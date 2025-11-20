import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCitySchema } from "@shared/schema";

type City = {
  id: string;
  nameEn: string;
  nameAlt: string | null;
  region: string | null;
  lat: string | null;
  lng: string | null;
};

const cityFormSchema = z.object({
  nameEn: z.string().min(1, "City name is required"),
  nameAlt: z.string().optional().transform(val => val || undefined),
  region: z.string().optional().transform(val => val || undefined),
  lat: z.string().optional().transform(val => val || undefined),
  lng: z.string().optional().transform(val => val || undefined),
});

type CityFormValues = z.infer<typeof cityFormSchema>;

export default function CitiesManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const { data: cities = [], isLoading } = useQuery<City[]>({
    queryKey: ['/api/catalog/cities'],
  });

  const form = useForm<CityFormValues>({
    resolver: zodResolver(cityFormSchema),
    defaultValues: {
      nameEn: "",
      nameAlt: "",
      region: "",
      lat: "",
      lng: "",
    },
  });

  const cityMutation = useMutation({
    mutationFn: async (data: CityFormValues) => {
      const endpoint = selectedCity ? `/api/catalog/cities/${selectedCity.id}` : '/api/catalog/cities';
      const method = selectedCity ? 'PATCH' : 'POST';
      const res = await apiRequest(method, endpoint, {
        nameEn: data.nameEn,
        nameAlt: data.nameAlt || null,
        region: data.region || null,
        lat: data.lat || null,
        lng: data.lng || null,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/catalog/cities'] });
      setIsDialogOpen(false);
      setSelectedCity(null);
      form.reset();
      toast({
        title: selectedCity ? "City updated" : "City added",
        description: "City has been saved successfully",
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

  const deleteCityMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/catalog/cities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/catalog/cities'] });
      toast({ title: "City deleted", description: "City has been removed" });
    },
  });

  const handleEdit = (city: City) => {
    setSelectedCity(city);
    form.reset({
      nameEn: city.nameEn,
      nameAlt: city.nameAlt || "",
      region: city.region || "",
      lat: city.lat || "",
      lng: city.lng || "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedCity(null);
      form.reset({
        nameEn: "",
        nameAlt: "",
        region: "",
        lat: "",
        lng: "",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle>Cities</CardTitle>
          <CardDescription>Manage cities in your country</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-city">
              <Plus className="h-4 w-4 mr-2" />
              Add City
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedCity ? "Edit City" : "Add City"}</DialogTitle>
              <DialogDescription>Enter city details</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => cityMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City Name (English) *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-city-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameAlt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City Name (Alternative)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-city-name-alt" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-city-region" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.0000001" data-testid="input-city-lat" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lng"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.0000001" data-testid="input-city-lng" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={cityMutation.isPending} data-testid="button-save-city">
                    {cityMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading cities...</div>
        ) : cities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No cities yet. Click "Add City" to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name (EN)</TableHead>
                <TableHead>Alternative Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cities.map((city) => (
                <TableRow key={city.id} data-testid={`row-city-${city.id}`}>
                  <TableCell className="font-medium">{city.nameEn}</TableCell>
                  <TableCell className="text-sm">{city.nameAlt || '-'}</TableCell>
                  <TableCell className="text-sm">{city.region || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {city.lat && city.lng ? `${city.lat}, ${city.lng}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(city)}
                        data-testid={`button-edit-city-${city.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCityMutation.mutate(city.id)}
                        data-testid={`button-delete-city-${city.id}`}
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
