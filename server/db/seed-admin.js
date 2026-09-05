import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import dns from 'dns';
import User from './models/User.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📊 MongoDB connected for admin seeding');

    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      await mongoose.connection.close();
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      id: 'user-admin',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      name: 'System Administrator',
      email: 'admin@nexus-erp.com',
    });

    await admin.save();
    console.log('✅ Admin user created successfully');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Role: admin');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Admin seeding error:', error);
    process.exit(1);
  }
};

seedAdmin();
