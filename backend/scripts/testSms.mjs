// scripts/testSms.mjs - find out exactly why OTP texts are not arriving
//   node scripts/testSms.mjs 9876543210
// Sends one real test SMS, then asks Twilio what happened to it.
import "dotenv/config";
import { sendSms } from "../services/sms.js";

const phone = (process.argv[2] || "").replace(/\D/g, "").slice(-10);
if (!/^\d{10}$/.test(phone)) {
  console.error("Usage: node scripts/testSms.mjs <10-digit mobile number>");
  process.exit(1);
}

const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM_NUMBER: from } = process.env;
console.log(`From: ${from ? from.slice(0, 3) + "…" + from.slice(-2) : "(missing)"}   To: +91${phone}\n`);

let sent;
try {
  sent = await sendSms(phone, "Synara test message. If you can read this, SMS works.");
} catch (err) {
  console.error("STEP 1 FAILED: Twilio refused the message.\n" + (err.detail || err.message));
  process.exit(1);
}
console.log(`STEP 1 OK: Twilio accepted it (sid ${sent.sid}, status "${sent.status}").`);
console.log("That only means Twilio took it. Checking delivery in 8 seconds…\n");

await new Promise((r) => setTimeout(r, 8000));
const auth = "Basic " + Buffer.from(`${sid.trim()}:${token.trim()}`).toString("base64");
const m = await (await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid.trim()}/Messages/${sent.sid}.json`, { headers: { Authorization: auth } })).json();
console.log(`STEP 2: delivery status = "${m.status}"${m.error_code ? `, error ${m.error_code}: ${m.error_message || ""}` : ""}`);
if (["delivered", "sent"].includes(m.status)) console.log("SMS is working. If a rider still gets nothing, check their number and signal.");
else if (["failed", "undelivered"].includes(m.status)) console.log("Twilio accepted it but the network did NOT deliver it. See the error code above (30xxx for India usually means DLT registration is needed).");
else console.log("Still in progress. Run again in a minute, or open console.twilio.com > Monitor > Logs > Messaging.");
