import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { productAPI } from '../services/apiWithToast';

const ExampleUsage = () => {
  const [products, setProducts] = useState([]);
  const { loading } = useApi();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      // Error is automatically handled by the API service
      console.error('Failed to fetch products:', error);
    }
  };

  const handleCreateProduct = async (productData) => {
    try {
      await productAPI.create(productData);
      // Success toast is automatically shown
      fetchProducts(); // Refresh the list
    } catch (error) {
      // Error toast is automatically shown
      console.error('Failed to create product:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Products</h2>
      
      {loading.isLoading('products-fetch') ? (
        <div className="flex items-center justify-center py-8">
          <loading.LoadingSpinner size="large" />
          <span className="ml-2">Loading products...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product._id} className="border rounded-lg p-4">
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-gray-600">{product.description}</p>
              <p className="text-lg font-bold">${product.price}</p>
            </div>
          ))}
        </div>
      )}
      
      <button
        onClick={() => handleCreateProduct({ name: 'Test Product', price: 100 })}
        disabled={loading.isLoading('product-create')}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center"
      >
        {loading.isLoading('product-create') ? (
          <>
            <loading.LoadingSpinner size="small" color="white" />
            <span className="ml-2">Creating...</span>
          </>
        ) : (
          'Create Product'
        )}
      </button>
    </div>
  );
};

export default ExampleUsage;