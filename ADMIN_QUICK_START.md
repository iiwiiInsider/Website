# Admin Quick Reference Guide

## Access Admin Panel

1. **Go to Admin Login**
   - Navigate to `http://localhost:3000/admin-login` (localhost only)
   - Or click "⚙️ Admin" button in navbar when logged in as admin

2. **Login Credentials**
   ```
   Email: admin@local.test
   Password: v67Sqou2hJYpyb
   ```

3. **Verify Access**
   - You'll see the admin dashboard at `/admin/dashboard`
   - An "⚙️ Admin" link appears in the navbar

## Admin Features

### 👥 User Management (`/admin/users`)
- **View all users** with counts and statistics
- **Search users** by email or name
- **Filter by role** (all, buyers, admins)
- **Create new user** directly (bypasses registration)
  - Set name, email, password, role
  - Immediately active after creation
- **Change user role** (buyer ↔ admin-capable)
- **Delete users** (except admin account)

### 📦 Products & Listings (`/admin/products`)
- **View all listings** with thumbnails
- **Search listings** by title or description
- **Create new listing** without seller restrictions
  - Select listing type (buy/sell)
  - Add title, description, price
  - Choose neighborhood and city
  - Upload product image
  - Instantly published to marketplace
- **Delete any listing** from the marketplace

### 📊 Analytics (`/admin/page-views`)
- View page visit statistics
- Track user engagement
- Monitor marketplace activity

### ⚙️ Tools (`/admin/tools`)
- Edit existing listings
- Bulk operations
- Advanced administration

### 🤖 Agents (`/admin/agents`)
- Configure marketplace agents
- Manage agent profiles
- Adjust agent settings

## Common Admin Tasks

### Create a Test User
1. Go to `/admin/users`
2. Click "+ Create User"
3. Fill in:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "TestPassword123"
   - Role: "Buyer"
4. Click "Create User"
5. Test user can now login with those credentials

### Create a Test Product
1. Go to `/admin/products`
2. Click "Create New Listing" tab
3. Fill in:
   - Listing Type: "Sell"
   - Title: "Test Product"
   - Description: "Test description"
   - Price: "500" (ZAR)
   - Neighborhood: "Select any"
   - Add image (optional)
4. Click "Create Listing"
5. Product appears in `/market` instantly

### Manage Users
1. Go to `/admin/users`
2. Search for user by email
3. Options:
   - Delete user (red button)
   - View their join date
   - See their statistics

### Clean Up Test Data
1. Users → Search → Delete
2. Products → Search → Delete
3. Verify marketplace is clean

## Admin Restrictions & Rules

✅ **Admin CAN**:
- Create users without registration
- Create listings without seller role
- Delete any user or listing
- Access restricted pages
- Bypass authentication checks
- View all user data
- Change user roles

❌ **Admin CANNOT**:
- Delete themselves via UI
- Access from non-localhost
- Delete admin@local.test account

## Navigation

**From Navbar** (when logged in as admin):
- Click "⚙️ Admin" button → Goes to dashboard
- Dashboard provides links to all tools

**Direct URLs**:
- `/admin/dashboard` - Main control center
- `/admin/users` - User management
- `/admin/products` - Product management
- `/admin/page-views` - Analytics
- `/admin/tools` - Advanced tools
- `/admin/agents` - Agent management

## Troubleshooting

**"Admin access only" message**:
- Ensure you're logged in as admin@local.test
- Check the navbar shows "Admin" label
- Verify you're on localhost (not remote)

**Can't create user**:
- Check email isn't already in use
- Ensure all fields are filled
- Password must be at least 1 character

**Listing not showing in market**:
- Refresh the market page
- Verify price is entered correctly
- Check listing appears in admin products list

**Lost admin access**:
- Check `/admin-login` for error message
- Verify credentials (admin@local.test / v67Sqou2hJYpyb)
- Ensure localhost access
