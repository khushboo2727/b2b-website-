import nodemailer from 'nodemailer';
import { MessageLog } from '../models/index.js';

// Create transporter (configure based on your email provider)
const createTransporter = () => {
  // For development, you can use Gmail or any SMTP service
  // For production, consider using services like SendGrid, AWS SES, etc.
  return nodemailer.createTransport({
    service: 'gmail', // or your preferred email service
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASSWORD // Your email password or app password
    }
  });
};

// Email templates
const emailTemplates = {
  rfqNotification: (rfqData, buyerData, productData) => {
    return {
      subject: `New RFQ Request - ${productData.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Request for Quote</h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Product Details:</h3>
            <p><strong>Product:</strong> ${productData.title}</p>
            <p><strong>Category:</strong> ${productData.category}</p>
            <p><strong>Quantity Required:</strong> ${rfqData.quantity}</p>
            ${rfqData.targetPrice ? `<p><strong>Target Price:</strong> ₹${rfqData.targetPrice}</p>` : ''}
            ${rfqData.expectedDeliveryDate ? `<p><strong>Expected Delivery:</strong> ${new Date(rfqData.expectedDeliveryDate).toLocaleDateString()}</p>` : ''}
          </div>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Buyer Information:</h3>
            <p><strong>Name:</strong> ${buyerData.name}</p>
            <p><strong>Email:</strong> ${buyerData.email}</p>
            <p><strong>Phone:</strong> ${buyerData.phone || 'Not provided'}</p>
            ${buyerData.companyName ? `<p><strong>Company:</strong> ${buyerData.companyName}</p>` : ''}
            ${buyerData.designation ? `<p><strong>Designation:</strong> ${buyerData.designation}</p>` : ''}
          </div>
          
          ${rfqData.deliveryLocation ? `
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Delivery Location:</h3>
            <p>${rfqData.deliveryLocation.address || ''}</p>
            <p>${rfqData.deliveryLocation.city || ''}, ${rfqData.deliveryLocation.state || ''} ${rfqData.deliveryLocation.pincode || ''}</p>
            <p>${rfqData.deliveryLocation.country || 'India'}</p>
          </div>
          ` : ''}
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Message from Buyer:</h3>
            <p style="font-style: italic;">${rfqData.message}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p>Please log in to your seller dashboard to respond to this RFQ.</p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/seller/rfqs" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View RFQ Dashboard
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            This is an automated message from Niryat Business B2B Marketplace.<br>
            RFQ Number: ${rfqData.rfqNumber}
          </p>
        </div>
      `
    };
  }
};

// Send email function
export const sendEmail = async (to, template, data, rfqId, fromUserId, toUserId) => {
  const transporter = createTransporter();
  const emailContent = template(data.rfq, data.buyer, data.product);
  
  // Create message log entry
  const messageLog = new MessageLog({
    rfqId,
    fromUserId,
    toUserId,
    emailType: 'rfq_notification',
    subject: emailContent.subject,
    content: emailContent.html,
    recipientEmail: to,
    status: 'pending'
  });
  
  try {
    await messageLog.save();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    // Update message log with success
    messageLog.status = 'sent';
    messageLog.sentAt = new Date();
    messageLog.metadata = {
      emailProvider: 'gmail',
      messageId: result.messageId,
      deliveryStatus: 'delivered'
    };
    await messageLog.save();
    
    console.log('✅ Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId, logId: messageLog._id };
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    // Update message log with error
    messageLog.status = 'failed';
    messageLog.errorMessage = error.message;
    await messageLog.save();
    
    return { success: false, error: error.message, logId: messageLog._id };
  }
};

// Send RFQ notification to seller
export const sendRFQNotification = async (rfqData, buyerData, productData, sellerEmail, rfqId, buyerId, sellerId) => {
  return await sendEmail(
    sellerEmail,
    emailTemplates.rfqNotification,
    {
      rfq: rfqData,
      buyer: buyerData,
      product: productData
    },
    rfqId,
    buyerId,
    sellerId
  );
};

// Send OTP email
export const sendOtpEmail = async (to, code, name = 'User') => {
  const transporter = createTransporter();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Your OTP for Seller Registration</h2>
      <p>Hi ${name},</p>
      <p>Your OTP code is:</p>
      <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 16px 0; color: #111827;">
        ${code}
      </div>
      <p>This OTP will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      <p>Regards,<br/>Niryat Business Team</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Niryat Business: OTP Verification',
      html
    });
    return { success: true };
  } catch (error) {
    console.error('❌ OTP email failed:', error);
    return { success: false, error: error.message };
  }
};

// Send seller rejection email with reason
export const sendSellerRejectionEmail = async (to, name = 'Seller', reason = '') => {
  const transporter = createTransporter();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Seller Application Rejected</h2>
      <p>Hi ${name},</p>
      <p>Unfortunately, your seller application has been rejected.</p>
      ${reason ? `<div style="background:#fef3c7;padding:12px;border-radius:6px;margin:12px 0;">
        <strong>Reason:</strong> ${reason}
      </div>` : ''}
      <p>You can update your details and apply again from the registration page.</p>
      <p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/seller/register"
           style="background:#2563eb;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block;">
          Register Again
        </a>
      </p>
      <p>Regards,<br/>Niryat Business Team</p>
    </div>
  `;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Niryat Business: Seller Application Rejected',
      html
    });
    return { success: true };
  } catch (err) {
    console.error('Email error (rejection):', err);
    return { success: false, error: err.message };
  }
};

export default {
  sendEmail,
  sendRFQNotification,
  emailTemplates,
  sendOtpEmail,
  sendSellerRejectionEmail
};