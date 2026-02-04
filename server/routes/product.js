import express from 'express';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { Product, SellerProfile } from '../models/index.js';
import mongoose from 'mongoose';

const router = express.Router();

// @route   POST /api/product
// @desc    Add new product
// @access  Private (Seller only)
router.post('/',
  authenticateUser,
  authorizeRoles(['seller']),
  async (req, res) => {
    const { title, description, images, category, priceRange, specifications } = req.body;

    try {
      const newProduct = new Product({
        sellerId: req.user.user.id,
        title,
        description,
        images,
        category,
        priceRange,
        specifications
      });

      const product = await newProduct.save();
      res.status(201).json(product);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET /api/products
// @desc    Get all products with advanced search & filter
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      location,
      minPrice,
      maxPrice,
      verified,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      sellerId,
      isActive
    } = req.query;

    // Build aggregation pipeline for complex search with seller info
    let pipeline = [];

    // Match active products
    let matchStage = { isActive: true };

    // Explicit seller filter (for seller portal)
    if (sellerId && mongoose.Types.ObjectId.isValid(sellerId)) {
      matchStage.sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    // Allow overriding isActive if passed (e.g., show offline)
    if (typeof isActive !== 'undefined') {
      matchStage.isActive = isActive === 'true';
    }

    // Text search functionality
    if (search) {
      matchStage.$text = { $search: search };
    }

    // Category filter
    if (category && category !== 'all') {
      matchStage.category = new RegExp(category, 'i');
    }

    // Price range filter
    if (minPrice || maxPrice) {
      if (minPrice) {
        matchStage['priceRange.min'] = { $gte: Number(minPrice) };
      }
      if (maxPrice) {
        matchStage['priceRange.max'] = { $lte: Number(maxPrice) };
      }
    }

    pipeline.push({ $match: matchStage });

    // Lookup seller information
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'sellerId',
        foreignField: '_id',
        as: 'seller'
      }
    });

    // Lookup seller profile for location and verification
    pipeline.push({
      $lookup: {
        from: 'sellerprofiles',
        localField: 'sellerId',
        foreignField: 'userId',
        as: 'sellerProfile'
      }
    });

    // Unwind arrays
    pipeline.push({ $unwind: '$seller' });
    pipeline.push({
      $unwind: {
        path: '$sellerProfile',
        preserveNullAndEmptyArrays: true
      }
    });

    // Lookup membership plan for seller
    pipeline.push({
      $lookup: {
        from: 'membershipplans',
        localField: 'seller.membershipPlan',
        foreignField: '_id',
        as: 'membershipPlan'
      }
    });
    pipeline.push({
      $unwind: { path: '$membershipPlan', preserveNullAndEmptyArrays: true }
    });

    // Additional filters based on seller info
    let additionalMatch = {};

    // Location filter
    if (location) {
      additionalMatch.$or = [
        { 'sellerProfile.address.city': new RegExp(location, 'i') },
        { 'sellerProfile.address.state': new RegExp(location, 'i') },
        { 'sellerProfile.address.pincode': new RegExp(location, 'i') }
      ];
    }

    // Verified seller filter
    if (verified === 'true') {
      additionalMatch['seller.verified'] = true;
    }

    if (Object.keys(additionalMatch).length > 0) {
      pipeline.push({ $match: additionalMatch });
    }

    // Add computed fields
    pipeline.push({
      $addFields: {
        sellerName: '$seller.name',
        sellerVerified: '$seller.verified',
        sellerLocation: {
          $concat: [
            { $ifNull: ['$sellerProfile.address.city', ''] },
            ', ',
            { $ifNull: ['$sellerProfile.address.state', ''] }
          ]
        },
        companyName: '$sellerProfile.companyName',
        companyLogo: '$sellerProfile.companyLogo',
        membershipPrice: { $ifNull: ['$membershipPlan.price', 0] },
        membershipName: '$membershipPlan.name'
      }
    });

    // Sort
    let sortStage = {};
    if (search) {
      // Priority: expensive membership, good rating, text relevance, recency
      sortStage = {
        membershipPrice: -1,
        averageRating: -1,
        score: { $meta: 'textScore' },
        createdAt: -1
      };
    } else {
      sortStage[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }
    pipeline.push({ $sort: sortStage });

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];

    // Add pagination
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: parseInt(limit) });

    // Project final fields
    pipeline.push({
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        images: 1,
        category: 1,
        priceRange: 1,
        specifications: 1,
        createdAt: 1,
        updatedAt: 1,
        sellerName: 1,
        sellerVerified: 1,
        sellerLocation: 1,
        companyName: 1,
        companyLogo: 1,
        sellerId: 1,
        isActive: 1 // FIX: status ke liye field include
      }
    });

    // Execute aggregation
    let [products, countResult] = await Promise.all([
      Product.aggregate(pipeline),
      Product.aggregate(countPipeline)
    ]);

    // --- FUZZY SEARCH FALLBACK ---
    if (products.length === 0 && search && parseInt(page) === 1) {
      console.log(`No exact match for "${search}". Attempting fuzzy/regex search...`);

      // Fallback 1: Regex Partial Match
      // Remove text search stage and add regex match
      const basePipeline = pipeline.filter(stage => !stage.$match || !stage.$match.$text);

      // Re-add other filters from original matchStage if any
      const originalMatch = pipeline.find(stage => stage.$match && !stage.$match.$text)?.$match || {};
      delete originalMatch.$text;

      const regexMatch = {
        ...originalMatch,
        isActive: true,
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }, // Check category name too
          { description: { $regex: search, $options: 'i' } }
        ]
      };

      const regexPipeline = [
        { $match: regexMatch },
        ...basePipeline.filter(s => !s.$match) // Add remaining stages (lookup, sort, etc)
      ];

      // We need to re-add lookups if they were part of the pipeline after the first match
      // Actually, simplest way is to rebuild pipeline logic or just basic fetch for fallback

      // Let's use a simpler approach for fallback to reuse existing code structure isn't easy without refactoring
      // dependent stages. 
      // Instead, let's query Product directly with Mongoose for the fuzzy part to get IDs, then run pipeline?
      // Or just run a new cleaner aggregation.

      const fuzzyPipeline = [
        { $match: regexMatch },
        // Add lookups same as original
        {
          $lookup: {
            from: 'users',
            localField: 'sellerId',
            foreignField: '_id',
            as: 'seller'
          }
        },
        {
          $lookup: {
            from: 'sellerprofiles',
            localField: 'sellerId',
            foreignField: 'userId',
            as: 'sellerProfile'
          }
        },
        { $unwind: '$seller' },
        {
          $unwind: {
            path: '$sellerProfile',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            images: 1,
            category: 1,
            priceRange: 1,
            sellerName: '$seller.name',
            sellerVerified: '$seller.verified',
            sellerLocation: {
              $concat: [
                { $ifNull: ['$sellerProfile.address.city', ''] },
                ', ',
                { $ifNull: ['$sellerProfile.address.state', ''] }
              ]
            },
            companyName: '$sellerProfile.companyName',
            companyLogo: '$sellerProfile.companyLogo',
            sellerId: '$seller._id',
            isActive: 1
          }
        },
        { $limit: parseInt(limit) }
      ];

      let fuzzyProducts = await Product.aggregate(fuzzyPipeline);

      if (fuzzyProducts.length > 0) {
        products = fuzzyProducts;
        countResult = [{ total: products.length }]; // approximate
      } else {
        // Fallback 2: Category Spelling Correction (Levenshtein)
        console.log(`No regex match for "${search}". Checking category spelling...`);

        const allCategories = await Product.distinct('category', { isActive: true });
        let bestMatch = null;
        let minDistance = Infinity;

        allCategories.forEach(cat => {
          const dist = levenshteinDistance(search.toLowerCase(), cat.toLowerCase());
          // Allow distance of 2 or 3 depending on length
          const threshold = cat.length < 5 ? 1 : 3;
          if (dist <= threshold && dist < minDistance) {
            minDistance = dist;
            bestMatch = cat;
          }
        });

        if (bestMatch) {
          console.log(`Found category correction: "${search}" -> "${bestMatch}"`);
          // Fetch products for this category
          const catPipeline = [
            { $match: { isActive: true, category: bestMatch } },
            {
              $lookup: {
                from: 'users',
                localField: 'sellerId',
                foreignField: '_id',
                as: 'seller'
              }
            },
            {
              $lookup: {
                from: 'sellerprofiles',
                localField: 'sellerId',
                foreignField: 'userId',
                as: 'sellerProfile'
              }
            },
            { $unwind: '$seller' },
            {
              $unwind: {
                path: '$sellerProfile',
                preserveNullAndEmptyArrays: true
              }
            },
            { $limit: parseInt(limit) },
            {
              $project: {
                _id: 1,
                title: 1,
                images: 1,
                category: 1,
                priceRange: 1,
                sellerName: '$seller.name',
                sellerVerified: '$seller.verified',
                sellerLocation: {
                  $concat: [
                    { $ifNull: ['$sellerProfile.address.city', ''] },
                    ', ',
                    { $ifNull: ['$sellerProfile.address.state', ''] }
                  ]
                },
                companyName: '$sellerProfile.companyName',
                companyLogo: '$sellerProfile.companyLogo',
                sellerId: '$seller._id',
                isActive: 1
              }
            }
          ];

          products = await Product.aggregate(catPipeline);
          countResult = [{ total: products.length }];
        }
      }
    }


    const total = countResult.length > 0 ? countResult[0].total : 0;

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasMore: page * limit < total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/products/categories
// @desc    Get all unique categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json(categories.sort());
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/products/search-suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/search-suggestions', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const suggestions = await Product.aggregate([
      {
        $match: {
          isActive: true,
          $or: [
            { title: new RegExp(q, 'i') },
            { category: new RegExp(q, 'i') },
            { description: new RegExp(q, 'i') }
          ]
        }
      },
      {
        $project: {
          title: 1,
          category: 1
        }
      },
      { $limit: 10 }
    ]);

    // Extract unique suggestions
    const uniqueSuggestions = new Set();
    suggestions.forEach(product => {
      if (product.title.toLowerCase().includes(q.toLowerCase())) {
        uniqueSuggestions.add(product.title);
      }
      if (product.category.toLowerCase().includes(q.toLowerCase())) {
        uniqueSuggestions.add(product.category);
      }
    });

    res.json(Array.from(uniqueSuggestions).slice(0, 8));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/products/:id/related
