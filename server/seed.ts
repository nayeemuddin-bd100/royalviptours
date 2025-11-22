import { db } from "./db";
import { users, tenants, userTenants } from "@shared/schema";
import { hashPassword } from "./lib/auth";
import { eq, and } from "drizzle-orm";

async function createOrGetUser(email: string, password: string, role: "admin" | "user", name: string, jobTitle: string) {
  const [existingUser] = await db.select().from(users).where(eq(users.email, email));
  
  if (!existingUser) {
    console.log(`  Creating user: ${email}`);
    const [user] = await db.insert(users).values({
      email,
      password: hashPassword(password),
      role,
      status: "active",
      name,
      jobTitle
    }).returning();
    return user;
  }
  
  console.log(`  User already exists: ${email}`);
  return existingUser;
}

async function createOrGetTenant(countryCode: string, name: string, currency: string, timezone: string) {
  const [existingTenant] = await db.select().from(tenants).where(eq(tenants.countryCode, countryCode));
  
  if (!existingTenant) {
    console.log(`  Creating tenant: ${name} (${countryCode})`);
    const [tenant] = await db.insert(tenants).values({
      countryCode,
      name,
      defaultCurrency: currency,
      defaultTimezone: timezone,
      status: "active"
    }).returning();
    return tenant;
  }
  
  console.log(`  Tenant already exists: ${name}`);
  return existingTenant;
}

async function assignTenantRole(userId: string, tenantId: string, role: "country_manager" | "transport" | "hotel" | "guide" | "sight") {
  const [existing] = await db.select().from(userTenants).where(
    and(
      eq(userTenants.userId, userId),
      eq(userTenants.tenantId, tenantId)
    )
  );
  
  if (!existing) {
    console.log(`    Assigning role: ${role}`);
    await db.insert(userTenants).values({
      userId: userId,
      tenantId: tenantId,
      tenantRole: role as any
    });
  } else {
    console.log(`    Role already assigned: ${role}`);
  }
}

async function grantTenantAccess(userId: string, tenantId: string) {
  const [existing] = await db.select().from(userTenants).where(
    and(
      eq(userTenants.userId, userId),
      eq(userTenants.tenantId, tenantId)
    )
  );
  
  if (!existing) {
    console.log(`    Granting tenant access (no role)`);
    await db.insert(userTenants).values({
      userId: userId,
      tenantId: tenantId,
      tenantRole: null
    });
  } else {
    console.log(`    Tenant access already granted`);
  }
}

