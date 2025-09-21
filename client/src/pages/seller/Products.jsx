import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SellerLayout from '../../components/layout/SellerLayout';
import { useAuth } from '../../context/AuthContext';
import { productAPI } from '../../services/apiWithToast';
import { Plus, Search } from 'lucide-react';

const PAGE_SIZE = 10;
const currencySymbol = (c) => ({ INR: '₹', USD: '$', EUR: '€', GBP: '£' }[c] || '');

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return '-';
  }
}

export default function SellerProducts() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(''); // UI only

  const [selectedIds, setSelectedIds] = useState([]);
  const allSelected = useMemo(
    () => products.length > 0 && selectedIds.length === products.length,
    [products, selectedIds]
  );

  const toggleAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(products.map((p) => p._id));
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const fetchCategories = async () => {
    try {
      const res = await productAPI.getCategories();
      const list = res?.data || [];
      setCategories(list);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productAPI.getAll({
        sellerId: user._id,
        page,
        limit: PAGE_SIZE,
        search: searchTerm || undefined,
        category: category || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      const data = res?.data || {};
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const onFilter = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const onReset = () => {
    setSearchTerm('');
    setCategory('');
    setDate('');
    setPage(1);
    fetchProducts();
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('Are you sure you want to delete this product? This action cannot be undone.');
    if (!ok) return;
    try {
      await productAPI.delete(id);
      fetchProducts();
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">Manage your listings</p>
          </div>
          <Link
            to="/seller/products/add"
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add new product
          </Link>
        </div>

        {/* Filters Row */}
        <form onSubmit={onFilter} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            className="border rounded px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          >
            <option value="">All dates</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>

          <select
            className="border rounded px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">— Select a category —</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="md:col-span-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                className="w-full border rounded pl-9 pr-3 py-2"
                placeholder="Search Products"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="px-3 py-2 rounded bg-gray-800 text-white">Filter</button>
            <button type="button" onClick={onReset} className="px-3 py-2 rounded bg-gray-200">Reset</button>
          </div>

          <div className="flex gap-2">
            <select className="border rounded px-3 py-2">
              <option>Bulk Actions</option>
              <option>Delete</option>
              <option>Mark Online</option>
              <option>Mark Offline</option>
            </select>
            <button type="button" className="px-3 py-2 rounded bg-gray-200">Apply</button>
          </div>
        </form>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold text-gray-600 uppercase">
                <th className="px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Stock</th>
                {/* Price column removed */}
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  // price & currency removed (no longer needed)
                  const img = p.images?.[0] || '';
                  const status = p.isActive ? 'Online' : 'Offline';
                  return (
                    <tr key={p._id} className="text-sm">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p._id)}
                          onChange={() => toggleOne(p._id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {img ? (
                          <img src={img} alt={p.title} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-200" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{p.title}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3">—</td>
                      <td className="px-4 py-3">{p.specifications?.stock || '—'}</td>
                      {/* Price cell removed */}
                      <td className="px-4 py-3">Simple</td>
                      <td className="px-4 py-3">{p.views ?? 0}</td>
                      <td className="px-4 py-3">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/seller/products/edit/${p._id}`}
                          className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="ml-2 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded border disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              className="px-3 py-1 rounded border disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}