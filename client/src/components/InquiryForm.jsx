import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { leadAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const InquiryForm = ({ product, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const toast = { success: showSuccess, error: showError, info: showInfo, warning: showWarning };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const inquiryData = {
        productId: product._id,
        message: data.message,
        buyerContact: {
          email: data.buyerEmail,
          phone: data.buyerPhone,
          companyName: data.companyName,
          country: data.country,
          state: data.state,
          city: data.city
        },
        quantity: parseInt(data.quantity),
        quantityUnit: data.quantityUnit,
        budget: data.budget // if you want to add budget field
      };
  
      await leadAPI.create(inquiryData);
      toast.success('Inquiry sent successfully!');
      reset();
      onClose();
    } catch (error) {
      console.error('Error sending inquiry:', error);
      toast.error('Failed to send inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Send Inquiry</h2>
            <p className="text-sm text-gray-600 mt-1">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Product Image and Details - Left Side */}
          <div className="lg:w-1/3 p-6 bg-gray-50 border-r">
            <div className="space-y-4">
              {/* Product Image */}
              <div className="aspect-square bg-white rounded-lg overflow-hidden border">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📦</div>
                      <p className="text-sm">No Image Available</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Product Details */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.category}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  {product.minimumOrderQuantity && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Min Order:</span>
                      <span className="font-medium">{product.minimumOrderQuantity} {product.unit || 'pieces'}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supplier:</span>
                    <span className="font-medium">{product.seller?.companyName || product.sellerProfile?.companyName}</span>
                  </div>
                  
                  {product.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{product.location}</span>
                    </div>
                  )}
                </div>
                
                {product.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Description:</h4>
                    <p className="text-sm text-gray-600 line-clamp-4">{product.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Form - Right Side */}
          <div className="lg:w-2/3">
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                {...register('buyerName', { required: 'Name is required' })}
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your full name"
              />
              {errors.buyerName && (
                <p className="text-red-600 text-sm mt-1">{errors.buyerName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                {...register('buyerEmail', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your.email@company.com"
              />
              {errors.buyerEmail && (
                <p className="text-red-600 text-sm mt-1">{errors.buyerEmail.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                {...register('buyerPhone', { required: 'Phone number is required' })}
                type="tel"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+91 9876543210"
              />
              {errors.buyerPhone && (
                <p className="text-red-600 text-sm mt-1">{errors.buyerPhone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                {...register('companyName')}
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your company name"
              />
            </div>
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <input
                type="text"
                {...register('country', { required: 'Country is required' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter country"
              />
              {errors.country && (
                <p className="text-red-600 text-sm mt-1">{errors.country.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State *
              </label>
              <input
                {...register('state', { required: 'State is required' })}
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter state"
              />
              {errors.state && (
                <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                {...register('city', { required: 'City is required' })}
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter city"
              />
              {errors.city && (
                <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>
              )}
            </div>
          </div>

          {/* Inquiry Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity Required *
                </label>
                <div className="flex gap-2">
                  <input
                    {...register('quantity', {
                      required: 'Quantity is required',
                      min: {
                        value: product.minimumOrderQuantity || 1,
                        message: `Minimum order quantity is ${product.minimumOrderQuantity || 1}`
                      }
                    })}
                    type="number"
                    min={product.minimumOrderQuantity || 1}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Min: ${product.minimumOrderQuantity || 1}`}
                  />
                 <select
                    {...register('quantityUnit', { required: 'Unit is required' })}
                    className="w-28 border border-gray-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onFocus={(e) => e.target.size = 5}   // focus karte hi 5 options show
                    onBlur={(e) => e.target.size = 1}    // blur karte hi normal ho jaye
                  >
                    <option value="pieces">Pieces</option>
                    <option value="kg">Kg</option>
                    <option value="gram">Gram</option>
                    <option value="liter">Liter</option>
                    <option value="ml">ML</option>
                    <option value="box">Box</option>
                    <option value="carton">Carton</option>
                    <option value="dozen">Dozen</option>
                    <option value="pair">Pair</option>
                    <option value="set">Set</option>
                    <option value="meter">Meter</option>
                    <option value="feet">Feet</option>
                    <option value="inch">Inch</option>
                    <option value="yard">Yard</option>
                    <option value="ton">Ton</option>
                    <option value="quintal">Quintal</option>
                    <option value="pack">Pack</option>
                    <option value="bag">Bag</option>
                    <option value="bottle">Bottle</option>
                    <option value="can">Can</option>
                    <option value="roll">Roll</option>
                    <option value="sheet">Sheet</option>
                    <option value="sqft">Sq Ft</option>
                    <option value="sqm">Sq Meter</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {errors.quantity && (
                  <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>
                )}
                {errors.quantityUnit && (
                  <p className="text-red-600 text-sm mt-1">{errors.quantityUnit.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency
                </label>
                <select
                  {...register('urgency')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="very_urgent">Very Urgent</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              {...register('message', { required: 'Message is required' })}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please provide details about your requirements, delivery timeline, and any specific questions..."
            />
            {errors.message && (
              <p className="text-red-600 text-sm mt-1">{errors.message.message}</p>
            )}
          </div>



              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Inquiry
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryForm;