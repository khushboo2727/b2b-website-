import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Heart, MessageCircle, Phone, Mail } from 'lucide-react';
import { productAPI } from '../services/api';
import InquiryForm from '../components/InquiryForm';
import toast from 'react-hot-toast';
import RFQForm from '../components/RFQForm';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [showRFQForm, setShowRFQForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  // ⭐ Reviews state
  const [reviews, setReviews] = useState([]);
  const [ratingValue, setRatingValue] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  // Fetch product
  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getById(id);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  // Images
  const images = Array.isArray(product?.images) ? product.images : [];

  const handlePrevThumb = () => {
    if (!images.length) return;
    setSelectedImage((i) => (i - 1 + images.length) % images.length);
  };
  const handleNextThumb = () => {
    if (!images.length) return;
    setSelectedImage((i) => (i + 1) % images.length);
  };

  useEffect(() => {
    const el = document.getElementById(`thumb-${selectedImage}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedImage]);

  const prevImage = () =>
    setSelectedImage((i) => (images.length ? (i - 1 + images.length) % images.length : 0));
  const nextImage = () =>
    setSelectedImage((i) => (images.length ? (i + 1) % images.length : 0));

  // Reviews fetch
  const fetchReviews = async () => {
    try {
      const res = await productAPI.getReviews(id);
      setReviews(res.data.reviews || []);
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              averageRating: res.data.averageRating,
              ratingsCount: res.data.ratingsCount,
            }
          : prev
      );
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (id) fetchReviews();
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!ratingValue) return toast.error('Please select a rating');
    try {
      setSubmittingReview(true);
      await productAPI.addReview(id, { rating: ratingValue, comment });
      setComment('');
      toast.success('Review submitted');
      await fetchReviews();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.msg || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRFQSuccess = () => {
    console.log('RFQ submitted successfully');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not found
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">{product.category}</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium truncate">{product.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center w-24">
              <button
                onClick={handlePrevThumb}
                disabled={images.length <= 1}
                className="bg-white/90 hover:bg-white disabled:opacity-50 border rounded-full h-8 w-8 flex items-center justify-center shadow"
              >
                ▲
              </button>
              <div className="mt-2 mb-2 max-h-[450px] overflow-auto pr-1">
                {images.map((src, idx) => (
                  <button
                    key={idx}
                    id={`thumb-${idx}`}
                    onClick={() => setSelectedImage(idx)}
                    className={`mb-2 block rounded border ${
                      selectedImage === idx ? 'ring-2 ring-purple-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Thumb ${idx + 1}`}
                      className="h-20 w-20 object-cover rounded"
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={handleNextThumb}
                disabled={images.length <= 1}
                className="bg-white/90 hover:bg-white disabled:opacity-50 border rounded-full h-8 w-8 flex items-center justify-center shadow"
              >
                ▼
              </button>
            </div>
            <div className="relative flex-1 flex">
              <img
                src={images[selectedImage] || '/api/placeholder/600/600'}
                alt={product?.title || 'Product Image'}
                className="w-full max-h-[500px] object-contain rounded"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {product.category}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span>
                    {Number(product?.averageRating || 0).toFixed(1)} ({product?.ratingsCount || 0} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="border-t border-b py-4">
              <p className="text-gray-700">Contact for price</p>
              {product.specifications?.minimumOrderQuantity && (
                <p className="text-gray-600 mt-1">
                  Minimum Order Quantity:{' '}
                  <span className="font-semibold">
                    {product.specifications.minimumOrderQuantity}
                  </span>
                </p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {product.specifications && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Specifications</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1">
                      <span className="text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}:
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setShowInquiryForm(true)}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Send Inquiry
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200">
                  <Phone className="h-4 w-4" />
                  Call Now
                </button>
                <button className="flex items-center justify-center gap-2 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200">
                  <Heart className="h-4 w-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Info */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Supplier Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                {product.sellerProfile?.companyName ||
                  product.specifications?.supplierCompany ||
                  '—'}
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {(product.sellerProfile?.address?.city ||
                      product.specifications?.supplierCity ||
                      '')}
                    {', '}
                    {(product.sellerProfile?.address?.state ||
                      product.specifications?.supplierState ||
                      '')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{product.specifications?.supplierPhone || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{product.specifications?.supplierEmail || '—'}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Supplier: {product.specifications?.supplierName || product.seller?.name || '—'}
              </p>
              {product.sellerProfile?.websiteUrl && (
                <p className="text-sm text-gray-700 mt-2">
                  Website: {product.sellerProfile.websiteUrl}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Customer Reviews</h3>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((r, idx) => (
                <div key={idx} className="border-b pb-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{r.name || 'Buyer'}</p>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} className={`h-4 w-4 ${n <= (r.rating||0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-gray-700 mt-1">{r.comment}</p>}
                  <div className="text-xs text-gray-500 mt-1">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No reviews yet.</p>
          )}

          {currentUser?.role === 'buyer' && (
            <form onSubmit={handleSubmitReview} className="mt-6 space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Your Rating</label>
                <div className="flex items-center gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setRatingValue(n)}
                      className="p-1"
                      aria-label={`Rate ${n} star`}
                    >
                      <Star className={`h-6 w-6 ${ratingValue >= n ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    </button>
                  ))}
                  <span className="text-sm text-gray-600 ml-2">{ratingValue || '-'}/5</span>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="border rounded p-2 w-full"
                  rows={3}
                  placeholder="Share details of your experience"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Inquiry Form Modal */}
      {showInquiryForm && (
        <InquiryForm product={product} onClose={() => setShowInquiryForm(false)} />
      )}

      {/* RFQ Form Modal */}
      {showRFQForm && (
        <RFQForm
          product={product}
          onClose={() => setShowRFQForm(false)}
          onSuccess={handleRFQSuccess}
        />
      )}
    </div>
  );
}

export default ProductDetail;
