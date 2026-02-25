import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import dns from 'dns';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Required environment variables (add to .env.local):
//
//   GMAIL_USER=your.gmail@gmail.com
//   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   ← Google account → App passwords
//   CONTACT_EMAIL=the.address.to.receive.emails@gmail.com
// ---------------------------------------------------------------------------

const interestLabels: Record<string, string> = {
  owner: 'I have a dog and want care help',
  friend: 'I want to hang out with a dog',
  both: 'Both',
  other: 'Something else',
};

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Please provide a valid email').max(200),
  interest: z.enum(['owner', 'friend', 'both', 'other']),
  neighbourhood: z.string().min(1, 'Neighbourhood is required').max(200),
  message: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, interest, neighbourhood, message } = schema.parse(body);

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const contactEmail = process.env.CONTACT_EMAIL;

    if (!gmailUser || !gmailPass || !contactEmail) {
      console.error('[contact] Missing env vars — GMAIL_USER:', !!gmailUser, 'GMAIL_APP_PASSWORD:', !!gmailPass, 'CONTACT_EMAIL:', !!contactEmail);
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Force IPv4 — Gmail's SMTP over IPv6 is often blocked by local networks
    dns.setDefaultResultOrder('ipv4first');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
      tls: {
        // Bypass self-signed cert issues common on Windows / corporate networks
        rejectUnauthorized: false,
      },
    });

    const messageBody = message?.trim() || '';
    const interestLabel = interestLabels[interest] ?? interest;

    await transporter.sendMail({
      from: `"dogcal" <${gmailUser}>`,
      to: contactEmail,
      replyTo: email,
      subject: `dogcal — new message from ${name}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:32px;border-radius:12px;">
          <div style="background:#1a3a3a;border-radius:8px;padding:16px 24px;margin-bottom:24px;">
            <h1 style="color:#f4a9a8;font-size:16px;margin:0;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">
              dogcal — contact form
            </h1>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;color:#64748b;font-size:13px;width:90px;vertical-align:top;font-weight:500;">Name</td>
              <td style="padding:10px 0;color:#0f172a;font-size:14px;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748b;font-size:13px;vertical-align:top;font-weight:500;">Email</td>
              <td style="padding:10px 0;font-size:14px;">
                <a href="mailto:${escapeHtml(email)}" style="color:#1a3a3a;">${escapeHtml(email)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748b;font-size:13px;vertical-align:top;font-weight:500;">Interest</td>
              <td style="padding:10px 0;color:#0f172a;font-size:14px;">${escapeHtml(interestLabel)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748b;font-size:13px;vertical-align:top;font-weight:500;">Based in</td>
              <td style="padding:10px 0;color:#0f172a;font-size:14px;">${escapeHtml(neighbourhood)}</td>
            </tr>
            ${
              messageBody
                ? `<tr>
              <td style="padding:10px 0;color:#64748b;font-size:13px;vertical-align:top;font-weight:500;">Message</td>
              <td style="padding:10px 0;color:#0f172a;font-size:14px;line-height:1.6;">${escapeHtml(messageBody).replace(/\n/g, '<br>')}</td>
            </tr>`
                : ''
            }
          </table>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">Sent via dogcal contact form</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Zod validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }
    // Log the full error so it shows in terminal / Vercel logs
    console.error('[contact] Failed to send email:', error);
    const msg = error instanceof Error ? error.message : String(error);
    // Return real error in dev so it's visible in the browser network tab
    const payload = process.env.NODE_ENV === 'development'
      ? { error: msg }
      : { error: 'Failed to send message' };
    return NextResponse.json(payload, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
