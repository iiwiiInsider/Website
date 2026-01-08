# System Architecture - Revenue & Engagement System

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
├─────────────────────────────────────────────────────────────┤
│
│  [Market Page] ──→ PropertyCard ──→ [Property Detail] ──→ [Ratings]
│        ↓                ↓                    ↓                ↓
│   property_viewed   listing_claimed    complete_txn      rate_agent
│
│  [Dashboard] ←─ Aggregates Data ←─ [Transactions]
│
└─────────────────────────────────────────────────────────────┘
         ↓           ↓           ↓           ↓
    ┌────────────────────────────────────────────┐
    │        API LAYER - Request Handlers         │
    ├────────────────────────────────────────────┤
    │  /api/engagement/events                    │
    │  /api/revenue/transactions                 │
    │  /api/ratings/create                       │
    │  /api/ratings/agent                        │
    │  /api/analytics/dashboard                  │
    └────────────────────────────────────────────┘
         ↓           ↓           ↓           ↓
    ┌────────────────────────────────────────────┐
    │       BUSINESS LOGIC LAYER - Libraries     │
    ├────────────────────────────────────────────┤
    │  lib/revenue.js                            │
    │    ├─ calculateCommission()                │
    │    ├─ calculateRevenueBreakdown()          │
    │    └─ COMMISSION_RATES, REVENUE_STREAMS   │
    │                                             │
    │  lib/engagement.js                         │
    │    ├─ calculateEngagementScore()           │
    │    ├─ determineSegment()                   │
    │    ├─ calculateLifetimeValue()             │
    │    └─ ENGAGEMENT_EVENTS, CUSTOMER_SEGMENTS│
    │                                             │
    │  lib/audit.js (existing)                   │
    │    └─ appendAudit() - All actions logged   │
    └────────────────────────────────────────────┘
         ↓           ↓           ↓           ↓
    ┌────────────────────────────────────────────┐
    │          DATA PERSISTENCE LAYER            │
    ├────────────────────────────────────────────┤
    │  data/engagement.json                      │
    │  data/ratings.json                         │
    │  data/transactions.json                    │
    │  data/auditLog.json (existing)             │
    │  data/agents.json (existing)               │
    │  data/marketListings.json (existing)       │
    └────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Property Viewing (Engagement Tracking)

```
User opens PropertyCard
    ↓
useEffect triggers in PropertyCard
    ↓
POST /api/engagement/events
  {
    eventType: "property_viewed",
    propertyId: "...",
    metadata: {...}
  }
    ↓
API Handler validates and stores
    ↓
Event added to data/engagement.json
    ↓
Audit log entry created
    ↓
Client silently succeeds (no UI change)
```

### 2. Property Claim with Transaction

```
User clicks "Claim Listing"
    ↓
PropertyCard.handleClaim()
    ↓
POST /api/claims/claim
    ↓
Claim recorded in propertyClaims.json
    ↓
POST /api/engagement/events
  { eventType: "listing_claimed" }
    ↓
Engagement event stored
    ↓
User views property details
    ↓
Shows claimed agent info + rating
    ↓
User clicks "Complete Transaction"
    ↓
POST /api/revenue/transactions
  {
    propertyId, listingPrice,
    agentEmail, buyerEmail
  }
    ↓
calculateRevenueBreakdown()
  Returns: agentEarnings, platformFee, etc.
    ↓
Transaction stored in transactions.json
    ↓
Audit log entry created
    ↓
Success confirmation shown to user
```

### 3. Agent Rating

```
User goes to /ratings page
    ↓
Form displays with agent email input
    ↓
User submits rating (1-5 stars + comment)
    ↓
POST /api/ratings/create
  {
    agentEmail,
    rating,
    comment
  }
    ↓
API validates rating (1-5 range)
    ↓
Review object created with metadata
    ↓
Rating stored in ratings.json
    ↓
Calculate new averageRating
    ↓
Update totalReviews count
    ↓
Persist updated data
    ↓
Audit log entry created
    ↓
Success message shown
    ↓
Next time agent profile viewed:
  GET /api/ratings/agent?email=...
    ↓
Return aggregated ratings data
    ↓
Display on property detail page
```

### 4. Dashboard Analytics

```
User visits /dashboard
    ↓
GET /api/analytics/dashboard
    ↓
API Handler:
  1. Read transactions.json
  2. Read engagement.json
  3. Read ratings.json
  4. Filter by user or get all (if admin)
    ↓
Calculate Metrics:
  For User:
    - Sum agentEarnings from transactions
    - Count total transactions
    - Calculate average value
    - Get rating + review count
    - Sum engagement event counts
    - Get lastActivity timestamp
    
  For Admin:
    - Sum all transactions
    - Sum all platform fees
    - Count unique agents
    - Calculate total marketplace volume
    ↓
Return aggregated data to frontend
    ↓
Dashboard renders metrics cards
    ↓
Display real-time KPIs
```

## Component Dependency Graph

