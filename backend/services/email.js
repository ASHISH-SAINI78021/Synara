// services/email.js
// Sends the verification code by email using EmailJS's REST API (from the SERVER, so the code
// is never visible in the browser).
//
// EmailJS dashboard setup (one time):
//  1. Email Services > Add service (Gmail is simplest) > note the Service ID
//  2. Email Templates > Create template. In the template set:
//       To Email : {{email}}
//       Subject  : Your Synara verification code
//       Content  : uses {{passcode}} (the code) and {{time}} (when it expires)
//     note the Template ID
//  3. Account > General: copy the Public Key.  Account > Security: copy / create the Private Key
//     and TURN ON "Allow EmailJS API for non-browser applications" (needed because we call it from a server)

export class EmailError extends Error {
  constructor(message, { status = 502, publicMessage, detail } = {}) {
    super(message);
    this.status = status;
    this.publicMessage = publicMessage; // safe to show the user
    this.detail = detail; // server log only
  }
}

const devMode = () => String(process.env.OTP_DEV_MODE || "").toLowerCase() === "true";
const debug = () => String(process.env.OTP_DEBUG || "").toLowerCase() === "true";

// "ashu.kumar@gmail.com" -> "as***@gmail.com"
export function maskEmail(email) {
  const [user = "", domain = ""] = String(email).split("@");
  return `${user.slice(0, 2)}${"*".repeat(Math.max(3, user.length - 2))}@${domain}`;
}

// what EmailJS's text answers mean for you
function explain(status, text) {
  const t = String(text || "");
  if (/non-browser/i.test(t)) return "Turn ON 'Allow EmailJS API for non-browser applications' in EmailJS > Account > Security.";
  if (/public key.*invalid|user_id/i.test(t)) return "EMAILJS_PUBLIC_KEY is wrong. Copy it from EmailJS > Account > General.";
  if (/private key|access ?token/i.test(t)) return "EMAILJS_PRIVATE_KEY is wrong. Copy it from EmailJS > Account > Security.";
  if (/service.*not found|service id/i.test(t)) return "EMAILJS_SERVICE_ID is wrong (EmailJS > Email Services).";
  if (/template.*not found|template id/i.test(t)) return "EMAILJS_TEMPLATE_ID is wrong (EmailJS > Email Templates).";
  if (/recipient.*empty|address is empty|to_email|\bemail\b.*empty/i.test(t)) return "In the EmailJS template, set the 'To Email' field to {{email}}.";
  if (status === 429 || /limit|quota/i.test(t)) return "EmailJS sending limit reached (free plan has a monthly cap). Wait, or upgrade.";
  if (/gmail|smtp|authentication|insufficient/i.test(t)) return "EmailJS could not log in to your Gmail. Reconnect the service in EmailJS > Email Services.";
  return `EmailJS answered ${status}: ${t.slice(0, 200)}`;
}

export async function sendOtpEmail({ to, name, code, expiresMinutes = 5 }, { fetchImpl = fetch } = {}) {
  // Development shortcut: print the code in the backend terminal, send nothing.
  if (devMode()) {
    console.log(`\n[OTP_DEV_MODE] code for ${to}: ${code}\n`);
    return { dev: true };
  }

  const { EMAILJS_SERVICE_ID: service, EMAILJS_TEMPLATE_ID: template, EMAILJS_PUBLIC_KEY: pub, EMAILJS_PRIVATE_KEY: priv } = process.env;
  if (!service || !template || !pub || !priv) {
    const missing = [["EMAILJS_SERVICE_ID", service], ["EMAILJS_TEMPLATE_ID", template], ["EMAILJS_PUBLIC_KEY", pub], ["EMAILJS_PRIVATE_KEY", priv]].filter(([, v]) => !v).map(([k]) => k);
    throw new EmailError("EmailJS not configured", { status: 503, publicMessage: "Email verification is not configured yet.", detail: `Missing in backend/.env: ${missing.join(", ")}` });
  }

  let res;
  try {
    res = await fetchImpl("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: service.trim(),
        template_id: template.trim(),
        user_id: pub.trim(),
        accessToken: priv.trim(),
        // these names must match the {{variables}} in your EmailJS template
        template_params: {
          email: to, // To Email field
          passcode: code, // the 6-digit code
          time: new Date(Date.now() + expiresMinutes * 60000).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }), // when it expires, e.g. 6:45 pm
          expires_in: `${expiresMinutes} minutes`,
          to_name: name || "there",
          app_name: "Synara",
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    throw new EmailError("Could not reach EmailJS", { status: 504, publicMessage: "Could not reach the email service. Please try again.", detail: `Network problem: ${err.name === "TimeoutError" ? "timed out after 15s" : err.message}` });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const fix = explain(res.status, text);
    throw new EmailError(`EmailJS ${res.status}`, {
      status: 502,
      publicMessage: debug() ? `Email failed: ${fix}` : "We could not send the code right now. Please try again, or contact support.",
      detail: `EmailJS ${res.status}: ${text.slice(0, 300)}\n  -> ${fix}`,
    });
  }
  return { sent: true };
}
