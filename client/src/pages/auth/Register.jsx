import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Building2, Phone, MapPin, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI as authApiWithToast } from '../../services/apiWithToast';
import { useToast } from '../../context/ToastContext';

const Register = () => {
  const [step, setStep] = useState(1);
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors }
  } = useForm();

  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  // Helper for toast to match used API
  const toast = { error: showError, success: showSuccess };

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Buyer-specific logic
  const userRole = 'buyer';
  const password = watch('password');
  const proofType = watch('proofType');

  // OTP States
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Proof Upload State
  const [proofImage, setProofImage] = useState(null);

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('File size should be less than 2MB');
        return;
      }
      try {
        const base64 = await toBase64(file);
        setProofImage(base64);
        toast.success('Proof initialized');
      } catch (err) {
        toast.error('Failed to process proof file');
      }
    }
  };

  const requestOtp = async () => {
    const email = watch('email');
    const phone = watch('phone');
    const name = watch('name');

    if (!email) {
      toast.error('Please enter email to receive OTP');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await authApiWithToast.requestOtp({ name, email, phone });
      const newOtpId = res?.data?.otpId;
      if (newOtpId) {
        setOtpId(newOtpId);
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
    if (!otpId) {
      toast.error('Please generate OTP first');
      return;
    }
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    setIsVerifyingOtp(true);
    try {
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

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Ensure OTP is verified for buyers
      if (userRole === 'buyer' && !otpVerified) {
        toast.error('Please verify OTP before registering');
        setIsLoading(false);
        return;
      }

      // Proof validation if proofType is selected
      if (data.proofType && !proofImage) {
        toast.error('Please upload the proof document');
        setIsLoading(false);
        return;
      }

      await authApiWithToast.register({
        ...data,
        role: userRole,
        otpId, // Include otpId if validation needed on backend
        proofImage // Include proof image base64
      });

      // Navigate to login on success
      navigate('/login');
    } catch (error) {
      console.error(error);
      // Toast handled by authAPI
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) fieldsToValidate = ['name', 'email', 'phone'];
    if (step === 2) fieldsToValidate = ['companyName', 'domainName'];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      // Step 1 extra check: OTP
      if (step === 1 && userRole === 'buyer') {
        if (!otpVerified) {
          toast.error('Please verify OTP before proceeding');
          return;
        }
      }
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => setStep(prev => prev - 1);

  // ... (keep onSubmit logic same, just remove duplicate validation if handled by step)

  const renderStep1 = () => (
    <div className="space-y-4">
      {/* Name, Email, Phone, OTP Fields here (moved from original) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Full Name *</label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
          <input {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Min 2 chars' } })} className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 py-2 border" placeholder="Full Name" />
        </div>
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email *</label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
          <input {...register('email', { required: 'Required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })} className="pl-10 block w-full border-gray-300 rounded-md py-2 border" placeholder="Email" />
        </div>
        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}

        {userRole === 'buyer' && (
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={requestOtp} disabled={isSendingOtp} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">{isSendingOtp ? 'Sending...' : 'Get OTP'}</button>
            <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="OTP" className="border rounded px-2 w-24" />
            <button type="button" onClick={verifyOtp} disabled={isVerifyingOtp} className="px-3 py-1 bg-green-600 text-white rounded text-sm">{isVerifyingOtp ? 'Verifying...' : 'Verify'}</button>
            {otpVerified && <span className="text-green-600 text-sm flex items-center">Verified</span>}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-gray-400" /></div>
          <input {...register('phone', { pattern: { value: /^[0-9]+$/, message: 'Invalid phone' } })} className="pl-10 block w-full border-gray-300 rounded-md py-2 border" placeholder="Phone" />
        </div>
        {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Company Name (Optional)</label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Building2 className="h-5 w-5 text-gray-400" /></div>
          <input {...register('companyName')} className="pl-10 block w-full border-gray-300 rounded-md py-2 border" placeholder="Company Name" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Domain Name (Optional)</label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Building2 className="h-5 w-5 text-gray-400" /></div>
          <input {...register('domainName', { pattern: { value: /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/, message: 'Invalid domain' } })} className="pl-10 block w-full border-gray-300 rounded-md py-2 border" placeholder="example.com" />
        </div>
        <p className="text-xs text-gray-500 mt-1">Domains &gt; 6 months are auto-verified.</p>
        {errors.domainName && <p className="text-red-600 text-sm mt-1">{errors.domainName.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Optional Proof (Select Document)</label>
        <div className="mt-1">
          <select {...register('proofType')} className="block w-full border-gray-300 rounded-md py-2 border pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <option value="">Select Document Type</option>
            <option value="Past BL copy">Past BL copy</option>
            <option value="Custom Declaration">Custom Declaration</option>
            <option value="Supplier Invoice">Supplier Invoice</option>
            <option value="LC copy">LC copy</option>
          </select>
        </div>
      </div>

      {proofType && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Upload {proofType}</label>
          <div className="mt-1">
            <div className="relative flex items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              {proofImage ? (
                <div className="relative w-full h-full p-2">
                  <img src={proofImage} alt="Proof" className="w-full h-full object-contain rounded-lg" />
                  <button type="button" onClick={() => setProofImage(null)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">X</button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500">Click to upload image</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleProofUpload} />
                </label>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Password *</label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
          <input type={showPassword ? "text" : "password"} {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })} className="pl-10 block w-full border-gray-300 rounded-md py-2 border" placeholder="Password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2"><Eye className="h-4 w-4 text-gray-400" /></button>
        </div>
        {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
          <input type={showConfirmPassword ? "text" : "password"} {...register('confirmPassword', { validate: v => v === password || 'Mismatch' })} className="pl-10 block w-full border-gray-300 rounded-md py-2 border" placeholder="Confirm Password" />
        </div>
        {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>}
      </div>
      <div className="flex items-center">
        <input type="checkbox" {...register('acceptTerms', { required: 'Required' })} className="h-4 w-4 text-blue-600 rounded" />
        <label className="ml-2 text-sm text-gray-900">Accept Terms & Conditions</label>
      </div>
      {errors.acceptTerms && <p className="text-red-600 text-sm">{errors.acceptTerms.message}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2f3284] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 border border-gray-300 rounded-lg shadow-md bg-white p-8 relative">
        <div className="absolute top-4 right-4">
          <button
            onClick={() => navigate('/seller/register')}
            className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 font-medium transition-colors"
          >
            Register as Seller
          </button>
        </div>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create Buyer Account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Step {step} of 3</p>
          {/* Simple Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <div className="flex justify-between gap-4">
            {step > 1 && (
              <button type="button" onClick={prevStep} className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Back</button>
            )}
            {step < 3 ? (
              <button type="button" onClick={nextStep} className="w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Next</button>
            ) : (
              <button type="submit" disabled={isLoading} className="w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-[#ff8c32] hover:bg-[#ff7a1a]">
                {isLoading ? 'Creating...' : 'Create Account'}
              </button>
            )}
          </div>

          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-500">Already have an account? Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
