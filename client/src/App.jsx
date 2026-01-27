import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Import pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
// import Register from './pages/seller/Register';
import Unauthorized from './pages/Unauthorized';
// import Membership from './pages/Membership';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import Buyers from './pages/admin/Buyers';
import Sellers from './pages/admin/Sellers';
import Inquiries from './pages/admin/Inquiries';
import Analytics from './pages/admin/Analytics';
import SupportTickets from './pages/admin/SupportTickets';
import Support from './pages/Support';
import TrackTicket from './pages/TrackTicket';
import SellerSettings from './pages/seller/Settings';
import AdminSettings from './pages/admin/Settings';
import AdminMessages from './components/admin/AdminMessages';
import AdminLayout from './components/layout/AdminLayout';

// Import seller pages
import SellerDashboard from './pages/seller/Dashboard';
import SellerProfile from './pages/seller/Profile';
import SellerLeads from './pages/seller/Leads';
import AllLeads from './pages/seller/AllLeads';
import PendingApproval from './pages/seller/PendingApproval';
import AddProduct from './pages/seller/AddProduct';
import SellerProducts from './pages/seller/Products';
import EditProduct from './pages/seller/EditProduct';
import SellerRegister from './pages/seller/Register';
// import SellerMessages from './pages/seller/Messages';
// import SellerRFQs from './pages/seller/RFQs';

// Import buyer pages
import BuyerDashboard from './pages/buyer/Dashboard';
import BuyerRFQs from './pages/buyer/RFQs';
import BuyerProfile from './pages/buyer/Profile';
import SellerDetail from './pages/admin/SellerDetail';
import Categories from './pages/Categories'; // NEW
import MembershipPlans from './pages/MembershipPlans';
import PostRequirement from './pages/PostRequirement';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/support" element={<Support />} />
          <Route path="/track-ticket" element={<TrackTicket />} />
          {/* <Route path="/membership" element={<Membership />} /> */}
          <Route path="/membership-plans" element={<MembershipPlans />} />
          <Route path="/post-requirement" element={<PostRequirement />} />

          {/* NEW: Categories landing page */}
          <Route path="/categories" element={<Categories />} />

          {/* Make pending approval public so non-logged-in sellers can see it */}
          <Route
            path="/seller/pending-approval"
            element={<PendingApproval />}
          />

          {/* Buyer protected routes */}
          <Route
            path="/buyer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/rfqs"
            element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <BuyerRFQs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/profile"
            element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <BuyerProfile />
              </ProtectedRoute>
            }
          />

          {/* Seller protected routes */}
          <Route
            path="/seller/dashboard"
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/profile"
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/leads"
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerLeads />
              </ProtectedRoute>
            }
          />
          {/* Messages page removed; floating widget now handles chat */}
          {/* <Route 
                  path="/seller/rfqs" 
                  element={
                    <ProtectedRoute allowedRoles={['seller']}>
                      <SellerRFQs />
                    </ProtectedRoute>
                  } 
                /> */}
          <Route
            path="/seller/all-leads"
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <AllLeads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/products"
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/pending-approval"
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <PendingApproval />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/products/add"
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <AddProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/products/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <EditProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/settings"
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerSettings />
              </ProtectedRoute>
            }
          />
          {/* Public seller registration */}
          <Route path="/seller/register" element={<SellerRegister />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminDashboard />
            }
          />
          <Route
            path="/admin/messages"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <AdminMessages />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/buyers"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Buyers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sellers"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Sellers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sellers/:id"
            element={<SellerDetail />}
          />
          <Route
            path="/admin/inquiries"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Inquiries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/support-tickets"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SupportTickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;