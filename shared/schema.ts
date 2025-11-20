import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, numeric, jsonb, pgEnum, boolean, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);
export const userStatusEnum = pgEnum("user_status", ["pending", "active", "suspended"]);
export const tenantRoleEnum = pgEnum("tenant_role", ["country_manager", "transport", "hotel", "guide", "sight"]);
export const tenantStatusEnum = pgEnum("tenant_status", ["active", "inactive"]);
export const agencyTypeEnum = pgEnum("agency_type", ["tour_operator", "travel_agency", "dmc", "other"]);
export const contactStatusEnum = pgEnum("contact_status", ["pending", "active", "suspended"]);
export const productTypeEnum = pgEnum("product_type", [
  "airport_transfer", "point_to_point", "intercity", "hourly", 
  "rail_escort", "ferry", "heli", "accessible"
]);
export const priceUnitEnum = pgEnum("price_unit", ["per_transfer", "per_hour", "per_km"]);
export const mealPlanEnum = pgEnum("meal_plan", ["RO", "BB", "HB", "FB", "AI"]);
export const workScopeEnum = pgEnum("work_scope", ["country", "city"]);
export const itineraryStatusEnum = pgEnum("itinerary_status", ["draft", "requested", "quoted", "expired", "canceled"]);
export const rfqStatusEnum = pgEnum("rfq_status", ["open", "in_progress", "supplier_pending", "quoted", "declined"]);
export const supplierTypeEnum = pgEnum("supplier_type", ["transport", "hotel", "guide", "sight"]);
export const segmentStatusEnum = pgEnum("segment_status", ["pending", "supplier_review", "supplier_proposed", "accepted", "rejected"]);

// === Global Tables ===

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  status: userStatusEnum("status").notNull().default("pending"),
  name: text("name"),
  jobTitle: text("job_title"),
  phoneWhatsApp: text("phone_whatsapp"),
  avatarUrl: text("avatar_url"),
  lastLoginAt: timestamp("last_login_at"),
  locale: text("locale").default("en"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Can reference either users.id or agency_contacts.id
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  countryCode: text("country_code").notNull().unique(),
  name: text("name").notNull(),
  defaultCurrency: text("default_currency").notNull(),
  defaultTimezone: text("default_timezone").notNull(),
  status: tenantStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userTenants = pgTable("user_tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  tenantRole: tenantRoleEnum("tenant_role").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueUserTenant: unique().on(table.userId, table.tenantId, table.tenantRole)
}));

