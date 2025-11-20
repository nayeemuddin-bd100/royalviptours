import { db } from "./db";
import { users, tenants, userTenants, transportCompanies } from "@shared/schema";
import { hashPassword } from "./lib/auth";
import { eq, and } from "drizzle-orm";

async function seed() {
  console.log("Starting seed...");

  // Create an admin user
  const [existingAdmin] = await db.select().from(users).where(eq(users.email, "admin@royalviptours.com"));
  
  let adminUser;
  if (!existingAdmin) {
    console.log("Creating admin user...");
    [adminUser] = await db.insert(users).values({
      email: "admin@royalviptours.com",
      password: hashPassword("admin123"),
      role: "admin",
      status: "active",
      name: "Admin User",
      jobTitle: "System Administrator"
    }).returning();
    console.log("Admin user created:", adminUser.email);
  } else {
    adminUser = existingAdmin;
    console.log("Admin user already exists:", adminUser.email);
  }

  // Create a test tenant (Jordan)
  const [existingTenant] = await db.select().from(tenants).where(eq(tenants.countryCode, "JO"));
  
  let tenant;
  if (!existingTenant) {
    console.log("Creating Jordan tenant...");
    [tenant] = await db.insert(tenants).values({
      countryCode: "JO",
      name: "Jordan",
      defaultCurrency: "JOD",
      defaultTimezone: "Asia/Amman",
      status: "active"
    }).returning();
    console.log("Tenant created:", tenant.name);
  } else {
    tenant = existingTenant;
    console.log("Tenant already exists:", tenant.name);
  }

  // Create Country Manager user for Jordan
  const [existingManager] = await db.select().from(users).where(eq(users.email, "manager@jordan.royalviptours.com"));
  
  let managerUser;
  if (!existingManager) {
    console.log("Creating Country Manager user...");
    [managerUser] = await db.insert(users).values({
      email: "manager@jordan.royalviptours.com",
      password: hashPassword("manager123"),
      role: "user",
      status: "active",
      name: "Jordan Manager",
      jobTitle: "Country Manager"
    }).returning();
    console.log("Country Manager user created:", managerUser.email);
  } else {
    managerUser = existingManager;
    console.log("Country Manager user already exists:", managerUser.email);
  }

  // Assign Country Manager role to Jordan tenant
  const [existingUserTenant] = await db.select().from(userTenants).where(
    eq(userTenants.userId, managerUser.id)
  );
  
  if (!existingUserTenant) {
    console.log("Assigning Country Manager role to Jordan tenant...");
    await db.insert(userTenants).values({
      userId: managerUser.id,
      tenantId: tenant.id,
      tenantRole: "country_manager"
    });
    console.log("Role assigned successfully");
  } else {
    console.log("User-Tenant relationship already exists");
  }

  // Create Transport Supplier user for Jordan
  const [existingTransport] = await db.select().from(users).where(eq(users.email, "transport@jordan.royalviptours.com"));
  
  let transportUser;
  if (!existingTransport) {
    console.log("Creating Transport Supplier user...");
    [transportUser] = await db.insert(users).values({
      email: "transport@jordan.royalviptours.com",
      password: hashPassword("transport123"),
      role: "user",
      status: "active",
      name: "Jordan Transport Co",
      jobTitle: "Transport Manager"
    }).returning();
    console.log("Transport Supplier user created:", transportUser.email);

    // Assign Transport role to Jordan tenant
    await db.insert(userTenants).values({
      userId: transportUser.id,
      tenantId: tenant.id,
      tenantRole: "transport"
    });
    console.log("Transport role assigned successfully");
  } else {
    transportUser = existingTransport;
    console.log("Transport Supplier user already exists");
  }

  // Create Transport Company for the transport user
  const [existingCompany] = await db.select().from(transportCompanies).where(
    and(
      eq(transportCompanies.tenantId, tenant.id),
      eq(transportCompanies.ownerId, transportUser.id)
    )
  );
  
  if (!existingCompany) {
    console.log("Creating Transport Company...");
    const [company] = await db.insert(transportCompanies).values({
      tenantId: tenant.id,
      ownerId: transportUser.id,
      name: "Royal Jordan Transport",
      description: "Premium transport services across Jordan",
      phone: "+962 6 123 4567",
      email: "transport@jordan.royalviptours.com"
    }).returning();
    console.log("Transport Company created:", company.name);
  } else {
    console.log("Transport Company already exists");
  }

  console.log("\n=== Seed completed successfully! ===\n");
  console.log("Test credentials:");
  console.log("1. Admin: admin@royalviptours.com / admin123");
  console.log("2. Country Manager (Jordan): manager@jordan.royalviptours.com / manager123");
  console.log("3. Transport Supplier (Jordan): transport@jordan.royalviptours.com / transport123");
  console.log("");

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
