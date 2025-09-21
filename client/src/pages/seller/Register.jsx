import React, { useMemo, useState , useEffect} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, ArrowLeft, ArrowRight, ShieldCheck, Upload, Building2, FileText, Globe, Image as ImageIcon } from 'lucide-react';
import { authAPI } from '../../services/apiWithToast';

const categories = ['Textiles', 'Electronics', 'Food & Beverages', 'Automobiles', 'Furniture', 'Handicrafts', 'Health & Beauty', 'Stationery', 'Construction', 'IT Services'];
const businessTypes = ['Proprietorship', 'Partnership', 'Pvt. Ltd.', 'LLP'];

const initialState = {
  // OTP step
  name: '',
  email: '',
  phone: '',
  otpId: null,
  otp: '',
  otpVerified: false,

  // Step 1: Basic
  companyName: '',
  gstNumber: '',
  gstVerified: false,
  businessType: '',
  businessCategory: '',
  description: '',

  // Step 2: Contact
  businessEmail: '',
  alternatePhone: '',

  // Step 3: Address
  address: {
    street: '',
    city: '',
    state: '',
    pincode: '',
    district: '',
    country: 'India'
  },

  // Step 4: Online
  websiteUrl: '',
  facebook: '',
  instagram: '',
  linkedin: '',

  // Step 5: Docs & Bank
  password: '',
  confirmPassword: '',
  gstCertificate: null, // base64
  panNumber: '',
  bankDetails: {
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  },
  companyLogo: null, // base64
  yearsInBusiness: '',
  totalEmployees: '',

  // Step 6: Images (min 2 with specific tags)
  videos: [], 
  images: [], // [{url, tag}]
};

const steps = [
  { key: 'otp', label: 'OTP' },
  { key: 'basic', label: 'Basic' },
  { key: 'contact', label: 'Contact' },
  { key: 'address', label: 'Address' },
  { key: 'online', label: 'Online' },
  { key: 'documents', label: 'Documents' },
  { key: 'images', label: 'Images' }
];

