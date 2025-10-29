import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productAPI, rfqAPI } from '../services/api';
import { CheckCircle } from 'lucide-react';

const tradeTermsOptions = ['FOB', 'CIF', 'EXW', 'DDP'];
// Currency dropdown options
const currencyOptions = ['USD','EUR','GBP','RMB','AUD','CAD','CHF','JPY','HKD','NZD','SGD','NTD','Other'];
// Home page categories
const homeCategories = [
  'Machinery & Parts',
  'Electronics & Electricals',
  'Textiles & Garments',
  'Furniture & Decor',
  'Automobile & Spares',
  'Construction & Hardware',
  'Food & Beverages',
  'Health & Beauty',
  'Handicrafts & Gifts',
  'Stationery & Office',
  'IT Services'
];

// Category -> Subcategory mapping (for popup selector)
const categoryTree = {
  'Machinery & Parts': ['Industrial Machines', 'Spare Parts', 'Tools', 'Pumps', 'Valves'],
  'Electronics & Electricals': ['Consumer Electronics', 'Components', 'Lighting', 'Wires & Cables', 'Switches'],
  'Textiles & Garments': ['Fabrics', 'Apparel', 'Home Textiles', 'Accessories', 'Yarn'],
  'Furniture & Decor': ['Living Room', 'Office Furniture', 'Outdoor', 'Decor', 'Kitchen'],
  'Automobile & Spares': ['Car Parts', 'Motorcycle Parts', 'Tyres', 'Lubricants', 'Accessories'],
  'Construction & Hardware': ['Bathroom Fittings', 'Doors & Windows', 'Building Materials', 'Hardware', 'Flooring'],
  'Food & Beverages': ['Grains', 'Processed Foods', 'Beverages', 'Spices', 'Packaging'],
  'Health & Beauty': ['Personal Care', 'Medical Supplies', 'Cosmetics', 'Wellness', 'Salon'],
  'Handicrafts & Gifts': ['Handmade', 'Festive Gifts', 'Corporate Gifts', 'Home Decor', 'Art & Craft'],
  'Stationery & Office': ['Office Supplies', 'Paper Products', 'Printing', 'Educational', 'IT Peripherals'],
  'IT Services': ['Software Development', 'Cloud', 'Cybersecurity', 'IT Support', 'Data Analytics']
};