```
Dashboard
  ├─ GET /api/analytics/dashboard
  │   ├─ reads transactions.json
  │   ├─ reads engagement.json
  │   ├─ reads ratings.json
  │   └─ lib/revenue.js (for breakdown calc)
  └─ Displays metrics

PropertyCard
  ├─ useEffect → POST /api/engagement/events
  ├─ handleClaim() → POST /api/claims/claim
  │   ├─ POST /api/engagement/events ("listing_claimed")
  │   └─ Callback: onClaimed()
  └─ Renders: price, description, claim button

Property Detail Page
  ├─ GET /api/claims/status
  ├─ GET /api/ratings/agent?email=...
  ├─ Complete Transaction Button
  │   └─ POST /api/revenue/transactions
  │       ├─ lib/revenue.js (calculateRevenueBreakdown)
  │       └─ writes transactions.json
  └─ Shows: agent info, rating, transaction form

Ratings Page
  ├─ Form Input: agentEmail, rating, comment
  ├─ POST /api/ratings/create
  │   ├─ Validate & write ratings.json
  │   ├─ Recalculate averageRating
  │   └─ Create audit entry
  ├─ GET /api/ratings/agent?email=...
  └─ Display: rating profile, recent reviews

Transactions Page
  ├─ GET /api/revenue/transactions
  │   └─ reads transactions.json
  ├─ Table: date, property, agent, amount, earnings
  └─ Admin Summary: volume, revenue, commissions

Navbar
  ├─ Dashboard link (if authenticated)
  ├─ Ratings link (if authenticated)
  ├─ Transactions link (if authenticated)
  └─ Agent/Admin tools (existing)
```

## Authentication & Authorization

```
All new endpoints require authentication (NextAuth)

Public Endpoints:
  - GET /api/ratings/agent?email=... (public view)
  - GET /api/analytics/dashboard (public-ish, filters by user)

User-Level (authenticated users):
  - POST /api/engagement/events (any event)
  - POST /api/revenue/transactions (can see own)
  - POST /api/ratings/create (can rate any agent)
  - GET /api/ratings/agent (public, can view any)
  - GET /api/analytics/dashboard (sees own metrics)

Admin-Only (admin@local.test):
  - GET /api/analytics/dashboard (sees all platform data)
  - PUT /api/revenue/transactions (update transaction status)
  - See all transactions and revenue in /transactions

Audit Trail:
  - Every action logged with actorEmail
  - Data/timestamp/action recorded in auditLog.json
  - Full accountability maintained
```

## Error Handling Flow

```
API Request
  ↓
Check Authentication
  ├─ Not authenticated → 401 Unauthorized
  └─ Authenticated ↓
Check Authorization
  ├─ Not authorized → 403 Forbidden
  └─ Authorized ↓
Validate Input
  ├─ Invalid input → 400 Bad Request
  └─ Valid ↓
Process Request
  ├─ File I/O error → 500 Server Error
  ├─ Logic error → 400 Bad Request
  └─ Success ↓
Write to Files
  ├─ Write error → 500 Server Error
  └─ Success ↓
Log Audit Entry
  ├─ Audit write error → 500 Server Error
  └─ Success ↓
Return Success Response
  ├─ 200 OK (GET)
  ├─ 201 Created (POST)
  ├─ 200 OK (PUT)
```

## Scaling Considerations

### Current Implementation
- File-based storage (JSON files)
- Suitable for: MVP, small teams, demonstration
- Performance: O(1) for small datasets

### Future Scaling
For production with growth:

1. **Database Migration**
   ```
   JSON files → MongoDB/PostgreSQL
   - Faster queries
   - Index support
   - Transaction support
   ```

2. **Caching Layer**
   ```
   Redis cache for:
   - Dashboard metrics
   - Agent ratings
   - Recent transactions
   ```

3. **Queue System**
   ```
   Heavy operations:
   - Revenue calculations
   - Report generation
   - Notification dispatch
   ```

4. **Separate Services**
   ```
   Microservices:
   - Revenue Service
   - Engagement Service
   - Notification Service
   - Analytics Service
   ```

## Security Measures

```
Input Validation
  ├─ Email format validation
  ├─ Rating range (1-5) validation
  ├─ Price validation (positive numbers)
  ├─ String length limits
  └─ Enum validation

Data Protection
  ├─ Authentication required (NextAuth)
  ├─ Authorization checks (admin/user)
  ├─ Audit logging of all changes
  └─ User data isolation (can't see others' transactions)

File Safety
  ├─ Atomic writes with fs.writeFile
  ├─ Directory creation (recursive)
  ├─ Error handling on I/O
  └─ JSON validation before parsing
```

## Integration Points

```
Existing Systems Connected:
  ├─ NextAuth (authentication)
  ├─ Audit System (audit.js)
  ├─ Email System (for notifications - future)
  ├─ Property Claims (propertyClaims.json)
  ├─ Agent Profiles (agents.json)
  ├─ Market Listings (marketListings.json)
  └─ Users (users.json)

New Data Linkages:
  ├─ engagement → user email
  ├─ transactions → propertyId + agentEmail
  ├─ ratings → agentEmail
  └─ auditLog → all actions with actor
```

## Performance Metrics

```
Typical Response Times (file-based):
  POST engagement event: ~50ms
  POST rating: ~50ms
  POST transaction: ~100ms
  GET dashboard: ~200ms (read 3 files)
  GET ratings: ~20ms

Expected Capacity:
  Current: 1,000s of records
  With optimization: 10,000s of records
  With database: Unlimited
```

---

This architecture is designed to be:
✅ **Scalable** - Grows from MVP to production
✅ **Maintainable** - Clear separation of concerns
✅ **Testable** - Modular components
✅ **Secure** - Authentication & authorization enforced
✅ **Auditable** - Complete action logging
