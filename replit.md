# Royal VIP Tours - B2B Travel Platform

## Overview

Royal VIP Tours is a multi-tenant B2B travel platform designed to streamline ground operations and travel quotations. The platform connects local suppliers (transport companies, hotels, tour guides, sights) with travel agencies worldwide, facilitating the creation of complex itineraries and the generation of accurate quotes through an RFQ (Request for Quote) workflow.

The application serves as a productivity-focused information management system for the travel industry, enabling efficient collaboration between country managers who coordinate local suppliers and travel agencies requesting services.

## Recent Progress (November 20, 2025)

**Completed: Itinerary Builder for Travel Agencies**
- Full CRUD itinerary management system with 10 backend API endpoints
- List page showing all agency itineraries with status badges and actions
- Create page with tenant selection, date range, and passenger count inputs
- Comprehensive edit/builder page with multi-day timeline interface
- Event management with add/edit/delete dialogs for each day
- All endpoints properly secured with requireAgencyContact and agencyId scoping
- Critical bug fixes:
  - Fixed passenger count validation (frontend now casts to Number before submission)
  - Added date change protection (blocks updates when events exist to prevent data loss)
  - Improved error handling on edit page with loading/error states
- E2E tests passed: itinerary creation → day generation → event management → DB verification
- Architect approved with "Pass" verdict after multiple review cycles

**Previous: Agency Authentication & Profile System**
- Implemented dual authentication supporting both suppliers and travel agencies
- JWT tokens include userType field ("user" or "agency") for proper routing
- Agency profile management with Profile, Contacts, and Addresses tabs
- Complete agency dashboard with stats overview and empty state CTAs
- End-to-end test passed: agency login → dashboard → profile management

**Previous: Supplier Catalog Management - Transport Module**
- Transport supplier dashboard with role-based access control
- Route (product) and fleet (vehicle) management functionality
- Proper tenant isolation with X-Tenant-Id header validation
- End-to-end test passed: login → create route → create vehicle → DB verification

**Recommended Future Improvements**:
- Security: Migrate from localStorage-based tokens to HttpOnly cookies for XSS protection
- Security: Move refresh token storage entirely server-side (currently exposed in localStorage)
- Database: Add userType discriminator to refresh_tokens or split into separate tables for referential integrity
- Itineraries: Add UI feedback when date changes are blocked due to existing events
- Itineraries: Add regression tests for date changes with/without events
- Validation: Harden numeric field validation with zod schemas across all forms
- Forms: Refactor remaining forms to use shadcn Form with react-hook-form + zodResolver

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Technology Stack

**Frontend:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with a custom B2B SaaS design system

**Backend:**
- Node.js with Express.js for the REST API server
- TypeScript for end-to-end type safety
- Drizzle ORM for database interactions
- JWT-based authentication with access and refresh token pattern

**Database:**
- PostgreSQL (via Neon serverless) for relational data storage
- Schema-driven design with comprehensive relationships between entities

### Architecture Patterns

**Monorepo Structure:**
The application uses a monorepo approach with clear separation:
- `/client` - React frontend application
- `/server` - Express backend API
- `/shared` - Shared TypeScript types and database schema

This structure enables code sharing (especially database schemas and types) while maintaining clear boundaries between frontend and backend concerns.

**Multi-Tenancy Model:**
The platform implements a tenant-per-country architecture where:
- Each tenant represents a country (e.g., Jordan, Egypt)
- Users can belong to multiple tenants with different roles
- Tenant-specific data (cities, airports, suppliers) is isolated per country
- Country managers coordinate all suppliers and services within their tenant

**Role-Based Access Control:**
Two-tier authorization system:
- Global roles: `admin` (platform-wide access) and `user` (tenant-scoped access)
- Tenant roles: `country_manager`, `transport`, `hotel`, `guide`, `sight` (supplier types)

This allows fine-grained permissions where users have different capabilities in different country contexts.

**Authentication Strategy:**
JWT-based authentication with dual-token approach:
- Short-lived access tokens (15 minutes) for API requests
- Long-lived refresh tokens (7 days) stored in database for session management
- Tokens stored in localStorage on client-side
- Middleware-based route protection on both client and server

