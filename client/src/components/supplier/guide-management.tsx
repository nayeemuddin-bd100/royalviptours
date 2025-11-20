import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function GuideManagement() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle>Tour Guide Management</CardTitle>
          <CardDescription>Manage your tour guide profiles, languages, specialties, and daily rates</CardDescription>
        </div>
        <Button data-testid="button-add-guide">
          <Plus className="h-4 w-4 mr-2" />
          Add Guide
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Guide management coming soon. You'll be able to add tour guides with their languages, specialties, and daily fees.
        </div>
      </CardContent>
    </Card>
  );
}
