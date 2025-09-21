import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SellerLayout from '../../components/layout/SellerLayout';
import { productAPI } from '../../services/apiWithToast';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await productAPI.getById(id);
        const data = res?.data;
        setProduct(data);
        setTitle(data?.title || '');
        setCategory(data?.category || '');
        setDescription(data?.description || '');
        setImages(Array.isArray(data?.images) ? data.images : []);
        setMinPrice(data?.priceRange?.min ?? '');
        setMaxPrice(data?.priceRange?.max ?? '');
        setCurrency(data?.priceRange?.currency ?? 'INR');
        setIsActive(typeof data?.isActive === 'boolean' ? data.isActive : true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onAddImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const base64s = await Promise.all(files.map(fileToBase64));
      setImages((prev) => [...prev, ...base64s]);
    } catch (e) {
      console.error('Failed to read files', e);
    } finally {
      e.target.value = '';
    }
  };

  const onRemoveImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('Title is required');
    if (!category.trim()) return alert('Category is required');
    if (!description.trim()) return alert('Description is required');
    if (!maxPrice && minPrice) return alert('Please provide Max Price if Min Price is provided');

    const payload = {
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      images,
      isActive,
      priceRange: {
        // min is optional as per your requirement
        ...(minPrice !== '' ? { min: Number(minPrice) } : {}),
        ...(maxPrice !== '' ? { max: Number(maxPrice) } : {}),
        currency: currency || 'INR',
      },
      // Keep existing specifications as is (if backend merges)
      ...(product?.specifications ? { specifications: product.specifications } : {}),
    };

    setSaving(true);
    try {
      await productAPI.update(id, payload);
      navigate('/seller/products');
    } catch (e) {
      console.error('Update failed', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SellerLayout>
        <div className="p-6">Loading...</div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <Link
            to="/seller/products"
            className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Back
          </Link>
        </div>

        <form onSubmit={onSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Electronics"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Images</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={img}
                    alt={`img-${idx}`}
                    className="h-24 w-24 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 text-xs"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <input type="file" accept="image/*" multiple onChange={onAddImages} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Min Price (optional)</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="e.g. 100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Price</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="e.g. 200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="isActive">Mark as Online</label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/seller/products')}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </SellerLayout>
  );
}