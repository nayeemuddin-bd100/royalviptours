import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function SightManagement() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle>Sights & Attractions</CardTitle>
          <CardDescription>Manage sights, entry fees, operating hours, and descriptions</CardDescription>
        </div>
        <Button data-testid="button-add-sight">
          <Plus className="h-4 w-4 mr-2" />
          Add Sight
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Sight management coming soon. You'll be able to add attractions with entry fees, operating hours, and media.
        </div>
      </CardContent>
    </Card>
  );
}
