import nodemailer from 'nodemailer';
import { MessageLog } from '../models/index.js';
// import { BREVO_API_KEY } from '../config.js;
// import "dotenv/config.js";
 import dotenv from "dotenv";
 import path from "path";
import jwt from 'jsonwebtoken';

// // Load .env from server folder explicitly
dotenv.config({ path: path.join(process.cwd(), '.env') });

//  console.log("Loaded ENV:");
// console.log("SMTP_USER =", process.env.SMTP_USER);
// console.log("SMTP_PASS =", process.env.SMTP_PASS?.slice(0, 10) + "...");
// console.log("EMAIL_FROM =", process.env.EMAIL_FROM);

// Create transporter (configure based on your email provider)
const createTransporter = () => {
  // Prefer explicit SMTP config (e.g., Brevo/Sendinblue SMTP)
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587/25
      auth: {
        user: process.env.SMTP_USER, // For Brevo, set SMTP_USER to your SMTP username (often 'apikey')
        pass: process.env.SMTP_PASS  // For Brevo, set SMTP_PASS to your SMTP key (API key)
      }
    });
  }

  // Fallback to service-based (e.g., Gmail) if SMTP not provided
  const service = process.env.EMAIL_SERVICE;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  // Explicit validation to avoid silent config issues
  if (!service || !user || !pass) {
    throw new Error('Email transport not configured. Set SMTP_* or EMAIL_SERVICE/EMAIL_USER/EMAIL_PASSWORD or BREVO_API_KEY in server environment.');
  }
  
  return nodemailer.createTransport({
    service,
    auth: {
      user, // Your email
      pass  // Your email password or app password
    }
  });
};

