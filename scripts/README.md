# Database Seeding Script

This script populates your JobConnect database with realistic demo data for testing, demos, and development.

## What Gets Created

### 🏢 **Demo Company**
- **TechStart Inc.** - A tech startup in San Francisco
- Owned by demo employer Sarah Chen

### 👥 **Demo Users**
- **Sarah Chen** - Employer/Hiring Manager
- **Alex Rodriguez** - CS student (immediate notifications)
- **Maya Patel** - Business student (daily digest enabled)

### 💼 **8 Diverse Jobs**
1. **Frontend Development Intern** - $18/hr, Hybrid (coding, design tags)
2. **Customer Support Representative** - $16.50/hr, Remote (customer service)
3. **Marketing Assistant** - Unpaid internship (design, customer service)
4. **Office Administrative Assistant** - $15/hr (front desk, inventory)
5. **Retail Sales Associate** - $17/hr (retail, cash register)
6. **Data Entry Specialist** - $14.50/hr, Remote (coding, inventory)
7. **Coffee Shop Barista** - $16/hr (cash register, customer service)
8. **Event Setup Assistant** - $15.50/hr (heavy lifting, inventory)

### 💬 **Interactive Content**
- **1-2 comments per job** from students
- **3 message threads** between employer and students
- **Realistic conversation flow** with interview scheduling
- **Job applications** with personalized notes

### ⚙️ **Student Preferences**
- Different notification settings (immediate vs daily digest)
- Varied interests matching job tags
- Location and hourly rate preferences

## Setup

### 1. Environment Variables
Add to your `.env` file:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> ⚠️ **Important**: You need the SERVICE ROLE KEY (not the anon key) for admin operations.

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Run the Seed Script
```bash
npm run seed
```

## What You'll See

After running the script, your app will have:

### 📱 **Student View**
- **8 job listings** with varied pay, locations, and requirements
- **Comments from other students** showing engagement
- **Application opportunities** for different interests
- **Message threads** with employers

### 🏢 **Employer View**
- **Complete company profile** with job listings
- **Applications from qualified students** 
- **Active message conversations** with candidates
- **Job management interface** ready for testing

### 💌 **Message System**
- **Pre-existing conversations** showing real-world usage
- **Interview scheduling** examples
- **Professional communication** patterns

## Demo Scenarios

Perfect for testing:

### 🎯 **Student Experience**
1. Browse jobs with realistic variety
2. See engagement (comments, applications)
3. Experience message flows with employers
4. Test notification preferences

### 🎯 **Employer Experience** 
1. Manage active job listings
2. Review student applications with context
3. Conduct interview conversations
4. Test job posting with notifications

### 🎯 **System Features**
1. **Search & Filtering** - Jobs span multiple categories
2. **Real-time Messaging** - Active conversation threads  
3. **Application Tracking** - Various application states
4. **Notification Testing** - Different user preferences

## Cleanup

The script automatically cleans up existing demo data before seeding, so you can run it multiple times safely.

To manually clean up:
```sql
-- Run in Supabase SQL Editor
DELETE FROM messages WHERE sender_user_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003');
-- (Continue with other tables in dependency order)
```

## Customization

Edit `scripts/seed.ts` to:
- Add more jobs or companies
- Change student interests/preferences  
- Modify conversation content
- Add different job categories
- Adjust pay rates and locations

## Troubleshooting

### Permission Errors
- Ensure you're using the SERVICE ROLE KEY
- Check Row Level Security policies in Supabase

### Script Failures
- Verify environment variables are set
- Check network connection to Supabase
- Review Supabase logs for detailed errors

### Missing Data
- Confirm the script completed successfully
- Check Supabase dashboard for created records
- Verify no RLS policies are blocking data access

---

**Ready for demos, user testing, and development! 🚀**