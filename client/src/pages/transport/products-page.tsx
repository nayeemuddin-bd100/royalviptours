import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Car, Edit, Trash2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function TransportProductsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: products, isLoading } = useQuery<any[]>({
    queryKey: ["/api/transport/products"],
    initialData: [],
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Transport Products</h1>
          <p className="text-sm text-muted-foreground">Manage your routes, transfers, and transport services</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-product">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Transport Product</DialogTitle>
              <DialogDescription>
                Add a new transport service or route
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  placeholder="Amman Airport to Downtown Hotels"
                  data-testid="input-product-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-type">Product Type</Label>
                <Select>
                  <SelectTrigger data-testid="select-product-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airport_transfer">Airport Transfer</SelectItem>
                    <SelectItem value="point_to_point">Point to Point</SelectItem>
                    <SelectItem value="intercity">Intercity Transfer</SelectItem>
                    <SelectItem value="hourly">Hourly Service</SelectItem>
                    <SelectItem value="accessible">Accessible Transport</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from-location">From</Label>
                  <Input
                    id="from-location"
                    placeholder="AMM Airport"
                    data-testid="input-from"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to-location">To</Label>
                  <Input
                    id="to-location"
                    placeholder="Downtown Amman"
                    data-testid="input-to"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base-price">Base Price</Label>
                  <Input
                    id="base-price"
                    type="number"
                    step="0.01"
                    placeholder="50.00"
                    data-testid="input-price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price-unit">Price Unit</Label>
                  <Select>
                    <SelectTrigger data-testid="select-price-unit">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_transfer">Per Transfer</SelectItem>
                      <SelectItem value="per_hour">Per Hour</SelectItem>
                      <SelectItem value="per_km">Per Kilometer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="45"
                  data-testid="input-duration"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Additional information"
                  data-testid="input-notes"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-product">
                  Create Product
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Products</CardTitle>
          <CardDescription>All transport services and routes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Car className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">No products yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                Add your first transport product to start receiving quote requests
              </p>
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-product">
                <Plus className="h-4 w-4 mr-2" />
                Add First Product
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {product.productType.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {product.fromLocation} → {product.toLocation}
                    </TableCell>
                    <TableCell className="text-sm">
                      {product.baseDurationMin ? `${product.baseDurationMin} min` : "—"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${parseFloat(product.basePrice).toFixed(2)}
                      <span className="text-xs text-muted-foreground ml-1">
                        /{product.priceUnit.replace("per_", "")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" data-testid={`button-edit-${product.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" data-testid={`button-delete-${product.id}`}>
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
    </div>
  );
}
