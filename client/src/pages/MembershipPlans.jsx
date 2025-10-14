import React, { useState } from 'react';
import { Check, X, Crown, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const MembershipPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [remainingLeads] = useState(0);

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
    setSelectedPlan(plan);
    // यहाँ API call होगी plan assign करने के लिए
    toast.success(`${plan.name} plan selected successfully!`);
    console.log('Selected plan:', plan);
  };

  const handleBuyLead = () => {
    toast.info('Redirecting to buy single lead...');
    console.log('Buy single lead clicked');
  };

  const handleBuyVerifyTag = () => {
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
                className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-colors duration-200 ${
                  plan.buttonColor
                } ${selectedPlan?.id === plan.id ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
              >
                {selectedPlan?.id === plan.id ? 'Selected' : plan.buttonText}
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
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Buy a Single Lead
            </button>
            <button 
              onClick={handleBuyVerifyTag}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Buy Verify Tag
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