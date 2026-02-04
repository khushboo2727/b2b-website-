import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { productAPI } from '../services/api';

const RELATED_KEYWORDS = {
    'shirt': ['pant', 'jeans', 'belt', 'trousers', 'shoes'],
    't-shirt': ['jeans', 'shorts', 'sneakers', 'cap'],
    'pant': ['shirt', 'belt', 'shoes', 't-shirt'],
    'jeans': ['t-shirt', 'shirt', 'sneakers', 'jacket'],
    'saree': ['blouse', 'necklace', 'bangles', 'sandals'],
    'kurti': ['leggings', 'dupatta', 'earrings'],
    'laptop': ['mouse', 'keyboard', 'headset', 'backpack'],
    'mobile': ['case', 'screen guard', 'power bank', 'earbuds'],
    'phone': ['case', 'screen guard', 'power bank', 'earbuds'],
    'shoes': ['socks', 'polish', 'laces'],
    'furniture': ['table', 'chair', 'sofa', 'lamp'],
    'chair': ['table', 'desk', 'cushion'],
    'machine': ['tools', 'oil', 'spare parts', 'safety gear'],
    'cnc': ['tools', 'cutter', 'drill'],
};

const RelatedProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastSearch, setLastSearch] = useState('');
    const [derivedKeywords, setDerivedKeywords] = useState([]);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        const search = localStorage.getItem('lastSearch');
        if (search) {
            setLastSearch(search);
            fetchRelatedProducts(search);
        }
    }, []);

    const fetchRelatedProducts = async (searchTerm) => {
        try {
            setLoading(true);
            const lowerTerm = searchTerm.toLowerCase();

            // Expand search terms based on mapping
            let additionalKeywords = [];

            // Check if any key in RELATED_KEYWORDS is present in the search term
            Object.keys(RELATED_KEYWORDS).forEach(key => {
                if (lowerTerm.includes(key)) {
                    additionalKeywords = [...additionalKeywords, ...RELATED_KEYWORDS[key]];
                }
            });

            const limit = 10; // Fetch enough for scrolling

            if (additionalKeywords.length > 0) {
                const combinedSearch = `${searchTerm} ${additionalKeywords.join(' ')}`;
                setDerivedKeywords(additionalKeywords);
                const response = await productAPI.getAll({ search: combinedSearch, limit });
                setProducts(response.data.products || response.data);
            } else {
                // Fallback: Find category from top search result and show products from that category
                const searchResponse = await productAPI.getAll({ search: searchTerm, limit: 1 });
                const foundProducts = searchResponse.data.products || searchResponse.data;

                if (foundProducts.length > 0 && foundProducts[0].category) {
                    const category = foundProducts[0].category;
                    // Optional: You could set derivedKeywords to show the category name in UI
                    // setDerivedKeywords([`Category: ${category}`]);

                    const categoryResponse = await productAPI.getAll({ category: category, limit });
                    setProducts(categoryResponse.data.products || categoryResponse.data);
                } else {
                    // Final fallback to simple text search
                    const response = await productAPI.getAll({ search: searchTerm, limit });
                    setProducts(response.data.products || response.data);
                }
            }

        } catch (error) {
            console.error('Error fetching related products:', error);
        } finally {
            setLoading(false);
        }
    };

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200; // Scroll by roughly one card width
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (!lastSearch || products.length === 0) return null;

    return (
        <section className="max-w-9xl mx-auto px-6 mt-8 mb-8">
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm relative group/section">
                <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Products Related to Your Search</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Because you searched for <span className="font-medium text-gray-900">"{lastSearch}"</span>
                            {derivedKeywords.length > 0 && (
                                <span className="hidden sm:inline"> • Also showing: {derivedKeywords.slice(0, 3).join(', ')}...</span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="relative p-4">
                    {/* Left Arrow */}
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-2 rounded-full shadow-md border hover:bg-white text-gray-700 hidden group-hover/section:block transition-all"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    {/* Right Arrow */}
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-2 rounded-full shadow-md border hover:bg-white text-gray-700 hidden group-hover/section:block transition-all"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {loading ? (
                        <div className="py-12 flex justify-center text-gray-500">
                            <div className="animate-pulse">Loading related items...</div>
                        </div>
                    ) : (
                        <div
                            ref={scrollContainerRef}
                            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth snap-x snap-mandatory"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {products.map((p) => (
                                <div key={p._id} className="min-w-[140px] w-[140px] bg-white border rounded-lg hover:shadow-lg transition-all duration-300 group flex-none snap-start">
                                    <Link to={`/product/${p._id}`} className="block relative overflow-hidden rounded-t-lg aspect-square">
                                        <img
                                            src={p.images?.[0] || 'https://placehold.co/150x150'}
                                            alt={p.title || p.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </Link>
                                    <div className="p-2">
                                        <Link to={`/product/${p._id}`}>
                                            <h4 className="font-medium text-gray-900 text-xs line-clamp-2 hover:text-[#ff6600] transition-colors mb-1 leading-tight">
                                                {p.title || p.name}
                                            </h4>
                                        </Link>
                                        <div className="mt-1">
                                            <div className="text-[10px] text-gray-500 truncate">
                                                {p.category}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default RelatedProducts;
