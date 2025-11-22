# Royal VIP Tours - B2B Travel Platform

## Overview

Royal VIP Tours is a multi-tenant B2B travel platform designed to streamline ground operations and travel quotations within the B2B travel sector. It connects local suppliers (transport, hotels, guides, sights) with global travel agencies to facilitate complex itinerary creation and accurate quote generation via an RFQ workflow. The platform acts as a productivity tool for information management, fostering efficient collaboration between country managers and travel agencies.

## Recent Changes (Nov 22, 2025)

### Meal Plans Implementation
- **Schema Update:** Changed meal plans from hotel-specific to tenant-wide static data
  - Removed `hotelId` from meal plans table
  - Added unique constraint on `(tenantId, code)` instead of `(hotelId, code)`
- **Seed Data:** Created 5 standard meal plans for each tenant:
  - **RO** - Room Only (no meals)
  - **BB** - Bed & Breakfast  
  - **HB** - Half Board (breakfast + dinner)
  - **FB** - Full Board (all meals)
  - **AI** - All Inclusive (meals + drinks)
- **Backend:** Added `/api/meal-plans` endpoint to fetch tenant meal plans
- **Frontend:** Hotel rate creation now shows meal plans in dropdown (Room Type also uses dropdown)
- **Bug Fix:** Removed `parseFloat()` conversion for `pricePerNight` to maintain string type for backend precision

### Auth Flow Improvements
- **Bug Fix:** Fixed sidebar menu showing incorrect items after login
  - Added automatic page reload after successful login/registration
  - Ensures all auth state and tenant data is fresh on page load
  - Sidebar now correctly displays supplier/agency menus immediately after login

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