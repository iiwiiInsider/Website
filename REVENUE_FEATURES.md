# Marketplace Revenue & Customer Experience Enhancements

This document describes the new connective tissue features added to improve revenue streams and customer experiences.

## Overview

The marketplace has been enhanced with integrated systems for:
- **Revenue Tracking & Commissions** - Track transactions and calculate agent earnings
- **Customer Engagement** - Monitor user interactions and behaviors across the platform
- **Ratings & Feedback** - Enable customers to rate agents and leave reviews
- **Analytics Dashboard** - View performance metrics and revenue insights
- **Transaction History** - Complete visibility into all marketplace transactions

## New Features

### 1. Revenue & Commission System

**Files:** `lib/revenue.js`, `pages/api/revenue/transactions.js`

#### Commission Structure
- **Agent Commission**: 2.5% when claiming listings
- **Transaction Fee**: 2.0% platform fee
- **Platform Revenue**: 1.5% cut
- **Referral Bonus**: 1.0% for referrals

#### Features
- Automatic revenue breakdown calculation
- Transaction status tracking (pending, completed, disputed, refunded)
- Complete audit trail of all transactions
- Revenue analytics by agent and property

#### How It Works
When a property transaction is recorded:
1. The system calculates revenue breakdown automatically
2. Agent earnings are calculated (2.5% commission + 1.0% referral)
3. Platform fees are tracked (1.5%)
4. Transaction is logged with full details
5. Data is available for admin analytics

### 2. Customer Engagement Tracking

**Files:** `lib/engagement.js`, `pages/api/engagement/events.js`

#### Tracked Events
- `property_viewed` - User views a property
- `property_saved` - User saves a property
- `inquiry_sent` - User sends inquiry to agent
- `listing_claimed` - Agent claims a listing
- `profile_completed` - User completes profile
- `review_left` - User leaves a review
- `referral_sent` - User refers someone
- `message_sent` - User sends message
- `agent_contacted` - User contacts agent
- `session_started` - User starts a session

#### Customer Segments
- **Inactive**: Score < 10
- **Casual**: Score 10-29
- **Active**: Score 30-49
- **Power User**: Score 50+ with 5+ transactions
- **VIP**: Score 100+ with 10+ transactions

#### Integration Points
- Property cards automatically track when viewed
- Claims trigger engagement events
- Customer lifetime value calculated from engagement + transactions

### 3. Ratings & Feedback System

**Files:** `pages/api/ratings/create.js`, `pages/api/ratings/agent.js`, `pages/ratings.js`

#### Features
- 1-5 star ratings for agents
- Written reviews and comments
- Automatic average rating calculation
- Public rating display on agent profiles
- Historical review tracking

#### User Journey
1. User visits property detail page
2. Sees agent's current rating and reviews
3. Clicks "Rate this agent" link
4. Goes to ratings page
5. Leaves a 1-5 star rating with optional comment
6. Rating is immediately reflected in agent profile

### 4. Advanced Analytics Dashboard

**Files:** `pages/dashboard.js`, `pages/api/analytics/dashboard.js`

#### For Agents/Users
- Total revenue earned
- Total transactions completed
- Average transaction value
- Agent rating and review count
- Engagement metrics (properties viewed, listings claimed, inquiries sent, messages)
- Last activity timestamp

#### For Administrators
- Total platform transactions
- Platform earnings (1.5% fees)
- Active agent count
- Gross marketplace volume
- Detailed transaction breakdown

#### Access
- Visit `/dashboard` for your personal metrics
- Admin sees platform-wide statistics

### 5. Transaction History & Records

**Files:** `pages/transactions.js`, `pages/api/revenue/transactions.js`

#### Features
- Complete transaction history
- Detailed revenue breakdown per transaction
- Status tracking and updates
- Agent commission tracking
- Platform revenue metrics

#### For Agents
- View all transactions they've participated in
- Track earnings and commissions
- See transaction dates and amounts

#### For Administrators
- View all platform transactions
- See agent and buyer information
- Track platform revenue
- Monitor transaction statuses
- Download/export transaction data (future enhancement)

## Integration with Existing Features

### PropertyCard Component
- Automatically logs `property_viewed` event when component mounts
- Logs `listing_claimed` event when user claims a listing
- Tracks engagement for customer journey analysis

### Property Detail Page
- Shows agent's current rating and reviews
- Allows transaction logging when property is completed
- Tracks inquiry events when user contacts agent

### Navbar Navigation
- Added links to Dashboard, Ratings, and Transactions
- Visible only to authenticated users
- Easy access to new features from any page

## Data Structures

### Transaction Object
```json
{
  "id": "txn_...",
  "propertyId": "...",
  "listingPrice": 1000000,
  "breakdown": {
    "grossPrice": 1000000,
    "agentEarnings": 25000,
    "transactionFee": 20000,
    "platformFee": 15000,
    "referralBonus": 10000,
    "totalCommissions": 55000,
    "netToAgent": 35000
  },
  "agentEmail": "agent@example.com",
  "buyerEmail": "buyer@example.com",
  "status": "completed",
  "createdAt": "2026-01-06T...",
  "completedAt": "2026-01-06T..."
}
```

### Engagement Event Object
```json
{
  "id": "evt_...",
  "type": "property_viewed",
  "propertyId": "...",
  "metadata": {
    "title": "Beautiful House",
    "neighborhood": "Clifton"
  },
  "timestamp": "2026-01-06T..."
}
```

### Rating Object
```json
{
  "id": "rev_...",
  "ratedBy": "user@example.com",
  "rating": 5,
  "comment": "Great agent, very professional",
  "propertyId": "...",
  "transactionId": "...",
  "createdAt": "2026-01-06T..."
}
```

## API Endpoints

### Revenue
- `GET /api/revenue/transactions` - List transactions
- `POST /api/revenue/transactions` - Create transaction
- `PUT /api/revenue/transactions` - Update transaction status

### Engagement
- `GET /api/engagement/events` - Get engagement history
- `POST /api/engagement/events` - Log engagement event

### Ratings
- `GET /api/ratings/agent?email=...` - Get agent ratings
- `POST /api/ratings/create` - Create rating

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard metrics

## Best Practices

### For Agents
1. Complete your profile early to unlock commissions
2. Monitor your dashboard to track earnings
3. Encourage customers to leave ratings
4. Track engagement metrics to improve outreach

### For Platform Administrators
1. Review transaction history regularly
2. Monitor revenue metrics and platform growth
3. Track agent performance through dashboard
4. Use engagement data to identify top agents
5. Review ratings to ensure quality standards

### For Customers/Buyers
1. Rate agents after transactions
2. Leave detailed reviews to help others
3. Monitor your engagement metrics
4. Use transaction history for records

## Future Enhancements

1. **Payout Management** - Automated commission payouts to agents
2. **Advanced Filtering** - Filter transactions by date, agent, status
3. **Export Reports** - PDF/CSV export of transaction and engagement data
4. **Performance Tiers** - Bronze/Silver/Gold agent tiers based on ratings
5. **Bonus Structures** - Dynamic commissions based on performance
6. **Customer Loyalty** - Rewards for repeat customers
7. **Referral Program** - Formal referral tracking and rewards
8. **Real-time Notifications** - Alert agents of new inquiries and ratings
9. **Revenue Forecasting** - Predict future revenue based on trends
10. **Dispute Resolution** - Handle transaction disputes and refunds

## Testing

### Test as Agent
1. Sign in with `agent@example.com`
2. Claim properties in the market
3. View your dashboard metrics
4. Check transaction history
5. Accept ratings from customers

### Test as Buyer
1. Sign in with regular account
2. Browse and view properties (engagement tracking)
3. Complete transactions
4. Leave ratings for agents
5. View your engagement metrics

### Test as Admin
1. Sign in with `admin@local.test`
2. View platform-wide dashboard
3. See all transactions and revenue
4. Monitor agent count and performance
5. Export transaction data

## Support & Questions

For questions about these features, contact the development team or review the inline code documentation in the API files.