// @desc    Get related products by category
// @access  Public
router.get('/:id/related', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the original product to get its category
    const originalProduct = await Product.findById(id);
    if (!originalProduct) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // 2. Find other products in the same category
    const relatedProducts = await Product.aggregate([
      {
        $match: {
          isActive: true,
          category: originalProduct.category,
          _id: { $ne: new mongoose.Types.ObjectId(id) } // Exclude current product
        }
      },
      { $sample: { size: 8 } }, // Randomly select 8 products
      {
        $project: {
          title: 1,
          images: 1,
          category: 1,
          priceRange: 1,
          averageRating: 1,
          ratingsCount: 1,
          description: 1
        }
      }
    ]);

    res.json(relatedProducts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/product/:id
// @desc    Get product by ID with seller details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'sellerId',
          foreignField: '_id',
          as: 'seller'
        }
      },
      {
        $lookup: {
          from: 'sellerprofiles',
          localField: 'sellerId',
          foreignField: 'userId',
          as: 'sellerProfile'
        }
      },
      { $unwind: '$seller' },
      {
        $unwind: {
          path: '$sellerProfile',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          images: 1,
          category: 1,
          priceRange: 1,
          specifications: 1,
          createdAt: 1,
          updatedAt: 1,
          averageRating: 1,         // NEW
          ratingsCount: 1,          // NEW
          seller: {
            _id: '$seller._id',
            name: '$seller.name',
            email: '$seller.email',
            verified: '$seller.verified'
          },
          sellerProfile: {
            companyName: '$sellerProfile.companyName',
            address: '$sellerProfile.address',
            websiteUrl: '$sellerProfile.websiteUrl',
            companyLogo: '$sellerProfile.companyLogo'
          }
        }
      }
    ]);

    if (!product || product.length === 0) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    res.json(product[0]);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Update product by ID (Seller/Admin)
