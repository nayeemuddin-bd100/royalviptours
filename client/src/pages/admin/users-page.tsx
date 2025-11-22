import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Mail, Shield, Building2, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
};

type Tenant = {
  id: string;
  name: string;
  countryCode: string;
};

type UserTenant = {
  id: string;
  userId: string;
  tenantId: string;
  role: string | null;
  tenant: {
    id: string;
    name: string;
    code: string;
  };
};

export default function UsersPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("travel_agent");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [supplierType, setSupplierType] = useState("transport");

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: userTenants, isLoading: tenantsLoading } = useQuery<UserTenant[]>({
    queryKey: ["/api/admin/user-tenants"],
  });

  const { data: tenants, isLoading: tenantsListLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const isLoading = usersLoading || tenantsLoading;

  const createUserMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      name: string;
      accountType: string;
      tenantId?: string;
      supplierType?: string;
    }) => {
      const res = await apiRequest("POST", "/api/admin/users/create-with-role", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-tenants"] });
      setDialogOpen(false);
      setEmail("");
      setPassword("");
      setName("");
      setAccountType("travel_agent");
      setSelectedTenant("");
      setSupplierType("transport");
      toast({
        title: "User created",
        description: "The user account has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (accountType === "travel_agent" || accountType === "country_manager") {
      if (!selectedTenant) {
        toast({
          title: "Validation error",
          description: "Please select a country for this account",
          variant: "destructive",
        });
        return;
      }
    }

    const payload: any = {
      email,
      password,
      name,
      accountType,
    };

    if (accountType === "travel_agent" || accountType === "country_manager") {
      payload.tenantId = selectedTenant;
    }

    if (accountType === "supplier") {
      if (!selectedTenant) {
        toast({
          title: "Validation error",
          description: "Please select a country for this supplier",
          variant: "destructive",
        });
        return;
      }
      payload.tenantId = selectedTenant;
      payload.supplierType = supplierType;
    }

    createUserMutation.mutate(payload);
  };

  const getUserTenants = (userId: string) => {
    return userTenants?.filter(ut => ut.userId === userId) || [];
  };

  const getRoleBadgeVariant = (role: string | null) => {
    if (!role) return "secondary"; // travel agent (null role)
    switch (role) {
      case "admin":
        return "default";
      case "country_manager":
        return "secondary";
      case "transport":
      case "hotel":
      case "guide":
      case "sight":
        return "outline";
      case "agency":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">
            View and manage user accounts across all tenants
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-user">
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user with a specific role: Travel Agent, Country Manager, or Supplier
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  data-testid="input-create-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-create-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-create-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type</Label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger data-testid="select-account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="travel_agent">Travel Agent - Creates itineraries & requests quotes</SelectItem>
                    <SelectItem value="country_manager">Country Manager - Manages country catalog</SelectItem>
                    <SelectItem value="supplier">Supplier - Provides services (transport, hotel, etc)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(accountType === "travel_agent" || accountType === "country_manager" || accountType === "supplier") && (
                <div className="space-y-2">
                  <Label htmlFor="tenant">Select Country</Label>
                  <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                    <SelectTrigger data-testid="select-tenant">
                      <SelectValue placeholder="Choose a country..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tenantsListLoading ? (
                        <div className="p-2 text-sm">Loading countries...</div>
                      ) : tenants && tenants.length > 0 ? (
                        tenants.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} ({t.countryCode})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm">No countries available</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {accountType === "supplier" && (
                <div className="space-y-2">
                  <Label htmlFor="supplierType">Supplier Type</Label>
                  <Select value={supplierType} onValueChange={setSupplierType}>
                    <SelectTrigger data-testid="select-supplier-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transport">Transport (Car rental, Bus company, etc)</SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="guide">Tour Guide</SelectItem>
                      <SelectItem value="sight">Attractions & Sights</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending} data-testid="button-submit-create-user">
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : users?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                users?.filter(u => u.role === "admin").length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">System administrators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                users?.filter(u =>
                  ["transport", "hotel", "guide", "sight"].includes(u.role)
                ).length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Service providers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Travel Agents</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                users?.filter(u => u.role === "user").length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Travel agencies</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Complete list of users and their tenant assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Tenant Assignments</TableHead>
                    <TableHead>Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const tenants = getUserTenants(user.id);
                    return (
                      <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                        <TableCell className="font-medium">
                          {user.name || <span className="text-muted-foreground">No name</span>}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                            {user.role === "user" ? "travel agent" : user.role?.replace(/_/g, " ") || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tenants.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {tenants.map((ut) => (
                                <Badge key={ut.id} variant="outline" className="text-xs">
                                  {ut.tenant.name}
                                  {ut.role && ut.role !== user.role && (
                                    <span className="ml-1 text-muted-foreground">
                                      ({ut.role.replace(/_/g, " ")})
                                    </span>
                                  )}
                                  {!ut.role && (
                                    <span className="ml-1 text-muted-foreground">
                                      (travel agent)
                                    </span>
                                  )}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No assignments</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