const PostRequirement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const categories = homeCategories;
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]); // main category used for RFQ routing
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [categoryPath, setCategoryPath] = useState('');
  const [form, setForm] = useState({
    productName: '',
    purchaseQuantity: 1,
    tradeTerms: tradeTermsOptions[0],
    targetUnitPrice: '',
    // add currency state for target unit price
    targetUnitPriceCurrency: 'USD',
    maxBudget: '',
    // add currency state for max budget
    maxBudgetCurrency: 'USD',
    details: '',
    buyerContact: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      companyName: user?.companyName || ''
    },
    deliveryLocation: {
      address: '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || '',
      country: user?.address?.country || 'India'
    }
  });

  const updateField = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setForm((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const openCategoryPicker = () => setCategoryModalOpen(true);
  const confirmCategorySelection = () => {
    if (!activeCategory || !activeSubcategory) return;
    const path = `${activeCategory} > ${activeSubcategory}`;
    setCategoryPath(path);
    setSelectedCategories(activeCategory ? [activeCategory] : []);
    setCategoryModalOpen(false);
  };

  const isBuyer = user?.role === 'buyer';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!isBuyer) {
        // Allow viewing the form for everyone, but require login on submit
        navigate('/login');
        return;
      }

      if (!activeCategory || !activeSubcategory) {
        alert('Please select category and subcategory');
        return;
      }

      const createdRFQs = [];
      for (const cat of selectedCategories) {
        // Find one active product in this category to anchor RFQ routing
        let productId = null;
        try {
          const resp = await productAPI.getAll({ page: 1, limit: 1, category: cat });
          const list = resp.data?.products || resp.data || resp.products || [];
          if (Array.isArray(list) && list.length) {
            productId = list[0]._id;
          }
        } catch (err) {
          console.error('Category fetch error', cat, err);
        }

        if (!productId) {
          console.warn(`No active products found in category ${cat}. Skipping.`);
          continue;
        }

        const composedMessage = [
          form.details?.trim() ? `Details: ${form.details.trim()}` : null,
          form.productName?.trim() ? `Product: ${form.productName.trim()}` : null,
          form.tradeTerms ? `Trade Terms: ${form.tradeTerms}` : null,
          form.targetUnitPrice ? `Target Unit Price: ${form.targetUnitPrice} ${form.targetUnitPriceCurrency}` : null,
          form.maxBudget ? `Max Budget: ${form.maxBudget} ${form.maxBudgetCurrency}` : null
        ]
          .filter(Boolean)
          .join('\n');

        const rfqPayload = {
          productId,
          quantity: Number(form.purchaseQuantity || 1),
          targetPrice: form.targetUnitPrice ? Number(form.targetUnitPrice) : undefined,
          // expectedDeliveryDate removed with Shipping & Payment section
          message: composedMessage || 'Requirement details enclosed',
          buyerContact: {
            email: form.buyerContact.email,
            phone: form.buyerContact.phone,
            companyName: form.buyerContact.companyName
          },
          deliveryLocation: {
            ...form.deliveryLocation
          }
        };

        try {
          const res = await rfqAPI.submit(rfqPayload);
          // res.data.rfqs may contain multiple RFQs (distributed). Accumulate for summary.
          const rfqs = res.data?.rfqs || res.rfqs || [];
          createdRFQs.push(...rfqs);
        } catch (err) {
          console.error('RFQ submit failed for', cat, err);
        }
      }

      if (createdRFQs.length) {
        alert(`Requirement submitted! Distributed RFQs: ${createdRFQs.length}`);
        navigate('/buyer/rfqs');
      } else {
        alert('No RFQs created. Try a different category.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-[#2f3284] py-4">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-white text-2xl font-bold">Post My Requirement</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Tell suppliers what you need</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Product Information */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Basic Product Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    name="productName"
                    value={form.productName}
                    onChange={updateField}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Enter a specific product name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={categoryPath}
                      readOnly
                      className="flex-1 border rounded px-3 py-2 bg-gray-50"
                      placeholder="Click Select to choose category and subcategory"
                    />
                    <button type="button" onClick={openCategoryPicker} className="px-4 py-2 border rounded">Select</button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Select a category from the popup, then choose a subcategory.</p>
                  {!categoryPath && (
                    <p className="text-xs text-red-600 mt-1">Please select a category and subcategory.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Quantity</label>
                  <input
                    type="number"
                    name="purchaseQuantity"
                    value={form.purchaseQuantity}
                    onChange={updateField}
                    min={1}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g. 1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trade Terms</label>
                  <select name="tradeTerms" value={form.tradeTerms} onChange={updateField} className="w-full border rounded px-3 py-2">
                    {tradeTermsOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Unit Price</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="targetUnitPrice"
                      value={form.targetUnitPrice}
                      onChange={updateField}
                      min={0}
                      step={0.01}
                      className="w-full border rounded px-3 py-2"
                    />
                    <select
                      name="targetUnitPriceCurrency"
                      value={form.targetUnitPriceCurrency}
                      onChange={updateField}
                      className="w-32 border rounded px-2 py-2"
                    >
                      {currencyOptions.map((cur) => (
                        <option key={cur} value={cur}>{cur}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="maxBudget"
                      value={form.maxBudget}
                      onChange={updateField}
                      min={0}
                      step={0.01}
                      className="w-full border rounded px-3 py-2"
                    />
                    <select
                      name="maxBudgetCurrency"
                      value={form.maxBudgetCurrency}
                      onChange={updateField}
                      className="w-32 border rounded px-2 py-2"
                    >
                      {currencyOptions.map((cur) => (
                        <option key={cur} value={cur}>{cur}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                  <textarea
                    name="details"
                    value={form.details}
                    onChange={updateField}
                    rows={4}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Describe color, material, size, specs, certifications…"
                  />
                </div>
              </div>
            </section>

            {/* Shipping & Payment section removed as requested */}

            {/* Buyer Contact */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Buyer Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-600">*</span></label>
                  <input type="text" name="buyerContact.name" value={form.buyerContact.name} onChange={updateField} className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-600">*</span></label>
                  <input type="email" name="buyerContact.email" value={form.buyerContact.email} onChange={updateField} className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-600">*</span></label>
                  <input type="tel" name="buyerContact.phone" value={form.buyerContact.phone} onChange={updateField} className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-600">*</span></label>
                  <input type="text" name="buyerContact.companyName" value={form.buyerContact.companyName} onChange={updateField} className="w-full border rounded px-3 py-2" required />
                </div>
              </div>
            </section>

            {/* Delivery Address */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Delivery Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" name="deliveryLocation.address" value={form.deliveryLocation.address} onChange={updateField} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" name="deliveryLocation.city" value={form.deliveryLocation.city} onChange={updateField} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input type="text" name="deliveryLocation.state" value={form.deliveryLocation.state} onChange={updateField} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input type="text" name="deliveryLocation.pincode" value={form.deliveryLocation.pincode} onChange={updateField} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => navigate('/')} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-[#2f3284] text-white rounded disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </form>
        </div>

        {/* Side panel */
        }
        <aside className="bg-white border rounded-lg p-6">
          {(() => {
            const checks = {
              productName: !!form.productName?.trim(),
              categories: selectedCategories.length > 0 && !!activeSubcategory,
              purchaseQuantity: Number(form.purchaseQuantity) > 0,
              details: !!form.details?.trim()
            };
            const allComplete = Object.values(checks).every(Boolean);
            const items = [
              { key: 'productName', label: 'Product Name' },
              { key: 'categories', label: 'Category' },
              { key: 'purchaseQuantity', label: 'Purchase Quantity' },
              { key: 'details', label: 'Details' }
            ];
            return (
              <div>
                <h3 className={`text-lg font-semibold mb-2 ${allComplete ? 'text-green-600' : ''}`}>
                  {allComplete ? 'Complete' : 'Completeness'}
                </h3>
                <p className="text-sm text-gray-600">The more precise your information, the faster response you will get.</p>
                <ul className="mt-4 space-y-2">
                  {items.map((it) => (
                    <li key={it.key} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 ${checks[it.key] ? 'text-green-600' : 'text-gray-300'}`} />
                      <span className={`${checks[it.key] ? 'text-green-700' : 'text-gray-600'}`}>{it.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
        </aside>
      </main>

      {/* Category selector modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-[800px] max-w-full rounded-lg shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <h4 className="font-semibold">Select Category</h4>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setCategoryModalOpen(false)}>×</button>
            </div>
            <div className="grid grid-cols-2">
              {/* Categories list */}
              <div className="border-r max-h-[360px] overflow-y-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${activeCategory === cat ? 'bg-gray-100 font-medium' : ''}`}
                    onClick={() => { setActiveCategory(cat); setActiveSubcategory(''); }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Subcategories list */}
              <div className="max-h-[360px] overflow-y-auto">
                {activeCategory ? (
                  (categoryTree[activeCategory] || []).map((sub) => (
                    <button
                      key={sub}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${activeSubcategory === sub ? 'bg-gray-100 font-medium' : ''}`}
                      onClick={() => setActiveSubcategory(sub)}
                    >
                      {sub}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">Left se category choose kijiye</div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-4 py-2">
              <button className="px-4 py-2 border rounded" onClick={() => setCategoryModalOpen(false)}>Cancel</button>
              <button
                className="px-4 py-2 bg-[#2f3284] text-white rounded disabled:opacity-50"
                onClick={confirmCategorySelection}
                disabled={!activeCategory || !activeSubcategory}
              >
                Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostRequirement;