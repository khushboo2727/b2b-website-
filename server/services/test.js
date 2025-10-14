// // test.js
// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// import path from "path";

// // Load .env from server folder explicitly
// dotenv.config({ path: path.join(process.cwd(), '.env') });

// // Debug: check if env loaded
// console.log("Loaded ENV:");
// console.log("SMTP_USER =", process.env.SMTP_USER);
// console.log("SMTP_PASS =", process.env.SMTP_PASS?.slice(0, 10) + "...");
// console.log("EMAIL_FROM =", process.env.EMAIL_FROM);

// // Create transporter
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT) || 587,
//   secure: false, // TLS false for port 587
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// async function testMail() {
//   try {
//     let info = await transporter.sendMail({
//       from: process.env.EMAIL_FROM,
//       to: "khushboogupta2728@gmail.com", // apna test email
//       subject: "Test Mail from Brevo SMTP",
//       text: "SMTP working ✅",
//     });
//     console.log("✅ Message sent:", info.messageId);
//   } catch (error) {
//     console.error("❌ SMTP Error:", error);
//   }
// }

// testMail();
