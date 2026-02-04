import mongoose from 'mongoose';
import { Product, User } from './models/index.js';
import dotenv from 'dotenv';
dotenv.config();

// Connect to DB
mongoose.connect(process.env.DB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

const seedShirts = async () => {
    try {
        // 1. Get the specific seller
        const sellerEmail = '1mit11umar@gmail.com';
        const seller = await User.findOne({ email: sellerEmail });

        if (!seller) {
            console.log(`No seller found with email ${sellerEmail}, cannot seed products.`);
            process.exit();
        }

        console.log(`Seeding products for seller: ${seller.name} (${seller._id})`);

        // 2. Define Shirt Products
        const shirtProducts = [
            {
                title: 'Classic Oxford Shirt',
                description: 'A timeless classic Oxford shirt suitable for both casual and formal occasions.',
                category: 'Clothing',
                priceRange: { min: 1200, max: 1800 },
                images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=60'],
                specifications: { Material: 'Cotton Oxford', Size: 'S, M, L, XL', Gender: 'Men', Color: 'Light Blue' }
            },
            {
                title: 'Slim Fit Linen Shirt',
                description: 'Breathable linen shirt, perfect for summer wear.',
                category: 'Clothing',
                priceRange: { min: 1500, max: 2500 },
                images: ['https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=500&auto=format&fit=crop&q=60'],
                specifications: { Material: 'Linen', Size: 'M, L', Gender: 'Men', Color: 'Beige' }
            },
            {
                title: 'Checked Flannel Shirt',
                description: 'Warm and comfortable flannel shirt with a classic check pattern.',
                category: 'Clothing',
                priceRange: { min: 900, max: 1600 },
                images: ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&auto=format&fit=crop&q=60'],
                specifications: { Material: 'Flannel', Size: 'S, M, L, XL', Gender: 'Men', Pattern: 'Checked' }
            },
            {
                title: 'Mandarin Collar Shirt',
                description: 'Modern mandarin collar shirt for a sharp, contemporary look.',
                category: 'Clothing',
                priceRange: { min: 1000, max: 1700 },
                images: ['https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&auto=format&fit=crop&q=60'],
                specifications: { Material: 'Cotton Blend', Size: 'M, L', Gender: 'Men', Style: 'Mandarin Collar' }
            },
            {
                title: 'Denim Work Shirt',
                description: 'Durable denim shirt designed for everyday wear.',
                category: 'Clothing',
                priceRange: { min: 1400, max: 2200 },
                images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format&fit=crop&q=60'],
                specifications: { Material: 'Denim', Size: 'M, L, XL', Gender: 'Men', Wash: 'Dark' }
            }
        ];

        // 3. Insert Products
        for (const p of shirtProducts) {
            await Product.create({
                ...p,
                sellerId: seller._id,
                isActive: true
            });
        }

        console.log(`Successfully added ${shirtProducts.length} shirt products.`);
        process.exit();

    } catch (error) {
        console.error('Error seeding:', error);
        process.exit(1);
    }
};

seedShirts();
