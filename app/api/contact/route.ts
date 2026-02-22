import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Required environment variables (add to .env.local):
//
//   GMAIL_USER=your.gmail@gmail.com
//   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   ← Google account → App passwords
//   CONTACT_EMAIL=the.address.to.receive.emails@gmail.com
// ---------------------------------------------------------------------------

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Please provide a valid email').max(200),
  message: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = schema.parse(body);

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const contactEmail = process.env.CONTACT_EMAIL;

    if (!gmailUser || !gmailPass || !contactEmail) {
      console.error('[contact] Missing email environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const messageBody = message?.trim() || '';

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
              <td style="padding:10px 0;color:#64748b;font-size:13px;width:80px;vertical-align:top;font-weight:500;">Name</td>
              <td style="padding:10px 0;color:#0f172a;font-size:14px;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748b;font-size:13px;vertical-align:top;font-weight:500;">Email</td>
              <td style="padding:10px 0;font-size:14px;">
                <a href="mailto:${escapeHtml(email)}" style="color:#1a3a3a;">${escapeHtml(email)}</a>
              </td>
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
          <p style="color:#94a3b8;font-size:12px;margin:0;">sent via dogcal contact form</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }
    console.error('[contact] error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
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
