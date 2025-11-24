import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Building2, Truck, Hotel, MapPin, Eye } from "lucide-react";

export default function UserDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const { data: roleRequest, isLoading: requestLoading } = useQuery({
    queryKey: ["/api/role-requests/my-request"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/role-requests/my-request");
      return await res.json();
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (requestType: string) => {
      const res = await apiRequest("POST", "/api/role-requests", { requestType });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Role request submitted successfully",
      });
      setSelectedRole(null);
      queryClient.invalidateQueries({ queryKey: ["/api/role-requests/my-request"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("DELETE", `/api/role-requests/${requestId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Request canceled",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/role-requests/my-request"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const roles = [
    {
      id: "travel_agent",
      title: "Travel Agency",
      description: "Join as a travel agency to request quotes from suppliers",
      icon: Building2,
    },
    {
      id: "transport",
      title: "Transport Supplier",
      description: "Manage transport services and quote requests",
      icon: Truck,
    },
    {
      id: "hotel",
      title: "Hotel",
      description: "Manage hotel inventory and pricing",
      icon: Hotel,
    },
    {
      id: "guide",
      title: "Tour Guide",
      description: "Offer tour guiding services",
      icon: Eye,
    },
    {
      id: "sight",
      title: "Sight/Attraction",
      description: "Manage attraction booking and pricing",
      icon: MapPin,
    },
  ];

  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  if (requestLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Normal User Dashboard</h1>
        <p className="text-muted-foreground">Select a role to upgrade your account</p>
      </div>

      {roleRequest && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Your Current Role Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">{roleRequest.requestType.replace("_", " ")}</p>
                <p className="text-sm text-muted-foreground">
                  Submitted on {new Date(roleRequest.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge className={statusColor[roleRequest.status as keyof typeof statusColor]}>
                {roleRequest.status}
              </Badge>
            </div>

            {roleRequest.status === "rejected" && roleRequest.rejectionNote && (
              <div className="bg-red-100 border border-red-300 rounded p-3 text-sm">
                <p className="font-medium text-red-900 mb-1">Rejection Reason:</p>
                <p className="text-red-800">{roleRequest.rejectionNote}</p>
              </div>
            )}

            {roleRequest.status === "pending" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => cancelRequestMutation.mutate(roleRequest.id)}
                disabled={cancelRequestMutation.isPending}
              >
                Cancel Request
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!roleRequest && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Select Your Role</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <Card
                  key={role.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          {role.title}
                        </CardTitle>
                        <CardDescription className="mt-2">{role.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        createRequestMutation.mutate(role.id);
                      }}
                      disabled={createRequestMutation.isPending}
                      data-testid={`button-apply-${role.id}`}
                    >
                      {createRequestMutation.isPending ? "Applying..." : "Apply for Role"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
