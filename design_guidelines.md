# Royal VIP Tours Design Guidelines

## Design Approach

**Selected Approach**: Design System - Modern B2B SaaS  
**References**: Linear (clean data tables), Notion (intuitive forms), Stripe (professional dashboards)  
**Rationale**: This is a productivity-focused, information-dense B2B platform requiring efficient data management, clear hierarchy, and professional credibility. Users need to process supplier catalogs, build itineraries, and generate quotes quickly.

**Core Principles**:
- Professional credibility for B2B travel industry
- Efficient information density without clutter
- Clear role-based dashboard differentiation
- Scannable data tables and forms
- Trust-building through polish and consistency

---

## Color Palette

**Light Mode**:
- Primary Brand: 220 70% 50% (professional blue for travel/trust)
- Primary Hover: 220 70% 45%
- Background: 0 0% 100% (white)
- Surface: 220 13% 97% (subtle warm gray)
- Border: 220 13% 91%
- Text Primary: 222 47% 11% (near black)
- Text Secondary: 215 16% 47%
- Success: 142 71% 45% (quote approved, data saved)
- Warning: 38 92% 50% (pending RFQs, expiring quotes)
- Error: 0 72% 51% (validation, declined quotes)

**Dark Mode**:
- Primary Brand: 220 70% 55%
- Background: 222 47% 11%
- Surface: 217 33% 17%
- Border: 217 33% 24%
- Text Primary: 210 40% 98%
- Text Secondary: 215 20% 65%

---

## Typography

**Font Stack**:
- Primary: "Inter", system-ui, sans-serif (professional, excellent legibility)
- Monospace: "JetBrains Mono", monospace (for IDs, codes, currency)

**Scale**:
- Headings: text-2xl (dashboards), text-xl (sections), text-lg (cards)
- Body: text-base (default), text-sm (tables, meta info)
- Small: text-xs (labels, timestamps, captions)
- Weight: font-normal (body), font-medium (labels, buttons), font-semibold (headings)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistency
- Component padding: p-4, p-6
- Section gaps: gap-4, gap-6, gap-8
- Page margins: mx-4, mx-6, mx-8
- Vertical rhythm: space-y-4, space-y-6, space-y-8

**Container Strategy**:
- Dashboard layouts: Full-width with max-w-7xl centered
- Forms: max-w-2xl centered
- Data tables: Full-width with horizontal scroll on mobile
- Modals: max-w-lg (small), max-w-2xl (standard), max-w-4xl (itinerary builder)

---

## Component Library

### Navigation
- **Top Navigation**: Fixed header with logo, tenant switcher (for admins), user menu
- **Sidebar**: Role-based navigation (collapsible on mobile), grouped by function
- **Breadcrumbs**: For deep hierarchies (Admin > Tenants > Jordan > Hotels)

### Data Display
- **Tables**: Striped rows, sortable columns, sticky headers, row actions (edit/delete), pagination
- **Cards**: Elevated surfaces for supplier profiles, itinerary summary, RFQ segments
- **Stats Widgets**: Dashboard KPIs (total suppliers, pending RFQs, quotes this month)
- **Timeline**: For itinerary day-by-day view, RFQ history

### Forms
- **Input Fields**: Outlined style, floating labels, inline validation, help text
- **Select/Dropdowns**: Searchable for cities, suppliers, event types
- **Date Pickers**: Range selection for itineraries, single for RFQ deadlines
- **File Upload**: Drag-and-drop zones for images (hotels, guides) and documents (agency verification)
- **Multi-Step Forms**: For agency registration, itinerary creation

### Actions
- **Primary Buttons**: Solid fill with primary color (Save, Submit Quote, Request Quote)
- **Secondary Buttons**: Outlined variant (Cancel, Back)
- **Danger Buttons**: Red for destructive actions (Delete, Decline RFQ)
- **Icon Buttons**: For table row actions, minimal footprint

### Overlays
- **Modals**: For quick edits, confirmations, RFQ segment review
- **Slide-Overs**: For detailed supplier info, quote preview without losing context
- **Toasts**: Success/error feedback positioned top-right
- **Tooltips**: For complex fields, icons, feature explanations

### Data Entry Patterns
- **Inline Editing**: For rate cards, pricing tables
- **Bulk Actions**: Select multiple rows for batch updates
- **Auto-Complete**: For city/airport search, supplier selection
- **Conditional Fields**: Show/hide based on event type selection

---

## Role-Based Dashboard Layouts

**Admin Dashboard**: Grid of tenant cards (3 columns), global stats, recent activity feed, audit log table

**Country Manager Dashboard**: Supplier approval queue (table), catalog completeness widgets, pending RFQs list, quick actions (Add City, Invite Supplier)

**Supplier Portals**: 
- Left sidebar: My Profile, My Products/Rooms/Rates, Incoming RFQs
- Main area: Data tables with inline editing, image galleries

**Travel Agency Portal**:
- Sidebar: My Itineraries, Quotes Archive, Account Settings
- Main area: Itinerary builder (day-by-day timeline), quote viewer (line-item table)

---

## Key Screens

**Itinerary Builder**: 
- Timeline view on left (vertical days), event cards on right
- Drag-and-drop event reordering
- Event detail modal with supplier selection dropdowns
- Floating action button: "Request Quote"

**Quote Viewer**:
- Header: Itinerary title, dates, PAX, validity date
- Line-item table: Event, Supplier, Unit Price, Quantity, Subtotal
- Summary card: Subtotal, Taxes, Total (large, prominent)
- Actions: Download PDF, Share Link, Amend Itinerary

**RFQ Management**:
- List view: Table with columns (Itinerary, Agency, Date, Status, Deadline)
- Segment cards: One per supplier type, with "Propose Pricing" button
- Proposal form: Line items with quantity/price inputs, notes textarea

---

## Images

**Where to Use**:
- Supplier profiles: Hotel property photos (gallery), guide headshots, vehicle fleet images
- Landing/Marketing: Hero image of luxury travel experience
- Empty states: Illustration for "No itineraries yet", "No pending RFQs"

**Hero Image** (if marketing/landing page):
- Large, high-quality image of premium travel experience (luxury tour bus, Jordan landmarks)
- Overlay gradient for text readability
- CTA buttons with blurred background (backdrop-blur-sm)

**In-App Images**:
- Hotel cards: 16:9 thumbnail
- Guide profiles: Square avatar (circular crop)
- Sight listings: Horizontal image strip

---

## Animations

Use sparingly, only for:
- Loading states: Skeleton screens for tables/cards
- Success feedback: Checkmark animation on save
- Modal transitions: Smooth fade-in
- Avoid: Scroll-triggered animations, excessive hover effects

---

## Accessibility & Consistency

- Maintain WCAG AA contrast ratios
- Consistent dark mode across all form inputs, tables, modals
- Keyboard navigation for all interactive elements
- Focus states clearly visible (ring-2 ring-primary)