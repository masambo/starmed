const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Vercel has the API key
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Vercel is missing the RESEND_API_KEY environment variable. Please add it in the Vercel dashboard.' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const submittedAt = new Date().toLocaleDateString('en-NA', {
      weekday: 'long',
      year:    'numeric',
      month:   'long',
      day:     'numeric',
    });

    const submittedTime = new Date().toLocaleTimeString('en-NA', {
      hour:   '2-digit',
      minute: '2-digit',
    });

    // ─── Styled HTML email (no PDF attachment) ────────────────────────────────
    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Appointment Booking</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#00478f 0%,#0069cc 100%);padding:32px 40px;">
              <p style="margin:0;color:#92D050;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Star Medical Services</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">New Appointment<br/>Booking Request</h1>
            </td>
          </tr>

          <!-- Date banner -->
          <tr>
            <td style="background:#eaf4ff;padding:14px 40px;border-bottom:1px solid #d0e6f5;">
              <p style="margin:0;font-size:13px;color:#555;">
                📅 Submitted on <strong>${submittedAt}</strong> at <strong>${submittedTime}</strong>
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">

              <!-- Patient Details Section -->
              <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#00478f;letter-spacing:1.5px;text-transform:uppercase;border-bottom:2px solid #00478f;padding-bottom:8px;">Patient Details</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;width:45%;color:#888;font-size:13px;">Full Name</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:14px;font-weight:700;">${data.name ?? ''} ${data.surname ?? ''}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;">Contact Number</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:14px;font-weight:700;">${data.contact_number ?? '—'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;">Medical Aid</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:14px;font-weight:700;">${data.medical_aid || 'None / Self-pay'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#888;font-size:13px;">First Visit to Starmed?</td>
                  <td style="padding:10px 0;color:#111;font-size:14px;font-weight:700;">${data.first_visit === 'yes' ? '✅ Yes — first time patient' : '🔄 No — returning patient'}</td>
                </tr>
              </table>

              <!-- Action prompt -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef6ff;border-left:4px solid #00478f;border-radius:6px;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#00478f;line-height:1.7;">
                      📞 Please contact <strong>${data.name ?? ''} ${data.surname ?? ''}</strong> on <strong>${data.contact_number ?? '—'}</strong> to confirm the appointment date and time.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #e8e8e8;text-align:center;">
              <p style="margin:0;font-size:11px;color:#aaa;">Sent automatically via <strong style="color:#00478f;">forms.starmednamibia.com</strong></p>
              <p style="margin:6px 0 0;font-size:11px;color:#aaa;">Star Medical Services · Namibia</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // ─── Send email ───────────────────────────────────────────────────────────
    const result = await resend.emails.send({
      from:    'Starmed Forms <forms@forms.starmednamibia.com>',
      to:      ['starmedicalservices@iway.na'],
      subject: `New Appointment Request — ${data.name ?? ''} ${data.surname ?? ''}`,
      html:    htmlBody,
    });

    if (result.error) {
      console.error(result.error);
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json({ success: true, message: 'Appointment request sent successfully!' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
