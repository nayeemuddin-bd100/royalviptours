import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building2, Users, MapPin, Plus, Edit, Trash2, Save, Mail, UserCheck, UserX, Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { Agency, AgencyContact, AgencyAddress } from "@shared/schema";

export default function AgencyAccountPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();

  return (
    <div className="container mx-auto p-6 max-w-7xl" data-testid="page-agency-account">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Account Settings</h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          Manage your agency profile, contacts, and business information
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl" data-testid="tabs-account">
          <TabsTrigger value="profile" data-testid="tab-profile">
            <Building2 className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-team">
            <Users className="w-4 h-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="contacts" data-testid="tab-contacts">
            <Users className="w-4 h-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="addresses" data-testid="tab-addresses">
            <MapPin className="w-4 h-4 mr-2" />
            Addresses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="team">
          <TeamTab />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactsTab />
        </TabsContent>

        <TabsContent value="addresses">
          <AddressesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileTab() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Agency>>({});

  const { data: agency, isLoading } = useQuery<Agency>({
    queryKey: ["/api/agency/profile"],
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Agency>) => 
      apiRequest("PATCH", "/api/agency/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency/profile"] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your agency profile has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    setFormData(agency || {});
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({});
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!agency) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No agency profile found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-agency-profile">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Agency Profile</CardTitle>
            <CardDescription>Your agency's business information</CardDescription>
          </div>
          {!isEditing && (
            <Button onClick={handleEdit} data-testid="button-edit-profile">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legalName">Legal Name *</Label>
                <Input
                  id="legalName"
                  value={formData.legalName || ""}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  data-testid="input-legal-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradeName">Trade Name</Label>
                <Input
                  id="tradeName"
                  value={formData.tradeName || ""}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                  data-testid="input-trade-name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Agency Type</Label>
                <Select
                  value={formData.type || ""}
                  onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                >
                  <SelectTrigger id="type" data-testid="select-agency-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tour_operator">Tour Operator</SelectItem>
                    <SelectItem value="travel_agency">Travel Agency</SelectItem>
                    <SelectItem value="dmc">DMC</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country || ""}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  data-testid="input-country"
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNo">License Number</Label>
                <Input
                  id="licenseNo"
                  value={formData.licenseNo || ""}
                  onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                  data-testid="input-license-no"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website || ""}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  data-testid="input-website"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="textarea-description"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleCancel} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={updateMutation.isPending}
                data-testid="button-save-profile"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-muted-foreground">Legal Name</Label>
                <p className="mt-1 font-medium" data-testid="text-legal-name">{agency.legalName}</p>
              </div>
              {agency.tradeName && (
                <div>
                  <Label className="text-muted-foreground">Trade Name</Label>
                  <p className="mt-1 font-medium" data-testid="text-trade-name">{agency.tradeName}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {agency.type && (
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="mt-1" data-testid="text-agency-type">
                    <Badge variant="outline">
                      {agency.type.replace("_", " ").toUpperCase()}
                    </Badge>
                  </p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Country</Label>
                <p className="mt-1 font-medium" data-testid="text-country">{agency.country}</p>
              </div>
            </div>

            {(agency.licenseNo || agency.website) && (
              <div className="grid grid-cols-2 gap-6">
                {agency.licenseNo && (
                  <div>
                    <Label className="text-muted-foreground">License Number</Label>
                    <p className="mt-1 font-medium" data-testid="text-license-no">{agency.licenseNo}</p>
                  </div>
                )}
                {agency.website && (
                  <div>
                    <Label className="text-muted-foreground">Website</Label>
                    <p className="mt-1">
                      <a 
                        href={agency.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        data-testid="link-website"
                      >
                        {agency.website}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            )}

            {agency.description && (
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm leading-relaxed" data-testid="text-description">
                  {agency.description}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContactsTab() {
  const { toast } = useToast();
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<AgencyContact | null>(null);
  const [formData, setFormData] = useState<Partial<AgencyContact & { password?: string }>>({});

  const { data: contacts, isLoading } = useQuery<AgencyContact[]>({
    queryKey: ["/api/agency/contacts"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<AgencyContact & { password: string }>) =>
      apiRequest("POST", "/api/agency/contacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency/contacts"] });
      setIsAddingContact(false);
      setFormData({});
      toast({
        title: "Contact added",
        description: "New contact has been successfully added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add contact",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AgencyContact> }) =>
      apiRequest("PATCH", `/api/agency/contacts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency/contacts"] });
      setEditingContact(null);
      setFormData({});
      toast({
        title: "Contact updated",
        description: "Contact has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update contact",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/agency/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency/contacts"] });
      toast({
        title: "Contact deleted",
        description: "Contact has been successfully removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete contact",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    setFormData({});
    setIsAddingContact(true);
  };

  const handleEdit = (contact: AgencyContact) => {
    setFormData(contact);
    setEditingContact(contact);
  };

  const handleSave = () => {
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data: formData });
    } else {
      createMutation.mutate(formData as any);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card data-testid="card-contacts">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Contacts</CardTitle>
              <CardDescription>Manage your agency team members</CardDescription>
            </div>
            <Button onClick={handleAdd} data-testid="button-add-contact">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!contacts || contacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No contacts added yet</p>
              <p className="text-sm">Add team members to collaborate on itineraries</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id} data-testid={`row-contact-${contact.id}`}>
                    <TableCell className="font-medium" data-testid={`text-contact-name-${contact.id}`}>
                      {contact.name}
                    </TableCell>
                    <TableCell data-testid={`text-contact-title-${contact.id}`}>
                      {contact.title || "-"}
                    </TableCell>
                    <TableCell data-testid={`text-contact-email-${contact.id}`}>
                      {contact.email}
                    </TableCell>
                    <TableCell data-testid={`text-contact-mobile-${contact.id}`}>
                      {contact.mobile || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={contact.status === "active" ? "default" : "secondary"}
                        data-testid={`badge-contact-status-${contact.id}`}
                      >
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(contact)}
                          data-testid={`button-edit-contact-${contact.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(contact.id)}
                          data-testid={`button-delete-contact-${contact.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
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

      <Dialog open={isAddingContact || editingContact !== null} onOpenChange={(open) => {
        if (!open) {
          setIsAddingContact(false);
          setEditingContact(null);
          setFormData({});
        }
      }}>
        <DialogContent data-testid="dialog-contact-form">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Edit Contact" : "Add New Contact"}
            </DialogTitle>
            <DialogDescription>
              {editingContact 
                ? "Update contact information" 
                : "Add a new team member to your agency"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-contact-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-contact-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-contact-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                value={formData.mobile || ""}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                data-testid="input-contact-mobile"
              />
            </div>
            {!editingContact && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password || ""}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  data-testid="input-contact-password"
                />
              </div>
            )}
            {editingContact && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || "active"}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger id="status" data-testid="select-contact-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingContact(false);
                setEditingContact(null);
                setFormData({});
              }}
              data-testid="button-cancel-contact"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-contact"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddressesTab() {
  const { toast } = useToast();
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AgencyAddress | null>(null);
  const [formData, setFormData] = useState<Partial<AgencyAddress>>({});

  const { data: addresses, isLoading } = useQuery<AgencyAddress[]>({
    queryKey: ["/api/agency/addresses"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<AgencyAddress>) =>
      apiRequest("POST", "/api/agency/addresses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency/addresses"] });
      setIsAddingAddress(false);
      setFormData({});
      toast({
        title: "Address added",
        description: "New address has been successfully added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add address",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AgencyAddress> }) =>
      apiRequest("PATCH", `/api/agency/addresses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency/addresses"] });
      setEditingAddress(null);
      setFormData({});
      toast({
        title: "Address updated",
        description: "Address has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update address",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/agency/addresses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency/addresses"] });
      toast({
        title: "Address deleted",
        description: "Address has been successfully removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete address",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    setFormData({});
    setIsAddingAddress(true);
  };

  const handleEdit = (address: AgencyAddress) => {
    setFormData(address);
    setEditingAddress(address);
  };

  const handleSave = () => {
    if (editingAddress) {
      updateMutation.mutate({ id: editingAddress.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card data-testid="card-addresses">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Business Addresses</CardTitle>
              <CardDescription>Manage your office locations</CardDescription>
            </div>
            <Button onClick={handleAdd} data-testid="button-add-address">
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!addresses || addresses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No addresses added yet</p>
              <p className="text-sm">Add your business locations</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {addresses.map((address) => (
                <Card key={address.id} data-testid={`card-address-${address.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium" data-testid={`text-address-street-${address.id}`}>
                          {address.street}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-address-city-${address.id}`}>
                          {address.city}
                          {address.region && `, ${address.region}`}
                          {address.postalCode && ` ${address.postalCode}`}
                        </p>
                        <p className="text-sm font-medium" data-testid={`text-address-country-${address.id}`}>
                          {address.country}
                        </p>
                        {address.googleMapsUrl && (
                          <a
                            href={address.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                            data-testid={`link-address-maps-${address.id}`}
                          >
                            <MapPin className="w-3 h-3" />
                            View on Maps
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(address)}
                          data-testid={`button-edit-address-${address.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(address.id)}
                          data-testid={`button-delete-address-${address.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddingAddress || editingAddress !== null} onOpenChange={(open) => {
        if (!open) {
          setIsAddingAddress(false);
          setEditingAddress(null);
          setFormData({});
        }
      }}>
        <DialogContent data-testid="dialog-address-form">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? "Update address information"
                : "Add a new business location"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address *</Label>
              <Input
                id="street"
                value={formData.street || ""}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                data-testid="input-address-street"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city || ""}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  data-testid="input-address-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.region || ""}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  data-testid="input-address-region"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode || ""}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  data-testid="input-address-postal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country || ""}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  data-testid="input-address-country"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
              <Input
                id="googleMapsUrl"
                type="url"
                value={formData.googleMapsUrl || ""}
                onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                data-testid="input-address-maps-url"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingAddress(false);
                setEditingAddress(null);
                setFormData({});
              }}
              data-testid="button-cancel-address"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-address"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TeamTab() {
  const { toast } = useToast();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const { data: availableUsers, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/agency/available-users"],
  });

  const { data: teamMembers, isLoading: membersLoading } = useQuery<any[]>({
    queryKey: ["/api/agency/team/members"],
  });

  const inviteMutation = useMutation({
    mutationFn: (data: { userId: string; message?: string }) =>
      apiRequest("POST", "/api/agency/team/invitations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency/available-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agency/team/members"] });
      setShowInviteDialog(false);
      setSelectedUserId("");
      setInviteMessage("");
      toast({
        title: "Invitation sent",
        description: "Team member invitation has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitation",
        description: error.message || "Could not send invitation",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/agency/team/members/${id}/toggle-active`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency/team/members"] });
      toast({
        title: "Status updated",
        description: "Team member status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const handleSendInvitation = () => {
    if (!selectedUserId) {
      toast({
        title: "No user selected",
        description: "Please select a user to invite",
        variant: "destructive",
      });
      return;
    }
    inviteMutation.mutate({ userId: selectedUserId, message: inviteMessage });
  };

  if (usersLoading || membersLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card data-testid="card-invite-team">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invite Team Members</CardTitle>
                <CardDescription>
                  Invite users without tenant roles to join your agency team
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowInviteDialog(true)}
                disabled={!availableUsers || availableUsers.length === 0}
                data-testid="button-invite-member"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!availableUsers || availableUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No available users to invite</p>
                <p className="text-sm">
                  All eligible users have either been invited or already have roles
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {availableUsers.length} user{availableUsers.length !== 1 ? "s" : ""} available to invite
              </p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-team-members">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage your agency team members and their access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!teamMembers || teamMembers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No team members yet</p>
                <p className="text-sm">
                  Invite users to join your team and collaborate on itineraries
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member: any) => (
                    <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                      <TableCell className="font-medium" data-testid={`text-member-name-${member.id}`}>
                        {member.userName || "N/A"}
                      </TableCell>
                      <TableCell data-testid={`text-member-email-${member.id}`}>
                        {member.userEmail}
                      </TableCell>
                      <TableCell>
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={member.isActive ? "default" : "secondary"}
                          data-testid={`badge-member-status-${member.id}`}
                        >
                          {member.isActive ? (
                            <>
                              <UserCheck className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={member.isActive}
                          onCheckedChange={() => toggleActiveMutation.mutate(member.id)}
                          disabled={toggleActiveMutation.isPending}
                          data-testid={`switch-member-active-${member.id}`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent data-testid="dialog-invite-member">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Select a user to invite to your agency team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user">Select User *</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger data-testid="select-invite-user">
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers?.map((user: any) => (
                    <SelectItem key={user.id} value={user.id} data-testid={`option-user-${user.id}`}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Optional Message</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to the invitation..."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={4}
                data-testid="textarea-invite-message"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteDialog(false);
                setSelectedUserId("");
                setInviteMessage("");
              }}
              data-testid="button-cancel-invite"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvitation}
              disabled={inviteMutation.isPending || !selectedUserId}
              data-testid="button-send-invite"
            >
              {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
