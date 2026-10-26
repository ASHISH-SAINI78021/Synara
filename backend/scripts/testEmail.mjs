// scripts/testEmail.mjs - check EmailJS works, before involving the app
//   node scripts/testEmail.mjs you@gmail.com
import "dotenv/config";
import { sendOtpEmail } from "../services/email.js";

const to = process.argv[2];
if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
  console.error("Usage: node scripts/testEmail.mjs <your email address>");
  process.exit(1);
}
try {
  await sendOtpEmail({ to, name: "Test", code: "123456" });
  console.log(`OK: EmailJS accepted it. Check the inbox (and Spam) of ${to} for code 123456.`);
} catch (err) {
  console.error("FAILED:\n" + (err.detail || err.message));
  process.exit(1);
}
