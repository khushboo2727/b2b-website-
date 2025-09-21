## 🎨 UI/UX Design Plan for MVP

### 1. **Design Principles**

* Clean, business-oriented look (not flashy like B2C e-commerce).
* Easy navigation between Buyer & Seller dashboards.
* Mobile-first responsive design.
* Consistent typography + color palette (trustworthy + professional).
* Focus on **leads → conversion** flow.

---

### 2. **Key Screens (MVP)**

#### 🔹 Buyer Side

1. **Landing Page / Home**

   * Hero section (Search Bar → Product / Category)
   * Why Choose Us (Trust badges, Verified Suppliers)
   * Featured Categories / Suppliers
   * CTA: *Post Your Requirement*

2. **Search & Product Listing Page**

   * Filters (Category, Country, Certifications, Supplier Type)
   * Compare Suppliers option
   * Supplier Cards (Company Name, Badge, Rating, Location, Contact CTA)

3. **RFQ (Request For Quotation) Form**

   * Product Name, Quantity, Delivery Country, Certifications needed
   * Buyer contact details

4. **Buyer Dashboard**

   * My RFQs (status: sent / responded / closed)
   * Saved Suppliers
   * Messages/Chat

---

#### 🔹 Seller Side

1. **Seller Registration / Login** (with membership plan selection)

2. **Seller Dashboard**

   * Company Profile (with verification status + documents upload)
   * Membership Status (Free / Premium with upgrade option)
   * Leads/Inquiry Dashboard (locked until subscription → CTA “Upgrade to View”)
   * Product Management (Add/Edit products with specs + images)

3. **Lead Detail View**

   * Buyer requirement summary (Product, Quantity, Location)
   * Contact details (visible only if Premium)

---

#### 🔹 Super Admin Side

1. **Admin Dashboard**

   * Approve/Reject Sellers
   * Manage Buyers
   * Monitor Leads + RFQs
   * Manage Membership Plans
   * Analytics (Signups, Leads generated, Active plans, Revenue)

---

### 3. **Membership Flow**

* Seller signs up → Adds company profile → Uploads docs → Pending approval.
* Once approved, can see leads but **contact details locked**.
* Must **purchase Premium plan** (via Razorpay/Stripe/PayPal) → unlock buyer details.

---

### 4. **Style Guide Proposal**

* **Colors:**

  * Primary: #2F3284 → trust & professionalism
  * Secondary: #FF6600 → success & growth
  * Accent: Golden (#F59E0B) → premium membership highlight
* **Typography:**

  * Headings: Montserrat (bold, clean)
  * Body: Open Sans / Roboto (readable)
* **Icons:** Lucide/Feather Icons (minimal)
* **Layout:** Grid-based, card UI for suppliers/leads

---
