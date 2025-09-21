import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LoadingProvider } from './context/LoadingContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import pages
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
// import Register from './pages/seller/Register';
import Unauthorized from './pages/Unauthorized';
import Membership from './pages/Membership';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import Buyers from './pages/admin/Buyers';
import Sellers from './pages/admin/Sellers';
import Inquiries from './pages/admin/Inquiries';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/seller/Settings';

// Import seller pages
import SellerDashboard from './pages/seller/Dashboard';
import SellerProfile from './pages/seller/Profile';
import SellerLeads from './pages/seller/Leads';
import PendingApproval from './pages/seller/PendingApproval';
import AddProduct from './pages/seller/AddProduct';
import SellerProducts from './pages/seller/Products';
import EditProduct from './pages/seller/EditProduct';
import SellerRegister from './pages/seller/Register';

// Import buyer pages
import BuyerDashboard from './pages/buyer/Dashboard';
import BuyerRFQs from './pages/buyer/RFQs';
import SellerDetail from './pages/admin/SellerDetail';

function App() {
  return (
    <LoadingProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/membership" element={<Membership />} />

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
                      <Settings />
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
                  path="/admin/settings" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </LoadingProvider>
  );
}

export default App;