export const agencies = pgTable("agencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  legalName: text("legal_name").notNull(),
  tradeName: text("trade_name"),
  type: agencyTypeEnum("type"),
  licenseNo: text("license_no"),
  yearEstablished: integer("year_established"),
  country: text("country").notNull(),
  website: text("website"),
  socialLinks: jsonb("social_links"),
  logoUrl: text("logo_url"),
  description: text("description"),
  services: text("services"),
  marketFocus: text("market_focus"),
  destinations: text("destinations"),
  targetCustomer: text("target_customer"),
  avgMonthlyBookings: integer("avg_monthly_bookings"),
  memberships: text("memberships"),
  travelAgentId: varchar("travel_agent_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const agencyContacts = pgTable("agency_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: varchar("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  title: text("title"),
  email: text("email").notNull(),
  altEmail: text("alt_email"),
  mobile: text("mobile"),
  officePhone: text("office_phone"),
  preferredChannel: text("preferred_channel"),
  password: text("password").notNull(),
  status: contactStatusEnum("status").notNull().default("pending"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const agencyAddresses = pgTable("agency_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: varchar("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  street: text("street").notNull(),
  city: text("city").notNull(),
  region: text("region"),
  postalCode: text("postal_code"),
  country: text("country").notNull(),
  googleMapsUrl: text("google_maps_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agencyFinanceDocs = pgTable("agency_finance_docs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: varchar("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  currency: text("currency"),
  bankName: text("bank_name"),
  iban: text("iban"),
  swift: text("swift"),
  accountHolder: text("account_holder"),
  taxId: text("tax_id"),
  billingAddress: text("billing_address"),
  paymentTerms: text("payment_terms"),
  preferredMethod: text("preferred_method"),
  docs: jsonb("docs"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// === Tenant-scoped Catalog Tables ===

export const cities = pgTable("cities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  nameEn: text("name_en").notNull(),
  nameAlt: text("name_alt"),
  region: text("region"),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const airports = pgTable("airports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  cityId: varchar("city_id").references(() => cities.id),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueTenantCode: unique().on(table.tenantId, table.code)
}));

export const eventCategories = pgTable("event_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  parentId: varchar("parent_id").references((): any => eventCategories.id),
  slug: text("slug").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueTenantSlug: unique().on(table.tenantId, table.slug)
}));

export const amenities = pgTable("amenities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueTenantSlug: unique().on(table.tenantId, table.slug)
}));

// === Supplier Tables ===

export const transportCompanies = pgTable("transport_companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const fleets = pgTable("fleets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  transportCompanyId: varchar("transport_company_id").notNull().references(() => transportCompanies.id, { onDelete: "cascade" }),
  vehicleType: text("vehicle_type").notNull(),
  size: integer("size").notNull(),
  features: jsonb("features"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transportProducts = pgTable("transport_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  transportCompanyId: varchar("transport_company_id").notNull().references(() => transportCompanies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  productType: productTypeEnum("product_type").notNull(),
  fromLocation: text("from_location"),
  toLocation: text("to_location"),
  baseDurationMin: integer("base_duration_min"),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }),
  priceUnit: priceUnitEnum("price_unit").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  transportCompanyId: varchar("transport_company_id").notNull().references(() => transportCompanies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const hotels = pgTable("hotels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  cityId: varchar("city_id").references(() => cities.id),
  geo: jsonb("geo"),
  stars: integer("stars"),
  description: text("description"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  images: jsonb("images"),
  policies: jsonb("policies"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const hotelAmenities = pgTable("hotel_amenities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" }),
  amenityId: varchar("amenity_id").notNull().references(() => amenities.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueHotelAmenity: unique().on(table.hotelId, table.amenityId)
}));

export const roomTypes = pgTable("room_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  occupancyMin: integer("occupancy_min").notNull(),
  occupancyMax: integer("occupancy_max").notNull(),
  bedding: jsonb("bedding"),
  features: jsonb("features"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const mealPlans = pgTable("meal_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" }),
  code: mealPlanEnum("code").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueHotelMealPlan: unique().on(table.hotelId, table.code)
}));

export const hotelRates = pgTable("hotel_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" }),
  roomTypeId: varchar("room_type_id").notNull().references(() => roomTypes.id, { onDelete: "cascade" }),
  mealPlanId: varchar("meal_plan_id").notNull().references(() => mealPlans.id, { onDelete: "cascade" }),
  season: text("season").notNull().default("base"),
  currency: text("currency").notNull(),
  pricePerNight: numeric("price_per_night", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tourGuides = pgTable("tour_guides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  languages: text("languages").array(),
  specialty: text("specialty"),
  religion: text("religion"),
  feePerDay: numeric("fee_per_day", { precision: 10, scale: 2 }),
  tipsPerDay: numeric("tips_per_day", { precision: 10, scale: 2 }),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  workScope: workScopeEnum("work_scope").notNull(),
  cityId: varchar("city_id").references(() => cities.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sights = pgTable("sights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  locationText: text("location_text"),
  cityId: varchar("city_id").references(() => cities.id),
  description: text("description"),
  images: jsonb("images"),
  videos: jsonb("videos"),
  daysOpen: jsonb("days_open"),
  hours: jsonb("hours"),
  entryFees: jsonb("entry_fees"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const eventsCatalog = pgTable("events_catalog", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  sightId: varchar("sight_id").references(() => sights.id),
  categoryId: varchar("category_id").references(() => eventCategories.id),
  name: text("name").notNull(),
  description: text("description"),
  defaultDurationMin: integer("default_duration_min"),
  notes: text("notes"),
  inclusions: jsonb("inclusions"),
  exclusions: jsonb("exclusions"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// === Itineraries & Quotes ===

export const itineraries = pgTable("itineraries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  agencyId: varchar("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  paxAdults: integer("pax_adults").notNull(),
  paxChildren: integer("pax_children").default(0),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  notes: text("notes"),
  status: itineraryStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const itineraryDays = pgTable("itinerary_days", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itineraryId: varchar("itinerary_id").notNull().references(() => itineraries.id, { onDelete: "cascade" }),
  dayNumber: integer("day_number").notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueItineraryDay: unique().on(table.itineraryId, table.dayNumber)
}));

export const itineraryEvents = pgTable("itinerary_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  itineraryId: varchar("itinerary_id").notNull().references(() => itineraries.id, { onDelete: "cascade" }),
  dayId: varchar("day_id").notNull().references(() => itineraryDays.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").references(() => eventCategories.id),
  eventType: text("event_type").notNull(),
  summary: text("summary").notNull(),
  details: jsonb("details").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  supplierRef: jsonb("supplier_ref"),
  quantity: integer("quantity").default(1),
  unit: text("unit"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rfqs = pgTable("rfqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  itineraryId: varchar("itinerary_id").notNull().references(() => itineraries.id, { onDelete: "cascade" }),
  agencyId: varchar("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  requestedByContactId: varchar("requested_by_contact_id").references(() => agencyContacts.id),
  status: rfqStatusEnum("status").notNull().default("open"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rfqSegments = pgTable("rfq_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rfqId: varchar("rfq_id").notNull().references(() => rfqs.id, { onDelete: "cascade" }),
  supplierType: supplierTypeEnum("supplier_type").notNull(),
  supplierId: varchar("supplier_id").notNull(),
  payload: jsonb("payload").notNull(),
  status: segmentStatusEnum("status").notNull().default("pending"),
  supplierNotes: text("supplier_notes"),
  proposedPrice: numeric("proposed_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rfqId: varchar("rfq_id").notNull().references(() => rfqs.id, { onDelete: "cascade" }),
  currency: text("currency").notNull(),
  items: jsonb("items").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxes: jsonb("taxes"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  validityDate: timestamp("validity_date"),
  terms: text("terms"),
  preparedByUserId: varchar("prepared_by_user_id").references(() => users.id),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userTenants: many(userTenants),
  agencies: many(agencies),
  quotesPrep: many(quotes),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  userTenants: many(userTenants),
  cities: many(cities),
  airports: many(airports),
  eventCategories: many(eventCategories),
  amenities: many(amenities),
  transportCompanies: many(transportCompanies),
  hotels: many(hotels),
  tourGuides: many(tourGuides),
  sights: many(sights),
  itineraries: many(itineraries),
}));

export const userTenantsRelations = relations(userTenants, ({ one }) => ({
  user: one(users, { fields: [userTenants.userId], references: [users.id] }),
  tenant: one(tenants, { fields: [userTenants.tenantId], references: [tenants.id] }),
}));

export const agenciesRelations = relations(agencies, ({ one, many }) => ({
  travelAgent: one(users, { fields: [agencies.travelAgentId], references: [users.id] }),
  contacts: many(agencyContacts),
  addresses: many(agencyAddresses),
  financeDocs: many(agencyFinanceDocs),
  itineraries: many(itineraries),
  rfqs: many(rfqs),
}));

export const agencyContactsRelations = relations(agencyContacts, ({ one }) => ({
  agency: one(agencies, { fields: [agencyContacts.agencyId], references: [agencies.id] }),
}));

export const agencyAddressesRelations = relations(agencyAddresses, ({ one }) => ({
  agency: one(agencies, { fields: [agencyAddresses.agencyId], references: [agencies.id] }),
}));

export const citiesRelations = relations(cities, ({ one, many }) => ({
  tenant: one(tenants, { fields: [cities.tenantId], references: [tenants.id] }),
  airports: many(airports),
  hotels: many(hotels),
  tourGuides: many(tourGuides),
  sights: many(sights),
}));

export const hotelsRelations = relations(hotels, ({ one, many }) => ({
  tenant: one(tenants, { fields: [hotels.tenantId], references: [tenants.id] }),
  city: one(cities, { fields: [hotels.cityId], references: [cities.id] }),
  amenities: many(hotelAmenities),
  roomTypes: many(roomTypes),
  mealPlans: many(mealPlans),
  rates: many(hotelRates),
}));

export const itinerariesRelations = relations(itineraries, ({ one, many }) => ({
  tenant: one(tenants, { fields: [itineraries.tenantId], references: [tenants.id] }),
  agency: one(agencies, { fields: [itineraries.agencyId], references: [agencies.id] }),
  days: many(itineraryDays),
  events: many(itineraryEvents),
  rfqs: many(rfqs),
}));

export const itineraryDaysRelations = relations(itineraryDays, ({ one, many }) => ({
  itinerary: one(itineraries, { fields: [itineraryDays.itineraryId], references: [itineraries.id] }),
  events: many(itineraryEvents),
}));

export const rfqsRelations = relations(rfqs, ({ one, many }) => ({
  tenant: one(tenants, { fields: [rfqs.tenantId], references: [tenants.id] }),
  itinerary: one(itineraries, { fields: [rfqs.itineraryId], references: [itineraries.id] }),
  agency: one(agencies, { fields: [rfqs.agencyId], references: [agencies.id] }),
  segments: many(rfqSegments),
  quote: many(quotes),
}));

export const rfqSegmentsRelations = relations(rfqSegments, ({ one }) => ({
  rfq: one(rfqs, { fields: [rfqSegments.rfqId], references: [rfqs.id] }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  rfq: one(rfqs, { fields: [quotes.rfqId], references: [rfqs.id] }),
  preparedBy: one(users, { fields: [quotes.preparedByUserId], references: [users.id] }),
}));

// Insert and Select Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
  role: true,
});
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAgencySchema = createInsertSchema(agencies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCitySchema = createInsertSchema(cities).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAirportSchema = createInsertSchema(airports).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEventCategorySchema = createInsertSchema(eventCategories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAmenitySchema = createInsertSchema(amenities).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTransportCompanySchema = createInsertSchema(transportCompanies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTransportProductSchema = createInsertSchema(transportProducts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHotelSchema = createInsertSchema(hotels).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRoomTypeSchema = createInsertSchema(roomTypes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHotelRateSchema = createInsertSchema(hotelRates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTourGuideSchema = createInsertSchema(tourGuides).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSightSchema = createInsertSchema(sights).omit({ id: true, createdAt: true, updatedAt: true });
export const insertItinerarySchema = createInsertSchema(itineraries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertItineraryEventSchema = createInsertSchema(itineraryEvents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRfqSchema = createInsertSchema(rfqs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRfqSegmentSchema = createInsertSchema(rfqSegments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, updatedAt: true });

// Insert schemas
export const insertRefreshTokenSchema = createInsertSchema(refreshTokens).omit({ id: true, createdAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type InsertRefreshToken = z.infer<typeof insertRefreshTokenSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Agency = typeof agencies.$inferSelect;
export type InsertAgency = z.infer<typeof insertAgencySchema>;
export type AgencyContact = typeof agencyContacts.$inferSelect;
export type AgencyAddress = typeof agencyAddresses.$inferSelect;
export type City = typeof cities.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;
export type Airport = typeof airports.$inferSelect;
export type InsertAirport = z.infer<typeof insertAirportSchema>;
export type EventCategory = typeof eventCategories.$inferSelect;
export type InsertEventCategory = z.infer<typeof insertEventCategorySchema>;
export type Amenity = typeof amenities.$inferSelect;
export type TransportCompany = typeof transportCompanies.$inferSelect;
export type InsertTransportCompany = z.infer<typeof insertTransportCompanySchema>;
export type TransportProduct = typeof transportProducts.$inferSelect;
export type InsertTransportProduct = z.infer<typeof insertTransportProductSchema>;
export type Hotel = typeof hotels.$inferSelect;
export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type RoomType = typeof roomTypes.$inferSelect;
export type InsertRoomType = z.infer<typeof insertRoomTypeSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;
export type HotelRate = typeof hotelRates.$inferSelect;
export type InsertHotelRate = z.infer<typeof insertHotelRateSchema>;
export type TourGuide = typeof tourGuides.$inferSelect;
export type InsertTourGuide = z.infer<typeof insertTourGuideSchema>;
export type Sight = typeof sights.$inferSelect;
export type InsertSight = z.infer<typeof insertSightSchema>;
export type Itinerary = typeof itineraries.$inferSelect;
export type InsertItinerary = z.infer<typeof insertItinerarySchema>;
export type ItineraryEvent = typeof itineraryEvents.$inferSelect;
export type InsertItineraryEvent = z.infer<typeof insertItineraryEventSchema>;
export type Rfq = typeof rfqs.$inferSelect;
export type InsertRfq = z.infer<typeof insertRfqSchema>;
export type RfqSegment = typeof rfqSegments.$inferSelect;
export type InsertRfqSegment = z.infer<typeof insertRfqSegmentSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
