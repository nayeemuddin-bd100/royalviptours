import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { 
  users, tenants, userTenants, cities, airports, eventCategories, amenities,
  transportCompanies, transportProducts, fleets, hotels, roomTypes, mealPlans, hotelRates,
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
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens, verifyToken, requireAuth, requireRole, requireTenantRole, requireAgencyContact, type AuthRequest } from "./lib/auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware to attach user to request
  app.use(async (req: AuthRequest, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      if (payload) {
        if (payload.userType === "agency") {
          // Load agency contact
          const [contact] = await db.select().from(agencyContacts).where(eq(agencyContacts.id, payload.userId));
          if (contact) {
            // Map agency contact to user-like structure for compatibility
            req.user = {
              id: contact.id,
              email: contact.email,
              name: contact.name,
              role: "user", // Agency contacts are treated as regular users for auth purposes
              status: contact.status,
              agencyId: contact.agencyId, // Include agencyId for agency authorization
              userType: "agency", // Mark as agency contact
            } as any;
          }
        } else {
          // Load regular user
          const [user] = await db.select().from(users).where(eq(users.id, payload.userId));
          if (user) {
            req.user = user;
          }
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

  // Agency login
  app.post("/api/agency/login", async (req, res, next) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string(),
      }).parse(req.body);

      const [contact] = await db
        .select({
          id: agencyContacts.id,
          agencyId: agencyContacts.agencyId,
          name: agencyContacts.name,
          title: agencyContacts.title,
          email: agencyContacts.email,
          password: agencyContacts.password,
          status: agencyContacts.status,
        })
        .from(agencyContacts)
        .where(eq(agencyContacts.email, email));
      
      if (!contact || !comparePassword(password, contact.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (contact.status !== "active") {
        return res.status(403).json({ message: "Account is not active. Please verify your email." });
      }

      // Get agency details
      const [agency] = await db
        .select()
        .from(agencies)
        .where(eq(agencies.id, contact.agencyId));

      // Generate tokens using contact ID as the "user" ID
      const accessToken = generateAccessToken(contact.id, "agency");
      const refreshToken = await generateRefreshToken(contact.id);
      
      const { password: _, ...contactWithoutPassword } = contact;
      
      res.json({ 
        ...contactWithoutPassword,
        agency,
        accessToken, 
        refreshToken,
        userType: "agency"
      });
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/user", requireAuth, async (req: AuthRequest, res) => {
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });

  // Get agency contact details
  app.get("/api/agency/contact", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const contactId = req.user!.id;
      
      const [contact] = await db
        .select({
          id: agencyContacts.id,
          agencyId: agencyContacts.agencyId,
          name: agencyContacts.name,
          title: agencyContacts.title,
          email: agencyContacts.email,
          altEmail: agencyContacts.altEmail,
          mobile: agencyContacts.mobile,
          officePhone: agencyContacts.officePhone,
          preferredChannel: agencyContacts.preferredChannel,
          status: agencyContacts.status,
        })
        .from(agencyContacts)
        .where(eq(agencyContacts.id, contactId));

      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      // Get agency details
      const [agency] = await db
        .select()
        .from(agencies)
        .where(eq(agencies.id, contact.agencyId));

      res.json({ contact, agency });
    } catch (error: any) {
      next(error);
    }
  });

  // Agency profile management
  app.get("/api/agency/profile", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const agencyId = (req.user as any).agencyId;

      const [agency] = await db
        .select()
        .from(agencies)
        .where(eq(agencies.id, agencyId));

      if (!agency) {
        return res.status(404).json({ message: "Agency not found" });
      }

      res.json(agency);
    } catch (error: any) {
      next(error);
    }
  });

  app.patch("/api/agency/profile", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const agencyId = (req.user as any).agencyId;

      const updateData = insertAgencySchema.partial().parse(req.body);
      
      const [updatedAgency] = await db
        .update(agencies)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(agencies.id, agencyId))
        .returning();

      if (!updatedAgency) {
        return res.status(404).json({ message: "Agency not found" });
      }

      res.json(updatedAgency);
    } catch (error: any) {
      next(error);
    }
  });

  // Agency contacts management
  app.get("/api/agency/contacts", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const agencyId = (req.user as any).agencyId;

      const contacts = await db
        .select({
          id: agencyContacts.id,
          name: agencyContacts.name,
          title: agencyContacts.title,
          email: agencyContacts.email,
          altEmail: agencyContacts.altEmail,
          mobile: agencyContacts.mobile,
          officePhone: agencyContacts.officePhone,
          preferredChannel: agencyContacts.preferredChannel,
          status: agencyContacts.status,
          createdAt: agencyContacts.createdAt,
        })
        .from(agencyContacts)
        .where(eq(agencyContacts.agencyId, agencyId))
        .orderBy(desc(agencyContacts.createdAt));

      res.json(contacts);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/agency/contacts", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const agencyId = (req.user as any).agencyId;

      const newContactData = z.object({
        name: z.string().min(1),
        title: z.string().optional(),
        email: z.string().email(),
        altEmail: z.string().email().optional(),
        mobile: z.string().optional(),
        officePhone: z.string().optional(),
        preferredChannel: z.string().optional(),
        password: z.string().min(6),
      }).parse(req.body);

      const [newContact] = await db
        .insert(agencyContacts)
        .values({
          ...newContactData,
          agencyId: agencyId,
          password: hashPassword(newContactData.password),
          status: "active",
        })
        .returning();

      const { password, ...contactWithoutPassword } = newContact;
      res.json(contactWithoutPassword);
    } catch (error: any) {
      next(error);
    }
  });

  app.patch("/api/agency/contacts/:id", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const agencyId = (req.user as any).agencyId;

      const [targetContact] = await db
        .select()
        .from(agencyContacts)
        .where(and(
          eq(agencyContacts.id, id),
          eq(agencyContacts.agencyId, agencyId)
        ));

      if (!targetContact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      const updateData = z.object({
        name: z.string().min(1).optional(),
        title: z.string().optional(),
        email: z.string().email().optional(),
        altEmail: z.string().email().optional(),
        mobile: z.string().optional(),
        officePhone: z.string().optional(),
        preferredChannel: z.string().optional(),
        status: z.enum(["pending", "active", "suspended"]).optional(),
      }).parse(req.body);

      const [updatedContact] = await db
        .update(agencyContacts)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(
          eq(agencyContacts.id, id),
          eq(agencyContacts.agencyId, agencyId)
        ))
        .returning();

      const { password, ...contactWithoutPassword } = updatedContact;
      res.json(contactWithoutPassword);
    } catch (error: any) {
      next(error);
    }
  });

  app.delete("/api/agency/contacts/:id", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const contactId = req.user!.id;
      const agencyId = (req.user as any).agencyId;
      
      if (id === contactId) {
        return res.status(400).json({ message: "Cannot delete your own contact" });
      }

      const [targetContact] = await db
        .select()
        .from(agencyContacts)
        .where(and(
          eq(agencyContacts.id, id),
          eq(agencyContacts.agencyId, agencyId)
        ));

      if (!targetContact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      await db.delete(agencyContacts).where(and(
        eq(agencyContacts.id, id),
        eq(agencyContacts.agencyId, agencyId)
      ));
      res.json({ message: "Contact deleted" });
    } catch (error: any) {
      next(error);
    }
  });

  // Agency addresses management
  app.get("/api/agency/addresses", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const agencyId = (req.user as any).agencyId;

      const addresses = await db
        .select()
        .from(agencyAddresses)
        .where(eq(agencyAddresses.agencyId, agencyId))
        .orderBy(desc(agencyAddresses.createdAt));

      res.json(addresses);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/agency/addresses", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const agencyId = (req.user as any).agencyId;

      const addressData = z.object({
        street: z.string().min(1),
        city: z.string().min(1),
        region: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().min(1),
        googleMapsUrl: z.string().url().optional(),
      }).parse(req.body);

      const [newAddress] = await db
        .insert(agencyAddresses)
        .values({
          ...addressData,
          agencyId: agencyId,
        })
        .returning();

      res.json(newAddress);
    } catch (error: any) {
      next(error);
    }
  });

  app.patch("/api/agency/addresses/:id", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const agencyId = (req.user as any).agencyId;

      const [targetAddress] = await db
        .select()
        .from(agencyAddresses)
        .where(and(
          eq(agencyAddresses.id, id),
          eq(agencyAddresses.agencyId, agencyId)
        ));

      if (!targetAddress) {
        return res.status(404).json({ message: "Address not found" });
      }

      const updateData = z.object({
        street: z.string().min(1).optional(),
        city: z.string().min(1).optional(),
        region: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().min(1).optional(),
        googleMapsUrl: z.string().url().optional(),
      }).parse(req.body);

      const [updatedAddress] = await db
        .update(agencyAddresses)
        .set(updateData)
        .where(and(
          eq(agencyAddresses.id, id),
          eq(agencyAddresses.agencyId, agencyId)
        ))
        .returning();

      res.json(updatedAddress);
    } catch (error: any) {
      next(error);
    }
  });

  app.delete("/api/agency/addresses/:id", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const { id} = req.params;
      const agencyId = (req.user as any).agencyId;

      const [targetAddress] = await db
        .select()
        .from(agencyAddresses)
        .where(and(
          eq(agencyAddresses.id, id),
          eq(agencyAddresses.agencyId, agencyId)
        ));

      if (!targetAddress) {
        return res.status(404).json({ message: "Address not found" });
      }

      await db.delete(agencyAddresses).where(and(
        eq(agencyAddresses.id, id),
        eq(agencyAddresses.agencyId, agencyId)
      ));
      res.json({ message: "Address deleted" });
    } catch (error: any) {
      next(error);
    }
  });

  // Agency itinerary management
  app.get("/api/agency/itineraries", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const agencyId = (req.user as any).agencyId;

      const agencyItineraries = await db
        .select()
        .from(itineraries)
        .where(eq(itineraries.agencyId, agencyId))
        .orderBy(desc(itineraries.createdAt));

      res.json(agencyItineraries);
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/agency/itineraries/:id", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const agencyId = (req.user as any).agencyId;

      const [itinerary] = await db
        .select()
        .from(itineraries)
        .where(and(
          eq(itineraries.id, id),
          eq(itineraries.agencyId, agencyId)
        ));

      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      // Fetch days with events
      const days = await db
        .select()
        .from(itineraryDays)
        .where(eq(itineraryDays.itineraryId, id))
        .orderBy(itineraryDays.dayNumber);

      const daysWithEvents = await Promise.all(
        days.map(async (day) => {
          const events = await db
            .select()
            .from(itineraryEvents)
            .where(eq(itineraryEvents.dayId, day.id))
            .orderBy(itineraryEvents.createdAt);
          return { ...day, events };
        })
      );

      res.json({ ...itinerary, days: daysWithEvents });
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/agency/itineraries", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const agencyId = (req.user as any).agencyId;

      const itineraryData = z.object({
        tenantId: z.string(),
        title: z.string().min(1),
        paxAdults: z.number().int().min(1),
        paxChildren: z.number().int().min(0).optional(),
        startDate: z.string().transform((str) => new Date(str)),
        endDate: z.string().transform((str) => new Date(str)),
        notes: z.string().optional(),
      }).parse(req.body);

      // Calculate number of days
      const start = new Date(itineraryData.startDate);
      const end = new Date(itineraryData.endDate);
      const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Create itinerary
      const [newItinerary] = await db
        .insert(itineraries)
        .values({
          ...itineraryData,
          agencyId: agencyId,
          paxChildren: itineraryData.paxChildren || 0,
        })
        .returning();

      // Create days
      const dayPromises = [];
      for (let i = 0; i < dayCount; i++) {
        const dayDate = new Date(start);
        dayDate.setDate(start.getDate() + i);
        dayPromises.push(
          db.insert(itineraryDays).values({
            itineraryId: newItinerary.id,
            dayNumber: i + 1,
            date: dayDate,
          }).returning()
        );
      }
      await Promise.all(dayPromises);

      res.json(newItinerary);
    } catch (error: any) {
      next(error);
    }
  });

  app.patch("/api/agency/itineraries/:id", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const agencyId = (req.user as any).agencyId;

      const [targetItinerary] = await db
        .select()
        .from(itineraries)
        .where(and(
          eq(itineraries.id, id),
          eq(itineraries.agencyId, agencyId)
        ));

      if (!targetItinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      const updateData = insertItinerarySchema.partial().parse(req.body);

      // If dates are being updated, check if any events exist
      if (updateData.startDate || updateData.endDate) {
        const existingEvents = await db
          .select()
          .from(itineraryEvents)
          .where(eq(itineraryEvents.itineraryId, id))
          .limit(1);

        if (existingEvents.length > 0) {
          return res.status(400).json({ 
            message: "Cannot change dates after events have been added. Please delete all events first." 
          });
        }

        // No events exist, safe to regenerate days
        const newStart = updateData.startDate ? new Date(updateData.startDate) : new Date(targetItinerary.startDate);
        const newEnd = updateData.endDate ? new Date(updateData.endDate) : new Date(targetItinerary.endDate);
        const dayCount = Math.ceil((newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // Delete existing days
        await db.delete(itineraryDays).where(eq(itineraryDays.itineraryId, id));

        // Create new days
        const dayPromises = [];
        for (let i = 0; i < dayCount; i++) {
          const dayDate = new Date(newStart);
          dayDate.setDate(newStart.getDate() + i);
          dayPromises.push(
            db.insert(itineraryDays).values({
              itineraryId: id,
              dayNumber: i + 1,
              date: dayDate,
            })
          );
        }
        await Promise.all(dayPromises);
      }

      const [updatedItinerary] = await db
        .update(itineraries)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(
          eq(itineraries.id, id),
          eq(itineraries.agencyId, agencyId)
        ))
        .returning();

      res.json(updatedItinerary);
    } catch (error: any) {
      next(error);
    }
  });

  app.delete("/api/agency/itineraries/:id", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const agencyId = (req.user as any).agencyId;

      const [targetItinerary] = await db
        .select()
        .from(itineraries)
        .where(and(
          eq(itineraries.id, id),
          eq(itineraries.agencyId, agencyId)
        ));

      if (!targetItinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      await db.delete(itineraries).where(and(
        eq(itineraries.id, id),
        eq(itineraries.agencyId, agencyId)
      ));
      res.json({ message: "Itinerary deleted" });
    } catch (error: any) {
      next(error);
    }
  });

  // Itinerary events management
  app.post("/api/agency/itineraries/:itineraryId/events", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const { itineraryId } = req.params;
      const agencyId = (req.user as any).agencyId;

      // Verify itinerary belongs to agency
      const [itinerary] = await db
        .select()
        .from(itineraries)
        .where(and(
          eq(itineraries.id, itineraryId),
          eq(itineraries.agencyId, agencyId)
        ));

      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      const eventData = z.object({
        dayId: z.string(),
        categoryId: z.string().optional(),
        eventType: z.string().min(1),
        summary: z.string().min(1),
        details: z.any(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        supplierRef: z.any().optional(),
        quantity: z.number().int().min(1).optional(),
        unit: z.string().optional(),
      }).parse(req.body);

      const [newEvent] = await db
        .insert(itineraryEvents)
        .values({
          tenantId: itinerary.tenantId,
          itineraryId: itineraryId,
          dayId: eventData.dayId,
          categoryId: eventData.categoryId || null,
          eventType: eventData.eventType,
          summary: eventData.summary,
          details: eventData.details,
          startTime: eventData.startTime || null,
          endTime: eventData.endTime || null,
          supplierRef: eventData.supplierRef || null,
          quantity: eventData.quantity || 1,
          unit: eventData.unit || null,
        })
        .returning();

      res.json(newEvent);
    } catch (error: any) {
      next(error);
    }
  });

  app.patch("/api/agency/itineraries/:itineraryId/events/:eventId", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const { itineraryId, eventId } = req.params;
      const agencyId = (req.user as any).agencyId;

      // Verify itinerary belongs to agency
      const [itinerary] = await db
        .select()
        .from(itineraries)
        .where(and(
          eq(itineraries.id, itineraryId),
          eq(itineraries.agencyId, agencyId)
        ));

      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      const updateData = insertItineraryEventSchema.partial().parse(req.body);

      const [updatedEvent] = await db
        .update(itineraryEvents)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(
          eq(itineraryEvents.id, eventId),
          eq(itineraryEvents.itineraryId, itineraryId)
        ))
        .returning();

      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(updatedEvent);
    } catch (error: any) {
      next(error);
    }
  });

  app.delete("/api/agency/itineraries/:itineraryId/events/:eventId", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const { itineraryId, eventId } = req.params;
      const agencyId = (req.user as any).agencyId;

      // Verify itinerary belongs to agency
      const [itinerary] = await db
        .select()
        .from(itineraries)
        .where(and(
          eq(itineraries.id, itineraryId),
          eq(itineraries.agencyId, agencyId)
        ));

      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      await db.delete(itineraryEvents).where(and(
        eq(itineraryEvents.id, eventId),
        eq(itineraryEvents.itineraryId, itineraryId)
      ));
      res.json({ message: "Event deleted" });
    } catch (error: any) {
      next(error);
    }
  });

  // ===== RFQ Routes (Agency) =====

  app.post("/api/agency/rfqs", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const agencyId = (req.user as any).agencyId;
      const { itineraryId, expiresAt } = z.object({
        itineraryId: z.string(),
        expiresAt: z.string().optional(),
      }).parse(req.body);

      // Critical security check: Verify itinerary belongs to THIS agency
      const [itinerary] = await db
        .select()
        .from(itineraries)
        .where(and(
          eq(itineraries.id, itineraryId),
          eq(itineraries.agencyId, agencyId)
        ));

      if (!itinerary) {
        return res.status(403).json({ message: "Access denied: Itinerary not found or does not belong to your agency" });
      }

      // Check for existing RFQ for this itinerary
      const existingRfq = await db
        .select()
        .from(rfqs)
        .where(eq(rfqs.itineraryId, itineraryId))
        .limit(1);

      if (existingRfq.length > 0) {
        return res.status(400).json({ message: "RFQ already exists for this itinerary" });
      }

      // Get all events from the itinerary
      const events = await db
        .select()
        .from(itineraryEvents)
        .where(eq(itineraryEvents.itineraryId, itineraryId));

      if (events.length === 0) {
        return res.status(400).json({ message: "Cannot create RFQ from empty itinerary" });
      }

      // Create the RFQ
      const [rfq] = await db
        .insert(rfqs)
        .values({
          tenantId: itinerary.tenantId,
          itineraryId: itineraryId,
          agencyId: agencyId,
          requestedByContactId: req.user!.id,
          status: "open",
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        })
        .returning();

      // Segment events by supplier type and get suppliers
      const eventsByType: Record<string, typeof events> = {
        transport: [],
        hotel: [],
        guide: [],
        sight: [],
      };

      events.forEach(event => {
        const type = event.eventType.toLowerCase();
        if (type.includes('transfer') || type.includes('transport')) {
          eventsByType.transport.push(event);
        } else if (type.includes('accommodation') || type.includes('hotel')) {
          eventsByType.hotel.push(event);
        } else if (type.includes('tour') || type.includes('guide')) {
          eventsByType.guide.push(event);
        } else if (type.includes('sight') || type.includes('attraction')) {
          eventsByType.sight.push(event);
        }
      });

      // Get suppliers for each type in this tenant
      const transportCompaniesData = await db
        .select()
        .from(transportCompanies)
        .where(eq(transportCompanies.tenantId, itinerary.tenantId));

      const hotelsData = await db
        .select()
        .from(hotels)
        .where(eq(hotels.tenantId, itinerary.tenantId));

      const tourGuidesData = await db
        .select()
        .from(tourGuides)
        .where(eq(tourGuides.tenantId, itinerary.tenantId));

      const sightsData = await db
        .select()
        .from(sights)
        .where(eq(sights.tenantId, itinerary.tenantId));

      // Create RFQ segments for each supplier type with events
      const segments = [];

      if (eventsByType.transport.length > 0 && transportCompaniesData.length > 0) {
        for (const supplier of transportCompaniesData) {
          const [segment] = await db
            .insert(rfqSegments)
            .values({
              rfqId: rfq.id,
              supplierType: "transport",
              supplierId: supplier.id,
              payload: { events: eventsByType.transport },
              status: "pending",
            })
            .returning();
          segments.push(segment);
        }
      }

      if (eventsByType.hotel.length > 0 && hotelsData.length > 0) {
        for (const supplier of hotelsData) {
          const [segment] = await db
            .insert(rfqSegments)
            .values({
              rfqId: rfq.id,
              supplierType: "hotel",
              supplierId: supplier.id,
              payload: { events: eventsByType.hotel },
              status: "pending",
            })
            .returning();
          segments.push(segment);
        }
      }

      if (eventsByType.guide.length > 0 && tourGuidesData.length > 0) {
        for (const supplier of tourGuidesData) {
          const [segment] = await db
            .insert(rfqSegments)
            .values({
              rfqId: rfq.id,
              supplierType: "guide",
              supplierId: supplier.id,
              payload: { events: eventsByType.guide },
              status: "pending",
            })
            .returning();
          segments.push(segment);
        }
      }

      if (eventsByType.sight.length > 0 && sightsData.length > 0) {
        for (const supplier of sightsData) {
          const [segment] = await db
            .insert(rfqSegments)
            .values({
              rfqId: rfq.id,
              supplierType: "sight",
              supplierId: supplier.id,
              payload: { events: eventsByType.sight },
              status: "pending",
            })
            .returning();
          segments.push(segment);
        }
      }

      // Update itinerary status to "requested"
      await db
        .update(itineraries)
        .set({ status: "requested", updatedAt: new Date() })
        .where(eq(itineraries.id, itineraryId));

      res.json({ ...rfq, segments });
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/agency/rfqs", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const agencyId = (req.user as any).agencyId;

      const rfqsData = await db
        .select({
          id: rfqs.id,
          tenantId: rfqs.tenantId,
          itineraryId: rfqs.itineraryId,
          agencyId: rfqs.agencyId,
          requestedByContactId: rfqs.requestedByContactId,
          status: rfqs.status,
          expiresAt: rfqs.expiresAt,
          createdAt: rfqs.createdAt,
          updatedAt: rfqs.updatedAt,
          itineraryTitle: itineraries.title,
          itineraryStartDate: itineraries.startDate,
          itineraryEndDate: itineraries.endDate,
          tenantName: tenants.name,
        })
        .from(rfqs)
        .leftJoin(itineraries, eq(rfqs.itineraryId, itineraries.id))
        .leftJoin(tenants, eq(rfqs.tenantId, tenants.id))
        .where(eq(rfqs.agencyId, agencyId))
        .orderBy(desc(rfqs.createdAt));

      res.json(rfqsData);
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/agency/rfqs/:id", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const agencyId = (req.user as any).agencyId;

      const [rfq] = await db
        .select()
        .from(rfqs)
        .where(and(
          eq(rfqs.id, id),
          eq(rfqs.agencyId, agencyId)
        ));

      if (!rfq) {
        return res.status(404).json({ message: "RFQ not found" });
      }

      // Get all segments for this RFQ
      const segments = await db
        .select()
        .from(rfqSegments)
        .where(eq(rfqSegments.rfqId, id));

      // Get itinerary details
      const [itinerary] = await db
        .select()
        .from(itineraries)
        .where(eq(itineraries.id, rfq.itineraryId));

      res.json({ ...rfq, segments, itinerary });
    } catch (error: any) {
      next(error);
    }
  });

  app.patch("/api/agency/rfqs/:id", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const agencyId = (req.user as any).agencyId;

      const [targetRfq] = await db
        .select()
        .from(rfqs)
        .where(and(
          eq(rfqs.id, id),
          eq(rfqs.agencyId, agencyId)
        ));

      if (!targetRfq) {
        return res.status(404).json({ message: "RFQ not found" });
      }

      const updateData = insertRfqSchema.partial().parse(req.body);

      const [updatedRfq] = await db
        .update(rfqs)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(
          eq(rfqs.id, id),
          eq(rfqs.agencyId, agencyId)
        ))
        .returning();

      res.json(updatedRfq);
    } catch (error: any) {
      next(error);
    }
  });

  app.delete("/api/agency/rfqs/:id", requireAuth, requireAgencyContact, async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const agencyId = (req.user as any).agencyId;

      const [targetRfq] = await db
        .select()
        .from(rfqs)
        .where(and(
          eq(rfqs.id, id),
          eq(rfqs.agencyId, agencyId)
        ));

      if (!targetRfq) {
        return res.status(404).json({ message: "RFQ not found" });
      }

      await db.delete(rfqs).where(and(
        eq(rfqs.id, id),
        eq(rfqs.agencyId, agencyId)
      ));

      res.json({ message: "RFQ deleted" });
    } catch (error: any) {
      next(error);
    }
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

  app.post("/api/admin/users", requireAuth, requireRole("admin"), async (req, res, next) => {
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

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      next(error);
    }
  });

  // ===== Agency Registration Route =====

  app.post("/api/agencies/register", async (req, res, next) => {
    try {
      const schema = z.object({
        legalName: z.string().min(1),
        tradeName: z.string().optional(),
        type: z.enum(["tour_operator", "travel_agency", "dmc", "other"]).optional(),
        licenseNo: z.string().optional(),
        yearEstablished: z.string().optional(),
        country: z.string().min(1),
        website: z.string().optional(),
        description: z.string().optional(),
        contactName: z.string().min(1),
        contactTitle: z.string().optional(),
        contactEmail: z.string().email(),
        contactMobile: z.string().optional(),
        contactPassword: z.string().min(6),
        street: z.string().min(1),
        city: z.string().min(1),
        region: z.string().optional(),
        postalCode: z.string().optional(),
        addressCountry: z.string().min(1),
      });

      const data = schema.parse(req.body);

      // Check if contact email already exists
      const existingContact = await db
        .select()
        .from(agencyContacts)
        .where(eq(agencyContacts.email, data.contactEmail));

      if (existingContact.length > 0) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Create agency
      const [agency] = await db.insert(agencies).values({
        legalName: data.legalName,
        tradeName: data.tradeName || null,
        type: data.type || "travel_agency",
        licenseNo: data.licenseNo || null,
        yearEstablished: data.yearEstablished ? parseInt(data.yearEstablished) : null,
        country: data.country,
        website: data.website || null,
        description: data.description || null,
      }).returning();

      // Create primary contact with hashed password
      const [contact] = await db.insert(agencyContacts).values({
        agencyId: agency.id,
        name: data.contactName,
        title: data.contactTitle || null,
        email: data.contactEmail,
        mobile: data.contactMobile || null,
        password: hashPassword(data.contactPassword),
        status: "active",
      }).returning();

      // Create address
      await db.insert(agencyAddresses).values({
        agencyId: agency.id,
        street: data.street,
        city: data.city,
        region: data.region || null,
        postalCode: data.postalCode || null,
        country: data.addressCountry,
      });

      res.json({ 
        message: "Agency registered successfully",
        agencyId: agency.id,
        contactEmail: contact.email,
      });
    } catch (error: any) {
      next(error);
    }
  });

  // ===== User Tenants Route ===== (defined earlier in file at line ~141)

  // ===== Supplier Routes - Transport =====

  // Get transport products for current user's transport company
  app.get("/api/supplier/transport/products", requireAuth, requireTenantRole("transport"), async (req: AuthRequest, res, next) => {
    try {
      const tenantId = req.tenantId!;
      
      // Get or create transport company for this tenant
      let [company] = await db
        .select()
        .from(transportCompanies)
        .where(eq(transportCompanies.tenantId, tenantId));

      if (!company) {
        // Create default transport company for this tenant
        [company] = await db.insert(transportCompanies).values({
          tenantId,
          name: `Transport Company - ${req.user!.email}`,
        }).returning();
      }

      const products = await db
        .select()
        .from(transportProducts)
        .where(eq(transportProducts.transportCompanyId, company.id));

      res.json(products);
    } catch (error) {
      next(error);
    }
  });

  // Create transport product
  app.post("/api/supplier/transport/products", requireAuth, requireTenantRole("transport"), async (req: AuthRequest, res, next) => {
    try {
      const tenantId = req.tenantId!;

      // Get or create transport company
      let [company] = await db
        .select()
        .from(transportCompanies)
        .where(eq(transportCompanies.tenantId, tenantId));

      if (!company) {
        [company] = await db.insert(transportCompanies).values({
          tenantId,
          name: `Transport Company - ${req.user!.email}`,
        }).returning();
      }

      const schema = z.object({
        name: z.string().min(1),
        productType: z.enum(["airport_transfer", "point_to_point", "intercity", "hourly", "rail_escort", "ferry", "heli", "accessible"]),
        fromLocation: z.string().optional(),
        toLocation: z.string().optional(),
        baseDurationMin: z.string().optional(),
        basePrice: z.string().optional(),
        priceUnit: z.enum(["per_transfer", "per_hour", "per_km"]),
        notes: z.string().optional(),
      });

      const data = schema.parse(req.body);

      const [product] = await db.insert(transportProducts).values({
        tenantId,
        transportCompanyId: company.id,
        name: data.name,
        productType: data.productType,
        fromLocation: data.fromLocation || null,
        toLocation: data.toLocation || null,
        baseDurationMin: data.baseDurationMin ? parseInt(data.baseDurationMin) : null,
        basePrice: data.basePrice || null,
        priceUnit: data.priceUnit,
        notes: data.notes || null,
      }).returning();

      res.json(product);
    } catch (error) {
      next(error);
    }
  });

  // Update transport product
  app.patch("/api/supplier/transport/products/:id", requireAuth, requireTenantRole("transport"), async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;

      const schema = z.object({
        name: z.string().min(1).optional(),
        productType: z.enum(["airport_transfer", "point_to_point", "intercity", "hourly", "rail_escort", "ferry", "heli", "accessible"]).optional(),
        fromLocation: z.string().optional(),
        toLocation: z.string().optional(),
        baseDurationMin: z.string().optional(),
        basePrice: z.string().optional(),
        priceUnit: z.enum(["per_transfer", "per_hour", "per_km"]).optional(),
        notes: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const updates: any = {};

      if (data.name) updates.name = data.name;
      if (data.productType) updates.productType = data.productType;
      if (data.fromLocation !== undefined) updates.fromLocation = data.fromLocation || null;
      if (data.toLocation !== undefined) updates.toLocation = data.toLocation || null;
      if (data.baseDurationMin !== undefined) updates.baseDurationMin = data.baseDurationMin ? parseInt(data.baseDurationMin) : null;
      if (data.basePrice !== undefined) updates.basePrice = data.basePrice || null;
      if (data.priceUnit) updates.priceUnit = data.priceUnit;
      if (data.notes !== undefined) updates.notes = data.notes || null;

      const [product] = await db
        .update(transportProducts)
        .set(updates)
        .where(and(eq(transportProducts.id, id), eq(transportProducts.tenantId, tenantId)))
        .returning();

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      next(error);
    }
  });

  // Delete transport product
  app.delete("/api/supplier/transport/products/:id", requireAuth, requireTenantRole("transport"), async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;

      await db
        .delete(transportProducts)
        .where(and(eq(transportProducts.id, id), eq(transportProducts.tenantId, tenantId)));

      res.json({ message: "Product deleted" });
    } catch (error) {
      next(error);
    }
  });

  // Get fleet vehicles
  app.get("/api/supplier/transport/fleet", requireAuth, requireTenantRole("transport"), async (req: AuthRequest, res, next) => {
    try {
      const tenantId = req.tenantId!;

      // Get or create transport company
      let [company] = await db
        .select()
        .from(transportCompanies)
        .where(eq(transportCompanies.tenantId, tenantId));

      if (!company) {
        [company] = await db.insert(transportCompanies).values({
          tenantId,
          name: `Transport Company - ${req.user!.email}`,
        }).returning();
      }

      const vehicles = await db
        .select()
        .from(fleets)
        .where(eq(fleets.transportCompanyId, company.id));

      res.json(vehicles);
    } catch (error) {
      next(error);
    }
  });

  // Create fleet vehicle
  app.post("/api/supplier/transport/fleet", requireAuth, requireTenantRole("transport"), async (req: AuthRequest, res, next) => {
    try {
      const tenantId = req.tenantId!;

      // Get or create transport company
      let [company] = await db
        .select()
        .from(transportCompanies)
        .where(eq(transportCompanies.tenantId, tenantId));

      if (!company) {
        [company] = await db.insert(transportCompanies).values({
          tenantId,
          name: `Transport Company - ${req.user!.email}`,
        }).returning();
      }

      const schema = z.object({
        vehicleType: z.string().min(1),
        size: z.string().min(1),
        features: z.string().optional(),
      });

      const data = schema.parse(req.body);

      const [vehicle] = await db.insert(fleets).values({
        tenantId,
        transportCompanyId: company.id,
        vehicleType: data.vehicleType,
        size: parseInt(data.size),
        features: data.features ? JSON.parse(data.features) : null,
      }).returning();

      res.json(vehicle);
    } catch (error) {
      next(error);
    }
  });

  // Update fleet vehicle
  app.patch("/api/supplier/transport/fleet/:id", requireAuth, requireTenantRole("transport"), async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;

      const schema = z.object({
        vehicleType: z.string().min(1).optional(),
        size: z.string().optional(),
        features: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const updates: any = {};

      if (data.vehicleType) updates.vehicleType = data.vehicleType;
      if (data.size) updates.size = parseInt(data.size);
      if (data.features !== undefined) updates.features = data.features ? JSON.parse(data.features) : null;

      const [vehicle] = await db
        .update(fleets)
        .set(updates)
        .where(and(eq(fleets.id, id), eq(fleets.tenantId, tenantId)))
        .returning();

      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.json(vehicle);
    } catch (error) {
      next(error);
    }
  });

  // Delete fleet vehicle
  app.delete("/api/supplier/transport/fleet/:id", requireAuth, requireTenantRole("transport"), async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;

      await db
        .delete(fleets)
        .where(and(eq(fleets.id, id), eq(fleets.tenantId, tenantId)));

      res.json({ message: "Vehicle deleted" });
    } catch (error) {
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

  // ===== RFQ Routes (Supplier) =====

  app.get("/api/supplier/rfq-segments", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user!.id;

      // Get user's tenant memberships to find supplier companies
      const userTenantsData = await db
        .select()
        .from(userTenants)
        .where(eq(userTenants.userId, userId));

      // Collect all supplier IDs for this user across all tenants
      const supplierIds: string[] = [];

      for (const ut of userTenantsData) {
        if (ut.tenantRole === "transport") {
          const companies = await db
            .select()
            .from(transportCompanies)
            .where(eq(transportCompanies.tenantId, ut.tenantId));
          supplierIds.push(...companies.map(c => c.id));
        } else if (ut.tenantRole === "hotel") {
          const hotelsData = await db
            .select()
            .from(hotels)
            .where(eq(hotels.tenantId, ut.tenantId));
          supplierIds.push(...hotelsData.map(h => h.id));
        } else if (ut.tenantRole === "guide") {
          const guidesData = await db
            .select()
            .from(tourGuides)
            .where(eq(tourGuides.tenantId, ut.tenantId));
          supplierIds.push(...guidesData.map(g => g.id));
        } else if (ut.tenantRole === "sight") {
          const sightsData = await db
            .select()
            .from(sights)
            .where(eq(sights.tenantId, ut.tenantId));
          supplierIds.push(...sightsData.map(s => s.id));
        }
      }

      if (supplierIds.length === 0) {
        return res.json([]);
      }

      // Get RFQ segments assigned to any of this user's supplier companies
      const segments = await db
        .select({
          id: rfqSegments.id,
          rfqId: rfqSegments.rfqId,
          supplierType: rfqSegments.supplierType,
          supplierId: rfqSegments.supplierId,
          payload: rfqSegments.payload,
          status: rfqSegments.status,
          supplierNotes: rfqSegments.supplierNotes,
          proposedPrice: rfqSegments.proposedPrice,
          createdAt: rfqSegments.createdAt,
          updatedAt: rfqSegments.updatedAt,
          rfqStatus: rfqs.status,
          rfqExpiresAt: rfqs.expiresAt,
          itineraryTitle: itineraries.title,
          itineraryStartDate: itineraries.startDate,
          itineraryEndDate: itineraries.endDate,
          agencyName: agencies.legalName,
        })
        .from(rfqSegments)
        .leftJoin(rfqs, eq(rfqSegments.rfqId, rfqs.id))
        .leftJoin(itineraries, eq(rfqs.itineraryId, itineraries.id))
        .leftJoin(agencies, eq(rfqs.agencyId, agencies.id))
        .where(eq(rfqSegments.supplierId, supplierIds[0])) // TODO: Support multiple supplier IDs with 'in' operator
        .orderBy(desc(rfqSegments.createdAt));

      res.json(segments);
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/supplier/rfq-segments/:id", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const [segment] = await db
        .select()
        .from(rfqSegments)
        .where(eq(rfqSegments.id, id));

      if (!segment) {
        return res.status(404).json({ message: "RFQ segment not found" });
      }

      // Get associated RFQ to check tenant
      const [rfq] = await db
        .select()
        .from(rfqs)
        .where(eq(rfqs.id, segment.rfqId));

      if (!rfq) {
        return res.status(404).json({ message: "RFQ not found" });
      }

      // Critical security check: Verify user has access to the supplier company
      // For suppliers with ownerId: user must own it
      // For legacy suppliers (ownerId null): user must have matching role in tenant
      let hasAccess = false;

      if (segment.supplierType === "transport") {
        const [company] = await db
          .select()
          .from(transportCompanies)
          .where(and(
            eq(transportCompanies.id, segment.supplierId),
            eq(transportCompanies.tenantId, rfq.tenantId)
          ));
        
        if (company) {
          if (company.ownerId) {
            // New suppliers with ownerId: require exact ownership match
            hasAccess = company.ownerId === userId;
          } else {
            // Legacy suppliers without ownerId: allow any user with transport role in tenant
            const [userTenant] = await db
              .select()
              .from(userTenants)
              .where(and(
                eq(userTenants.userId, userId),
                eq(userTenants.tenantId, rfq.tenantId),
                eq(userTenants.tenantRole, "transport")
              ));
            hasAccess = !!userTenant;
          }
        }
      } else if (segment.supplierType === "hotel") {
        const [hotel] = await db
          .select()
          .from(hotels)
          .where(and(
            eq(hotels.id, segment.supplierId),
            eq(hotels.tenantId, rfq.tenantId)
          ));
        
        if (hotel) {
          if (hotel.ownerId) {
            hasAccess = hotel.ownerId === userId;
          } else {
            const [userTenant] = await db
              .select()
              .from(userTenants)
              .where(and(
                eq(userTenants.userId, userId),
                eq(userTenants.tenantId, rfq.tenantId),
                eq(userTenants.tenantRole, "hotel")
              ));
            hasAccess = !!userTenant;
          }
        }
      } else if (segment.supplierType === "guide") {
        const [guide] = await db
          .select()
          .from(tourGuides)
          .where(and(
            eq(tourGuides.id, segment.supplierId),
            eq(tourGuides.tenantId, rfq.tenantId)
          ));
        
        if (guide) {
          if (guide.ownerId) {
            hasAccess = guide.ownerId === userId;
          } else {
            const [userTenant] = await db
              .select()
              .from(userTenants)
              .where(and(
                eq(userTenants.userId, userId),
                eq(userTenants.tenantId, rfq.tenantId),
                eq(userTenants.tenantRole, "guide")
              ));
            hasAccess = !!userTenant;
          }
        }
      } else if (segment.supplierType === "sight") {
        const [sight] = await db
          .select()
          .from(sights)
          .where(and(
            eq(sights.id, segment.supplierId),
            eq(sights.tenantId, rfq.tenantId)
          ));
        
        if (sight) {
          if (sight.ownerId) {
            hasAccess = sight.ownerId === userId;
          } else {
            const [userTenant] = await db
              .select()
              .from(userTenants)
              .where(and(
                eq(userTenants.userId, userId),
                eq(userTenants.tenantId, rfq.tenantId),
                eq(userTenants.tenantRole, "sight")
              ));
            hasAccess = !!userTenant;
          }
        }
      }

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied: Segment not found or does not belong to your company" });
      }

      const [itinerary] = await db
        .select()
        .from(itineraries)
        .where(eq(itineraries.id, rfq.itineraryId));

      const [agency] = await db
        .select()
        .from(agencies)
        .where(eq(agencies.id, rfq.agencyId));

      res.json({ ...segment, rfq, itinerary, agency });
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/supplier/rfq-segments/:id/quote", requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const quoteData = z.object({
        proposedPrice: z.number().positive().finite(),
        supplierNotes: z.string().optional(),
      }).parse(req.body);

      const [segment] = await db
        .select()
        .from(rfqSegments)
        .where(eq(rfqSegments.id, id));

      if (!segment) {
        return res.status(404).json({ message: "RFQ segment not found" });
      }

      // Get associated RFQ to check tenant
      const [rfq] = await db
        .select()
        .from(rfqs)
        .where(eq(rfqs.id, segment.rfqId));

      if (!rfq) {
        return res.status(404).json({ message: "RFQ not found" });
      }

      // Critical security check: Verify user has access to the supplier company
      // For suppliers with ownerId: user must own it
      // For legacy suppliers (ownerId null): user must have matching role in tenant
      let hasAccess = false;

      if (segment.supplierType === "transport") {
        const [company] = await db
          .select()
          .from(transportCompanies)
          .where(and(
            eq(transportCompanies.id, segment.supplierId),
            eq(transportCompanies.tenantId, rfq.tenantId)
          ));
        
        if (company) {
          if (company.ownerId) {
            // New suppliers with ownerId: require exact ownership match
            hasAccess = company.ownerId === userId;
          } else {
            // Legacy suppliers without ownerId: allow any user with transport role in tenant
            const [userTenant] = await db
              .select()
              .from(userTenants)
              .where(and(
                eq(userTenants.userId, userId),
                eq(userTenants.tenantId, rfq.tenantId),
                eq(userTenants.tenantRole, "transport")
              ));
            hasAccess = !!userTenant;
          }
        }
      } else if (segment.supplierType === "hotel") {
        const [hotel] = await db
          .select()
          .from(hotels)
          .where(and(
            eq(hotels.id, segment.supplierId),
            eq(hotels.tenantId, rfq.tenantId)
          ));
        
        if (hotel) {
          if (hotel.ownerId) {
            hasAccess = hotel.ownerId === userId;
          } else {
            const [userTenant] = await db
              .select()
              .from(userTenants)
              .where(and(
                eq(userTenants.userId, userId),
                eq(userTenants.tenantId, rfq.tenantId),
                eq(userTenants.tenantRole, "hotel")
              ));
            hasAccess = !!userTenant;
          }
        }
      } else if (segment.supplierType === "guide") {
        const [guide] = await db
          .select()
          .from(tourGuides)
          .where(and(
            eq(tourGuides.id, segment.supplierId),
            eq(tourGuides.tenantId, rfq.tenantId)
          ));
        
        if (guide) {
          if (guide.ownerId) {
            hasAccess = guide.ownerId === userId;
          } else {
            const [userTenant] = await db
              .select()
              .from(userTenants)
              .where(and(
                eq(userTenants.userId, userId),
                eq(userTenants.tenantId, rfq.tenantId),
                eq(userTenants.tenantRole, "guide")
              ));
            hasAccess = !!userTenant;
          }
        }
      } else if (segment.supplierType === "sight") {
        const [sight] = await db
          .select()
          .from(sights)
          .where(and(
            eq(sights.id, segment.supplierId),
            eq(sights.tenantId, rfq.tenantId)
          ));
        
        if (sight) {
          if (sight.ownerId) {
            hasAccess = sight.ownerId === userId;
          } else {
            const [userTenant] = await db
              .select()
              .from(userTenants)
              .where(and(
                eq(userTenants.userId, userId),
                eq(userTenants.tenantId, rfq.tenantId),
                eq(userTenants.tenantRole, "sight")
              ));
            hasAccess = !!userTenant;
          }
        }
      }

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied: Segment not found or does not belong to your company" });
      }

      // Update the segment with the quote (store as string to match schema)
      const [updatedSegment] = await db
        .update(rfqSegments)
        .set({
          proposedPrice: quoteData.proposedPrice.toString(),
          supplierNotes: quoteData.supplierNotes || null,
          status: "supplier_proposed",
          updatedAt: new Date(),
        })
        .where(eq(rfqSegments.id, id))
        .returning();

      res.json(updatedSegment);
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
        tenantId: req.tenantContext!.tenantId,
        ownerId: req.user!.id
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
