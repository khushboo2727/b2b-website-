import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
  await mongoose.connect(process.env.DB_URI);

  const existingAdmin = await User.findOne({ email: 'admin@niryat.com' });

  if (!existingAdmin) {
    const admin = new User({
      name: 'Super Admin',
      email: 'admin@niryat.com',
      password: 'Admin@123', // ye save hote waqt bcrypt se hash ho jayega
      role: 'admin'
    });
    await admin.save();
    console.log('✅ Admin created:', admin.email);
  } else {
    console.log('⚡ Admin already exists:', existingAdmin.email);
  }

  process.exit();
};

createAdmin();