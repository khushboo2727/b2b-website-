import React, { useState, useEffect } from 'react';
import { membershipAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Membership = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await membershipAPI.getPlans();
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubscribing(planId);
    try {
      const response = await membershipAPI.subscribe(planId);
      
      // Update user context with new membership plan
      updateUser(response.data.user);
      
      alert(response.data.msg);
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(null);
    }
  };

  const isCurrentPlan = (planId) => {
    return user?.membershipPlan?._id === planId;
  };

  const getPlanButtonText = (plan) => {
    if (isCurrentPlan(plan._id)) {
      return 'Current Plan';
    }
    return plan.name === 'Free' ? 'Select Free Plan' : `Subscribe to ${plan.name}`;
  };

  const getPlanButtonStyle = (plan) => {
    if (isCurrentPlan(plan._id)) {
      return 'bg-green-600 text-white cursor-not-allowed';
    }
    return plan.name === 'Premium' 
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-gray-600 hover:bg-gray-700 text-white';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Membership Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Unlock more features and grow your business with our premium plans
          </p>
        </div>

        {/* Current Plan Display */}
        {user?.membershipPlan && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">
                You are currently on the {user.membershipPlan.name} plan
              </span>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`border rounded-lg shadow-sm divide-y divide-gray-200 ${
                plan.name === 'Premium'
                  ? 'border-blue-500 shadow-blue-100'
                  : 'border-gray-200'
              }`}
            >
              <div className="p-6">
                {/* Plan Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {plan.name}
                  </h3>
                  {plan.name === 'Premium' && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                
                {/* Price */}
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    /month
                  </span>
                </div>

                {/* Features */}
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5" />
                      <span className="ml-3 text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limits */}
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Leads per month:</span>
                    <span className="font-medium">
                      {plan.limits.leadsPerMonth === 0 ? 'Unlimited' : plan.limits.leadsPerMonth}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Products allowed:</span>
                    <span className="font-medium">
                      {plan.limits.productsAllowed === 0 ? 'Unlimited' : plan.limits.productsAllowed}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Verification badge:</span>
                    <span className="font-medium">
                      {plan.limits.verificationBadge ? (
                        <CheckIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <XMarkIcon className="h-4 w-4 text-red-500" />
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscribe Button */}
              <div className="px-6 py-4">
                <button
                  onClick={() => handleSubscribe(plan._id)}
                  disabled={isCurrentPlan(plan._id) || subscribing === plan._id}
                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                    getPlanButtonStyle(plan)
                  } disabled:opacity-50`}
                >
                  {subscribing === plan._id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Subscribing...
                    </div>
                  ) : (
                    getPlanButtonText(plan)
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Membership Benefits Info */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Membership Benefits & Restrictions
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Free Plan</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Limited access to leads (first 5 per month)</li>
                <li>• Basic product listing</li>
                <li>• Standard support</li>
                <li>• No verification badge</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Premium Plan</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Unlimited access to all leads</li>
                <li>• Unlimited product listings</li>
                <li>• Priority support</li>
                <li>• Verified seller badge</li>
                <li>• Advanced analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Membership;