// Helper to create per-recipient open token
const createOpenToken = (rfqId, sellerId) => {
  const payload = { rfqId, sellerId, type: 'rfq_open' };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Email templates
const emailTemplates = {
  rfqNotification: (rfqData, buyerData, productData, trackingUrl) => {
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
           <div style="margin-top:12px;">
             <a href="${trackingUrl}" style="font-size:12px;color:#6b7280;text-decoration:none;">Mark as opened</a>
           </div>
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
  // Try Brevo API first if configured, then fallback to SMTP/service
  const token = createOpenToken(rfqId, toUserId);
  const trackingUrl = `${process.env.SERVER_URL || process.env.API_URL || 'http://localhost:5000'}/api/rfq/${rfqId}/open?token=${encodeURIComponent(token)}`;
  const emailContent = template(data.rfq, data.buyer, data.product, trackingUrl);

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

    // Prefer Brevo transactional API
    if (process.env.BREVO_API_KEY) {
      try {
        const result = await sendViaBrevoEmail({ to, subject: emailContent.subject, html: emailContent.html });
        messageLog.status = 'sent';
        messageLog.sentAt = new Date();
        messageLog.metadata = {
          emailProvider: 'brevo',
          messageId: result.messageId,
          deliveryStatus: 'delivered'
        };
        await messageLog.save();
        console.log('✅ Email sent via Brevo:', result.messageId);
        return { success: true, messageId: result.messageId, logId: messageLog._id };
      } catch (brevoErr) {
        console.error('❌ Brevo API send failed, attempting SMTP/service fallback:', brevoErr.message);
        // Continue to SMTP/service fallback
      }
    }

    // Fallback: SMTP/service transporter
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };
    const result = await transporter.sendMail(mailOptions);

    // Update message log with success
    messageLog.status = 'sent';
    messageLog.sentAt = new Date();
    messageLog.metadata = {
      emailProvider: process.env.SMTP_HOST ? 'smtp' : (process.env.EMAIL_SERVICE || 'gmail'),
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

// New: Lead inquiry email to seller
export const sendLeadNotificationToSeller = async (sellerEmail, lead, buyerInfo, product) => {
  const subject = `New Inquiry for ${product?.name || 'Product'} — Qty ${lead?.quantity || ''}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2 style="color:#2563eb;margin-bottom:12px;">New Inquiry Received</h2>
      <div style="background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:12px;">
        <h3 style="margin:0 0 8px 0;">Product Details</h3>
        <p style="margin:4px 0;"><strong>Product:</strong> ${product?.name || 'N/A'}</p>
        ${product?.category ? `<p style="margin:4px 0;"><strong>Category:</strong> ${product.category}</p>` : ''}
        ${lead?.quantity ? `<p style="margin:4px 0;"><strong>Quantity:</strong> ${lead.quantity}</p>` : ''}
        ${lead?.budget ? `<p style="margin:4px 0;"><strong>Budget:</strong> ₹${lead.budget}</p>` : ''}
      </div>
      <div style="background:#f0f9ff;padding:16px;border-radius:8px;margin-bottom:12px;">
        <h3 style="margin:0 0 8px 0;">Buyer Information</h3>
        <p style="margin:4px 0;"><strong>Name:</strong> ${buyerInfo?.name || 'N/A'}</p>
        ${buyerInfo?.companyName ? `<p style="margin:4px 0;"><strong>Company:</strong> ${buyerInfo.companyName}</p>` : ''}
        ${buyerInfo?.email ? `<p style="margin:4px 0;"><strong>Email:</strong> ${buyerInfo.email}</p>` : ''}
        ${buyerInfo?.phone ? `<p style="margin:4px 0;"><strong>Phone:</strong> ${buyerInfo.phone}</p>` : ''}
      </div>
      ${lead?.message ? `
      <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin-bottom:12px;">
        <h3 style="margin:0 0 8px 0;">Buyer Message</h3>
        <p style="margin:0;">${lead.message}</p>
      </div>` : ''}
      <div style="text-align:center;margin:20px 0;">
        <a href="${(process.env.CLIENT_URL || 'http://localhost:5173')}/seller/leads?leadId=${lead?._id}" style="background:#2563eb;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;display:inline-block;">Show Details</a>
      </div>
      <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:20px;">This is an automated email from Niryat Business.</p>
    </div>
  `;

  try {
    if (process.env.BREVO_API_KEY) {
      const result = await sendViaBrevoEmail({ to: sellerEmail, subject, html });
      return { success: true, messageId: result.messageId };
    }
    const transporter = createTransporter();
    await transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.EMAIL_USER, to: sellerEmail, subject, html });
    return { success: true };
  } catch (error) {
    console.error('❌ Lead email to seller failed:', error);
    return { success: false, error: error.message };
  }
};

// New: Buyer thank-you email after submitting inquiry
export const sendLeadThankYouToBuyer = async (to, buyerName = 'Buyer', productName = 'your selected product') => {
  const subject = 'Thank you! Your inquiry has been submitted';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2 style="color:#16a34a;margin-bottom:12px;">Thank you for your inquiry</h2>
      <p>Hi ${buyerName},</p>
      <p>Thank you for submitting your inquiry for <strong>${productName}</strong> on Niryat Business.</p>
      <p>Our verified sellers have received your request. You will start getting responses shortly.</p>
      <p>You can track your requests from your dashboard.</p>
      <div style="text-align:center;margin:20px 0;">
        <a href="${(process.env.CLIENT_URL || 'http://localhost:5173')}/buyer/dashboard" style="background:#2563eb;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;display:inline-block;">Go to Dashboard</a>
      </div>
      <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:20px;">Regards,<br/>Niryat Business Team</p>
    </div>
  `;

  try {
    if (process.env.BREVO_API_KEY) {
      const result = await sendViaBrevoEmail({ to, subject, html });
      return { success: true, messageId: result.messageId };
    }
    const transporter = createTransporter();
    await transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.EMAIL_USER, to, subject, html });
    return { success: true };
  } catch (error) {
    console.error('❌ Buyer thank-you email failed:', error);
    return { success: false, error: error.message };
  }
};

// New helper: send via Brevo transactional email API (REST)
const sendViaBrevoEmail = async ({ to, subject, html, senderName, senderEmail }) => {
  const rawKey = process.env.BREVO_API_KEY;
  const apiKey = rawKey ? rawKey.trim().replace(/^['"]|['"]$/g, '') : '';
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const sender = {
    name: senderName || process.env.BREVO_SENDER_NAME || 'Niryat Business',
    email: senderEmail || process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || process.env.EMAIL_USER,
  };

  const payload = {
    sender,
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Brevo API error: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  return {
    success: true,
    messageId: data.messageId || data['messageId'] || data['message-id'] || 'brevo',
    data,
  };
};

// Removed default export to avoid early binding issues with later-declared functions
// export default {
//   sendEmail,
//   sendRFQNotification,
//   emailTemplates,
//   sendOtpEmail,
//   sendSellerRejectionEmail,
//   sendLeadNotificationToSeller,
//   sendLeadThankYouToBuyer
// };
// Send OTP email
export const sendOtpEmail = async (to, code, name = 'User') => {
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
    if (process.env.BREVO_API_KEY) {
      try {
        const result = await sendViaBrevoEmail({
          to,
          subject: 'Niryat Business: OTP Verification',
          html,
        });
        return { success: true, messageId: result.messageId };
      } catch (brevoErr) {
        console.error('❌ Brevo API send failed, attempting SMTP/service fallback:', brevoErr.message);
        if (process.env.SMTP_HOST || (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD)) {
          const transporter = createTransporter();
          await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject: 'Niryat Business: OTP Verification',
            html,
          });
          console.log('✅ Fallback email (SMTP/service) sent successfully');
          return { success: true };
        }
        throw brevoErr;
      }
    }

    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: 'Niryat Business: OTP Verification',
      html,
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
      ${reason ? `<div style=\"background:#fef3c7;padding:12px;border-radius:6px;margin:12px 0;\">
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
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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

export const sendSupportTicketConfirmation = async (to, name = 'User', ticketNumber, issueType, description) => {
  const subject = `Your Support Ticket #${ticketNumber}`;
  const trackUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/track-ticket`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2 style="color:#2563eb;margin-bottom:12px;">Support Ticket Created</h2>
      <p>Hi ${name},</p>
      <p>Thank you for contacting Niryat Business Support. Your ticket has been created successfully.</p>
      <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:4px 0;"><strong>Ticket Number:</strong> #${ticketNumber}</p>
        ${issueType ? `<p style="margin:4px 0;"><strong>Issue Type:</strong> ${issueType}</p>` : ''}
        ${description ? `<p style="margin:4px 0;"><strong>Description:</strong> ${description.substring(0, 200)}${description.length > 200 ? '...' : ''}</p>` : ''}
      </div>
      <p>You can track your ticket status using your email and ticket number.</p>
      <div style="text-align:center;margin:20px 0;">
        <a href="${trackUrl}" style="background:#2563eb;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;display:inline-block;">Track Your Ticket</a>
      </div>
      <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:20px;">Regards,<br/>Niryat Business Support Team</p>
    </div>
  `;

  try {
    if (process.env.BREVO_API_KEY) {
      const result = await sendViaBrevoEmail({ to, subject, html });
      return { success: true, messageId: result.messageId };
    }
    const transporter = createTransporter();
    await transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.EMAIL_USER, to, subject, html });
    return { success: true };
  } catch (error) {
    console.error('❌ Support ticket confirmation email failed:', error);
    return { success: false, error: error.message };
  }
};