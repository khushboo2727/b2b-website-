# 🚀 Week 2 Task List for TRAE AI Agent

This is the **exact roadmap + prompts** for TRAE Agent to follow in **Week 2** of our B2B Marketplace project (MERN Stack).

---

## 📌 Frontend – Auth Integration
- [ ] Connect **Login & Register forms** with backend APIs (`/auth/register`, `/auth/login`).
- [ ] Implement **JWT storage** (localStorage) & auto-redirect after login.
- [ ] Add **ProtectedRoute component** for role-based page access.

**Prompt for TRAE:**
```
Connect Login and Register forms in frontend with backend APIs. Store JWT in localStorage and implement ProtectedRoute component for role-based access.
```

---

## 📌 Seller Dashboard Features
- [ ] Build **Seller Dashboard UI** with Sidebar navigation (Profile, Products, Leads, Membership).
- [ ] **Profile Page** → integrate with `/seller/profile` API (create/update & fetch).
- [ ] **Add Product Page** → integrate with `/product` API.
- [ ] **Product Listing** → show seller’s own products with edit/delete functionality.

**Prompt for TRAE:**
```
Create Seller Dashboard with Sidebar navigation. Add Profile Page (integrated with /seller/profile API), Add Product Page (connected to /product API), and Product Listing page showing seller’s products with edit/delete options.
```

---

## 📌 Buyer Features
- [ ] Build **Buyer Homepage** with Product Search & Filter (connected to `/products` API).
- [ ] **Product Detail Page** → show product info + “Send Inquiry” button.
- [ ] **Inquiry Form** → integrate with `/lead` API.

**Prompt for TRAE:**
```
Build Buyer Homepage with product search and filter connected to /products API. Add Product Detail page with Send Inquiry button, and integrate Inquiry Form with /lead API.
```

---

## 📌 Lead Management
- [ ] Create **Seller Leads Page**.
- [ ] Integrate with `/leads` API (restrict by membership plan).
- [ ] Show buyer inquiries with product info, buyer message, and contact details if allowed.
- [ ] Allow seller to update inquiry status (open/closed).

**Prompt for TRAE:**
```
Build Seller Leads Page connected to /leads API. Show inquiries with buyer message, product details, and contact info (if membership allows). Add functionality to update inquiry status (open/closed).
```

---

## 📌 Membership Plans
- [ ] Create **Membership Page** (frontend).
- [ ] Integrate with `/plans` API to display Free & Premium plans.
- [ ] Add Subscribe button → connect with `/subscribe/:planId` API.
- [ ] Restrict seller access (e.g., Free plan → limited leads).

**Prompt for TRAE:**
```
Create Membership Page in frontend. Fetch and display plans from /plans API. Add Subscribe button that connects with /subscribe/:planId API. Apply restriction logic based on membership type (e.g., Free users see limited leads).
```

---

## 📌 Utilities
- [ ] Add **Toast Notifications** (success/error) for all API actions.
- [ ] Setup **Loader & Error States** for API calls.

**Prompt for TRAE:**
```
Implement Toast notifications for success/error on all API calls. Add loader and error state handling for better user experience.
```

---

## 📌 Testing & QA
- [ ] Test full flow:
  - Buyer registers → browses products → sends inquiry.
  - Seller registers → sets profile → adds product → views inquiry.
  - Membership restrictions verified.
- [ ] Update Postman collection with new endpoints.
- [ ] Update README with new usage instructions.

**Prompt for TRAE:**
```
Test end-to-end flow: Buyer registers, browses products, and sends inquiry. Seller registers, updates profile, adds product, and views inquiry (with membership restrictions). Update Postman collection and README with new endpoints and usage steps.
```

---

✅ **Deliverables for Week 2:**
- Auth integration with JWT fully functional
- Seller Dashboard (Profile + Product CRUD + Leads)
- Buyer Homepage (Product browsing + Inquiry system)
- Membership Plans integrated with restrictions
- Toast notifications, loaders, and error handling in place
- End-to-end tested workflows with updated docs

