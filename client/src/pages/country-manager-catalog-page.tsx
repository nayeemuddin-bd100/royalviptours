import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CitiesManagement from "@/components/country-manager/cities-management";
import AirportsManagement from "@/components/country-manager/airports-management";
import EventCategoriesManagement from "@/components/country-manager/event-categories-management";
import AmenitiesManagement from "@/components/country-manager/amenities-management";

export default function CountryManagerCatalogPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Country Catalog Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage master data for your country - cities, airports, event categories, and amenities
        </p>
      </div>

      <Tabs defaultValue="cities" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="cities" data-testid="tab-cities">Cities</TabsTrigger>
          <TabsTrigger value="airports" data-testid="tab-airports">Airports</TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">Event Categories</TabsTrigger>
          <TabsTrigger value="amenities" data-testid="tab-amenities">Amenities</TabsTrigger>
        </TabsList>

        <TabsContent value="cities">
          <CitiesManagement />
        </TabsContent>

        <TabsContent value="airports">
          <AirportsManagement />
        </TabsContent>

        <TabsContent value="categories">
          <EventCategoriesManagement />
        </TabsContent>

        <TabsContent value="amenities">
          <AmenitiesManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
