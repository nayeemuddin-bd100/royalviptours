import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, TrendingUp, Building2, ClipboardList, MapPin, Users } from "lucide-react";
import { Link } from "wouter";

export default function AgencyDashboard() {
  const { data: agencyData } = useQuery<any>({
    queryKey: ["/api/agency/contact"],
  });

  const { data: itineraries = [], isLoading: itinerariesLoading } = useQuery<any[]>({
    queryKey: ["/api/itineraries"],
  });

  const { data: rfqs = [], isLoading: rfqsLoading } = useQuery<any[]>({
    queryKey: ["/api/rfqs"],
  });

  const recentItineraries = itineraries.slice(0, 5);
  const pendingRfqs = rfqs.filter((rfq: any) => rfq.status === 'open').slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">
          Welcome back, {agencyData?.contact?.name || "Agency Partner"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {agencyData?.agency?.tradeName || agencyData?.agency?.legalName || "Manage your travel itineraries and quotes"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Itineraries</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{itineraries.length}</div>
            <p className="text-xs text-muted-foreground">
              {itineraries.length === 0 ? "No itineraries yet" : `${itineraries.length} ${itineraries.length === 1 ? 'itinerary' : 'itineraries'}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{pendingRfqs.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingRfqs.length === 0 ? "No pending quotes" : `${pendingRfqs.length} pending`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
            <p className="text-xs text-muted-foreground">No suppliers yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">$0</div>
            <p className="text-xs text-muted-foreground">No activity</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Itineraries</CardTitle>
            <CardDescription>Your latest travel itineraries</CardDescription>
          </CardHeader>
          <CardContent>
            {itinerariesLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : recentItineraries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  No itineraries yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Start building your first itinerary to request quotes from suppliers
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentItineraries.map((itinerary: any) => (
                  <Link key={itinerary.id} href={`/itineraries/${itinerary.id}`}>
                    <div className="flex items-start gap-3 p-3 rounded-lg border hover-elevate active-elevate-2 cursor-pointer" data-testid={`itinerary-${itinerary.id}`}>
                      <div className="flex-shrink-0 mt-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{itinerary.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {itinerary.pax || 0} pax
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(itinerary.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          itinerary.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                          itinerary.status === 'requested' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {itinerary.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {itineraries.length > 5 && (
                  <Link href="/itineraries">
                    <Button variant="ghost" className="w-full mt-2" data-testid="button-view-all-itineraries">
                      View all itineraries
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending RFQs</CardTitle>
            <CardDescription>Quote requests awaiting response</CardDescription>
          </CardHeader>
          <CardContent>
            {rfqsLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : pendingRfqs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  No pending requests
                </p>
                <p className="text-xs text-muted-foreground">
                  Quote requests will appear here when you submit an itinerary
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRfqs.map((rfq: any) => (
                  <Link key={rfq.id} href={`/rfqs/${rfq.id}`}>
                    <div className="flex items-start gap-3 p-3 rounded-lg border hover-elevate active-elevate-2 cursor-pointer" data-testid={`rfq-${rfq.id}`}>
                      <div className="flex-shrink-0 mt-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{rfq.itineraryTitle || 'Untitled'}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(rfq.createdAt).toLocaleDateString()}
                          </span>
                          {rfq.expiresAt && (
                            <span className="text-xs text-muted-foreground">
                              Expires {new Date(rfq.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                          {rfq.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {rfqs.filter((rfq: any) => rfq.status === 'open').length > 5 && (
                  <Link href="/rfqs">
                    <Button variant="ghost" className="w-full mt-2" data-testid="button-view-all-rfqs">
                      View all RFQs
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
