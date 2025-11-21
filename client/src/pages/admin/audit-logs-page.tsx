import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, User, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuditLog } from "@shared/schema";
import { format } from "date-fns";

export default function AuditLogsPage() {
  const { data: auditLogs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit"],
  });

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("created")) return "default";
    if (action.includes("updated")) return "secondary";
    if (action.includes("deleted")) return "destructive";
    if (action.includes("login") || action.includes("logout")) return "outline";
    return "outline";
  };

  const formatActionText = (action: string) => {
    return action
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDetails = (details: any) => {
    if (!details) return "—";
    if (typeof details === "string") return details;
    
    try {
      const detailsObj = typeof details === "object" ? details : JSON.parse(details);
      const keys = Object.keys(detailsObj);
      if (keys.length === 0) return "—";
      
      // Show first key-value pair as summary
      const firstKey = keys[0];
      const firstValue = detailsObj[firstKey];
      if (keys.length === 1) {
        return `${firstKey}: ${firstValue}`;
      }
      return `${firstKey}: ${firstValue} (+${keys.length - 1} more)`;
    } catch {
      return String(details).substring(0, 50);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground" data-testid="heading-audit-logs">
            Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            System activity and change history across all entities
          </p>
        </div>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Activity Log</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 flex-1" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No audit logs yet</h3>
              <p className="text-sm text-muted-foreground">
                System activities will appear here as they occur
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id} data-testid={`row-audit-log-${log.id}`}>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)} data-testid={`badge-action-${log.id}`}>
                        {formatActionText(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          {log.userName && (
                            <span className="text-sm font-medium" data-testid={`text-user-name-${log.id}`}>
                              {log.userName}
                            </span>
                          )}
                          {log.userEmail && (
                            <span className="text-xs text-muted-foreground" data-testid={`text-user-email-${log.id}`}>
                              {log.userEmail}
                            </span>
                          )}
                          {!log.userName && !log.userEmail && (
                            <span className="text-sm text-muted-foreground">System</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm" data-testid={`text-entity-type-${log.id}`}>
                        {log.entityType || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-muted-foreground" data-testid={`text-entity-id-${log.id}`}>
                        {log.entityId ? log.entityId.substring(0, 8) + "..." : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground" data-testid={`text-details-${log.id}`}>
                        {formatDetails(log.details)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-muted-foreground" data-testid={`text-ip-${log.id}`}>
                        {log.ipAddress || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm" data-testid={`text-timestamp-${log.id}`}>
                          {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                        </span>
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
