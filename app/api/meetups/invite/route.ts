import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import dns from 'dns';

// POST /api/meetups/invite - request an invite for someone
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, type, neighbourhood, requestedBy } = body as { name?: string; email?: string; type?: string; neighbourhood?: string; requestedBy?: string };

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!type || !['owner', 'friend'].includes(type)) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 });
    }
    if (!neighbourhood || typeof neighbourhood !== 'string' || neighbourhood.trim().length === 0) {
      return NextResponse.json({ error: 'Neighbourhood is required' }, { status: 400 });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const contactEmail = process.env.CONTACT_EMAIL;

    if (!gmailUser || !gmailPass || !contactEmail) {
      console.error('[invite] Missing env vars');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    dns.setDefaultResultOrder('ipv4first');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: gmailUser, pass: gmailPass },
      tls: { rejectUnauthorized: false },
    });

    const typeLabel = type === 'owner' ? 'has a dog and wants care help' : 'wants to hang out with dogs';

    await transporter.sendMail({
      from: `"dogcal" <${gmailUser}>`,
      to: contactEmail,
      replyTo: email,
      subject: `dogcal — invite request for ${name.trim()}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:32px;border-radius:12px;">
          <div style="background:#1a3a3a;border-radius:8px;padding:16px 24px;margin-bottom:24px;">
            <h1 style="color:#f4a9a8;font-size:16px;margin:0;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">
              dogcal — invite request
            </h1>
          </div>
          <p style="color:#0f172a;font-size:15px;margin:0 0 20px;">${requestedBy ? `<strong>${escapeHtml(requestedBy)}</strong> wants to invite a friend to dogcal.` : 'Someone wants to invite a friend to dogcal.'}</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;color:#64748b;font-size:13px;width:100px;vertical-align:top;font-weight:500;">Their name</td>
              <td style="padding:10px 0;color:#0f172a;font-size:14px;">${escapeHtml(name.trim())}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748b;font-size:13px;vertical-align:top;font-weight:500;">Their email</td>
              <td style="padding:10px 0;font-size:14px;">
                <a href="mailto:${escapeHtml(email.trim())}" style="color:#1a3a3a;">${escapeHtml(email.trim())}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748b;font-size:13px;vertical-align:top;font-weight:500;">They</td>
              <td style="padding:10px 0;color:#0f172a;font-size:14px;">${escapeHtml(typeLabel)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748b;font-size:13px;vertical-align:top;font-weight:500;">Based in</td>
              <td style="padding:10px 0;color:#0f172a;font-size:14px;">${escapeHtml(neighbourhood.trim())}</td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">Sent via dogcal invite form</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[invite] Failed:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? msg : 'Failed to send invite' },
      { status: 500 }
    );
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
