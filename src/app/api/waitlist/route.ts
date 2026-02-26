import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY is not defined in environment variables.");
}
sgMail.setApiKey(SENDGRID_API_KEY);

const FROM = process.env.EMAIL_FROM;
if (!FROM) {
  throw new Error("EMAIL_FROM is not defined in environment variables.");
}

const NOTIFY = process.env.NOTIFY_EMAIL;
if (!NOTIFY) {
  throw new Error("NOTIFY_EMAIL is not defined in environment variables.");
}

function confirmationEmail(email: string) {
  return {
    to: email,
    from: FROM,
    subject: "You're on the HAM waitlist",
    html: `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #1c1917;">
        <p style="font-family: monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #78716c; margin: 0 0 24px 0;">
          HAM — Hierarchical Agent Memory
        </p>

        <h1 style="font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 16px 0; line-height: 1.2;">
          You're on the list.
        </h1>

        <p style="font-size: 14px; line-height: 1.7; color: #44403c; margin: 0 0 24px 0;">
          We'll reach out when HAM Pro is ready — multi-agent observability,
          team usage comparison, and shared memory sync for your whole
          engineering org.
        </p>

        <p style="font-size: 14px; line-height: 1.7; color: #44403c; margin: 0 0 24px 0;">
          In the meantime, the open-source version is live:
        </p>

        <a href="https://github.com/kromahlusenii-ops/ham"
           style="display: inline-block; background: #1c1917; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 500;">
          Try the free version
        </a>

        <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 32px 0;" />

        <p style="font-size: 12px; color: #a8a29e; margin: 0;">
          Fewer tokens. Lower cost. Greener AI.
        </p>
      </div>
    `,
  };
}

function notificationEmail(userEmail: string) {
  return {
    to: NOTIFY,
    from: FROM,
    subject: `🌿 New HAM user: ${userEmail}`,
    html: `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #1c1917;">
        <p style="font-family: monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #78716c; margin: 0 0 24px 0;">
          HAM Waitlist Notification
        </p>

        <h1 style="font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 16px 0;">
          New HAM user
        </h1>

        <p style="font-size: 14px; line-height: 1.7; color: #44403c; margin: 0 0 8px 0;">
          <strong>${userEmail}</strong> just joined the HAM Pro waitlist.
        </p>

        <p style="font-size: 12px; color: #a8a29e; margin: 24px 0 0 0;">
          ${new Date().toISOString()}
        </p>
      </div>
    `,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    await Promise.all([
      sgMail.send(confirmationEmail(email)),
      sgMail.send(notificationEmail(email)),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Waitlist email error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