router.put('/:id',
  authenticateUser,
  authorizeRoles(['seller', 'admin']),
  async (req, res) => {
    try {
      const userId = req.user?.user?.id; // same shape used in create
      const userRole = req.user?.user?.role;
      const { id } = req.params;

      const product = await Product.findById(id);
      if (!product) return res.status(404).json({ msg: 'Product not found' });

      // Sellers can only update their own product
      if (userRole !== 'admin' && String(product.sellerId) !== String(userId)) {
        return res.status(403).json({ msg: 'Not authorized' });
      }

      // Build update payload (only allowed fields)
      const allowed = ['title', 'description', 'images', 'category', 'priceRange', 'specifications', 'isActive'];
      const update = {};
      for (const key of allowed) {
        if (typeof req.body[key] !== 'undefined') {
          update[key] = req.body[key];
        }
      }

      const updated = await Product.findByIdAndUpdate(id, { $set: update }, { new: true });
      return res.json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).send('Server Error');
    }
  }
);

// Delete product by ID (Seller/Admin)
router.delete('/:id',
  authenticateUser,
  authorizeRoles(['seller', 'admin']),
  async (req, res) => {
    try {
      const userId = req.user?.user?.id;
      const userRole = req.user?.user?.role;
      const { id } = req.params;

      const product = await Product.findById(id);
      if (!product) return res.status(404).json({ msg: 'Product not found' });

      // Sellers can only delete their own product
      if (userRole !== 'admin' && String(product.sellerId) !== String(userId)) {
        return res.status(403).json({ msg: 'Not authorized' });
      }

      await Product.findByIdAndDelete(id);
      return res.json({ msg: 'Product deleted' });
    } catch (err) {
      console.error(err);
      return res.status(500).send('Server Error');
    }
  }
);

// Add a review (Buyer only). Upsert: agar same buyer pehle review de chuka hai to update ho jayega
router.post('/:id/reviews',
  authenticateUser,
  authorizeRoles(['buyer', 'admin']),
  async (req, res) => {
    try {
      const { rating, comment } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ msg: 'Rating must be 1-5' });
      }

      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ msg: 'Product not found' });

      const userId = req.user.user.id;
      const userName = req.user.user.name;

      // Upsert buyer's review
      const existing = product.reviews.find(r => String(r.userId) === String(userId));
      if (existing) {
        existing.rating = rating;
        existing.comment = comment || existing.comment;
        existing.createdAt = new Date();
      } else {
        product.reviews.push({ userId, name: userName, rating, comment });
      }

      // Recalculate stats
      product.ratingsCount = product.reviews.length;
      product.averageRating =
        product.ratingsCount === 0
          ? 0
          : Number(
            (
              product.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / product.ratingsCount
            ).toFixed(2)
          );

      await product.save();
      return res.json({
        averageRating: product.averageRating,
        ratingsCount: product.ratingsCount,
        reviews: product.reviews.sort((a, b) => b.createdAt - a.createdAt)
      });
    } catch (err) {
      console.error(err);
      return res.status(500).send('Server Error');
    }
  }
);

// Get reviews (Public) — NEW
router.get('/:id/reviews', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id, {
      reviews: 1,
      averageRating: 1,
      ratingsCount: 1
    });
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    return res.json({
      averageRating: product.averageRating,
      ratingsCount: product.ratingsCount,
      reviews: (product.reviews || []).sort((a, b) => b.createdAt - a.createdAt)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});

export default router;

// Helper: Levenshtein Distance for string similarity
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}