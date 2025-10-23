import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Eye, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default function QuotesPage() {
  const { data: quotes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/quotes"],
    initialData: [],
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Quotes</h1>
          <p className="text-sm text-muted-foreground">View and download your travel quotes</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Quotes</CardTitle>
          <CardDescription>All generated quotes from your itineraries</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading quotes...</div>
            </div>
          ) : quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">No quotes yet</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Request quotes from your itineraries to see them here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote ID</TableHead>
                  <TableHead>Itinerary</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id} data-testid={`row-quote-${quote.id}`}>
                    <TableCell className="font-mono text-sm">{quote.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">Sample Itinerary</TableCell>
                    <TableCell className="font-semibold">${parseFloat(quote.total).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{quote.currency}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {quote.validityDate ? format(new Date(quote.validityDate), "MMM d, yyyy") : "No expiry"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(quote.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" data-testid={`button-view-${quote.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" data-testid={`button-download-${quote.id}`}>
                          <Download className="h-4 w-4 mr-1" />
                          PDF
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
