import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../../services/apiWithToast';
import { CATEGORY_TREE, categoryNames, getSubcategories } from '../../constants/categories';

const MAX_IMAGE_MB = 5;
const MAX_GALLERY_FILES = 8;

function bytesToMB(size) {
  return size / (1024 * 1024);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result?.toString() || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AddProduct() {
  const [title, setTitle] = useState('');
  const [selectedCategory , setSelectedCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [hoverCategory, setHoverCategory] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [description, setDescription] = useState('');
  const [moq, setMoq] = useState('');
  const [brand, setBrand] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [customizationAvailable, setCustomizationAvailable] = useState('no');
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [mainImageData, setMainImageData] = useState('');
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [galleryData, setGalleryData] = useState([]);
  const [videoFileName, setVideoFileName] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Multi-step
  const [step, setStep] = useState(1);
  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));
  const steps = [1, 2, 3];

  // Supplier detail fields
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierCompany, setSupplierCompany] = useState('');
  const [supplierCity, setSupplierCity] = useState('');
  const [supplierState, setSupplierState] = useState('');

  const subcategoryOptions = useMemo(
    () => getSubcategories(hoverCategory || selectedCategory),
    [hoverCategory, selectedCategory]
  );

  // Validation
  const validateStep1 = () => {
    const e = {};
    if (!title.trim()) e.title = 'Product/Service Name is required.';
    if (!selectedCategory) e.category = 'Product Category is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!description.trim()) e.description = 'Description is required.';
    if (!mainImageData) e.mainImage = 'Main product image is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // File handlers
  const onMainImageChange = async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (bytesToMB(file.size) > MAX_IMAGE_MB) {
      setErrors((p) => ({ ...p, mainImage: `Main image must be <= ${MAX_IMAGE_MB} MB.` }));
      return;
    }
    const base64 = await fileToBase64(file);
    setMainImageData(base64);
    setMainImagePreview(base64);
    setErrors((p) => ({ ...p, mainImage: undefined }));
  };

  const onGalleryChange = async (ev) => {
    const files = Array.from(ev.target.files || []);
    if (files.length > MAX_GALLERY_FILES) {
      setErrors((p) => ({ ...p, gallery: `You can upload up to ${MAX_GALLERY_FILES} images.` }));
      return;
    }
    const oversized = files.find((f) => bytesToMB(f.size) > MAX_IMAGE_MB);
    if (oversized) {
      setErrors((p) => ({ ...p, gallery: `Each gallery image must be <= ${MAX_IMAGE_MB} MB.` }));
      return;
    }
    const base64s = await Promise.all(files.map(fileToBase64));
    setGalleryData(base64s);
    setGalleryPreviews(base64s);
    setErrors((p) => ({ ...p, gallery: undefined }));
  };

  const onVideoChange = (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    setVideoFileName(file.name);
  };

  const onPdfChange = (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    setPdfFileName(file.name);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (step === 1) return next();
    if (step === 2) {
      if (!validateStep1()) return;
      return next();
    }
    if (step === 3) {
      if (!validateStep2()) return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category: selectedCategory,
      images: [mainImageData, ...galleryData],
      specifications: {
        brandName: brand.trim(),
        minimumOrderQuantity: moq.trim(),
        deliveryTimeDays: deliveryDays.trim(),
        videoFileName,
        pdfFileName,
        subcategory,
        customizationAvailable,
        supplierName: supplierName.trim(),
        supplierPhone: supplierPhone.trim(),
        supplierEmail: supplierEmail.trim(),
        supplierCompany: supplierCompany.trim(),
        supplierCity: supplierCity.trim(),
        supplierState: supplierState.trim(),
      },
    };

    try {
      setSubmitting(true);
      const res = await productAPI.create(payload);
      if (res?.data?._id || res?.success) navigate('/seller/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2f3284] py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
           <h1 className="text-2xl font-semibold ml-24 text-white">Add Product</h1>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex mr-24 items-center gap-2 px-3 py-2 rounded border border-gray-300 text-white hover:bg-gray-50"
        >
          ← Back
        </button>
     
      </div>

      {/* Stepper */}
<div className="flex items-center justify-center ml-[360px] mb-6">
  {steps.map((s, idx) => {
    const completed = step > s;
    const current = step === s;
    return (
      <div key={s} className="flex-1 flex items-center">
        {/* Circle */}
        <div
          className={`w-8 h-8 flex items-center justify-center rounded-full border-2 text-white font-semibold
            ${completed ? 'bg-[#ff6600] border-[#ff6600]' : current ? 'bg-[#ff9900] border-[#ff6600]' : 'bg-gray-200 border-gray-300'}
          `}
        >
          {s}
        </div>

        {/* Connector line */}
        {idx < steps.length - 1 && (
          <div
            className={`flex-1 h-1 ${
              step > s ? 'bg-[#ff6600]' : 'bg-gray-200'
            }`}
          />
        )}
      </div>
    );
  })}
</div>



      {/* Form */}
      <div className="min-h-screen bg-[#2f3284] py-8 flex justify-center items-start">
      <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-6 border border-gray-300 rounded-lg p-6 bg-white ">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Supplier Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Supplier Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Supplier full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="+91-XXXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  placeholder="supplier@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={supplierCompany}
                  onChange={(e) => setSupplierCompany(e.target.value)}
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={supplierCity}
                  onChange={(e) => setSupplierCity(e.target.value)}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={supplierState}
                  onChange={(e) => setSupplierState(e.target.value)}
                  placeholder="State"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Product Basics</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter product name"
              />
              {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                className="w-small border rounded px-3 py-2"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSubcategory('');
                  setHoverCategory('');
                }}
              >
                <option value="">Select category</option>
                {categoryNames.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subcategory</label>
              <select
                className="w-small border rounded px-3 py-2"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                disabled={!selectedCategory}
              >
                <option value="">{selectedCategory ? 'Select subcategory' : 'Select category first'}</option>
                {getSubcategories(selectedCategory).map((sc) => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Order Quantity</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="e.g. 10 Kg, 100 Pieces"
                value={moq}
                onChange={(e) => setMoq(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Delivery Time (in days)</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2"
                placeholder="Enter delivery time in days"
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Brand Name</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="Enter brand name"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Customization Available ?</label>
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="customization"
                    value="yes"
                    checked={customizationAvailable === 'yes'}
                    onChange={(e) => setCustomizationAvailable(e.target.value)}
                  />
                  <span>Yes</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="customization"
                    value="no"
                    checked={customizationAvailable === 'no'}
                    onChange={(e) => setCustomizationAvailable(e.target.value)}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Description & Media</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Product/Service Description</label>
              <textarea
                className="w-full border rounded px-3 py-2 min-h-[160px]"
                placeholder="Describe your product/service"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Main Product Image</label>
              <input type="file" accept="image/*" onChange={onMainImageChange} />
              <p className="text-xs text-gray-500 mt-1">Max {MAX_IMAGE_MB} MB. JPG/PNG.</p>
              {errors.mainImage && <p className="text-red-600 text-sm mt-1">{errors.mainImage}</p>}
              {mainImagePreview && (
                <img src={mainImagePreview} alt="Main preview" className="mt-3 h-28 w-28 object-cover rounded border" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gallery / Reference Images</label>
              <input multiple type="file" accept="image/*" onChange={onGalleryChange} />
              <p className="text-xs text-gray-500 mt-1">Up to {MAX_GALLERY_FILES} images, each ≤ {MAX_IMAGE_MB} MB.</p>
              {errors.gallery && <p className="text-red-600 text-sm mt-1">{errors.gallery}</p>}
              {!!galleryPreviews.length && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {galleryPreviews.map((src, idx) => (
                    <img key={idx} src={src} alt={`Gallery ${idx + 1}`} className="h-20 w-20 object-cover rounded border" />
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Video (filename)</label>
                <input type="file" accept="video/*" onChange={onVideoChange} />
                {videoFileName && <p className="text-xs text-gray-600 mt-1">Selected: {videoFileName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Brochure PDF (filename)</label>
                <input type="file" accept="application/pdf" onChange={onPdfChange} />
                {pdfFileName && <p className="text-xs text-gray-600 mt-1">Selected: {pdfFileName}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={back}
            disabled={step === 1}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-[#ff6600] text-white hover:bg-[#ff6600] disabled:opacity-50"
            disabled={submitting}
          >
            {step < 3 ? 'Next' : (submitting ? 'Saving...' : 'Save Product')}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
