import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, MapPin, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function CitiesPage() {
  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [isAirportDialogOpen, setIsAirportDialogOpen] = useState(false);

  const { data: cities, isLoading: citiesLoading } = useQuery<any[]>({
    queryKey: ["/api/catalog/cities"],
    initialData: [],
  });

  const { data: airports, isLoading: airportsLoading } = useQuery<any[]>({
    queryKey: ["/api/catalog/airports"],
    initialData: [],
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cities & Airports</h1>
          <p className="text-sm text-muted-foreground">Manage locations for your region</p>
        </div>
      </div>

      <Tabs defaultValue="cities" className="w-full">
        <TabsList>
          <TabsTrigger value="cities" data-testid="tab-cities">Cities</TabsTrigger>
          <TabsTrigger value="airports" data-testid="tab-airports">Airports</TabsTrigger>
        </TabsList>

        <TabsContent value="cities" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cities</CardTitle>
                <CardDescription>Major cities in your region</CardDescription>
              </div>
              <Dialog open={isCityDialogOpen} onOpenChange={setIsCityDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-city">
                    <Plus className="h-4 w-4 mr-2" />
                    Add City
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New City</DialogTitle>
                    <DialogDescription>
                      Add a major city to your catalog
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="city-name-en">City Name (English)</Label>
                      <Input
                        id="city-name-en"
                        placeholder="Amman"
                        data-testid="input-city-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city-name-alt">Local Name (Optional)</Label>
                      <Input
                        id="city-name-alt"
                        placeholder="عمّان"
                        data-testid="input-city-name-alt"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Input
                        id="region"
                        placeholder="Amman Governorate"
                        data-testid="input-region"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lat">Latitude</Label>
                        <Input
                          id="lat"
                          type="number"
                          step="0.000001"
                          placeholder="31.9454"
                          data-testid="input-lat"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lng">Longitude</Label>
                        <Input
                          id="lng"
                          type="number"
                          step="0.000001"
                          placeholder="35.9284"
                          data-testid="input-lng"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCityDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" data-testid="button-save-city">
                        Add City
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {citiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading cities...</div>
                </div>
              ) : cities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">No cities yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mb-4">
                    Add cities to organize your suppliers and travel services
                  </p>
                  <Button onClick={() => setIsCityDialogOpen(true)} data-testid="button-add-first-city">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First City
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>City</TableHead>
                      <TableHead>Local Name</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Coordinates</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cities.map((city) => (
                      <TableRow key={city.id} data-testid={`row-city-${city.id}`}>
                        <TableCell className="font-medium">{city.nameEn}</TableCell>
                        <TableCell className="text-muted-foreground">{city.nameAlt || "—"}</TableCell>
                        <TableCell>{city.region || "—"}</TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">
                          {city.lat && city.lng ? `${city.lat}, ${city.lng}` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" data-testid={`button-edit-${city.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" data-testid={`button-delete-${city.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        </TabsContent>

        <TabsContent value="airports" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Airports</CardTitle>
                <CardDescription>Airport codes and locations</CardDescription>
              </div>
              <Dialog open={isAirportDialogOpen} onOpenChange={setIsAirportDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-airport">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Airport
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Airport</DialogTitle>
                    <DialogDescription>
                      Add an airport to your catalog
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="airport-code">Airport Code (IATA)</Label>
                      <Input
                        id="airport-code"
                        placeholder="AMM"
                        maxLength={3}
                        data-testid="input-airport-code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="airport-name">Airport Name</Label>
                      <Input
                        id="airport-name"
                        placeholder="Queen Alia International Airport"
                        data-testid="input-airport-name"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAirportDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" data-testid="button-save-airport">
                        Add Airport
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {airportsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading airports...</div>
                </div>
              ) : airports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">No airports yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mb-4">
                    Add airports for transfer services and itinerary planning
                  </p>
                  <Button onClick={() => setIsAirportDialogOpen(true)} data-testid="button-add-first-airport">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Airport
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Airport Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {airports.map((airport) => (
                      <TableRow key={airport.id} data-testid={`row-airport-${airport.id}`}>
                        <TableCell>
                          <span className="font-mono font-semibold">{airport.code}</span>
                        </TableCell>
                        <TableCell className="font-medium">{airport.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {airport.cityId || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" data-testid={`button-edit-${airport.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" data-testid={`button-delete-${airport.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
