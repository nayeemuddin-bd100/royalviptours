import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Plus, Trash2, Edit, Calendar, MapPin, Utensils, Hotel, Car } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ItineraryEvent {
  id: string;
  tenantId: string;
  itineraryId: string;
  dayId: string;
  categoryId: string | null;
  eventType: string;
  summary: string;
  details: any;
  startTime: string | null;
  endTime: string | null;
  supplierRef: any;
  quantity: number;
  unit: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ItineraryDay {
  id: string;
  itineraryId: string;
  dayNumber: number;
  date: string;
  createdAt: string;
  events: ItineraryEvent[];
}

interface Itinerary {
  id: string;
  tenantId: string;
  agencyId: string;
  title: string;
  paxAdults: number;
  paxChildren: number;
  startDate: string;
  endDate: string;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  days: ItineraryDay[];
}

const EVENT_TYPES = [
  { value: "accommodation", label: "Accommodation", icon: Hotel },
  { value: "transport", label: "Transport", icon: Car },
  { value: "meal", label: "Meal", icon: Utensils },
  { value: "activity", label: "Activity/Tour", icon: MapPin },
  { value: "other", label: "Other", icon: Calendar },
];

export default function AgencyItineraryEditPage() {
  const { toast } = useToast();
  const [, params] = useRoute("/itineraries/:id");
  const itineraryId = params?.id;
  
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<ItineraryEvent | null>(null);
  const [eventFormData, setEventFormData] = useState({
    eventType: "",
    summary: "",
    startTime: "",
    endTime: "",
    details: {},
  });

  const { data: itinerary, isLoading, error } = useQuery<Itinerary>({
    queryKey: ["/api/agency/itineraries", itineraryId],
    enabled: !!itineraryId,
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/agency/itineraries/${itineraryId}/events`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency/itineraries", itineraryId] });
      setIsAddingEvent(false);
      setSelectedDayId(null);
      setEventFormData({ eventType: "", summary: "", startTime: "", endTime: "", details: {} });
      toast({
        title: "Event added",
        description: "Event has been successfully added to the day.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add event",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, data }: { eventId: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/agency/itineraries/${itineraryId}/events/${eventId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency/itineraries", itineraryId] });
      setEditingEvent(null);
      setEventFormData({ eventType: "", summary: "", startTime: "", endTime: "", details: {} });
      toast({
        title: "Event updated",
        description: "Event has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update event",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) =>
      apiRequest("DELETE", `/api/agency/itineraries/${itineraryId}/events/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency/itineraries", itineraryId] });
      toast({
        title: "Event deleted",
        description: "Event has been successfully removed.",
      });
    },
  });

  const handleAddEvent = (dayId: string) => {
    setSelectedDayId(dayId);
    setIsAddingEvent(true);
    setEventFormData({ eventType: "", summary: "", startTime: "", endTime: "", details: {} });
  };

  const handleEditEvent = (event: ItineraryEvent) => {
    setEditingEvent(event);
    setEventFormData({
      eventType: event.eventType,
      summary: event.summary,
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      details: event.details,
    });
  };

  const handleSubmitEvent = () => {
    if (editingEvent) {
      updateEventMutation.mutate({
        eventId: editingEvent.id,
        data: eventFormData,
      });
    } else if (selectedDayId) {
      createEventMutation.mutate({
        dayId: selectedDayId,
        ...eventFormData,
        details: eventFormData.details || {},
      });
    }
  };

  const getEventIcon = (type: string) => {
    const eventType = EVENT_TYPES.find(t => t.value === type);
    return eventType?.icon || Calendar;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-64 bg-muted rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive mb-2">Failed to load itinerary</p>
        <p className="text-muted-foreground text-sm mb-4">{(error as Error).message || "An error occurred"}</p>
        <Link href="/itineraries">
          <Button>Back to Itineraries</Button>
        </Link>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Itinerary not found</p>
        <Link href="/itineraries">
          <Button className="mt-4">Back to Itineraries</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/itineraries">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Itineraries
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-itinerary-title">
              {itinerary.title}
            </h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>{format(new Date(itinerary.startDate), "MMM d")} - {format(new Date(itinerary.endDate), "MMM d, yyyy")}</span>
              <span>{itinerary.paxAdults} Adults{itinerary.paxChildren > 0 && `, ${itinerary.paxChildren} Children`}</span>
            </div>
            {itinerary.notes && (
              <p className="text-muted-foreground mt-2">{itinerary.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge>{itinerary.status}</Badge>
            <Link href={`/rfqs?from_itinerary=${itineraryId}`}>
              <Button variant="outline" data-testid="button-create-rfq">
                Request Quotes
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {itinerary.days.map((day) => {
          const Icon = Calendar;
          return (
            <Card key={day.id} data-testid={`card-day-${day.dayNumber}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      Day {day.dayNumber}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {format(new Date(day.date), "EEEE, MMMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddEvent(day.id)}
                    data-testid={`button-add-event-day-${day.dayNumber}`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {day.events.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No events scheduled for this day
                  </p>
                ) : (
                  <div className="space-y-3">
                    {day.events.map((event) => {
                      const EventIcon = getEventIcon(event.eventType);
                      return (
                        <div
                          key={event.id}
                          className="flex items-start gap-4 p-4 rounded-md border hover-elevate"
                          data-testid={`event-${event.id}`}
                        >
                          <div className="p-2 rounded-md bg-muted">
                            <EventIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="font-medium">{event.summary}</h4>
                                <p className="text-sm text-muted-foreground capitalize mt-1">
                                  {event.eventType}
                                  {(event.startTime || event.endTime) && (
                                    <span className="ml-2">
                                      {event.startTime && format(new Date(`2000-01-01T${event.startTime}`), "h:mm a")}
                                      {event.startTime && event.endTime && " - "}
                                      {event.endTime && format(new Date(`2000-01-01T${event.endTime}`), "h:mm a")}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditEvent(event)}
                                  data-testid={`button-edit-event-${event.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteEventMutation.mutate(event.id)}
                                  data-testid={`button-delete-event-${event.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isAddingEvent || !!editingEvent} onOpenChange={() => {
        setIsAddingEvent(false);
        setEditingEvent(null);
        setEventFormData({ eventType: "", summary: "", startTime: "", endTime: "", details: {} });
      }}>
        <DialogContent data-testid="dialog-event-form">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Add Event"}</DialogTitle>
            <DialogDescription>
              {editingEvent ? "Update the event details below" : "Add a new event to this day"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type *</Label>
              <Select
                value={eventFormData.eventType}
                onValueChange={(value) => setEventFormData({ ...eventFormData, eventType: value })}
              >
                <SelectTrigger id="eventType" data-testid="select-event-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Description *</Label>
              <Input
                id="summary"
                value={eventFormData.summary}
                onChange={(e) => setEventFormData({ ...eventFormData, summary: e.target.value })}
                placeholder="e.g., Breakfast at hotel, Transfer to Petra, etc."
                data-testid="input-event-summary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={eventFormData.startTime}
                  onChange={(e) => setEventFormData({ ...eventFormData, startTime: e.target.value })}
                  data-testid="input-start-time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={eventFormData.endTime}
                  onChange={(e) => setEventFormData({ ...eventFormData, endTime: e.target.value })}
                  data-testid="input-end-time"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingEvent(false);
                setEditingEvent(null);
              }}
              data-testid="button-cancel-event"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEvent}
              disabled={!eventFormData.eventType || !eventFormData.summary || createEventMutation.isPending || updateEventMutation.isPending}
              data-testid="button-save-event"
            >
              {createEventMutation.isPending || updateEventMutation.isPending ? "Saving..." : editingEvent ? "Update Event" : "Add Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
