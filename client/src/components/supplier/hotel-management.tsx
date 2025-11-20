import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Building2, Bed, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Hotel = {
  id: string;
  name: string;
  address: string;
  stars: number | null;
  phone: string | null;
  email: string | null;
  description: string | null;
};

type RoomType = {
  id: string;
  hotelId: string;
  name: string;
  occupancyMin: number;
  occupancyMax: number;
};

type HotelRate = {
  id: string;
  hotelId: string;
  roomTypeId: string;
  mealPlanId: string;
  season: string;
  currency: string;
  pricePerNight: string;
  notes: string | null;
};

export default function HotelManagement() {
  const { toast } = useToast();
  const [isHotelDialogOpen, setIsHotelDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [selectedRate, setSelectedRate] = useState<HotelRate | null>(null);
  const [activeHotelId, setActiveHotelId] = useState<string>("");

  // Fetch hotels
  const { data: hotels = [], isLoading: hotelsLoading } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });

  // Fetch room types for selected hotel
  const { data: roomTypes = [], isLoading: roomsLoading } = useQuery<RoomType[]>({
    queryKey: ['/api/hotels', activeHotelId, 'room-types'],
    enabled: !!activeHotelId,
  });

  // Fetch rates for selected hotel
  const { data: rates = [], isLoading: ratesLoading } = useQuery<HotelRate[]>({
    queryKey: ['/api/hotels', activeHotelId, 'rates'],
    enabled: !!activeHotelId,
  });

  // Hotel form state
  const [hotelForm, setHotelForm] = useState({
    name: "",
    address: "",
    stars: "",
    phone: "",
    email: "",
    description: "",
  });

  // Room type form state
  const [roomForm, setRoomForm] = useState({
    name: "",
    occupancyMin: "",
    occupancyMax: "",
  });

  // Rate form state
  const [rateForm, setRateForm] = useState({
    roomTypeId: "",
    mealPlanId: "",
    season: "base",
    currency: "USD",
    pricePerNight: "",
    notes: "",
  });

  // Hotel mutations
  const hotelMutation = useMutation({
    mutationFn: async (data: typeof hotelForm) => {
      const endpoint = selectedHotel ? `/api/hotels/${selectedHotel.id}` : '/api/hotels';
      const method = selectedHotel ? 'PATCH' : 'POST';
      const res = await apiRequest(method, endpoint, {
        ...data,
        stars: data.stars ? Number(data.stars) : null,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hotels'] });
      setIsHotelDialogOpen(false);
      setSelectedHotel(null);
      resetHotelForm();
      toast({
        title: selectedHotel ? "Hotel updated" : "Hotel added",
        description: "Hotel has been saved successfully",
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

  const deleteHotelMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/hotels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hotels'] });
      toast({ title: "Hotel deleted", description: "Hotel has been removed" });
    },
  });

  // Room type mutations
  const roomMutation = useMutation({
    mutationFn: async (data: typeof roomForm) => {
      const endpoint = selectedRoom
        ? `/api/hotels/${activeHotelId}/room-types/${selectedRoom.id}`
        : `/api/hotels/${activeHotelId}/room-types`;
      const method = selectedRoom ? 'PATCH' : 'POST';
      const res = await apiRequest(method, endpoint, {
        ...data,
        tenantId: "",
        occupancyMin: Number(data.occupancyMin),
        occupancyMax: Number(data.occupancyMax),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hotels', activeHotelId, 'room-types'] });
      setIsRoomDialogOpen(false);
      setSelectedRoom(null);
      resetRoomForm();
      toast({
        title: selectedRoom ? "Room type updated" : "Room type added",
        description: "Room type has been saved successfully",
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

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/hotels/${activeHotelId}/room-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hotels', activeHotelId, 'room-types'] });
      toast({ title: "Room type deleted", description: "Room type has been removed" });
    },
  });

  // Rate mutations
  const rateMutation = useMutation({
    mutationFn: async (data: typeof rateForm) => {
      const endpoint = selectedRate
        ? `/api/hotels/${activeHotelId}/rates/${selectedRate.id}`
        : `/api/hotels/${activeHotelId}/rates`;
      const method = selectedRate ? 'PATCH' : 'POST';
      const res = await apiRequest(method, endpoint, {
        ...data,
        tenantId: "",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hotels', activeHotelId, 'rates'] });
      setIsRateDialogOpen(false);
      setSelectedRate(null);
      resetRateForm();
      toast({
        title: selectedRate ? "Rate updated" : "Rate added",
        description: "Rate has been saved successfully",
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

  const deleteRateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/hotels/${activeHotelId}/rates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hotels', activeHotelId, 'rates'] });
      toast({ title: "Rate deleted", description: "Rate has been removed" });
    },
  });

  const resetHotelForm = () => {
    setHotelForm({
      name: "",
      address: "",
      stars: "",
      phone: "",
      email: "",
      description: "",
    });
  };

  const resetRoomForm = () => {
    setRoomForm({
      name: "",
      occupancyMin: "",
      occupancyMax: "",
    });
  };

  const resetRateForm = () => {
    setRateForm({
      roomTypeId: "",
      mealPlanId: "",
      season: "base",
      currency: "USD",
      pricePerNight: "",
      notes: "",
    });
  };

  const handleEditHotel = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setHotelForm({
      name: hotel.name,
      address: hotel.address,
      stars: hotel.stars?.toString() || "",
      phone: hotel.phone || "",
      email: hotel.email || "",
      description: hotel.description || "",
    });
    setIsHotelDialogOpen(true);
  };

  const handleEditRoom = (room: RoomType) => {
    setSelectedRoom(room);
    setRoomForm({
      name: room.name,
      occupancyMin: room.occupancyMin.toString(),
      occupancyMax: room.occupancyMax.toString(),
    });
    setIsRoomDialogOpen(true);
  };

  const handleEditRate = (rate: HotelRate) => {
    setSelectedRate(rate);
    setRateForm({
      roomTypeId: rate.roomTypeId,
      mealPlanId: rate.mealPlanId,
      season: rate.season,
      currency: rate.currency,
      pricePerNight: rate.pricePerNight,
      notes: rate.notes || "",
    });
    setIsRateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="hotels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hotels" className="gap-2">
            <Building2 className="h-4 w-4" />
            Hotels
          </TabsTrigger>
          <TabsTrigger value="rooms" className="gap-2" disabled={!activeHotelId}>
            <Bed className="h-4 w-4" />
            Room Types
          </TabsTrigger>
          <TabsTrigger value="rates" className="gap-2" disabled={!activeHotelId}>
            <DollarSign className="h-4 w-4" />
            Rates
          </TabsTrigger>
        </TabsList>

        {/* Hotels Tab */}
        <TabsContent value="hotels">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
              <div>
                <CardTitle>Hotels</CardTitle>
                <CardDescription>Manage your hotel properties</CardDescription>
              </div>
              <Dialog open={isHotelDialogOpen} onOpenChange={setIsHotelDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setSelectedHotel(null); resetHotelForm(); }} data-testid="button-add-hotel">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Hotel
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{selectedHotel ? "Edit Hotel" : "Add Hotel"}</DialogTitle>
                    <DialogDescription>Enter hotel details</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Hotel Name *</Label>
                      <Input
                        id="name"
                        value={hotelForm.name}
                        onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                        data-testid="input-hotel-name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        value={hotelForm.address}
                        onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
                        data-testid="input-hotel-address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="stars">Star Rating</Label>
                        <Input
                          id="stars"
                          type="number"
                          min="1"
                          max="5"
                          value={hotelForm.stars}
                          onChange={(e) => setHotelForm({ ...hotelForm, stars: e.target.value })}
                          data-testid="input-hotel-stars"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={hotelForm.phone}
                          onChange={(e) => setHotelForm({ ...hotelForm, phone: e.target.value })}
                          data-testid="input-hotel-phone"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={hotelForm.email}
                        onChange={(e) => setHotelForm({ ...hotelForm, email: e.target.value })}
                        data-testid="input-hotel-email"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={hotelForm.description}
                        onChange={(e) => setHotelForm({ ...hotelForm, description: e.target.value })}
                        rows={3}
                        data-testid="input-hotel-description"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsHotelDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => hotelMutation.mutate(hotelForm)}
                      disabled={!hotelForm.name || !hotelForm.address || hotelMutation.isPending}
                      data-testid="button-save-hotel"
                    >
                      {hotelMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {hotelsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading hotels...</div>
              ) : hotels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hotels yet. Click "Add Hotel" to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Stars</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hotels.map((hotel) => (
                      <TableRow
                        key={hotel.id}
                        className="cursor-pointer hover-elevate"
                        onClick={() => setActiveHotelId(hotel.id)}
                        data-testid={`row-hotel-${hotel.id}`}
                      >
                        <TableCell className="font-medium">{hotel.name}</TableCell>
                        <TableCell>{hotel.address}</TableCell>
                        <TableCell>{hotel.stars ? "⭐".repeat(hotel.stars) : "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {hotel.phone || hotel.email || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); handleEditHotel(hotel); }}
                              data-testid={`button-edit-hotel-${hotel.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); deleteHotelMutation.mutate(hotel.id); }}
                              data-testid={`button-delete-hotel-${hotel.id}`}
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

        {/* Room Types Tab */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
              <div>
                <CardTitle>Room Types</CardTitle>
                <CardDescription>
                  {activeHotelId ? `Managing room types for ${hotels.find(h => h.id === activeHotelId)?.name}` : "Select a hotel first"}
                </CardDescription>
              </div>
              {activeHotelId && (
                <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setSelectedRoom(null); resetRoomForm(); }} data-testid="button-add-room">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Room Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{selectedRoom ? "Edit Room Type" : "Add Room Type"}</DialogTitle>
                      <DialogDescription>Enter room type details</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="room-name">Room Type Name *</Label>
                        <Input
                          id="room-name"
                          placeholder="e.g., Standard Double, Deluxe Suite"
                          value={roomForm.name}
                          onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                          data-testid="input-room-name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="min-occ">Min Occupancy *</Label>
                          <Input
                            id="min-occ"
                            type="number"
                            min="1"
                            value={roomForm.occupancyMin}
                            onChange={(e) => setRoomForm({ ...roomForm, occupancyMin: e.target.value })}
                            data-testid="input-room-min-occupancy"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="max-occ">Max Occupancy *</Label>
                          <Input
                            id="max-occ"
                            type="number"
                            min="1"
                            value={roomForm.occupancyMax}
                            onChange={(e) => setRoomForm({ ...roomForm, occupancyMax: e.target.value })}
                            data-testid="input-room-max-occupancy"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsRoomDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => roomMutation.mutate(roomForm)}
                        disabled={!roomForm.name || !roomForm.occupancyMin || !roomForm.occupancyMax || roomMutation.isPending}
                        data-testid="button-save-room"
                      >
                        {roomMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {roomsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading room types...</div>
              ) : roomTypes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No room types yet. Click "Add Room Type" to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Min Occupancy</TableHead>
                      <TableHead>Max Occupancy</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomTypes.map((room) => (
                      <TableRow key={room.id} data-testid={`row-room-${room.id}`}>
                        <TableCell className="font-medium">{room.name}</TableCell>
                        <TableCell>{room.occupancyMin}</TableCell>
                        <TableCell>{room.occupancyMax}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditRoom(room)}
                              data-testid={`button-edit-room-${room.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteRoomMutation.mutate(room.id)}
                              data-testid={`button-delete-room-${room.id}`}
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

        {/* Rates Tab */}
        <TabsContent value="rates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
              <div>
                <CardTitle>Rates</CardTitle>
                <CardDescription>
                  {activeHotelId ? "Manage pricing for room types and meal plans" : "Select a hotel first"}
                </CardDescription>
              </div>
              {activeHotelId && roomTypes.length > 0 && (
                <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setSelectedRate(null); resetRateForm(); }} data-testid="button-add-rate">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rate
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{selectedRate ? "Edit Rate" : "Add Rate"}</DialogTitle>
                      <DialogDescription>Enter rate details</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Room Type *</Label>
                        <Input
                          value={rateForm.roomTypeId}
                          onChange={(e) => setRateForm({ ...rateForm, roomTypeId: e.target.value })}
                          placeholder="Room Type ID"
                          data-testid="input-rate-room-type"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Meal Plan ID *</Label>
                        <Input
                          value={rateForm.mealPlanId}
                          onChange={(e) => setRateForm({ ...rateForm, mealPlanId: e.target.value })}
                          placeholder="Meal Plan ID"
                          data-testid="input-rate-meal-plan"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Season</Label>
                          <Input
                            value={rateForm.season}
                            onChange={(e) => setRateForm({ ...rateForm, season: e.target.value })}
                            data-testid="input-rate-season"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Currency</Label>
                          <Input
                            value={rateForm.currency}
                            onChange={(e) => setRateForm({ ...rateForm, currency: e.target.value })}
                            data-testid="input-rate-currency"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Price Per Night *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={rateForm.pricePerNight}
                          onChange={(e) => setRateForm({ ...rateForm, pricePerNight: e.target.value })}
                          data-testid="input-rate-price"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={rateForm.notes}
                          onChange={(e) => setRateForm({ ...rateForm, notes: e.target.value })}
                          rows={2}
                          data-testid="input-rate-notes"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsRateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => rateMutation.mutate(rateForm)}
                        disabled={!rateForm.roomTypeId || !rateForm.mealPlanId || !rateForm.pricePerNight || rateMutation.isPending}
                        data-testid="button-save-rate"
                      >
                        {rateMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {roomTypes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Add room types first before creating rates.
                </div>
              ) : ratesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading rates...</div>
              ) : rates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No rates yet. Click "Add Rate" to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Meal Plan</TableHead>
                      <TableHead>Season</TableHead>
                      <TableHead>Price/Night</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rates.map((rate) => (
                      <TableRow key={rate.id} data-testid={`row-rate-${rate.id}`}>
                        <TableCell>{roomTypes.find(r => r.id === rate.roomTypeId)?.name || rate.roomTypeId}</TableCell>
                        <TableCell>{rate.mealPlanId}</TableCell>
                        <TableCell>{rate.season}</TableCell>
                        <TableCell>{rate.currency} {parseFloat(rate.pricePerNight).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditRate(rate)}
                              data-testid={`button-edit-rate-${rate.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteRateMutation.mutate(rate.id)}
                              data-testid={`button-delete-rate-${rate.id}`}
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
    </div>
  );
}
