import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, Check, X, Building2, Calendar } from "lucide-react";

export default function UserInvitationsPage() {
  const { toast } = useToast();

  const { data: invitations, isLoading } = useQuery<any[]>({
    queryKey: ["/api/user/invitations"],
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/user/invitations/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/invitations"] });
      toast({
        title: "Invitation accepted",
        description: "You are now a member of the agency team. Redirecting...",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to accept invitation",
        description: error.message || "Could not accept invitation",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/user/invitations/${id}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/invitations"] });
      toast({
        title: "Invitation declined",
        description: "The invitation has been declined.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to decline invitation",
        description: error.message || "Could not decline invitation",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: string) => {
    if (confirm("Are you sure you want to join this agency team?")) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id: string) => {
    if (confirm("Are you sure you want to decline this invitation?")) {
      rejectMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-5xl" data-testid="page-user-invitations">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl" data-testid="page-user-invitations">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Agency Invitations</h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          Review and respond to invitations to join agency teams
        </p>
      </div>

      {!invitations || invitations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Mail className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-semibold mb-2">No Pending Invitations</h3>
            <p className="text-muted-foreground">
              You don't have any pending agency invitations at the moment
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation: any) => (
            <Card key={invitation.id} data-testid={`card-invitation-${invitation.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <CardTitle className="text-xl" data-testid={`text-agency-name-${invitation.id}`}>
                        {invitation.agencyName || invitation.agencyTradeName || "Unknown Agency"}
                      </CardTitle>
                    </div>
                    {invitation.agencyTradeName && invitation.agencyName !== invitation.agencyTradeName && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Trade Name: {invitation.agencyTradeName}
                      </p>
                    )}
                    <CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Invited {new Date(invitation.createdAt).toLocaleDateString()} by {invitation.invitedByName}
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" data-testid={`badge-status-${invitation.id}`}>
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {invitation.message && (
                  <div className="mb-4 p-4 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-1">Personal Message:</p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-message-${invitation.id}`}>
                      {invitation.message}
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApprove(invitation.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="flex-1"
                    data-testid={`button-accept-${invitation.id}`}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {approveMutation.isPending ? "Accepting..." : "Accept Invitation"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReject(invitation.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="flex-1"
                    data-testid={`button-decline-${invitation.id}`}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {rejectMutation.isPending ? "Declining..." : "Decline"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Expires on {new Date(invitation.expiresAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
