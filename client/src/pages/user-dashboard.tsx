import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Building2, Truck, Hotel, MapPin, Eye, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function UserDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: roleRequest, isLoading: requestLoading, refetch } = useQuery({
    queryKey: ["/api/role-requests/my-request"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/role-requests/my-request");
      return await res.json();
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/role-requests", {
        requestType: selectedRole,
        data: selectedRole === "travel_agent" ? data : { country: data.country, ...data },
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Role request submitted successfully",
      });
      setSelectedRole(null);
      setShowModal(false);
      setFormData({});
      refetch();
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
      refetch();
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

  const statusIcon = {
    pending: <Clock className="h-4 w-4" />,
    approved: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    rejected: <XCircle className="h-4 w-4 text-red-600" />,
  };

  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setFormData({});
    setShowModal(true);
  };

  const handleFormSubmit = () => {
    // Validate required fields
    if (selectedRole === "travel_agent") {
      if (!formData.legalName || !formData.country) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!formData.country) {
        toast({
          title: "Error",
          description: "Country is required",
          variant: "destructive",
        });
        return;
      }
    }
    createRequestMutation.mutate(formData);
  };

  if (requestLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Normal User Dashboard</h1>
        <p className="text-muted-foreground">Manage your role requests and upgrade your account</p>
      </div>

      {/* Request History Section */}
      {roleRequest && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Your Role Request Status</CardTitle>
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
                <span className="flex items-center gap-1">
                  {statusIcon[roleRequest.status as keyof typeof statusIcon]}
                  {roleRequest.status}
                </span>
              </Badge>
            </div>

            {/* Show submitted data */}
            {roleRequest.data && (
              <div className="bg-blue-100 border border-blue-300 rounded p-3 text-sm">
                <p className="font-medium text-blue-900 mb-2">Submitted Information:</p>
                <div className="space-y-1 text-blue-800">
                  {Object.entries(roleRequest.data).map(([key, value]: [string, any]) => (
                    <p key={key}>
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}:</span> {String(value)}
                    </p>
                  ))}
                </div>
              </div>
            )}

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
                data-testid="button-cancel-request"
              >
                Cancel Request
              </Button>
            )}

            {roleRequest.status === "rejected" && (
              <Button
                variant="default"
                size="sm"
                onClick={() => cancelRequestMutation.mutate(roleRequest.id)}
                disabled={cancelRequestMutation.isPending}
                data-testid="button-delete-rejected"
              >
                Delete & Apply Again
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Role Selection Section */}
      {(!roleRequest || roleRequest.status !== "pending") && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Select Your Role</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <Card
                  key={role.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleRoleSelect(role.id)}
                  data-testid={`card-role-${role.id}`}
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
                        handleRoleSelect(role.id);
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

      {/* Role Application Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedRole === "travel_agent" ? "Travel Agency Application" : "Supplier Application"}
            </DialogTitle>
            <DialogDescription>
              {selectedRole === "travel_agent"
                ? "Provide your agency details"
                : "Provide your supplier information"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Travel Agency Form */}
            {selectedRole === "travel_agent" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Legal Name *</label>
                  <Input
                    placeholder="Your legal business name"
                    value={formData.legalName || ""}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    data-testid="input-legal-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trade Name</label>
                  <Input
                    placeholder="Trading name (optional)"
                    value={formData.tradeName || ""}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country *</label>
                  <Input
                    placeholder="Country of operation"
                    value={formData.country || ""}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    data-testid="input-country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <Input
                    placeholder="e.g., Tour Operator, Travel Agency, DMC"
                    value={formData.type || ""}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <Input
                    placeholder="Your website URL"
                    value={formData.website || ""}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    placeholder="Tell us about your agency"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-24"
                  />
                </div>
              </>
            )}

            {/* Supplier Form */}
            {selectedRole && selectedRole !== "travel_agent" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Country *</label>
                  <Input
                    placeholder="Country of operation"
                    value={formData.country || ""}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    data-testid="input-supplier-country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company/Business Name</label>
                  <Input
                    placeholder="Your business name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    placeholder="Contact email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <Input
                    placeholder="Contact phone"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    placeholder="Tell us about your business"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-24"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                data-testid="button-cancel-modal"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFormSubmit}
                disabled={createRequestMutation.isPending}
                data-testid="button-submit-form"
              >
                {createRequestMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