This provides security through token expiration while maintaining good UX through automatic token refresh.

**Data Model Design:**
The schema is organized around core business entities:

1. **Catalog Management** - Master data for travel components:
   - Cities and airports (per tenant)
   - Event categories (dining, tours, transfers, etc.)
   - Amenities (WiFi, accessibility features, etc.)

2. **Supplier Management** - Service providers:
   - Transport companies with product variants (transfers, hourly, intercity)
   - Hotels with room types, meal plans, and seasonal rates
   - Tour guides with language skills and city coverage
   - Sights with admission fees and operational details

3. **Itinerary System** - Trip planning workflow:
   - Itineraries composed of multi-day schedules
   - Days containing ordered events (meals, tours, transfers, accommodations)
   - Events reference catalog items and suppliers

4. **RFQ Workflow** - Quote generation process:
   - RFQs created from itineraries
   - Segmented by supplier type for parallel processing
   - Quotes aggregate supplier responses with pricing

**API Design:**
RESTful API organized by resource type with standard CRUD patterns:
- Authentication endpoints (`/api/auth/*`) for login, registration, token refresh
- User management (`/api/user/*`) for profile and tenant associations
- Resource endpoints follow pattern `/api/{resource}` with proper HTTP verbs
- Middleware chains for auth verification and tenant context injection

**State Management:**
Client-side state handled through React Query with clear separation:
- Server state (API data) managed via TanStack Query with automatic caching
- Authentication state via custom AuthContext provider
- Local UI state via React component state
- Query invalidation patterns for optimistic updates

**UI Component Strategy:**
Built on shadcn/ui philosophy:
- Radix UI primitives for accessible, unstyled components
- Custom Tailwind styling following B2B design guidelines
- Design system focused on professional credibility and information density
- Consistent color palette with light/dark mode support
- Professional blue primary color (220 70% 50%) for trust in B2B context

### Design Decisions

**Why Drizzle ORM:**
Chosen for type-safe database queries that map directly to PostgreSQL, providing excellent TypeScript integration and migration management while remaining lightweight compared to heavier ORMs.

**Why Neon Serverless:**
PostgreSQL-compatible serverless database that scales automatically and provides WebSocket connections, ideal for development and production deployment on platforms like Replit.

**Why JWT over Sessions:**
Stateless authentication enables easier horizontal scaling and works well with modern SPA architecture. Refresh token storage in database provides revocation capability while maintaining statelessness for access tokens.

**Why Multi-Tenant per Country:**
Travel operations are inherently geographic - suppliers, regulations, and logistics are country-specific. This model allows independent operation of each country while sharing the platform infrastructure.

**Why Monorepo with Shared Schema:**
Database schema and types are the contract between frontend and backend. Sharing them eliminates drift and provides compile-time guarantees that client and server speak the same data language.

## External Dependencies

**UI Component Library:**
- Radix UI (@radix-ui/*) - Comprehensive set of unstyled, accessible component primitives
- Lucide React - Icon library for consistent iconography
- class-variance-authority - Utility for managing component variants
- tailwind-merge and clsx - Tailwind class management utilities

**Authentication:**
- jsonwebtoken - JWT creation and verification
- bcryptjs - Password hashing (10 rounds)
- crypto (Node.js built-in) - Refresh token generation

**Data & Validation:**
- Drizzle ORM (drizzle-orm, drizzle-kit) - Database toolkit and migrations
- Zod (via drizzle-zod) - Schema validation integrated with database schema
- @tanstack/react-query - Async state management

**Database:**
- @neondatabase/serverless - PostgreSQL client for Neon database
- ws - WebSocket support for Neon connections

**Development:**
- Vite - Fast build tool with HMR
- TypeScript - Type safety across the stack
- @replit/* plugins - Replit-specific development tooling

**Styling:**
- Tailwind CSS - Utility-first CSS framework
- PostCSS with Autoprefixer - CSS processing

**Date Management:**
- date-fns - Lightweight date utility library for formatting and manipulation

**Forms:**
- React Hook Form (@hookform/resolvers) - Form state management (implied by resolver package)

The application does not currently use a specific database provider in production configuration but is designed to work with any PostgreSQL-compatible database through the Drizzle ORM abstraction layer.