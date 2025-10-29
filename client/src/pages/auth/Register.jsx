import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Building2, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI as authApiWithToast } from '../../services/apiWithToast';
import { useToast } from '../../context/ToastContext';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState('buyer');
  const [otpId, setOtpId] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const toast = { success: showSuccess, error: showError, info: showInfo, warning: showWarning };
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();



  const password = watch('password');


  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Buyer registration requires OTP verification
      if (userRole === 'buyer' && !otpVerified) {
        toast.error('Please verify OTP sent to your email before registering');
        return;
      }
      const userData = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: userRole,
        phone: data.phone,
        ...(data.companyName && { companyName: data.companyName }),
        ...(userRole === 'seller' && {
          gstNumber: data.gstNumber,
          address: data.address
        }),
        // FIX: use the registered field name
        termsAccepted: data.acceptTerms
      };

      const result = await registerUser(userData);
      
      if (result.success) {
        // Redirect based on role
        if (userRole === 'buyer') {
          navigate('/buyer/dashboard');
        } else {
          navigate('/seller/dashboard');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestOtp = async () => {
    try {
      const name = watch('name');
      const email = watch('email');
      if (!email) {
        toast.error('Please enter your email to receive OTP');
        return;
      }
      setIsSendingOtp(true);
      const res = await authApiWithToast.requestOtp({ name, email });
      const id = res?.data?.otpId;
      if (id) {
        setOtpId(id);
        toast.success(`OTP sent to ${email}`);
      } else {
        toast.error(res?.data?.message || 'Failed to request OTP');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to request OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    try {
      if (!otpId) {
        toast.error('Please generate OTP first');
        return;
      }
      if (!otp) {
        toast.error('Please enter the OTP');
        return;
      }
      setIsVerifyingOtp(true);
      const res = await authApiWithToast.verifyOtp({ otpId, code: otp });
      const verified = res?.data?.verified;
      if (verified) {
        setOtpVerified(true);
        toast.success('OTP verified');
      } else {
        toast.error('Invalid OTP');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to verify OTP');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2f3284] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8 border border-gray-300 rounded-lg shadow-md bg-white p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setUserRole('buyer')}
            className={`w-full py-2 rounded-md border ${userRole === 'buyer' ? 'bg-[#ff8c32] text-white' : 'bg-white text-gray-700'}`}
          >
            I'm a Buyer
          </button>

          <button
            type="button"
            onClick={() => navigate('/seller/register')}
            className={`w-full py-2 rounded-md border ${userRole === 'seller' ? 'bg-[#2f3284] text-white' : 'bg-white text-gray-700'}`}
          >
            I'm a Seller
          </button>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('name', {
                    required: 'Full name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters'
                    }
                  })}
                  type="text"
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
              {/* OTP Controls for Buyer */}
              {userRole === 'buyer' && (
                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    onClick={requestOtp}
                    disabled={isSendingOtp}
                  >
                    {isSendingOtp ? 'Sending OTP...' : 'Generate OTP'}
                  </button>
                  <input
                    className="border rounded px-3 py-2 flex-1"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                    onClick={verifyOtp}
                    disabled={isVerifyingOtp}
                  >
                    {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              )}
              {userRole === 'buyer' && otpVerified && (
                <div className="mt-2 text-green-700 text-sm">OTP Verified</div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number {userRole === 'seller' ? '*' : ''}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('phone', {
                    required: userRole === 'seller' ? 'Phone number is required for sellers' : false,
                    pattern: {
                      value: /^[\+]?[1-9][\d]{0,15}$/,
                      message: 'Invalid phone number'
                    }
                  })}
                  type="tel"
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your phone number"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name {userRole === 'seller' ? '*' : '(Optional)'}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('companyName', {
                    required: userRole === 'seller' ? 'Company name is required for sellers' : false,
                    minLength: {
                      value: 2,
                      message: 'Company name must be at least 2 characters'
                    }
                  })}
                  type="text"
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your company name"
                />
              </div>
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
              )}
            </div>

            {/* Seller-specific fields */}
            {userRole === 'seller' && (
              <>
                {/* GST/Business Number */}
                <div>
                  <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700">
                    GST/Business Number *
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('gstNumber', {
                        required: 'GST/Business number is required for sellers',
                        minLength: {
                          value: 5,
                          message: 'GST/Business number must be at least 5 characters'
                        }
                      })}
                      type="text"
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Enter your GST/Business number"
                    />
                  </div>
                  {errors.gstNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.gstNumber.message}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Business Address *
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      {...register('address', {
                        required: 'Business address is required for sellers',
                        minLength: {
                          value: 10,
                          message: 'Business address must be at least 10 characters'
                        }
                      })}
                      className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Enter your business address"
                    />
                  </div>
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm your password"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-center">
              <input
                id="acceptTerms"
                type="checkbox"
                {...register('acceptTerms', { required: 'You must accept the terms and conditions' })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                I accept the <a href="#" className="text-blue-600">terms and conditions</a>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="mt-1 text-sm text-red-600">{errors.acceptTerms.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#ff8c32] hover:bg-[#ff7a1a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
