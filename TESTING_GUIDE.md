# Testing Guide - New Revenue & Engagement Features

## Quick Start Testing

### 1. Access the Dashboard
**URL:** `http://localhost:3000/dashboard`

**What to expect:**
- Personal metrics card showing revenue (starts at 0)
- Transaction count
- Average transaction value
- Agent rating (if you have any)
- Engagement metrics
- For admin: Platform-wide statistics

**Test Steps:**
1. Sign in with your user account
2. Navigate to Dashboard
3. See your empty metrics (nothing logged yet)
4. If admin, see platform stats

---

### 2. Test Engagement Tracking

**What happens automatically:**
- Every time you view a property card, it logs `property_viewed` event
- When you claim a property, it logs `listing_claimed` event
- Each event is timestamped and stored in `data/engagement.json`

**Test Steps:**
1. Sign in
2. Go to `/market`
3. Browse properties (each card view triggers engagement event)
4. Return to `/dashboard` → Engagement counts should increase
5. Go back to `/market` and claim a property
6. Return to `/dashboard` → See updated engagement metrics

---

### 3. Test Rating System

**URL:** `http://localhost:3000/ratings`

**What to expect:**
- Form to rate an agent by email
- 1-5 star slider
- Optional comment box
- Your average rating profile
- Previous reviews you've left

**Test Steps:**
1. Go to `/ratings`
2. Enter an agent's email (e.g., `admin@local.test`)
3. Set a rating (1-5 stars)
4. Add a comment (optional)
5. Click "Submit Rating"
6. See rating appear in "Your Rating Profile"
7. Check `/property/[any-id]` to see rating displayed on property detail

---

### 4. Test Transaction Logging

**Requirements:** Property must be claimed by an agent

**How to test:**
1. Go to `/market`
2. Find a property with a **claimed** badge
3. Click **View** to see property details
4. You should see:
   - Agent's rating and reviews
   - "Complete Transaction" button (if logged in)
5. Click "Complete Transaction"
6. Click "Confirm & Record Transaction"
7. Transaction is logged with revenue breakdown

**Result:**
- Transaction appears in `/transactions`
- Revenue is added to agent's dashboard
- Platform earnings are recorded
- Breakdown is calculated automatically

---

### 5. Test Transaction History

**URL:** `http://localhost:3000/transactions`

**What to expect:**
- Table of all transactions you've participated in
- Columns: Date, Property, Agent, Amount, Agent Earnings, Status
- For admin: Additional "Buyer" column
- Summary stats at bottom (for admin only)

**Test Steps:**
1. Complete a transaction (see step 4)
2. Go to `/transactions`
3. See your transaction in the list
4. If admin: See summary stats (total volume, platform revenue, agent commissions)

---

## Test Scenarios

### Scenario 1: New Agent
1. Sign in as agent
2. Check `/dashboard` - all metrics at 0
3. Go to `/market`
4. View properties (engagement tracked)
5. Claim a property
6. Go to `/dashboard` - engagement count increases
7. Property shows you as claiming agent

### Scenario 2: Complete Sale
1. Sign in as agent
2. Claim property on `/market`
3. Go to property detail page
4. Click "Complete Transaction"
5. Confirm transaction
6. Check `/dashboard` - revenue increases
7. Check `/transactions` - transaction appears
8. Agent earns 2.5% commission

### Scenario 3: Agent Rating
1. Sign in as buyer
2. Go to `/ratings`
3. Rate an agent (e.g., agent@example.com)
4. Go to property detail with that agent
5. See rating displayed in "Agent Rating" card
6. Agent rating updates in their `/dashboard`

### Scenario 4: Admin Overview
1. Sign in as `admin@local.test`
2. Go to `/dashboard` - see platform stats
3. Go to `/transactions` - see all transactions in system
4. See summary: total volume, platform earnings, agent commissions
5. Each transaction shows breakdown

---

## Data Files to Inspect

### engagement.json
Shows all user activity events. Format:
```json
{
  "user@email.com": {
    "email": "user@email.com",
    "events": [
      {
        "id": "evt_...",
        "type": "property_viewed",
        "propertyId": "...",
        "timestamp": "2026-01-06T..."
      }
    ],
    "createdAt": "...",
    "lastActivity": "..."
  }
}
```

### ratings.json
Shows all ratings by agent. Format:
```json
{
  "agent@email.com": {
    "email": "agent@email.com",
    "reviews": [
      {
        "id": "rev_...",
        "ratedBy": "user@email.com",
        "rating": 5,
        "comment": "Great!",
        "createdAt": "..."
      }
    ],
    "averageRating": 4.5,
    "totalReviews": 2
  }
}
```

### transactions.json
Shows all completed transactions. Format:
```json
[
  {
    "id": "txn_...",
    "propertyId": "...",
    "listingPrice": 1000000,
    "breakdown": {
      "agentEarnings": 25000,
      "platformFee": 15000,
      ...
    },
    "agentEmail": "agent@email.com",
    "buyerEmail": "buyer@email.com",
    "status": "completed",
    "createdAt": "..."
  }
]
```

---

## Common Test Cases

### ✅ Test Case 1: Engagement Tracking Works
- [ ] View 5 properties
- [ ] Check dashboard - engagement count = 5
- [ ] Claim 1 property
- [ ] Check dashboard - claimed count = 1

### ✅ Test Case 2: Rating System Works
- [ ] Leave rating for agent
- [ ] Check agent profile - rating appears
- [ ] Leave another rating for same agent
- [ ] Check profile - average rating updates
- [ ] Check ratings.json - data persisted

### ✅ Test Case 3: Transaction Revenue Works
- [ ] Claim property
- [ ] Complete transaction (R1,000,000)
- [ ] Agent sees +R25,000 in dashboard
- [ ] Admin sees +R15,000 platform fee
- [ ] Transaction appears in `/transactions`

### ✅ Test Case 4: Admin Dashboard Works
- [ ] Log in as admin@local.test
- [ ] Dashboard shows platform stats
- [ ] Complete 3 transactions
- [ ] Stats update correctly
- [ ] Platform earnings visible

### ✅ Test Case 5: Navigation Works
- [ ] All new links appear in navbar
- [ ] All pages load without errors
- [ ] Links work from any page
- [ ] Can navigate between Dashboard/Ratings/Transactions

---

## Troubleshooting

### Engagement Not Tracking
- Make sure you're signed in
- Check browser console for errors
- Verify `data/engagement.json` exists
- Check `/api/engagement/events` endpoint

### Ratings Not Saving
- Ensure email format is valid (contains @)
- Check `data/ratings.json` exists
- Try with `admin@local.test` email
- Check browser console for response errors

### Transactions Not Logging
- Property must be claimed by an agent
- Must be signed in
- Check property detail page loads fully
- Check `data/transactions.json` exists

### Dashboard Metrics Not Updating
- Refresh page after taking action
- Check all data files exist (engagement.json, ratings.json, transactions.json)
- Check API endpoints return data
- Try signing out and back in

---

## Success Indicators

✅ **All working when:**
- Dashboard loads without errors
- Engagement metrics increase when browsing
- Ratings save and display correctly
- Transactions calculate revenue automatically
- Admin sees platform-wide statistics
- Transaction history shows all activities
- Navigation works smoothly

🎉 **Congratulations!** Your revenue system is fully operational!