function SellerRegister() {
  const [data, setData] = useState(initialState);
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // Add password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const progress = useMemo(() => Math.round((current) * 100 / (steps.length - 1)), [current]);


  // Prefill Logic
  useEffect(() => {
    // Priority: location.state.prefill -> localStorage.sellerRegistrationDraft
    const statePrefill = location.state?.prefill;
    const ls = localStorage.getItem('sellerRegistrationDraft');
    let draft = null;
    try {
      draft = ls ? JSON.parse(ls) : null;
    } catch {}

    const prefill = statePrefill || draft;
    if (prefill && typeof prefill === 'object') {
      setData(prev => ({
        ...prev,
        ...prefill,
        address: { ...prev.address, ...(prefill.address || {}) },
        bankDetails: { ...prev.bankDetails, ...(prefill.bankDetails || {}) },
        images: Array.isArray(prefill.images) ? prefill.images : prev.images
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);





  const addVideoFromFile = async (file) => {
    // Simple base64 reader (same pattern as images if used)
    const toBase64 = (f) => new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(f);
    });
    const url = await toBase64(file);
    setData(prev => ({ ...prev, videos: [...(prev.videos || []), { url, tag: 'premises', title: 'Premises video' }] }));
  };





  const handleInput = (path, value) => {
    setData(prev => {
      const clone = structuredClone(prev);
      const keys = Array.isArray(path) ? path : [path];
      let obj = clone;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return clone;
    });
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const requestOtp = async () => {
    // DEV: Bypass OTP sending
    handleInput('otpId', 'DEV_BYPASS');
    toast.success('DEV: OTP step bypassed (no email sent)');
  };

  const verifyOtp = async () => {
    // DEV: Bypass OTP verification
    handleInput('otpVerified', true);
    toast.success('DEV: OTP verification bypassed');
    setCurrent(1);
  };

  const verifyGST = async () => {
    // DEV: Bypass GST verification
    handleInput('gstVerified', true);
    toast.success('DEV: GST verification bypassed');
  };

  const next = () => {
    // step-wise validations
    if (current === 0) {
      // DEV: skip OTP check
      // previously: if (!data.otpVerified) return toast.error('Please verify OTP to continue');
    }
    if (current === 1) {
      if (!data.companyName) return toast.error('Company name is required');
      if (!data.businessType) return toast.error('Business type is required');
      if (!data.businessCategory) return toast.error('Business category is required');
    }
    if (current === 2) {
      if (!data.businessEmail) return toast.error('Business email is required');
    }
    if (current === 3) {
      const a = data.address;
      if (!a.street || !a.city || !a.state || !a.pincode) {
        return toast.error('Complete address is required');
      }
    }
    if (current === 5) {
      if (!data.password || data.password.length < 6) return toast.error('Password (min 6 chars) is required');
      if (data.password !== data.confirmPassword) return toast.error('Passwords do not match');
      if (!data.bankDetails.accountHolderName || !data.bankDetails.accountNumber || !data.bankDetails.ifscCode) {
        return toast.error('Bank details are required');
      }
    }
    if (current === 6) {
      // images step validation occurs on submit
    }
    setCurrent(c => Math.min(steps.length - 1, c + 1));
  };

  const prev = () => setCurrent(c => Math.max(0, c - 1));

  const handleFile = async (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await toBase64(file);
    handleInput(target, base64);
  };

  const addImage = async (e, tag) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await toBase64(file);
    setData(prev => ({ ...prev, images: [...prev.images, { url: base64, tag }] }));
  };

  const removeImage = (idx) => {
    setData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const submit = async () => {
    if (data.images.length < 2) return toast.error('At least 2 business images are required');
    const hasLandmark = data.images.some(i => i.tag === 'landmark');
    const hasBoard = data.images.some(i => i.tag === 'board');
    if (!hasLandmark || !hasBoard) return toast.error('One landmark and one business board image required');

    setSubmitting(true);
    try {
      // Save draft so if rejected later, we can prefill
      localStorage.setItem('sellerRegistrationDraft', JSON.stringify(data));

      const payload = {
        otpId: data.otpId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,

        companyName: data.companyName,
        gstNumber: data.gstNumber,
        businessType: data.businessType,
        businessCategory: data.businessCategory,
        description: data.description,

        businessEmail: data.businessEmail,
        alternatePhone: data.alternatePhone,

        address: data.address,

        websiteUrl: data.websiteUrl,
        facebook: data.facebook,
        instagram: data.instagram,
        linkedin: data.linkedin,

        gstCertificate: data.gstCertificate,
        panNumber: data.panNumber,
        bankDetails: data.bankDetails,
        companyLogo: data.companyLogo,
        yearsInBusiness: Number(data.yearsInBusiness || 0),
        totalEmployees: Number(data.totalEmployees || 0),

        sellerRole: data.sellerRole, // NEW
        address: {
          street: data.address?.street,
          city: data.address?.city,
          state: data.address?.state,
          pincode: data.address?.pincode,
          country: data.address?.country,
          district: data.address?.district, // NEW
        },
        images: data.images || [],
        videos: data.videos || []
      };

      // Check if email already exists and is suspended -> resubmit instead of new register
      let shouldResubmit = false;
      try {
        const s = await authAPI.getStatusByEmail(data.email);
        const exists = Boolean(s?.data?.exists);
        const status = s?.data?.status;
        if (exists && status === 'suspended') {
          shouldResubmit = true;
        } else if (exists && status === 'active') {
          toast.error('This email is already registered and approved. Please login.');
          return;
        }
      } catch {
        // ignore status check failure; fallback to normal register
      }

      if (shouldResubmit) {
        const res = await fetch('/api/seller/resubmit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Resubmission failed');

        toast.success('Application resubmitted! Your account is pending approval.');
        localStorage.setItem('pendingEmail', data.email);
        localStorage.setItem('pendingName', data.name);
        navigate(`/seller/pending-approval?email=${encodeURIComponent(data.email)}`);
        return;
      }

      // Else proceed with fresh registration
      const res = await fetch('/api/seller/register-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Registration failed');

      toast.success('Registration submitted! Your seller account is pending approval.');
      localStorage.setItem('pendingEmail', data.email);
      localStorage.setItem('pendingName', data.name);
      navigate(`/seller/pending-approval?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-[#2f3284] py-10">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
        {location.state?.fromRejected && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded p-3 text-sm">
            Your previous application was rejected.
            {location.state?.rejectedReason ? (
              <span className="block mt-1">Reason: {location.state.rejectedReason}</span>
            ) : null}
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Become a Seller</h1>
          <div className="text-sm text-gray-600">Step {current + 1} of {steps.length}</div>
        </div>

        {/* Progress */}
        <div className="w-full bg-gray-200 rounded h-2 mb-6">
          <div className="bg-[#ff6600] h-2 rounded" style={{ width: `${progress}%` }} />
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-7 gap-2 mb-8">
          {steps.map((s, idx) => (
            <div key={s.key} className={`text-center text-xs ${idx <= current ? 'text-[#ff6600]' : 'text-gray-400'}`}>
              <div className={`mx-auto w-7 h-7 rounded-full flex items-center justify-center ${idx <= current ? 'bg-[#f1cdb4]' : 'bg-gray-100'}`}>
                {idx < current ? <CheckCircle className="w-4 h-4 text-[#ff6600]" /> : idx === current ? <span className="font-bold">{idx+1}</span> : <span>{idx+1}</span>}
              </div>
              <div className="mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        {current === 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm">Full Name<span className="text-red-500">*</span></label>
                <input className="w-full border rounded px-3 py-2" value={data.name} onChange={e => handleInput('name', e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Email <span className="text-red-500">*</span></label>
                <input className="w-full border rounded px-3 py-2" value={data.email} onChange={e => handleInput('email', e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Phone<span className="text-red-500">*</span></label>
                <input className="w-full border rounded px-3 py-2" value={data.phone} onChange={e => handleInput('phone', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" className="px-4 py-2 bg-[#ff6600] text-white rounded" onClick={requestOtp}>Generate OTP</button>
              <input className="border rounded px-3 py-2" placeholder="Enter OTP" value={data.otp} onChange={e => handleInput('otp', e.target.value)} />
              <button type="button" className="px-4 py-2 bg-green-600 text-white rounded" onClick={verifyOtp}>Verify OTP</button>
            </div>
            {data.otpVerified && (
              <div className="flex items-center text-green-700">
                <ShieldCheck className="w-5 h-5 mr-2" /> OTP Verified
              </div>
            )}

             <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Register user as</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={data.sellerRole}
            onChange={(e) => setData(prev => ({ ...prev, sellerRole: e.target.value }))}
            required
          >
            <option value="">Select</option>
            <option value="Merchant Exporter">Merchant Exporter</option>
            <option value="Manufacturer & Exporter">Manufacturer & Exporter</option>
            <option value="Merchant & Manufacturer Exporter">Merchant & Manufacturer Exporter</option>
            <option value="Only Manufacturer">Only Manufacturer</option>
          </select>
        </div>
          </div>
        )}

        {current === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input className="w-full border rounded px-3 py-2" value={data.companyName} onChange={e => handleInput('companyName', e.target.value)} />
              </div>
              <div>
                <label className="text-sm">GST Number</label>
                <div className="flex gap-2">
                  <input className="w-full border rounded px-3 py-2 uppercase" value={data.gstNumber} onChange={e => handleInput('gstNumber', e.target.value.toUpperCase())} />
                  <button type="button" className="px-3 py-2 border rounded" onClick={verifyGST}>Verify GST</button>
                </div>
                {data.gstVerified && <div className="text-green-600 text-sm mt-1">GST Verified</div>}
              </div>
              <div>
                <label className="text-sm">
                  Business Type <span className="text-red-500">*</span>
                </label>
                <select className="w-full border rounded px-3 py-2" value={data.businessType} onChange={e => handleInput('businessType', e.target.value)}>
                  <option value="">Select</option>
                  {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm">
                  Business Category <span className="text-red-500">*</span>
                </label>
                <select className="w-full border rounded px-3 py-2" value={data.businessCategory} onChange={e => handleInput('businessCategory', e.target.value)}>
                  <option value="">Select</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm">Description</label>
              <textarea className="w-full border rounded px-3 py-2" rows={3} value={data.description} onChange={e => handleInput('description', e.target.value)} />
            </div>
          </div>
        )}

        {current === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm">
                  Business Email <span className="text-red-500">*</span>
                </label>
                <input className="w-full border rounded px-3 py-2" value={data.businessEmail} onChange={e => handleInput('businessEmail', e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Phone</label>
                <input className="w-full border rounded px-3 py-2" value={data.phone} readOnly />
              </div>
              <div>
                <label className="text-sm">Alternate Phone</label>
                <input className="w-full border rounded px-3 py-2" value={data.alternatePhone} onChange={e => handleInput('alternatePhone', e.target.value)} />
              </div>

          
       

            </div>
          </div>
        )}

        {current === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Registered Address <span className="text-red-500">*</span>
                </label>
                <input className="w-full border rounded px-3 py-2" value={data.address.street} onChange={e => handleInput(['address', 'street'], e.target.value)} />
              </div>
              <div>
                <label className="text-sm">City <span className="text-red-500">*</span>
                </label>
                <input className="w-full border rounded px-3 py-2" value={data.address.city} onChange={e => handleInput(['address', 'city'], e.target.value)} />
              </div>
              <div>
                <label className="text-sm">State <span className="text-red-500">*</span>
                </label>
                <input className="w-full border rounded px-3 py-2" value={data.address.state} onChange={e => handleInput(['address', 'state'], e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Pincode <span className="text-red-500">*</span>
                </label>
                <input className="w-full border rounded px-3 py-2" value={data.address.pincode} onChange={e => handleInput(['address', 'pincode'], e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Country</label>
                <input className="w-full border rounded px-3 py-2" value={data.address.country} onChange={e => handleInput(['address', 'country'], e.target.value)} />
              </div>
              <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={data.address?.district || ''}
              onChange={(e) =>
                setData(prev => ({ ...prev, address: { ...prev.address, district: e.target.value } }))
              }
              placeholder="Enter district"
            />
          </div>
            </div>
          </div>
        )}

        {current === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Website URL</label>
                <input className="w-full border rounded px-3 py-2" value={data.websiteUrl} onChange={e => handleInput('websiteUrl', e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Facebook</label>
                <input className="w-full border rounded px-3 py-2" value={data.facebook} onChange={e => handleInput('facebook', e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Instagram</label>
                <input className="w-full border rounded px-3 py-2" value={data.instagram} onChange={e => handleInput('instagram', e.target.value)} />
              </div>
              <div>
                <label className="text-sm">LinkedIn</label>
                <input className="w-full border rounded px-3 py-2" value={data.linkedin} onChange={e => handleInput('linkedin', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {current === 5 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full border rounded px-3 py-2 pr-16"
                    value={data.password}
                    onChange={e => handleInput('password', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600"
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm">Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full border rounded px-3 py-2 pr-16"
                    value={data.confirmPassword}
                    onChange={e => handleInput('confirmPassword', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600"
                    onClick={() => setShowConfirmPassword(v => !v)}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm">GST Certificate (JPG/PNG/PDF)</label>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => handleFile(e, 'gstCertificate')} />
              </div>
              <div>
                <label className="text-sm">PAN Number</label>
                <input className="w-full border rounded px-3 py-2" value={data.panNumber} onChange={e => handleInput('panNumber', e.target.value)} />
              </div>

              <div>
                <label className="text-sm">
                  Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input className="w-full border rounded px-3 py-2" value={data.bankDetails.accountHolderName} onChange={e => handleInput(['bankDetails','accountHolderName'], e.target.value)} />
              </div>
              <div>
                <label className="text-sm">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input className="w-full border rounded px-3 py-2" value={data.bankDetails.accountNumber} onChange={e => handleInput(['bankDetails','accountNumber'], e.target.value)} />
              </div>
              <div>
                <label className="text-sm">IFSC Code</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={data.bankDetails.ifscCode}
                  onChange={e => handleInput(['bankDetails','ifscCode'], e.target.value)}
                />
              </div>
              {/* <div>
                <label className="text-sm">UPI ID</label>
                <input className="w-full border rounded px-3 py-2" value={data.bankDetails.upiId} onChange={e => handleInput(['bankDetails','upiId'], e.target.value)} />
              </div> */}

              <div>
                <label className="text-sm">Company Logo</label>
                <input type="file" accept=".jpg,.jpeg,.png" onChange={e => handleFile(e, 'companyLogo')} />
              </div>
              <div>
                <label className="text-sm">Years in Business</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={data.yearsInBusiness} onChange={e => handleInput('yearsInBusiness', e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Total Employees</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={data.totalEmployees} onChange={e => handleInput('totalEmployees', e.target.value)} />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Upload guidelines: JPG, PNG (or PDF for GST), not blurred, clear background.
            </div>
          </div>
        )}

        {current === 6 && (
          <div className="space-y-4">
            <div className="flex gap-3 items-center">
              <label className="text-sm font-medium">Add Landmark Image</label>
              <input type="file" accept=".jpg,.jpeg,.png" onChange={e => addImage(e, 'landmark')} />
            </div>
            <div className="flex gap-3 items-center">
              <label className="text-sm font-medium">Add Business Board Image</label>
              <input type="file" accept=".jpg,.jpeg,.png" onChange={e => addImage(e, 'board')} />
            </div>
            <div className="flex gap-3 items-center">
              <label className="text-sm font-medium">Add Other Image</label>
              <input type="file" accept=".jpg,.jpeg,.png" onChange={e => addImage(e, 'other')} />
            </div>

                  <div className="pt-4 border-t">
          <h3 className="text-md font-semibold mb-2">Video premises entrance / any manufacturing facility</h3>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) addVideoFromFile(f); }}
              className="block"
            />
            <span className="text-sm text-gray-500">or paste video URL</span>
          </div>
          <div className="mt-2">
            <input
              type="url"
              placeholder="https://..."
              className="w-full border rounded px-3 py-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const v = e.currentTarget.value.trim();
                  if (v) {
                    setData(prev => ({ ...prev, videos: [...(prev.videos || []), { url: v, tag: 'premises', title: 'Premises video' }] }));
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
          </div>
          {/* <div className="pt-4 border-t"> */}
            {/* <h3 className="text-md font-semibold mb-2">Video premises entrance / any manufacturing facility</h3> */}
            {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {data.videos.map((video, idx) => (
                <div key={idx} className="border rounded p-2">
                  <div className="text-xs mb-1 uppercase">{video.tag}</div>
                  <video alt={video.tag} src={video.url} className="w-full h-24 object-cover rounded" />  
                  <button className="mt-2 text-xs text-red-600" onClick={() => removeImage(idx)}>Remove</button>
                </div>
              ))}
            </div> */}
          {/* </div> */}


              <div className="mt-3 space-y-2">
            {(data.videos || []).map((v, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 border rounded p-2">
                <div className="text-sm truncate">{v.url?.slice(0, 80)}</div>
                <button
                  type="button"
                  className="text-red-600"
                  onClick={() =>
                    setData(prev => ({ ...prev, videos: prev.videos.filter((_, i) => i !== idx) }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

      {/* )}   */}

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between">
          <button className="px-4 py-2 border rounded flex items-center gap-2" disabled={current === 0} onClick={prev}>
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>
          {current < steps.length - 1 ? (
            <button className="px-4 py-2 bg-[#ff6600] text-white rounded flex items-center gap-2" onClick={next}>
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2" onClick={submit}>
              <Upload className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SellerRegister;
