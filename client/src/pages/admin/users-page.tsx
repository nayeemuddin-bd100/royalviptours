import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Shield, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
};

type UserTenant = {
  id: string;
  userId: string;
  tenantId: string;
  role: string;
  tenant: {
    id: string;
    name: string;
    code: string;
  };
};

export default function UsersPage() {
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: userTenants, isLoading: tenantsLoading } = useQuery<UserTenant[]>({
    queryKey: ["/api/admin/user-tenants"],
  });

  const isLoading = usersLoading || tenantsLoading;

  const getUserTenants = (userId: string) => {
    return userTenants?.filter(ut => ut.userId === userId) || [];
  };

  const getRoleBadgeVariant = (role: string) => {
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
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground">
          View and manage user accounts across all tenants
        </p>
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
            <CardTitle className="text-sm font-medium">Agencies</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                users?.filter(u => u.role === "agency").length || 0
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
          <CardDescription>Complete list of registered users and their tenant assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !users || users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">No users found</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Users will appear here once they register
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
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
                            {user.role.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tenants.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {tenants.map((ut) => (
                                <Badge key={ut.id} variant="outline" className="text-xs">
                                  {ut.tenant.name}
                                  {ut.role !== user.role && (
                                    <span className="ml-1 text-muted-foreground">
                                      ({ut.role.replace(/_/g, " ")})
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