async function seed() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║            ROYAL VIP TOURS - DATABASE SEED SCRIPT               ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // ===== GLOBAL USERS =====
  console.log("📌 Creating Global Users");
  console.log("─────────────────────────");
  const adminUser = await createOrGetUser(
    "admin@example.com",
    "password123",
    "admin",
    "Admin User",
    "System Administrator"
  );

  const regularUser = await createOrGetUser(
    "user@example.com",
    "password123",
    "user",
    "Regular User",
    "Travel Planner"
  );

  // ===== TENANTS =====
  console.log("\n📌 Creating Tenants");
  console.log("─────────────────────────");
  const jordanTenant = await createOrGetTenant("JO", "Jordan", "JOD", "Asia/Amman");
  const egyptTenant = await createOrGetTenant("EG", "Egypt", "EGP", "Africa/Cairo");

  // Grant regular user access to all tenants (so they can create itineraries)
  console.log("\n📌 Granting Regular User Tenant Access");
  console.log("─────────────────────────");
  await assignTenantRole(regularUser.id, jordanTenant.id, "country_manager");
  await assignTenantRole(regularUser.id, egyptTenant.id, "country_manager");

  // ===== JORDAN TENANT - SUPPLIERS & MANAGERS =====
  console.log("\n📌 Jordan Tenant - Users & Roles");
  console.log("─────────────────────────");
  
  // Country Manager
  const jordanManager = await createOrGetUser(
    "manager.jordan@example.com",
    "password123",
    "user",
    "Ahmed Al-Qudah",
    "Country Manager"
  );
  await assignTenantRole(jordanManager.id, jordanTenant.id, "country_manager");

  // Transport Supplier
  const transportSupplier = await createOrGetUser(
    "nayeem@test.com",
    "password123",
    "user",
    "Nayeem Transport Solutions",
    "Transport Manager"
  );
  await assignTenantRole(transportSupplier.id, jordanTenant.id, "transport");

  // Hotel Supplier
  const hotelSupplier = await createOrGetUser(
    "hotel.amman@example.com",
    "password123",
    "user",
    "Amman Grand Hotel",
    "Hotel Manager"
  );
  await assignTenantRole(hotelSupplier.id, jordanTenant.id, "hotel");

  // Guide Supplier
  const guideSupplier = await createOrGetUser(
    "guide.jordan@example.com",
    "password123",
    "user",
    "Rasha Al-Rasheed",
    "Tour Guide"
  );
  await assignTenantRole(guideSupplier.id, jordanTenant.id, "guide");

  // Sight Supplier
  const sightSupplier = await createOrGetUser(
    "sight.jordan@example.com",
    "password123",
    "user",
    "Petra Heritage Tours",
    "Attractions Manager"
  );
  await assignTenantRole(sightSupplier.id, jordanTenant.id, "sight");

  // ===== EGYPT TENANT - SUPPLIERS & MANAGERS =====
  console.log("\n📌 Egypt Tenant - Users & Roles");
  console.log("─────────────────────────");
  
  // Country Manager
  const egyptManager = await createOrGetUser(
    "manager.egypt@example.com",
    "password123",
    "user",
    "Fatima Hassan",
    "Country Manager"
  );
  await assignTenantRole(egyptManager.id, egyptTenant.id, "country_manager");

  // Transport Supplier
  const egyptTransport = await createOrGetUser(
    "transport.egypt@example.com",
    "password123",
    "user",
    "Cairo Premium Transport",
    "Transport Manager"
  );
  await assignTenantRole(egyptTransport.id, egyptTenant.id, "transport");

  // Hotel Supplier
  const egyptHotel = await createOrGetUser(
    "hotel.cairo@example.com",
    "password123",
    "user",
    "Cairo Luxury Hotels",
    "Hotel Manager"
  );
  await assignTenantRole(egyptHotel.id, egyptTenant.id, "hotel");

  // Guide Supplier
  const egyptGuide = await createOrGetUser(
    "guide.egypt@example.com",
    "password123",
    "user",
    "Dr. Mohamed Abdel-Salam",
    "Senior Tour Guide"
  );
  await assignTenantRole(egyptGuide.id, egyptTenant.id, "guide");

  // Sight Supplier
  const egyptSight = await createOrGetUser(
    "sight.egypt@example.com",
    "password123",
    "user",
    "Egyptian Heritage Foundation",
    "Attractions Director"
  );
  await assignTenantRole(egyptSight.id, egyptTenant.id, "sight");

  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║                  ✅ SEED COMPLETED SUCCESSFULLY!                ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  console.log("📝 TEST CREDENTIALS CREATED:\n");
  
  console.log("🔐 GLOBAL ACCOUNTS:");
  console.log("   Admin: admin@example.com / password123");
  console.log("   Regular User: user@example.com / password123\n");

  console.log("🇯🇴 JORDAN TENANT:");
  console.log("   Country Manager: manager.jordan@example.com / password123");
  console.log("   Transport Supplier: nayeem@test.com / password123");
  console.log("   Hotel Supplier: hotel.amman@example.com / password123");
  console.log("   Guide Supplier: guide.jordan@example.com / password123");
  console.log("   Sight Supplier: sight.jordan@example.com / password123\n");

  console.log("🇪🇬 EGYPT TENANT:");
  console.log("   Country Manager: manager.egypt@example.com / password123");
  console.log("   Transport Supplier: transport.egypt@example.com / password123");
  console.log("   Hotel Supplier: hotel.cairo@example.com / password123");
  console.log("   Guide Supplier: guide.egypt@example.com / password123");
  console.log("   Sight Supplier: sight.egypt@example.com / password123\n");

  console.log("📖 For detailed testing guide, see: demo-accounts.md\n");

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
