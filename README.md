# Niryat Business - B2B Lead Generation Platform

A comprehensive MERN stack application for B2B lead generation, connecting buyers and sellers with advanced membership-based features.

## 🚀 Features

### For Buyers
- **Product Discovery**: Advanced search and filtering
- **Inquiry System**: Send detailed product inquiries
- **User Dashboard**: Track inquiry status
- **Responsive Design**: Mobile-friendly interface

### For Sellers
- **Product Management**: Add, edit, and manage products
- **Lead Management**: View and respond to buyer inquiries
- **Profile Management**: Complete business profile setup
- **Membership Tiers**: Free and Premium plans with different access levels

### System Features
- **Authentication**: JWT-based secure authentication
- **Role-based Access**: Buyer and Seller roles with specific permissions
- **Membership System**: Tiered access with Free and Premium plans
- **Real-time Notifications**: Toast notifications for all actions
- **Loading States**: Comprehensive loading and error handling

## 🛠️ Technology Stack

### Frontend
- **React 18** with Vite
- **TailwindCSS** for styling
- **React Router** for navigation
- **React Hook Form** for form handling
- **Axios** for API calls
- **Context API** for state management

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn package manager

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd niryat-business
```

### 2. Install Dependencies

#### Backend Setup
```bash
cd server
npm install
```

#### Frontend Setup
```bash
cd client
npm install
```

### 3. Environment Configuration

Create `.env` file in the server directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/niryat-business
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

Create `.env` file in the client directory:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Database Setup

#### Option 1: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Database will be created automatically

#### Option 2: MongoDB Atlas
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and update `MONGO_URI` in `.env`

### 5. Start the Application

#### Start Backend Server
```bash
cd server
npm run dev
```
Server will run on http://localhost:5000

#### Start Frontend Development Server
```bash
cd client
npm run dev
```
Frontend will run on http://localhost:5173

## 📖 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "buyer" // or "seller"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

### Product Endpoints

#### Get All Products (with filters)
```http
GET /api/product?search=laptop&category=Electronics&minPrice=500&maxPrice=2000&sort=price&order=asc&page=1&limit=10
```

#### Get Product by ID
```http
GET /api/product/:productId
```

#### Create Product (Seller only)
```http
POST /api/product
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product Description",
  "category": "Electronics",
  "price": 1000,
  "minOrderQuantity": 10,
  "specifications": {
    "key": "value"
  },
  "images": ["image1.jpg"]
}
```

### Lead Endpoints

#### Create Lead (Buyer only)
```http
POST /api/lead
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "productId": "product-id",
  "message": "Inquiry message",
  "quantity": 100,
  "budget": 50000
}
```

#### Get Seller Leads
```http
GET /api/leads?status=open&page=1&limit=10
Authorization: Bearer <jwt-token>
```

#### Update Lead Status
```http
PATCH /api/lead/:leadId/status
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "status": "closed"
}
```

### Membership Endpoints

#### Get Membership Plans
```http
GET /api/membership/plans
```

#### Subscribe to Plan
```http
POST /api/membership/subscribe/:planId
Authorization: Bearer <jwt-token>
```

## 🧪 Testing

### End-to-End Testing Flow

#### Complete Buyer Journey
1. **Register as Buyer**
   - Navigate to `/register`
   - Fill form with role "buyer"
   - Verify account creation

2. **Login**
   - Navigate to `/login`
   - Enter credentials
   - Verify redirect to homepage

3. **Browse Products**
   - Use search and filters on homepage
   - Verify product results
   - Click on product for details

4. **Send Inquiry**
   - Click "Send Inquiry" on product detail page
   - Fill inquiry form
   - Verify success message

#### Complete Seller Journey
1. **Register as Seller**
   - Navigate to `/register`
   - Fill form with role "seller"
   - Verify account creation

2. **Login and Setup Profile**
   - Login and navigate to `/seller/profile`
   - Complete business profile
   - Verify profile update

3. **Add Product**
   - Navigate to seller dashboard
   - Add new product
   - Verify product creation

4. **Manage Inquiries**
   - Navigate to `/seller/leads`
   - View received inquiries
   - Update lead status
   - Test membership restrictions

### Using Postman Collection

1. Import the collection from `docs/Niryat_Business_API.postman_collection.json`
2. Set environment variables:
   - `baseUrl`: http://localhost:5000/api
3. Run the requests in order:
   - Register → Login → Create Product → Create Lead → Get Leads

### Automated Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## 🔧 Development

### Project Structure