You are assisting in building a B2B Export Marketplace (MERN stack). 
This is Week 4 task: Implement Buyer-Seller Communication & Inquiry Management.

Step-by-step deliverables for this week:

1. Buyer Inquiry Form
   - Add “Send Inquiry” button on product/supplier pages.
   - Create frontend form (Name, Email, Product Interest, Message).
   - Store inquiry in MongoDB with buyerId, sellerId, timestamp.

2. Seller Inquiry Dashboard
   - Show inquiries list with filters (date, product, buyer).
   - Mark as read/unread.
   - Display partial buyer info for Free sellers, full details for Premium sellers.

3. Messaging (MVP)
   - Basic one-way Buyer → Seller messaging stored in DB.
   - UI: Simple chat placeholder.

4. Notifications
   - Create notification API linked with inquiries.
   - Notification bell + badge count on seller dashboard.

5. Membership Integration
   - Restrict inquiry details based on seller plan (Free vs Premium).
   - Premium sellers see full buyer details, Free sellers see limited info.

6. Email Notifications
   - Send email to seller when inquiry received (SMTP/Brevo).

7. Testing
   - Ensure inquiries work end-to-end.
   - Test membership restrictions.
   - Verify responsive design.

Deliverables:
- Inquiry form & backend API.
- Inquiry dashboard for sellers.
- Notification & email integration.
- Membership-based restrictions.
- Document API endpoints and DB schema changes.
