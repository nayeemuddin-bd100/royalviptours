import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { 
  users, tenants, userTenants, cities, airports, eventCategories, amenities,
  transportCompanies, transportProducts, hotels, roomTypes, mealPlans, hotelRates,
  tourGuides, sights, itineraries, itineraryDays, itineraryEvents, 
  rfqs, rfqSegments, quotes, agencies, agencyContacts, agencyAddresses,
  insertUserSchema, insertTenantSchema, insertCitySchema, insertAirportSchema,
  insertEventCategorySchema, insertAmenitySchema, insertTransportCompanySchema,
  insertTransportProductSchema, insertHotelSchema, insertRoomTypeSchema,
  insertMealPlanSchema, insertHotelRateSchema, insertTourGuideSchema,
  insertSightSchema, insertItinerarySchema, insertItineraryEventSchema,
  insertRfqSchema, insertAgencySchema
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens, verifyToken, requireAuth, requireRole, requireTenantRole, type AuthRequest } from "./lib/auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware to attach user to request
  app.use(async (req: AuthRequest, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      if (payload) {
        const [user] = await db.select().from(users).where(eq(users.id, payload.userId));
        if (user) {
          req.user = user;
        }
      }
    }
    next();
  });

  // ===== Authentication Routes =====
  
  app.post("/api/register", async (req, res, next) => {
    try {
      const body = insertUserSchema.parse(req.body);
      const existingUser = await db.select().from(users).where(eq(users.email, body.email));
      
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const [user] = await db.insert(users).values({
        ...body,
        password: hashPassword(body.password),
        status: "active",
      }).returning();

      const accessToken = generateAccessToken(user.id);
      const refreshToken = await generateRefreshToken(user.id);
      const { password, ...userWithoutPassword } = user;
      
      res.json({ ...userWithoutPassword, accessToken, refreshToken });
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string(),
      }).parse(req.body);

      const [user] = await db.select().from(users).where(eq(users.email, email));
      
      if (!user || !comparePassword(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.status !== "active") {
        return res.status(403).json({ message: "Account is not active" });
      }

      // Update last login
      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

      const accessToken = generateAccessToken(user.id);
      const refreshToken = await generateRefreshToken(user.id);
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ ...userWithoutPassword, accessToken, refreshToken });
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/logout", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      // Revoke all refresh tokens for this user
      await revokeAllUserTokens(req.user!.id);
      res.json({ message: "Logged out successfully" });
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/auth/refresh", async (req, res, next) => {
    try {
      const { refreshToken } = z.object({
        refreshToken: z.string(),
      }).parse(req.body);

      const userId = await verifyRefreshToken(refreshToken);
      
      if (!userId) {
        return res.status(401).json({ message: "Invalid or expired refresh token" });
      }

      // Get user to verify they still exist and are active
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user || user.status !== "active") {
        return res.status(401).json({ message: "User not found or inactive" });
      }

      // Revoke the old refresh token (token rotation)
      await revokeRefreshToken(refreshToken);
      
      // Generate new tokens
      const accessToken = generateAccessToken(user.id);
      const newRefreshToken = await generateRefreshToken(user.id);
      
      res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/user", requireAuth, async (req: AuthRequest, res) => {
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });

  app.get("/api/user/tenants", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const userTenantsData = await db
        .select({
          id: userTenants.id,
          tenantId: userTenants.tenantId,
          tenantRole: userTenants.tenantRole,
          tenantName: tenants.name,
          tenantCountryCode: tenants.countryCode,
          tenantStatus: tenants.status
        })
        .from(userTenants)
        .leftJoin(tenants, eq(userTenants.tenantId, tenants.id))
        .where(eq(userTenants.userId, req.user!.id));
      
      res.json(userTenantsData);
    } catch (error: any) {
      next(error);
    }
  });

  // ===== Tenant Routes =====
  
  app.get("/api/tenants", requireAuth, async (req, res, next) => {
    try {
      const allTenants = await db.select().from(tenants).orderBy(desc(tenants.createdAt));
      res.json(allTenants);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/tenants", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const body = insertTenantSchema.parse(req.body);
      const [tenant] = await db.insert(tenants).values(body).returning();
      res.json(tenant);
    } catch (error: any) {
      next(error);
    }
  });

  app.patch("/api/tenants/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = insertTenantSchema.partial().parse(req.body);
      const [tenant] = await db.update(tenants).set(body).where(eq(tenants.id, id)).returning();
      res.json(tenant);
    } catch (error: any) {
      next(error);
    }
  });

  app.delete("/api/tenants/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const { id } = req.params;
      await db.delete(tenants).where(eq(tenants.id, id));
      res.json({ message: "Tenant deleted" });
    } catch (error: any) {
      next(error);
    }
  });

  // ===== Admin Routes - User Management =====
  
  app.get("/api/admin/users", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      }).from(users).orderBy(desc(users.createdAt));
      res.json(allUsers);
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/admin/user-tenants", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const allUserTenants = await db
        .select({
          id: userTenants.id,
          userId: userTenants.userId,
          tenantId: userTenants.tenantId,
          role: userTenants.tenantRole,
          tenant: {
            id: tenants.id,
            name: tenants.name,
            code: tenants.countryCode,
          }
        })
        .from(userTenants)
        .leftJoin(tenants, eq(userTenants.tenantId, tenants.id));
      res.json(allUserTenants);
    } catch (error: any) {
      next(error);
    }
  });

  // ===== Catalog Routes - Cities =====
  
  app.get("/api/catalog/cities", requireAuth, requireTenantRole("country_manager"), async (req: AuthRequest, res, next) => {
    try {
      const allCities = await db.select().from(cities)
        .where(eq(cities.tenantId, req.tenantContext!.tenantId))
        .orderBy(cities.nameEn);
      res.json(allCities);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/catalog/cities", requireAuth, requireTenantRole("country_manager"), async (req: AuthRequest, res, next) => {
    try {
      const body = insertCitySchema.parse(req.body);
      const [city] = await db.insert(cities).values({
        ...body,
        tenantId: req.tenantContext!.tenantId
      }).returning();
      res.json(city);
    } catch (error: any) {
      next(error);
    }
  });

  app.patch("/api/catalog/cities/:id", requireAuth, requireTenantRole("country_manager"), async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const body = insertCitySchema.partial().parse(req.body);
      const [city] = await db.update(cities).set(body).where(
        and(eq(cities.id, id), eq(cities.tenantId, req.tenantContext!.tenantId))
      ).returning();
      if (!city) {
        return res.status(404).json({ message: "City not found" });
      }
      res.json(city);
    } catch (error: any) {
      next(error);
    }
  });

  app.delete("/api/catalog/cities/:id", requireAuth, requireTenantRole("country_manager"), async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      await db.delete(cities).where(
        and(eq(cities.id, id), eq(cities.tenantId, req.tenantContext!.tenantId))
      );
      res.json({ message: "City deleted" });
    } catch (error: any) {
      next(error);
    }
  });

  // ===== Catalog Routes - Airports =====
  
  app.get("/api/catalog/airports", requireAuth, requireTenantRole("country_manager"), async (req: AuthRequest, res, next) => {
    try {
      const allAirports = await db.select().from(airports)
        .where(eq(airports.tenantId, req.tenantContext!.tenantId))
        .orderBy(airports.code);
      res.json(allAirports);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/catalog/airports", requireAuth, requireTenantRole("country_manager"), async (req: AuthRequest, res, next) => {
    try {
      const body = insertAirportSchema.parse(req.body);
      const [airport] = await db.insert(airports).values({
        ...body,
        tenantId: req.tenantContext!.tenantId
      }).returning();
      res.json(airport);
    } catch (error: any) {
      next(error);
    }
  });

  // ===== Catalog Routes - Event Categories =====
  
  app.get("/api/catalog/event-categories", requireAuth, async (req, res, next) => {
    try {
      const categories = await db.select().from(eventCategories).orderBy(eventCategories.name);
      res.json(categories);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/catalog/event-categories", requireAuth, async (req, res, next) => {
    try {
      const body = insertEventCategorySchema.parse(req.body);
      const [category] = await db.insert(eventCategories).values(body).returning();
      res.json(category);
    } catch (error: any) {
      next(error);
    }
  });

  // ===== Catalog Routes - Amenities =====
  
  app.get("/api/catalog/amenities", requireAuth, async (req, res, next) => {
    try {
      const allAmenities = await db.select().from(amenities).orderBy(amenities.category, amenities.name);
      res.json(allAmenities);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/catalog/amenities", requireAuth, async (req, res, next) => {
    try {
      const body = insertAmenitySchema.parse(req.body);
      const [amenity] = await db.insert(amenities).values(body).returning();
      res.json(amenity);
    } catch (error: any) {
      next(error);
    }
  });

  // ===== Transport Routes =====
  
  app.get("/api/transport/companies", requireAuth, requireTenantRole("transport"), async (req: AuthRequest, res, next) => {
    try {
      const companies = await db.select().from(transportCompanies)
        .where(eq(transportCompanies.tenantId, req.tenantContext!.tenantId))
        .orderBy(transportCompanies.name);
      res.json(companies);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/transport/companies", requireAuth, requireTenantRole("transport"), async (req: AuthRequest, res, next) => {
    try {
      const body = insertTransportCompanySchema.parse(req.body);
      const [company] = await db.insert(transportCompanies).values({
        ...body,
        tenantId: req.tenantContext!.tenantId
      }).returning();
      res.json(company);
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/transport/products", requireAuth, requireTenantRole("transport"), async (req: AuthRequest, res, next) => {
    try {
      const products = await db.select().from(transportProducts)
        .where(eq(transportProducts.tenantId, req.tenantContext!.tenantId))
        .orderBy(transportProducts.name);
      res.json(products);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/transport/products", requireAuth, requireTenantRole("transport"), async (req: AuthRequest, res, next) => {
    try {
      const body = insertTransportProductSchema.parse(req.body);
      const [product] = await db.insert(transportProducts).values({
        ...body,
        tenantId: req.tenantContext!.tenantId
      }).returning();
      res.json(product);
    } catch (error: any) {
      next(error);
    }
  });

  app.patch("/api/transport/products/:id", requireAuth, requireTenantRole("transport"), async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const body = insertTransportProductSchema.partial().parse(req.body);
      const [product] = await db.update(transportProducts).set(body).where(
        and(eq(transportProducts.id, id), eq(transportProducts.tenantId, req.tenantContext!.tenantId))
      ).returning();
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      next(error);
    }
  });

  app.delete("/api/transport/products/:id", requireAuth, requireTenantRole("transport"), async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      await db.delete(transportProducts).where(
        and(eq(transportProducts.id, id), eq(transportProducts.tenantId, req.tenantContext!.tenantId))
      );
      res.json({ message: "Product deleted" });
    } catch (error: any) {
      next(error);
    }
  });

  // ===== Hotel Routes =====
  
  app.get("/api/hotels", requireAuth, requireTenantRole("hotel"), async (req: AuthRequest, res, next) => {
    try {
      const allHotels = await db.select().from(hotels)
        .where(eq(hotels.tenantId, req.tenantContext!.tenantId))
        .orderBy(hotels.name);
      res.json(allHotels);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/hotels", requireAuth, requireTenantRole("hotel"), async (req: AuthRequest, res, next) => {
    try {
      const body = insertHotelSchema.parse(req.body);
      const [hotel] = await db.insert(hotels).values({
        ...body,
        tenantId: req.tenantContext!.tenantId
      }).returning();
      res.json(hotel);
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/hotels/:id/room-types", requireAuth, requireTenantRole("hotel"), async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      // Verify hotel belongs to user's tenant
      const [hotel] = await db.select().from(hotels).where(
        and(eq(hotels.id, id), eq(hotels.tenantId, req.tenantContext!.tenantId))
      );
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      const rooms = await db.select().from(roomTypes).where(eq(roomTypes.hotelId, id));
      res.json(rooms);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/hotels/:id/room-types", requireAuth, requireTenantRole("hotel"), async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      // Verify hotel belongs to user's tenant
      const [hotel] = await db.select().from(hotels).where(
        and(eq(hotels.id, id), eq(hotels.tenantId, req.tenantContext!.tenantId))
      );
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      const body = insertRoomTypeSchema.parse({ ...req.body, hotelId: id });
      const [room] = await db.insert(roomTypes).values(body).returning();
      res.json(room);
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/hotels/:id/rates", requireAuth, requireTenantRole("hotel"), async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      // Verify hotel belongs to user's tenant
      const [hotel] = await db.select().from(hotels).where(
        and(eq(hotels.id, id), eq(hotels.tenantId, req.tenantContext!.tenantId))
      );
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      const rates = await db.select().from(hotelRates).where(eq(hotelRates.hotelId, id));
      res.json(rates);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/hotels/:id/rates", requireAuth, requireTenantRole("hotel"), async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      // Verify hotel belongs to user's tenant
      const [hotel] = await db.select().from(hotels).where(
        and(eq(hotels.id, id), eq(hotels.tenantId, req.tenantContext!.tenantId))
      );
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      const body = insertHotelRateSchema.parse({ ...req.body, hotelId: id });
      const [rate] = await db.insert(hotelRates).values(body).returning();
      res.json(rate);
    } catch (error: any) {
      next(error);
    }
  });

  // ===== Tour Guide Routes =====
  
  app.get("/api/guides", requireAuth, requireTenantRole("guide"), async (req: AuthRequest, res, next) => {
    try {
      const guides = await db.select().from(tourGuides)
        .where(eq(tourGuides.tenantId, req.tenantContext!.tenantId))
        .orderBy(tourGuides.name);
      res.json(guides);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/guides", requireAuth, requireTenantRole("guide"), async (req: AuthRequest, res, next) => {
    try {
      const body = insertTourGuideSchema.parse(req.body);
      const [guide] = await db.insert(tourGuides).values({
        ...body,
        tenantId: req.tenantContext!.tenantId
      }).returning();
      res.json(guide);
    } catch (error: any) {
      next(error);
    }
  });

  // ===== Sights Routes =====
  
  app.get("/api/sights", requireAuth, requireTenantRole("sight"), async (req: AuthRequest, res, next) => {
    try {
      const allSights = await db.select().from(sights)
        .where(eq(sights.tenantId, req.tenantContext!.tenantId))
        .orderBy(sights.name);
      res.json(allSights);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/sights", requireAuth, requireTenantRole("sight"), async (req: AuthRequest, res, next) => {
    try {
      const body = insertSightSchema.parse(req.body);
      const [sight] = await db.insert(sights).values({
        ...body,
        tenantId: req.tenantContext!.tenantId
      }).returning();
      res.json(sight);
    } catch (error: any) {
      next(error);
    }
  });

  // ===== Agency Routes =====
  
  app.get("/api/agencies", requireAuth, async (req, res, next) => {
    try {
      const allAgencies = await db.select().from(agencies).orderBy(agencies.legalName);
      res.json(allAgencies);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/agencies", requireAuth, async (req, res, next) => {
    try {
      const body = insertAgencySchema.parse(req.body);
      const [agency] = await db.insert(agencies).values(body).returning();
      res.json(agency);
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/agencies/:id/contacts", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const contacts = await db.select().from(agencyContacts).where(eq(agencyContacts.agencyId, id));
      res.json(contacts);
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/agencies/:id/addresses", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const addresses = await db.select().from(agencyAddresses).where(eq(agencyAddresses.agencyId, id));
      res.json(addresses);
    } catch (error: any) {
      next(error);
    }
  });

  // ===== Itinerary Routes =====
  
  app.get("/api/itineraries", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      // Itineraries can be accessed by agency users or country managers
      // For now, just require authentication - will add proper agency scoping later
      const allItineraries = await db.select().from(itineraries)
        .orderBy(desc(itineraries.createdAt));
      res.json(allItineraries);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/itineraries", requireAuth, async (req, res, next) => {
    try {
      const body = insertItinerarySchema.parse(req.body);
      const [itinerary] = await db.insert(itineraries).values(body).returning();
      res.json(itinerary);
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/itineraries/:id", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const [itinerary] = await db.select().from(itineraries).where(eq(itineraries.id, id));
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }
      res.json(itinerary);
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/itineraries/:id/events", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const events = await db.select().from(itineraryEvents).where(eq(itineraryEvents.itineraryId, id));
      res.json(events);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/itineraries/:id/events", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = insertItineraryEventSchema.parse({ ...req.body, itineraryId: id });
      const [event] = await db.insert(itineraryEvents).values(body).returning();
      res.json(event);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/itineraries/:id/request-quote", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const [itinerary] = await db.select().from(itineraries).where(eq(itineraries.id, id));
      
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      const [rfq] = await db.insert(rfqs).values({
        tenantId: itinerary.tenantId,
        itineraryId: id,
        agencyId: itinerary.agencyId,
        status: "open",
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      }).returning();

      await db.update(itineraries).set({ status: "requested" }).where(eq(itineraries.id, id));

      res.json(rfq);
    } catch (error: any) {
      next(error);
    }
  });

  // ===== RFQ Routes =====
  
  app.get("/api/rfqs", requireAuth, async (req, res, next) => {
    try {
      const allRfqs = await db.select().from(rfqs).orderBy(desc(rfqs.createdAt));
      res.json(allRfqs);
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/rfq-segments/:id", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const segments = await db.select().from(rfqSegments).where(eq(rfqSegments.rfqId, id));
      res.json(segments);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/rfq-segments/:id/propose", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { proposedPrice, supplierNotes } = req.body;

      const [segment] = await db.update(rfqSegments)
        .set({
          proposedPrice,
          supplierNotes,
          status: "supplier_proposed",
        })
        .where(eq(rfqSegments.id, id))
        .returning();

      res.json(segment);
    } catch (error: any) {
      next(error);
    }
  });

  // ===== Quote Routes =====
  
  app.get("/api/quotes", requireAuth, async (req, res, next) => {
    try {
      const allQuotes = await db.select().from(quotes).orderBy(desc(quotes.createdAt));
      res.json(allQuotes);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/quotes/compile", requireAuth, async (req, res, next) => {
    try {
      const { rfqId, items, currency, subtotal, total } = req.body;

      const [quote] = await db.insert(quotes).values({
        rfqId,
        currency,
        items,
        subtotal,
        total,
        preparedByUserId: (req as AuthRequest).user!.id,
        validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }).returning();

      await db.update(rfqs).set({ status: "quoted" }).where(eq(rfqs.id, rfqId));

      res.json(quote);
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/quotes/:id", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (error: any) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
