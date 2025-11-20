import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function HotelManagement() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle>Hotel Management</CardTitle>
          <CardDescription>Manage your hotels, room types, meal plans, and seasonal rates</CardDescription>
        </div>
        <Button data-testid="button-add-hotel">
          <Plus className="h-4 w-4 mr-2" />
          Add Hotel
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Hotel management coming soon. You'll be able to add hotels, room types, meal plans, and seasonal pricing.
        </div>
      </CardContent>
    </Card>
  );
}
