# Week 3 – TRAE Agent Instructions

## 🎯 Goal for Week 3
Set up the **buyer-side features** of the platform so buyers can search products, request quotes, and sellers can start receiving leads. This will make the MVP buyer journey functional.

---

## 📌 TRAE Agent – Exact Instructions

You are tasked with implementing **Week 3 buyer-side features**. Please follow these step-by-step tasks carefully:

### 1. Buyer Search & Product Browsing
- Implement **search bar** (by product name, category, location).
- Enable **category-based filtering**.
- Design results page to show product cards (with image, title, seller name, and verified badge if seller is approved).
- Add pagination or lazy load for search results.

### 2. Request for Quote (RFQ) System
- Add **"Request for Quote" button** on each product page.
- Create an RFQ form (fields: Product, Quantity, Buyer Contact Details, Message).
- Save RFQ in database under a new collection (`rfqs`).
- Connect RFQ submission to seller inquiry dashboard (Week 2’s seller dashboard).

### 3. Buyer Inquiry Dashboard
- Build **buyer dashboard** where they can view submitted RFQs.
- Show status of RFQ (Pending / Sent to Sellers / Seller Responded).

### 4. Lead Distribution Logic
- Connect submitted RFQ to relevant sellers (based on category).
- If seller has **active membership plan**, allow them to view buyer details.
- If not subscribed → show teaser (blurred details) with “Subscribe to View Lead”.

### 5. Messaging (Basic)
- Add simple **contact via email trigger** (send buyer details via email to seller’s registered email).
- Optional: Store a basic message log in database.

### 6. Testing
- Test buyer → product search → RFQ submission → seller dashboard lead visibility flow.
- Ensure free plan sellers **cannot view buyer contact details**, only paid sellers can.

---

✅ Deliverables for Week 3:
- Buyer search and filter system.
- RFQ submission + database storage.
- Buyer dashboard (view RFQs).
- RFQ lead distribution to sellers (membership-controlled).
- Email notification for new inquiries.

---

⚡ TRAE Agent — Please make sure your code is:
- Clean and modular (separate backend routes, controllers, and models).
- Scalable for future features (multi-language, chat system, etc.).
- Well-documented (comment functions and logic clearly).

