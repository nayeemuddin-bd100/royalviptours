# Royal VIP Tours - Demo Test Accounts

This document provides a comprehensive guide to all test accounts in the Royal VIP Tours platform for testing different user roles and features.

## Quick Reference

### Global Accounts
| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `admin@example.com` | `admin123` | Admin | Full system access, tenant management |
| `user@example.com` | `password123` | Regular User | Testing basic user features |

---

## Jordan Tenant (JO) 🇯🇴

**Tenant Details:** Country Code: JO | Currency: JOD | Timezone: Asia/Amman

### Country Manager
```
Email: manager.jordan@example.com
Password: manager123
Role: Country Manager
Responsibilities: Manage cities, airports, event categories, amenities for Jordan
```
**Access:** Can view/manage Jordan country catalog and infrastructure

### Transport Supplier
```
Email: nayeem@test.com
Password: password123
Role: Transport Supplier (Transport Company)
Responsibilities: Manage vehicles, routes, pricing for transport services
```
**Access:**
- Dashboard
- My Catalog (Fleet & Products management)
- **RFQ Inbox** - View and respond to quote requests from travel agencies
- Submit quotes with proposed prices and notes

**Testing Transport Quote Submission:**
1. Login as `nayeem@test.com`
2. Create an itinerary as a regular user with transport events
3. Request quotes for the itinerary
4. Switch to `nayeem@test.com` account
5. Navigate to "RFQ Inbox" in sidebar
6. View pending transport requests
7. Click "Submit Quote" and enter price + notes
8. Status changes from "Pending" → "Quote Submitted"

### Hotel Supplier
```
Email: hotel.amman@example.com
Password: hotel123
Role: Hotel Supplier
Responsibilities: Manage hotel properties, room types, rates
```
**Access:**
- Dashboard
- My Catalog (Hotel profile, room types, rates)
- **RFQ Inbox** - View and respond to hotel quote requests

### Guide Supplier
```
Email: guide.jordan@example.com
Password: guide123
Role: Tour Guide
Responsibilities: Manage guide profile, rates, availability, languages, specialties
```
**Access:**
- Dashboard
- My Profile (Guide information, languages, specialties)
- Rates & Availability (Daily fees, working scope)
- **RFQ Inbox** - View and respond to guide service requests

### Sight/Attraction Supplier
```
Email: sight.jordan@example.com
Password: sight123
Role: Sight/Attraction Manager
Responsibilities: Manage attraction details, entry fees, operating hours
```
**Access:**
- Dashboard
- My Catalog (Attraction details, entry fees, hours)
- **RFQ Inbox** - View and respond to sight/tour requests

---

## Egypt Tenant (EG) 🇪🇬

**Tenant Details:** Country Code: EG | Currency: EGP | Timezone: Africa/Cairo

### Country Manager
```
Email: manager.egypt@example.com
Password: manager123
Role: Country Manager
Responsibilities: Manage cities, airports, event categories, amenities for Egypt
```

### Transport Supplier
```
Email: transport.egypt@example.com
Password: transport123
Role: Transport Supplier
```

### Hotel Supplier
```
Email: hotel.cairo@example.com
Password: hotel123
Role: Hotel Supplier
```

### Guide Supplier
```
Email: guide.egypt@example.com
Password: guide123
Role: Senior Tour Guide
```

### Sight/Attraction Supplier
```
Email: sight.egypt@example.com
Password: sight123
Role: Attractions Manager
```

---

## Testing Workflows

### 1. Complete Quote Submission Workflow

**Goal:** Test the full RFQ and quote submission process

#### Step 1: Create Itinerary (as Regular User)
```
1. Login: user@example.com / password123
2. Navigate: My Itineraries → Create New
3. Fill: Trip title, dates (2-3 days), passenger count
4. Add Events: Transport, Hotel, Guide, Sight events for each day
5. Save itinerary
```

#### Step 2: Request Quotes (as Regular User)
```
1. From itinerary detail page
2. Click "Request Quotes"
3. Select suppliers/tenants (e.g., Jordan)
4. Submit RFQ
→ System creates RFQ segments for each supplier type
```

#### Step 3: View RFQ (as Supplier)
```
1. Login as supplier: nayeem@test.com / password123
2. See "RFQ Inbox" in sidebar navigation
3. View all pending transport quote requests
4. See trip dates, passenger count, event type
```

