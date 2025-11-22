import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Bus, Route } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type TransportProduct = {
  id: string;
  name: string;
  productType: string;
  fromLocation: string | null;
  toLocation: string | null;
  baseDurationMin: number | null;
  basePrice: string | null;
  priceUnit: string;
  notes: string | null;
};

type Fleet = {
  id: string;
  vehicleType: string;
  size: number;
  features: any;
  imageUrl: string | null;
};

type TransportCompany = {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export default function TransportManagement() {
  const { toast } = useToast();
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isFleetDialogOpen, setIsFleetDialogOpen] = useState(false);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<TransportProduct | null>(null);
  const [selectedFleet, setSelectedFleet] = useState<Fleet | null>(null);

  // Fetch transport company
  const { data: companies = [], isLoading: companiesLoading } = useQuery<TransportCompany[]>({
    queryKey: ['/api/transport/companies'],
  });

  const myCompany = companies.length > 0 ? companies[0] : null;

  // Fetch transport products (routes)
  const { data: products = [], isLoading: productsLoading } = useQuery<TransportProduct[]>({
    queryKey: ['/api/supplier/transport/products'],
    enabled: !!myCompany,
  });

  // Fetch fleet (buses)
  const { data: fleet = [], isLoading: fleetLoading } = useQuery<Fleet[]>({
    queryKey: ['/api/supplier/transport/fleet'],
    enabled: !!myCompany,
  });

  // Product form state
  const [productForm, setProductForm] = useState({
    name: "",
    productType: "airport_transfer",
    fromLocation: "",
    toLocation: "",
    baseDurationMin: "",
    basePrice: "",
    priceUnit: "per_transfer",
    notes: "",
  });

  // Fleet form state
  const [fleetForm, setFleetForm] = useState({
    vehicleType: "",
    size: "",
    features: "",
  });

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
  });

  // Create/Update product mutation
  const productMutation = useMutation({
    mutationFn: async (data: typeof productForm) => {
      const endpoint = selectedProduct
        ? `/api/supplier/transport/products/${selectedProduct.id}`
        : '/api/supplier/transport/products';
      const method = selectedProduct ? 'PATCH' : 'POST';
      const res = await apiRequest(method, endpoint, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/transport/products'] });
      setIsProductDialogOpen(false);
      setSelectedProduct(null);
      resetProductForm();
      toast({
        title: selectedProduct ? "Route updated" : "Route added",
        description: "Transport route has been saved successfully",
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

  // Create/Update fleet mutation
  const fleetMutation = useMutation({
    mutationFn: async (data: typeof fleetForm) => {
      const endpoint = selectedFleet
        ? `/api/supplier/transport/fleet/${selectedFleet.id}`
        : '/api/supplier/transport/fleet';
      const method = selectedFleet ? 'PATCH' : 'POST';
      const res = await apiRequest(method, endpoint, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/transport/fleet'] });
      setIsFleetDialogOpen(false);
      setSelectedFleet(null);
      resetFleetForm();
      toast({
        title: selectedFleet ? "Vehicle updated" : "Vehicle added",
        description: "Fleet vehicle has been saved successfully",
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

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/supplier/transport/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/transport/products'] });
      toast({
        title: "Route deleted",
        description: "Transport route has been removed",
      });
    },
  });

  // Delete fleet mutation
  const deleteFleetMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/supplier/transport/fleet/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/transport/fleet'] });
      toast({
        title: "Vehicle deleted",
        description: "Fleet vehicle has been removed",
      });
    },
  });

  // Create company mutation
  const companyMutation = useMutation({
    mutationFn: async (data: typeof companyForm) => {
      const res = await apiRequest('POST', '/api/transport/companies', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transport/companies'] });
      setIsCompanyDialogOpen(false);
      setCompanyForm({
        name: "",
        description: "",
        phone: "",
        email: "",
        address: "",
      });
      toast({
        title: "Company created",
        description: "Your transport company has been successfully created",
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

  const resetProductForm = () => {
    setProductForm({
      name: "",
      productType: "airport_transfer",
      fromLocation: "",
      toLocation: "",
      baseDurationMin: "",
      basePrice: "",
      priceUnit: "per_transfer",
      notes: "",
    });
  };

  const resetFleetForm = () => {
    setFleetForm({
      vehicleType: "",
      size: "",
      features: "",
    });
  };

  const handleEditProduct = (product: TransportProduct) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      productType: product.productType,
      fromLocation: product.fromLocation || "",
      toLocation: product.toLocation || "",
      baseDurationMin: product.baseDurationMin?.toString() || "",
      basePrice: product.basePrice || "",
      priceUnit: product.priceUnit,
      notes: product.notes || "",
    });
    setIsProductDialogOpen(true);
  };

  const handleEditFleet = (vehicle: Fleet) => {
    setSelectedFleet(vehicle);
    setFleetForm({
      vehicleType: vehicle.vehicleType,
      size: vehicle.size.toString(),
      features: JSON.stringify(vehicle.features || {}),
    });
    setIsFleetDialogOpen(true);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    resetProductForm();
    setIsProductDialogOpen(true);
  };

  const handleAddFleet = () => {
    setSelectedFleet(null);
    resetFleetForm();
    setIsFleetDialogOpen(true);
  };

  if (companiesLoading) {
    return <div className="p-6">Loading...</div>;
  }

  // Show company setup if no company exists
  if (!myCompany) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Set Up Your Transport Company</CardTitle>
          <CardDescription>
            Create your transport company profile to start managing routes and fleet vehicles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              value={companyForm.name}
              onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
              placeholder="Enter company name"
              data-testid="input-company-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-description">Description</Label>
            <Input
              id="company-description"
              value={companyForm.description}
              onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
              placeholder="Brief description of your services"
              data-testid="input-company-description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-phone">Phone</Label>
            <Input
              id="company-phone"
              value={companyForm.phone}
              onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
              placeholder="+1 234 567 8900"
              data-testid="input-company-phone"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-email">Email</Label>
            <Input
              id="company-email"
              type="email"
              value={companyForm.email}
              onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
              placeholder="contact@company.com"
              data-testid="input-company-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-address">Address</Label>
            <Input
              id="company-address"
              value={companyForm.address}
              onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
              placeholder="Business address"
              data-testid="input-company-address"
            />
          </div>
          <Button
            onClick={() => companyMutation.mutate(companyForm)}
            disabled={!companyForm.name || companyMutation.isPending}
            data-testid="button-create-company"
          >
            {companyMutation.isPending ? "Creating..." : "Create Company"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="routes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="routes" className="gap-2">
            <Route className="h-4 w-4" />
            Routes & Pricing
          </TabsTrigger>
          <TabsTrigger value="fleet" className="gap-2">
            <Bus className="h-4 w-4" />
            Fleet (Buses/Vehicles)
          </TabsTrigger>
        </TabsList>

        {/* Routes Tab */}
        <TabsContent value="routes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
              <div>
                <CardTitle>Transport Routes</CardTitle>
                <CardDescription>Manage your transport products and pricing</CardDescription>
              </div>
              <Button onClick={handleAddProduct} data-testid="button-add-route">
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div>Loading routes...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transport routes added yet. Click "Add Route" to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>From - To</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.productType.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.fromLocation && product.toLocation
                            ? `${product.fromLocation} → ${product.toLocation}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {product.baseDurationMin ? `${product.baseDurationMin} min` : '-'}
                        </TableCell>
                        <TableCell>
                          {product.basePrice ? `$${product.basePrice}` : '-'} / {product.priceUnit.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditProduct(product)}
                              data-testid={`button-edit-route-${product.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteProductMutation.mutate(product.id)}
                              data-testid={`button-delete-route-${product.id}`}
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
        </TabsContent>

        {/* Fleet Tab */}
        <TabsContent value="fleet">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
              <div>
                <CardTitle>Fleet Management</CardTitle>
                <CardDescription>Manage your buses and vehicle types</CardDescription>
              </div>
              <Button onClick={handleAddFleet} data-testid="button-add-vehicle">
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </CardHeader>
            <CardContent>
              {fleetLoading ? (
                <div>Loading fleet...</div>
              ) : fleet.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No vehicles added yet. Click "Add Vehicle" to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle Type</TableHead>
                      <TableHead>Capacity (Seats)</TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fleet.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">{vehicle.vehicleType}</TableCell>
                        <TableCell>{vehicle.size} seats</TableCell>
                        <TableCell>
                          {vehicle.features ? JSON.stringify(vehicle.features) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditFleet(vehicle)}
                              data-testid={`button-edit-vehicle-${vehicle.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteFleetMutation.mutate(vehicle.id)}
                              data-testid={`button-delete-vehicle-${vehicle.id}`}
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
        </TabsContent>
      </Tabs>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit Route' : 'Add New Route'}</DialogTitle>
            <DialogDescription>
              Configure transport route details and pricing
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              productMutation.mutate(productForm);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Route Name *</Label>
                <Input
                  id="product-name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Airport Transfer - Amman"
                  required
                  data-testid="input-product-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-type">Product Type *</Label>
                <Select
                  value={productForm.productType}
                  onValueChange={(v) => setProductForm({ ...productForm, productType: v })}
                >
                  <SelectTrigger data-testid="select-product-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airport_transfer">Airport Transfer</SelectItem>
                    <SelectItem value="point_to_point">Point to Point</SelectItem>
                    <SelectItem value="intercity">Intercity</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="rail_escort">Rail Escort</SelectItem>
                    <SelectItem value="ferry">Ferry</SelectItem>
                    <SelectItem value="heli">Helicopter</SelectItem>
                    <SelectItem value="accessible">Accessible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from-location">From Location</Label>
                <Input
                  id="from-location"
                  value={productForm.fromLocation}
                  onChange={(e) => setProductForm({ ...productForm, fromLocation: e.target.value })}
                  placeholder="Queen Alia Airport"
                  data-testid="input-from-location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to-location">To Location</Label>
                <Input
                  id="to-location"
                  value={productForm.toLocation}
                  onChange={(e) => setProductForm({ ...productForm, toLocation: e.target.value })}
                  placeholder="Amman City Center"
                  data-testid="input-to-location"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={productForm.baseDurationMin}
                  onChange={(e) => setProductForm({ ...productForm, baseDurationMin: e.target.value })}
                  placeholder="45"
                  data-testid="input-duration"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="base-price">Base Price ($)</Label>
                <Input
                  id="base-price"
                  type="number"
                  step="0.01"
                  value={productForm.basePrice}
                  onChange={(e) => setProductForm({ ...productForm, basePrice: e.target.value })}
                  placeholder="50.00"
                  data-testid="input-base-price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price-unit">Price Unit</Label>
                <Select
                  value={productForm.priceUnit}
                  onValueChange={(v) => setProductForm({ ...productForm, priceUnit: v })}
                >
                  <SelectTrigger data-testid="select-price-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_transfer">Per Transfer</SelectItem>
                    <SelectItem value="per_hour">Per Hour</SelectItem>
                    <SelectItem value="per_km">Per KM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={productForm.notes}
                onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })}
                placeholder="Additional information..."
                data-testid="input-notes"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProductDialogOpen(false)}
                data-testid="button-cancel-product"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={productMutation.isPending}
                data-testid="button-save-product"
              >
                {productMutation.isPending ? 'Saving...' : 'Save Route'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Fleet Dialog */}
      <Dialog open={isFleetDialogOpen} onOpenChange={setIsFleetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedFleet ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
            <DialogDescription>
              Configure vehicle type and capacity
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fleetMutation.mutate(fleetForm);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="vehicle-type">Vehicle Type *</Label>
              <Input
                id="vehicle-type"
                value={fleetForm.vehicleType}
                onChange={(e) => setFleetForm({ ...fleetForm, vehicleType: e.target.value })}
                placeholder="Mini Bus, Coach, SUV, etc."
                required
                data-testid="input-vehicle-type"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Capacity (Seats) *</Label>
              <Input
                id="size"
                type="number"
                value={fleetForm.size}
                onChange={(e) => setFleetForm({ ...fleetForm, size: e.target.value })}
                placeholder="25"
                required
                data-testid="input-vehicle-size"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (JSON)</Label>
              <Input
                id="features"
                value={fleetForm.features}
                onChange={(e) => setFleetForm({ ...fleetForm, features: e.target.value })}
                placeholder='{"wifi": true, "ac": true}'
                data-testid="input-vehicle-features"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFleetDialogOpen(false)}
                data-testid="button-cancel-fleet"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={fleetMutation.isPending}
                data-testid="button-save-fleet"
              >
                {fleetMutation.isPending ? 'Saving...' : 'Save Vehicle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
