# Royal VIP Tours - B2B Travel Platform

## Overview

Royal VIP Tours is a multi-tenant B2B travel platform designed to streamline ground operations and travel quotations within the B2B travel sector. It connects local suppliers (transport, hotels, guides, sights) with global travel agencies to facilitate complex itinerary creation and accurate quote generation via an RFQ workflow. The platform acts as a productivity tool for information management, fostering efficient collaboration between country managers and travel agencies.

## Recent Changes (Nov 24, 2025)

### Role-Based Registration System
- **Schema Update:** Added new `roleRequests` table to track role change requests
  - **Fields:** id, userId (FK), requestType (enum), status (pending/approved/rejected), rejectionNote, createdAt, updatedAt
  - **Constraint:** Unique constraint on userId ensures only one active request per user
  - **Enums:** `roleRequestStatusEnum` (pending/approved/rejected), `roleRequestTypeEnum` (travel_agent/transport/hotel/guide/sight)
- **Registration Flow:** All users start as "Normal Users" (role='user')
  - Simplified registration to single form: name, email, password, confirm password
  - Removed complex 4-step travel agency registration flow
  - New registration schema: `registerSchema` validates password confirmation
- **Backend APIs:** Added 7 role request endpoints
  - `POST /api/role-requests` - Create role change request (enforces single active request)
  - `GET /api/role-requests/my-request` - View current request status
  - `DELETE /api/role-requests/:id` - Cancel pending request
  - `GET /api/admin/role-requests` - Admin lists all requests (pending + processed)
  - `POST /api/admin/role-requests/:id/approve` - Approve request and update user role
  - `POST /api/admin/role-requests/:id/reject` - Reject with optional notes
- **Frontend Changes:**
  - **Auth Page:** Simplified to basic login/registration (removed agency login option)
  - **Normal User Dashboard:** Shows role selection cards (Travel Agency, Transport, Hotel, Guide, Sight)
    - Displays current request status with ability to view notes
    - Allows canceling pending requests
    - One role option active at a time
  - **Admin Page:** `/admin/role-requests` manages all requests
    - Pending requests show in primary view with textareas for rejection notes
    - Processed requests shown in secondary "Processed" section
    - Action buttons: Approve, Reject with notes
- **Home Page Routing:** Updated redirect logic
  - Normal users (role='user') → Redirect to `/user-dashboard`
  - Admin users (role='admin') → Stay on home page
  - Travel agents → Redirect to `/agency`
  - Suppliers → Redirect to `/supplier`
  - Country managers → Redirect to `/country-manager/catalog`
- **Database:** Successfully pushed schema changes, `roleRequests` table created
- **E2E Tests:** All 7 tests passing (100% success rate)
  - ✅ User Registration - All users start as "user" role
  - ✅ Travel Agency Request - Users can apply for travel_agent role
  - ✅ Supplier Request - Users can apply for transport/hotel/guide/sight roles
  - ✅ Admin Views Requests - Admin can view all pending and processed requests
  - ✅ Admin Approval - Admin approves requests and updates user role
  - ✅ Admin Rejection - Admin rejects with optional notes, users see feedback
  - ✅ User Cancels - Users can cancel pending requests and reapply
- **Constraint Enforcement:** Single pending request per user enforced at database level
- **User Role Enum Updated:** Extended to include travel_agent, transport, hotel, guide, sight

### Previous Session Changes (Nov 22, 2025)

#### Meal Plans Implementation
- Changed meal plans from hotel-specific to tenant-wide static data
- Seed data for 5 standard meal plans: RO, BB, HB, FB, AI
- Backend endpoint: `/api/meal-plans`
- Frontend dropdown for hotel rate creation

#### Auth Flow Improvements
- Fixed sidebar menu after login with automatic page reload

#### Supplier Account Creation
- Auto-create company on admin account creation with owner link

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Technology Stack

**Frontend:** React with TypeScript, Vite, Wouter, TanStack Query, shadcn/ui (Radix UI), Tailwind CSS.
**Backend:** Node.js with Express.js, TypeScript, Drizzle ORM, JWT authentication.
**Database:** PostgreSQL (via Neon serverless).

### Architecture Patterns

**Monorepo Structure:** Separates `/client`, `/server`, and `/shared` to enable code sharing and clear boundaries.
**Multi-Tenancy Model:** Tenant-per-country architecture for geographical isolation of data (e.g., suppliers, cities) and operations. Users can have multiple roles across different tenants.
**Role-Based Access Control:** Two-tier system with global roles (`admin`, `user`) and tenant-specific roles (`country_manager`, `transport`, `hotel`, `guide`, `sight`) for fine-grained permissions.
**Authentication Strategy:** JWT-based authentication using short-lived access tokens and long-lived refresh tokens for secure and user-friendly session management.
**Data Model Design:** Organized around core entities: Catalog Management (cities, airports, event categories, amenities), Supplier Management (transport, hotels, guides, sights), Itinerary System (multi-day schedules with events), and RFQ Workflow (quote generation from itineraries).
**API Design:** RESTful API with standard CRUD patterns, organized by resource type, employing middleware for authentication and tenant context.
**State Management:** Client-side state managed by React Query for server state, custom AuthContext for authentication, and React component state for local UI.
**UI Component Strategy:** Built on shadcn/ui (Radix UI primitives) with custom Tailwind CSS for a professional B2B SaaS design system, focusing on information density and a consistent color palette.

### Design Decisions

**Drizzle ORM:** Chosen for type-safe PostgreSQL interactions and lightweight migration management.
**Neon Serverless:** Selected for its PostgreSQL compatibility, serverless scalability, and WebSocket support.
**JWT over Sessions:** Provides stateless authentication for better horizontal scaling and SPA compatibility, with refresh token revocation capabilities.
**Multi-Tenant per Country:** Aligns with the geographic nature of travel operations, enabling independent country-specific management.
**Monorepo with Shared Schema:** Ensures data consistency and compile-time guarantees between frontend and backend by sharing database schemas and types.

## External Dependencies

**UI Component Library:** Radix UI (@radix-ui/*), Lucide React, class-variance-authority, tailwind-merge, clsx.
**Authentication:** jsonwebtoken, bcryptjs, crypto (Node.js built-in).
**Data & Validation:** Drizzle ORM (drizzle-orm, drizzle-kit), Zod (via drizzle-zod), @tanstack/react-query.
**Database:** @neondatabase/serverless, ws.
**Development:** Vite, TypeScript, @replit/* plugins.
**Styling:** Tailwind CSS, PostCSS with Autoprefixer.
**Date Management:** date-fns.
**Forms:** React Hook Form (@hookform/resolvers).