#### Step 4: Submit Quote (as Supplier)
```
1. Click "Submit Quote" button
2. Enter: Proposed Price (USD)
3. Add: Optional notes (e.g., "Includes driver tips and fuel")
4. Submit
→ Status changes: pending → supplier_proposed
```

#### Step 5: View Quote (as Regular User/Agency)
```
1. Login back as original user: user@example.com
2. Navigate: RFQs
3. View RFQ detail
4. See all supplier quotes
5. Compare prices and details
6. Accept/reject quotes as needed
```

### 2. Navigation Testing

#### Agency Navigation (Regular User)
```
User: user@example.com / password123
Expected Navigation:
  ✓ Dashboard
  ✓ My Itineraries
  ✓ RFQs
  ✓ Quotes
  ✓ Account
```

#### Supplier Navigation (Transport)
```
User: nayeem@test.com / password123
Expected Navigation:
  ✓ Dashboard
  ✓ My Catalog
  ✓ RFQ Inbox
```

#### Supplier Navigation (Hotel)
```
User: hotel.amman@example.com / hotel123
Expected Navigation:
  ✓ Dashboard
  ✓ My Catalog
  ✓ RFQ Inbox
```

#### Country Manager Navigation
```
User: manager.jordan@example.com / manager123
Expected Navigation:
  ✓ Dashboard
  ✓ Country Catalog
```

### 3. Multi-Tenant Testing

Test that users with roles in multiple tenants can switch contexts:

```
1. Create a user with roles in both Jordan and Egypt
2. Login with that user
3. Verify they can see both tenants' data
4. Check that RFQ segments are properly scoped to tenant
```

### 4. Admin Testing

```
User: admin@example.com / admin123
Access:
  ✓ Dashboard (Admin Stats)
  ✓ Tenants (View/Create/Edit)
  ✓ Users (View/Create/Edit)
  ✓ Audit Logs (View all system actions)
```

---

## Common Test Scenarios

### Scenario A: Simple Quote Request
```
1. user@example.com creates simple 1-day itinerary (transport only)
2. Requests quotes
3. nayeem@test.com submits quote
4. user@example.com views and accepts quote
```

### Scenario B: Multi-Day Complex Trip
```
1. user@example.com creates 5-day itinerary
2. Adds transport, hotel, guide, sight events
3. Requests quotes for Jordan
4. All 4 supplier types receive RFQ segments
5. Each supplier (transport, hotel, guide, sight) submits quotes
6. user@example.com reviews all quotes
```

### Scenario C: Multi-Tenant Comparison
```
1. user@example.com creates itinerary
2. Requests quotes from BOTH Jordan and Egypt
3. See quotes from all suppliers across both countries
4. Compare pricing and services between countries
```

---

## Password Reference

All supplier/manager passwords follow this pattern:
- **Managers:** Use `manager123`
- **Suppliers:** Use role-specific (hotel123, guide123) or generic `password123`
- **Admin:** Use `admin123`

## Database Reset

To reset all test accounts and start fresh:

```bash
# Run the seed script
npm run db:seed
```

This will:
1. Create all demo accounts if they don't exist
2. Assign tenant roles
3. Display credentials in console

---

## Notes

- All accounts are pre-configured with correct tenant assignments
- Navigation sidebar automatically shows correct menu based on user role
- Suppliers can only see their own RFQ segments (other suppliers' quotes are hidden)
- Passwords are bcrypt-hashed in database (cannot be recovered, only reset)
- Test accounts are persistent - safe to use repeatedly

---

## Troubleshooting

### I don't see "RFQ Inbox" in my sidebar
- **Reason:** Account doesn't have supplier role (transport, hotel, guide, sight)
- **Solution:** Login as `nayeem@test.com` or other supplier account

### I can't submit quotes
- **Reason:** No pending RFQ segments exist
- **Solution:** 
  1. Login as `user@example.com`
  2. Create itinerary with events
  3. Request quotes
  4. Then login as supplier to submit

### I see different navigation than expected
- **Reason:** Role detection logic in sidebar
- **Solution:** Check `getNavigationItems()` in `client/src/components/app-sidebar.tsx`
  - Suppliers (transport/hotel/guide/sight) → Supplier nav
  - Managers → Manager nav
  - Others → Agency nav

---

## Contact

For issues or questions about demo accounts, refer to the code in:
- Backend Seed: `server/seed.ts`
- Navigation Logic: `client/src/components/app-sidebar.tsx`
- RFQ Inbox: `client/src/pages/supplier-rfq-inbox-page.tsx`
