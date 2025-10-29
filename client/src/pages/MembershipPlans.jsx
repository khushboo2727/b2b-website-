import React, { useState } from 'react';
import { Check, X, Crown, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { membershipAPI, authAPI, leadAPI } from '../services/api';

const MembershipPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [remainingLeads, setRemainingLeads] = useState('—');
  const { user } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!user;
  const { updateUser } = useAuth();
  const [serverPlans, setServerPlans] = useState([]);

  React.useEffect(() => {
    const fetchServerPlans = async () => {
      try {
        const res = await membershipAPI.getPlans();
        setServerPlans(res.data || []);
      } catch (err) {
        console.error('Failed to load server plans', err);
      }
    };
    fetchServerPlans();
  }, []);

  // Compute remaining leads based on current membership plan and purchased count
  React.useEffect(() => {
    const computeRemainingLeads = async () => {
      try {
        if (!isLoggedIn) {
          setRemainingLeads(0);
          return;
        }

        const meRes = await authAPI.getCurrentUser();
        const meData = meRes?.data || {};
        let planRef = meData.membershipPlan;
        let leadsPerMonth = 0;

        if (planRef && typeof planRef === 'object') {
          leadsPerMonth = planRef?.limits?.leadsPerMonth ?? 0;
        } else if (planRef) {
          // Prefer already-fetched serverPlans; fallback to fetching if empty
          let plans = serverPlans;
          if (!plans || plans.length === 0) {
            const pRes = await membershipAPI.getPlans();
            plans = pRes.data || [];
          }
          const match = plans.find(p => String(p._id) === String(planRef));
          leadsPerMonth = match?.limits?.leadsPerMonth ?? 0;
        }

        // Purchased leads total for this seller
        const purchasedRes = await leadAPI.getPurchasedLeads({ page: 1, limit: 50 });
        const purchasedTotal = purchasedRes?.data?.total ?? 0;

        // 0 means unlimited in MembershipPlan schema
        if (!leadsPerMonth || leadsPerMonth === 0) {
          setRemainingLeads('Unlimited');
        } else {
          setRemainingLeads(Math.max(0, leadsPerMonth - purchasedTotal));
        }
      } catch (err) {
        console.error('Failed to compute remaining leads:', err);
        setRemainingLeads(0);
      }
    };

    computeRemainingLeads();
  }, [isLoggedIn, serverPlans]);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: '/year',
      color: 'border-gray-300',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      buttonText: 'Start Free',
      features: [
        { text: '5 Product Listings', included: true },
        { text: 'Verified Seller Badge', included: false },
        { text: 'Buyer Contact', included: false },
        { text: 'Featured Listing', included: false },
        { text: 'Dashboard Access', included: true },
        { text: 'Analytics', included: false },
        { text: 'Support', included: false }
      ]
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 9999,
      period: '/year',
      color: 'border-blue-500',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      buttonText: 'Choose Basic',
      features: [
        { text: '20 Product Listings', included: true },
        { text: 'Verified Seller Badge', included: false },
        { text: '20 Inquiries/Month', included: true },
        { text: 'Featured Listing', included: false },
        { text: 'Dashboard + Limited Analytics', included: true },
        { text: 'Email Support', included: true }
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 24999,
      period: '/year',
      color: 'border-yellow-500',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      buttonText: 'Choose Standard',
      features: [
        { text: '100 Product Listings', included: true },
        { text: 'Verified Tag for 1 Year', included: true },
        { text: '100 Inquiries/Month', included: true },
        { text: 'Featured Listing', included: false },
        { text: 'Advanced Analytics', included: true },
        { text: 'Priority Email Support', included: true }
      ]
    },
    {
      id: 'gold',
      name: 'Gold',
      price: 39999,
      period: '/year',
      color: 'border-orange-500',
      buttonColor: 'bg-orange-600 hover:bg-orange-700',
      buttonText: 'Choose Gold',
      features: [
        { text: 'Unlimited Listings', included: true },
        { text: 'Verified Tag for 1 Year', included: true },
        { text: 'Unlimited Inquiries', included: true },
        { text: 'Featured Homepage Listing', included: true },
        { text: 'Full Analytics Access', included: true },
        { text: 'Dedicated Account Manager', included: true }
      ]
    }
  ];

  const handlePlanSelection = (plan) => {
    if (!isLoggedIn) {
      toast.error('Please login to select a plan');
      navigate('/login');
      return;
    }
    const matchServerPlanId = () => {
      if (!serverPlans.length) return null;
      const name = (plan.name || '').toLowerCase();
      // Exact match first
      const exact = serverPlans.find(p => (p.name || '').toLowerCase() === name);
      if (exact) return exact._id;
      // Heuristic mapping
      if (name.includes('free')) {
        const freePlan = serverPlans.find(p => (p.name || '').toLowerCase().includes('free'));
        if (freePlan) return freePlan._id;
      }
      if (name.includes('basic')) {
        const basicPlan = serverPlans.find(p => (p.name || '').toLowerCase().includes('basic'));
        if (basicPlan) return basicPlan._id;
      }
      // Map Standard/Gold to Premium (highest tier)
      if (name.includes('standard') || name.includes('gold') || name.includes('premium')) {
        const premiumPlan = serverPlans.find(p => (p.name || '').toLowerCase().includes('premium'));
        if (premiumPlan) return premiumPlan._id;
      }
      return null;
    };

    const serverPlanId = matchServerPlanId();
    const normalizedName = (() => {
      const n = (plan.name || '').toLowerCase();
      if (n.includes('standard') || n.includes('gold') || n.includes('premium')) return 'Premium';
      if (n.includes('basic')) return 'Basic';
      return 'Free';
    })();

    const activate = async () => {
      try {
        const res = await membershipAPI.subscribe(serverPlanId || normalizedName, { name: normalizedName });
        const updatedUser = res?.data?.user;
        if (updatedUser) {
          updateUser(updatedUser);
        }
        setSelectedPlan(plan);
        toast.success(`${plan.name} plan activated (testing mode)!`);
        navigate('/seller/leads');
      } catch (err) {
        const msg = err?.response?.data?.message || err?.response?.data?.msg || err.message || 'Activation failed';
        // Fallback: local-only activation for UI testing
        updateUser({ ...(user || {}), membershipPlan: { name: normalizedName } });
        setSelectedPlan(plan);
        toast.success(`${plan.name} plan locally activated for testing`);
        navigate('/seller/leads');
      }
    };

    activate();
  };

  const handleBuyLead = () => {
    if (!isLoggedIn) {
      toast.error('Please login to buy a single lead');
      navigate('/login');
      return;
    }
    toast.info('Redirecting to buy single lead...');
    console.log('Buy single lead clicked');
  };

  const handleBuyVerifyTag = () => {
    if (!isLoggedIn) {
      toast.error('Please login to buy verify tag');
      navigate('/login');
      return;
    }
    toast.info('Redirecting to buy verify tag...');
    console.log('Buy verify tag clicked');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price).replace('₹', '₹');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Membership Plan
          </h1>
          <p className="text-xl text-gray-600">
            Grow your business with the right features
          </p>
        </div>

        {/* Login Notice */}
        {!isLoggedIn && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm">Login required: Activate plan or buy single lead only after login.</p>
            <Link to="/login" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm">Login</Link>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 ${plan.color} p-8 hover:shadow-xl transition-shadow duration-300`}
            >


              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-blue-600">
                    {plan.price === 0 ? '₹0' : formatPrice(plan.price)}
                  </span>
                  <span className="text-gray-500 ml-1">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${
                      feature.included ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handlePlanSelection(plan)}
                disabled={!isLoggedIn}
                className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-colors duration-200 ${
                  plan.buttonColor
                } ${selectedPlan?.id === plan.id ? 'ring-2 ring-offset-2 ring-blue-500' : ''} ${!isLoggedIn ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {selectedPlan?.id === plan.id ? 'Selected' : (!isLoggedIn ? 'Login to Select' : plan.buttonText)}
              </button>
            </div>
          ))}
        </div>

        {/* Remaining Leads Info */}
        <div className="text-center mb-8">
          <p className="text-lg text-gray-600">
            Your Remaining Leads: <span className="font-semibold">{remainingLeads}</span>
          </p>
        </div>

        {/* Buy Single Lead and Verify Tag */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleBuyLead}
              disabled={!isLoggedIn}
              className={`bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 ${!isLoggedIn ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isLoggedIn ? 'Buy a Single Lead' : 'Login to Buy Lead'}
            </button>
            <button 
              onClick={handleBuyVerifyTag}
              disabled={!isLoggedIn}
              className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 ${!isLoggedIn ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isLoggedIn ? 'Buy Verify Tag' : 'Login to Buy Tag'}
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            Why Choose Our Membership Plans?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Premium Features</h4>
              <p className="text-gray-600 text-sm">
                Access advanced tools and analytics to grow your business
              </p>
            </div>
            <div className="text-center">
              <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Verified Badge</h4>
              <p className="text-gray-600 text-sm">
                Build trust with buyers through our verification system
              </p>
            </div>
            <div className="text-center">
              <Check className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Priority Support</h4>
              <p className="text-gray-600 text-sm">
                Get dedicated support to help you succeed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipPlans;