import mongoose from 'mongoose';
import { Product, User } from './models/index.js';
import dotenv from 'dotenv';
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

const seedRelated = async () => {
    try {
        // 1. Get the existing seller
        const seller = await User.findOne({ role: 'seller' });
        if (!seller) {
            console.log('No seller found, cannot seed products.');
            process.exit();
        }

        console.log(`Seeding products for seller: ${seller.name} (${seller._id})`);

        // 2. Clear existing demo products (optional, maybe just add more)
        // await Product.deleteMany({ sellerId: seller._id });

        // 3. Create products in "Clothing"
        const clothingProducts = [
            {
                title: 'Casual Denim Shirt',
                description: 'Stylish denim shirt for casual outings.',
                category: 'Clothing',
                priceRange: { min: 800, max: 1500 },
                images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format&fit=crop&q=60'],
                specifications: { Material: 'Denim', Size: 'M, L', Gender: 'Men' }
            },
            {
                title: 'Formal White Shirt',
                description: 'Crisp white shirt for office wear.',
                category: 'Clothing',
                priceRange: { min: 600, max: 1000 },
                images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60'],
                specifications: { Material: 'Cotton', Size: 'S, M, L, XL', Gender: 'Men' }
            },
            {
                title: 'Striped Polos',
                description: 'Comfortable polo t-shirts.',
                category: 'Clothing',
                priceRange: { min: 400, max: 800 },
                images: ['https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=500&auto=format&fit=crop&q=60'],
                specifications: { Material: 'Cotton Blend', Size: 'M, L', Gender: 'Unisex' }
            }
        ];

        // 4. Create products in "Electronics"
        const electronicsProducts = [
            {
                title: 'Bluetooth Speaker',
                description: 'Portable speaker with high bass.',
                category: 'Electronics',
                priceRange: { min: 1200, max: 2000 },
                images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=60'],
                specifications: { Battery: '10h', Bluetooth: '5.1' }
            },
            {
                title: 'Smart Watch',
                description: 'Fitness tracker and smartwatch.',
                category: 'Electronics',
                priceRange: { min: 3000, max: 5000 },
                images: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&auto=format&fit=crop&q=60'],
                specifications: { Battery: '3 days', Waterproof: 'Yes' }
            }
        ];

        const all = [...clothingProducts, ...electronicsProducts];

        for (const p of all) {
            await Product.create({
                ...p,
                sellerId: seller._id,
                isActive: true
            });
        }

        console.log(`Added ${all.length} new products.`);
        process.exit();

    } catch (error) {
        console.error('Error seeding:', error);
        process.exit(1);
    }
};

seedRelated();
