import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { 
  AuthRouter, 
  SellerRouter, 
  ProductRouter, 
  LeadRouter, 
  MembershipRouter, 
  RFQRouter,
  AdminRouter ,
  MessageRouter,
  NotificationRouter,
  TicketRouter
} from './routes/index.js';

dotenv.config({ path: './.env' });
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/niryat-business')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Niryat Business B2B Marketplace API',
    version: '1.0.0',
    status: 'Running'
  });
});

// IEC format verification endpoint
app.post('/verify-iec-format', (req, res) => {
  try {
    const iec = String(req.body?.iec ?? '').trim();
    const valid = /^[0-9]{10}$/.test(iec);
    if (!valid) {
      return res.json({ valid: false, message: 'Please enter a valid 10-digit IEC number.' });
    }
    return res.json({ valid: true });
  } catch (err) {
    console.error('IEC format verify error:', err);
    return res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// Alias under /api for dev proxy compatibility
app.post('/api/verify-iec-format', (req, res) => {
  try {
    const iec = String(req.body?.iec ?? '').trim();
    const valid = /^[0-9]{10}$/.test(iec);
    if (!valid) {
      return res.json({ valid: false, message: 'Please enter a valid 10-digit IEC number.' });
    }
    return res.json({ valid: true });
  } catch (err) {
    console.error('IEC format verify error:', err);
    return res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// API Routes
app.use('/api/auth', AuthRouter);
app.use('/api/seller', SellerRouter);
app.use('/api/products', ProductRouter);
app.use('/api/leads', LeadRouter);
app.use('/api/membership', MembershipRouter);
app.use('/api/rfq', RFQRouter);
app.use('/api/admin', AdminRouter);
app.use('/api/notifications', NotificationRouter);
app.use('/api/messages', MessageRouter);
app.use('/api/tickets', TicketRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
