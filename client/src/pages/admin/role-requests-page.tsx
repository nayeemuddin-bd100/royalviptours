import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, Eye } from "lucide-react";

type RoleRequest = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestType: string;
  status: "pending" | "approved" | "rejected";
  data?: Record<string, any>;
  rejectionNote?: string;
  createdAt: string;
};

export default function RoleRequestsPage() {
  const { toast } = useToast();
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({});
  const [selectedRequest, setSelectedRequest] = useState<RoleRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["/api/admin/role-requests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/role-requests");
      return await res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("POST", `/api/admin/role-requests/${requestId}/approve`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Request approved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-requests"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("POST", `/api/admin/role-requests/${requestId}/reject`, {
        rejectionNote: rejectionNotes[requestId] || "",
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Request rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-requests"] });
      setRejectionNotes({});
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

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

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const pendingRequests = requests.filter((r: RoleRequest) => r.status === "pending");
  const processedRequests = requests.filter((r: RoleRequest) => r.status !== "pending");

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Role Change Requests</h1>
        <p className="text-muted-foreground">Review and approve user role upgrade requests</p>
      </div>

      {pendingRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Requests ({pendingRequests.length})</h2>
          <div className="space-y-4">
            {pendingRequests.map((request: RoleRequest) => (
              <Card key={request.id} className="border-yellow-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.userName}</CardTitle>
                      <CardDescription>{request.userEmail}</CardDescription>
                    </div>
                    <Badge className={statusColor[request.status]}>
                      <span className="flex items-center gap-1">
                        {statusIcon[request.status]}
                        {request.status}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Requested Role</p>
                      <p className="font-medium capitalize">{request.requestType.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Requested On</p>
                      <p className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Show submitted data */}
                  {request.data && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-blue-900">Submitted Information</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailsModal(true);
                          }}
                          data-testid={`button-view-details-${request.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1 text-sm text-blue-800">
                        {Object.entries(request.data)
                          .slice(0, 3)
                          .map(([key, value]: [string, any]) => (
                            <p key={key}>
                              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}:</span> {String(value).substring(0, 50)}...
                            </p>
                          ))}
                        {Object.keys(request.data).length > 3 && (
                          <p className="text-blue-600 italic">+{Object.keys(request.data).length - 3} more fields</p>
                        )}
                      </div>
                    </div>
                  )}

                  <Textarea
                    placeholder="Optional rejection note..."
                    value={rejectionNotes[request.id] || ""}
                    onChange={(e) => setRejectionNotes({ ...rejectionNotes, [request.id]: e.target.value })}
                    className="min-h-24"
                    data-testid={`textarea-rejection-note-${request.id}`}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => approveMutation.mutate(request.id)}
                      disabled={approveMutation.isPending}
                      variant="default"
                      data-testid={`button-approve-${request.id}`}
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => rejectMutation.mutate(request.id)}
                      disabled={rejectMutation.isPending}
                      variant="destructive"
                      data-testid={`button-reject-${request.id}`}
                    >
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {processedRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Processed Requests</h2>
          <div className="space-y-2">
            {processedRequests.map((request: RoleRequest) => (
              <Card key={request.id} className="opacity-75">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{request.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.userEmail} • {request.requestType.replace("_", " ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {request.data && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailsModal(true);
                          }}
                          data-testid={`button-view-processed-details-${request.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Badge className={statusColor[request.status]}>
                        <span className="flex items-center gap-1">
                          {statusIcon[request.status]}
                          {request.status}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  {request.rejectionNote && (
                    <p className="text-sm text-red-600 mt-2">Note: {request.rejectionNote}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No role requests yet
          </CardContent>
        </Card>
      )}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              {selectedRequest?.userName} ({selectedRequest?.userEmail})
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Basic Information</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Role Type</p>
                    <p className="font-medium capitalize">{selectedRequest.requestType.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge className={statusColor[selectedRequest.status]}>
                      <span className="flex items-center gap-1">
                        {statusIcon[selectedRequest.status]}
                        {selectedRequest.status}
                      </span>
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Requested On</p>
                    <p className="font-medium">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {selectedRequest.data && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Submitted Information</p>
                  <div className="space-y-3 text-sm">
                    {Object.entries(selectedRequest.data).map(([key, value]: [string, any]) => (
                      <div key={key} className="border-b pb-2">
                        <p className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                        <p className="font-medium break-words">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.rejectionNote && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-800">{selectedRequest.rejectionNote}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
