# Royal VIP Tours - B2B Travel Platform

## Overview
Royal VIP Tours is a multi-tenant B2B travel platform designed to streamline ground operations and travel quotations within the B2B travel sector. It connects local suppliers (transport, hotels, guides, sights) with global travel agencies to facilitate complex itinerary creation and accurate quote generation via an RFQ workflow. The platform acts as a productivity tool for information management, fostering efficient collaboration between country managers and travel agencies. The project aims to provide a robust, scalable solution for the B2B travel market, enhancing efficiency and connectivity between diverse stakeholders.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Technology Stack
**Frontend:** React with TypeScript, Vite, Wouter, TanStack Query, shadcn/ui (Radix UI), Tailwind CSS.
**Backend:** Node.js with Express.js, TypeScript, Drizzle ORM, JWT authentication.
**Database:** PostgreSQL (via Neon serverless).

### Architecture Patterns
**Monorepo Structure:** Separates `/client`, `/server`, and `/shared` for clear boundaries and code sharing.
**Multi-Tenancy Model:** Tenant-per-country architecture for geographical data isolation and operations, allowing users to have multiple roles across different tenants.
**Role-Based Access Control:** Two-tier system with global roles (`admin`, `user`) and tenant-specific roles (`country_manager`, `transport`, `hotel`, `guide`, `sight`) for fine-grained permissions.
**Authentication Strategy:** JWT-based authentication using short-lived access tokens and long-lived refresh tokens.
**Data Model Design:** Centered around Catalog Management, Supplier Management, an Itinerary System, and an RFQ Workflow.
**API Design:** RESTful API with standard CRUD patterns, organized by resource type, utilizing middleware for authentication and tenant context.
**State Management:** Client-side state managed by React Query for server state, custom AuthContext for authentication, and React component state for local UI.
**UI Component Strategy:** Built on shadcn/ui (Radix UI primitives) with custom Tailwind CSS for a professional B2B SaaS design system, emphasizing information density and consistent aesthetics.

### Design Decisions
**Drizzle ORM:** Selected for type-safe PostgreSQL interactions and lightweight migration management.
**Neon Serverless:** Chosen for PostgreSQL compatibility, serverless scalability, and WebSocket support.
**JWT over Sessions:** Provides stateless authentication for horizontal scaling and SPA compatibility, with refresh token revocation.
**Multi-Tenant per Country:** Aligns with the geographic nature of travel operations, enabling independent country-specific management.
**Monorepo with Shared Schema:** Ensures data consistency and compile-time guarantees between frontend and backend by sharing database schemas and types.
**Exclusive Membership Enforcement:** Each user can have EITHER a tenant role OR be a team member of exactly ONE agency, enforced by database constraints and backend validation.
**Auto-Create Supplier Companies:** Supplier companies are automatically created upon admin approval of supplier role requests, ensuring RFQ routing and visibility.
**Multi-Tenant Role Request Architecture:** Fully migrated to a multi-tenant role system where `userTenants` records store tenant-specific roles, allowing users to apply for roles in multiple countries.
**Enhanced Role Request System:** Includes data collection forms for role-specific information and displays request history on the user dashboard.

## External Dependencies
**UI Component Library:** Radix UI (`@radix-ui/*`), Lucide React, class-variance-authority, tailwind-merge, clsx.
**Authentication:** jsonwebtoken, bcryptjs, crypto (Node.js built-in).
**Data & Validation:** Drizzle ORM (drizzle-orm, drizzle-kit), Zod (via drizzle-zod), `@tanstack/react-query`.
**Database:** `@neondatabase/serverless`, ws.
**Development:** Vite, TypeScript, `@replit/*` plugins.
**Styling:** Tailwind CSS, PostCSS with Autoprefixer.
**Date Management:** date-fns.
**Forms:** React Hook Form (`@hookform/resolvers`).