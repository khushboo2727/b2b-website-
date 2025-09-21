# 🚀 Week 1 Task List for TRAE AI Agent

This is the **exact roadmap + prompts** for TRAE Agent to follow in **Week 1** of our B2B Marketplace project (MERN Stack).

---

## 📌 Project Setup
- [ ] Initialize **MERN stack project** with folder structure:
  - `client/` → React + Vite + TailwindCSS
  - `server/` → Node.js + Express + MongoDB (Mongoose ORM)
- [ ] Setup `.env` with: `PORT`, `DB_URI`, `JWT_SECRET`
- [ ] Create `README.md` with setup instructions

**Prompt for TRAE:**
```
Initialize a MERN stack project with client (React + Vite + TailwindCSS) and server (Node.js + Express + MongoDB). Add .env setup for PORT, DB_URI, JWT_SECRET. Create README.md with setup instructions.
```

---

## 📌 Database Models (Mongoose)
- [ ] **User Model** → name, email, password (hashed), role (buyer/seller/admin), membershipPlan, phone, verified
- [ ] **Seller Profile Model** → userId (ref User), companyName, gstNumber, address, websiteUrl, companyLogo, certifications[]
- [ ] **Product Model** → sellerId (ref User), title, description, images[], category, priceRange, specifications
- [ ] **Lead/Inquiry Model** → buyerId (ref User), productId (ref Product), message, status (open/closed), sharedWith[]
- [ ] **Membership Plan Model** → name (Free, Premium), price, features[]

**Prompt for TRAE:**
```
Create Mongoose models for User, Seller Profile, Product, Lead, and Membership Plan with schema fields as listed in the Week 1 plan.
```

---

## 📌 Backend APIs
- [ ] **Auth Routes** → /auth/register, /auth/login
- [ ] **Seller Routes** → /seller/profile (create/update), /seller/profile/:id (get)
- [ ] **Product Routes** → /product (POST), /products (GET with search & filter)
- [ ] **Lead Routes** → /lead (POST), /leads (GET for seller restricted by membership)
- [ ] **Membership Routes** → /plans (GET), /subscribe/:planId (POST)

**Prompt for TRAE:**
```
Implement Express routes:
- Auth: register, login with JWT.
- Seller: create/update profile, get profile.
- Product: add product, list all products with search & filter.
- Lead: create lead, list leads restricted by membership.
- Membership: get plans, subscribe to a plan.
```

---

## 📌 Middleware & Utilities
- [ ] JWT Authentication Middleware
- [ ] Role-based Access Middleware (isSeller, isBuyer, isAdmin)
- [ ] Membership Access Check (restrict free users)
- [ ] Password Hashing (bcrypt)

**Prompt for TRAE:**
```
Add middleware for authentication (JWT), role-based access (isSeller, isBuyer, isAdmin), and membership restrictions. Use bcrypt for password hashing.
```

---

## 📌 Basic Frontend Setup
- [ ] Initialize React + Vite + Tailwind project
- [ ] Setup global layout: Navbar, Sidebar, Footer
- [ ] Create Auth Pages → Login, Register
- [ ] Create Seller Dashboard Page (placeholder)
- [ ] Create Buyer Homepage → Product search + Inquiry form

**Prompt for TRAE:**
```
In the React frontend, setup TailwindCSS and create pages: Login, Register, Seller Dashboard (placeholder), and Buyer Homepage with product search + inquiry form. Add Navbar, Sidebar, and Footer components.
```

---

## 📌 Testing & Documentation
- [ ] Add Postman collection for all APIs
- [ ] Write sample test users: admin, seller, buyer
- [ ] Ensure APIs work end-to-end (auth → product → inquiry → membership)

**Prompt for TRAE:**
```
Create Postman collection for all backend APIs. Add sample test users (admin, seller, buyer). Verify flow from user registration/login → product creation → inquiry → membership access.
```

---

✅ **Deliverables for Week 1:**
- Running MERN boilerplate app
- Auth, Membership, Product, Lead APIs functional
- React frontend with Auth + Dashboard placeholders
- Documentation with setup + sample API usage

