// services/sms.js
// Sends the OTP text message through Twilio and, when it fails, tells you WHY.
// (The old code threw Twilio's answer away, so every failure looked the same.)

export class SmsError extends Error {
  constructor(message, { status = 502, publicMessage, detail } = {}) {
    super(message);
    this.status = status;
    this.detail = detail; // goes to the server log only
    this.publicMessage = publicMessage; // safe to show the rider
  }
}

// Twilio error code -> what it means for YOU and how to fix it
const FIX = {
  20003: "Twilio rejected TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN. Copy them again from console.twilio.com (and restart the backend).",
  21608: "TRIAL ACCOUNT: Twilio only texts numbers you have verified. Console > Phone Numbers > Verified Caller IDs > add the rider's number, or upgrade the account.",
  21408: "INDIA IS NOT ENABLED: Console > Messaging > Settings > Geo permissions > tick India, save.",
  21211: "Twilio says the destination number is not valid.",
  21614: "The destination is not a mobile number Twilio can text.",
  21606: "TWILIO_FROM_NUMBER cannot send SMS. It must be an SMS-capable number that belongs to this Twilio account.",
  21610: "That number replied STOP earlier, so Twilio blocks messages to it. Send START from that phone, or use another number.",
  21612: "Twilio cannot route SMS from TWILIO_FROM_NUMBER to this destination.",
  21266: "TWILIO_FROM_NUMBER and the destination are the same number.",
  30007: "Blocked by the carrier as spam. For India this usually means DLT registration is missing (see README note).",
  30008: "Carrier could not deliver (unknown error). For India, usually DLT.",
};

const devMode = () => String(process.env.OTP_DEV_MODE || "").toLowerCase() === "true";
const debug = () => String(process.env.OTP_DEBUG || "").toLowerCase() === "true";

export async function sendSms(phone, message, { fetchImpl = fetch } = {}) {
  // Development shortcut: print the code in the terminal instead of sending an SMS.
  if (devMode()) {
    console.log(`\n[OTP_DEV_MODE] SMS to +91${phone}: ${message}\n`);
    return { dev: true };
  }

  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM_NUMBER: rawFrom } = process.env;
  const from = (rawFrom || "").trim().replace(/\s+/g, "");
  if (!sid || !token || !from) {
    throw new SmsError("Twilio credentials missing", { status: 503, publicMessage: "Phone verification is not configured yet.", detail: "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER in backend/.env" });
  }
  if (!/^\+\d{8,15}$/.test(from)) {
    throw new SmsError("Bad TWILIO_FROM_NUMBER", { status: 503, publicMessage: "Phone verification is not configured correctly.", detail: `TWILIO_FROM_NUMBER must look like +14155550123 (with the + and country code). Got length ${from.length}.` });
  }

  let response;
  try {
    response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid.trim())}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${sid.trim()}:${token.trim()}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: `+91${phone}`, From: from, Body: message }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    throw new SmsError("Could not reach Twilio", { status: 504, publicMessage: "Could not reach the SMS service. Please try again.", detail: `Network problem calling Twilio: ${err.name === "TimeoutError" ? "timed out after 15s" : err.message}` });
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    /* no JSON body */
  }
  if (!response.ok) {
    const fix = FIX[data.code] || data.message || `HTTP ${response.status}`;
    throw new SmsError(`Twilio error ${data.code ?? response.status}`, {
      status: 502,
      publicMessage: debug() ? `SMS failed (Twilio ${data.code}): ${fix}` : "We could not send the code right now. Please try again, or contact support.",
      detail: `Twilio error ${data.code ?? response.status}: ${data.message || ""}\n  -> ${fix}`,
    });
  }
  // Twilio says "queued" the moment it ACCEPTS the message. It does not mean the phone received it.
  return { sid: data.sid, status: data.status };
}
