const { Resend } = require('resend');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs   = require('fs');
const path = require('path');

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

    // ─── Build PDF ────────────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();
    const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page  = pdfDoc.addPage([595.28, 841.89]);
    let yIdx  = 780;
    const margin    = 50;
    const pageWidth = 595.28;

    // ── Embed Starmed logo ──────────────────────────────────────────────────
    try {
      const logoPath  = path.join(process.cwd(), 'images', 'STAR Medical Services logo design.png');
      const logoBytes = fs.readFileSync(logoPath);
      const logoImg   = await pdfDoc.embedPng(logoBytes);
      const logoDims  = logoImg.scaleToFit(130, 60);
      page.drawImage(logoImg, {
        x:      pageWidth - margin - logoDims.width,
        y:      841.89 - 30 - logoDims.height,
        width:  logoDims.width,
        height: logoDims.height,
      });
    } catch (logoErr) {
      // Logo not critical — proceed without it if file can't be read
      console.warn('Logo not embedded:', logoErr.message);
    }

    const drawText = (text, size = 12, isBold = false, color = rgb(0, 0, 0)) => {
      if (yIdx < 60) {
        page  = pdfDoc.addPage([595.28, 841.89]);
        yIdx  = 780;
      }
      page.drawText(String(text ?? ''), {
        x: margin,
        y: yIdx,
        size,
        font: isBold ? boldFont : font,
        color,
      });
      yIdx -= (size + 8);
    };

    const drawLine = () => {
      if (yIdx < 60) {
        page  = pdfDoc.addPage([595.28, 841.89]);
        yIdx  = 780;
      }
      page.drawLine({
        start: { x: margin, y: yIdx },
        end:   { x: pageWidth - margin, y: yIdx },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
      yIdx -= 10;
    };

    // Header
    drawText('Star Medical Services', 22, true, rgb(0, 0.278, 0.561));
    yIdx -= 4;
    drawText('Uluntu Medicare — Subscription Application', 14, true, rgb(0.573, 0.816, 0.314));
    yIdx -= 4;
    drawText(`Date Submitted: ${new Date().toLocaleDateString('en-NA', { year: 'numeric', month: 'long', day: 'numeric' })}`, 10, false, rgb(0.4, 0.4, 0.4));
    yIdx -= 6;
    drawLine();

    const sections = {
      '1. Plan Selection': [
        ['Plan Type',          data.planType],
        ['Payment Frequency',  data.paymentFreq],
      ],
      '2. Principal Member Details': [
        ['Full Name',              `${data.firstName ?? ''} ${data.surname ?? ''}`],
        ['ID / Passport No.',      data.idNumber],
        ['Date of Birth',          data.dob],
        ['Gender',                 data.gender],
        ['Nationality',            data.nationality],
        ['Residential Address',    `${data.address ?? ''}${data.city ? ', ' + data.city : ''}${data.postalCode ? ' - ' + data.postalCode : ''}`],
        ['Mobile Number',          data.mobile],
        ['Alternate Number',       data.altNumber],
        ['Employer',               data.employer],
        ['Occupation',             data.occupation],
      ],
      '3. Medical History': [
        ['Age / Height / Weight',      `${data.age || 'N/A'} yrs / ${data.height || 'N/A'} / ${data.weight || 'N/A'}`],
        ['Existing Conditions',        data.existingConditions + (data.existingConditionsDetail ? `: ${data.existingConditionsDetail}` : '')],
        ['Smoking Status',             data.smoking],
        ['Alcohol Consumption',        data.alcohol],
        ['Chronic Medication',         data.chronicMed + (data.chronicMedDetail ? `: ${data.chronicMedDetail}` : '')],
        ['Family Chronic Illnesses',   data.familyChronic + (data.familyChronicDetail ? `: ${data.familyChronicDetail}` : '')],
        ['Previous Surgeries',         data.surgeries + (data.surgeriesDetail ? `: ${data.surgeriesDetail}` : '')],
        ['Previous Accidents',         data.accidents + (data.accidentsDetail ? `: ${data.accidentsDetail}` : '')],
        ['Hospitalisations',           data.hospitalisations + (data.hospitalisationsDetail ? `: ${data.hospitalisationsDetail}` : '')],
        ['Allergies',                  data.allergies + (data.allergiesDetail ? `: ${data.allergiesDetail}` : '')],
        ['Pregnant?',                  data.pregnant],
      ],
      '4. Banking & Payment Details': [
        ['Account Holder',  data.accountHolder],
        ['Bank Name',       data.bankName],
        ['Branch Code',     data.branchCode],
        ['Account Number',  data.accountNumber],
        ['Account Type',    data.accountType],
        ['Debit Order Date',data.debitDate],
      ],
      '5. Emergency Contact': [
        ['Full Name',       data.emergencyName],
        ['Relationship',    data.emergencyRelationship],
        ['Contact Number',  data.emergencyPhone],
      ],
      '6. Declaration': [
        ['Agreed to Terms', data.declaration ? 'Yes' : 'No'],
        ['Printed Name',    data.printName],
        ['Date Signed',     data.signDate],
        ['Preferred Branch',data.preferredBranch],
      ],
    };

    for (const [sectionTitle, fields] of Object.entries(sections)) {
      yIdx -= 6;
      drawText(sectionTitle, 13, true, rgb(0, 0.278, 0.561));
      yIdx -= 2;
      for (const [label, val] of fields) {
        if (!val || val === 'undefined' || val === 'null' || val === '') continue;
        drawText(`${label}: ${val}`, 11);
      }
      drawLine();
    }

    const pdfBytes  = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // ─── Styled HTML email ────────────────────────────────────────────────────
    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Uluntu Medicare Application</title>
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
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">New Uluntu Medicare<br/>Application Received</h1>
            </td>
          </tr>

          <!-- Summary Banner -->
          <tr>
            <td style="background:#eaf4ff;padding:16px 40px;border-bottom:1px solid #d0e6f5;">
              <p style="margin:0;font-size:13px;color:#555;">Submitted on <strong>${new Date().toLocaleDateString('en-NA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">

              <!-- Member Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td colspan="2" style="padding-bottom:10px;border-bottom:2px solid #00478f;margin-bottom:12px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#00478f;letter-spacing:1.5px;text-transform:uppercase;">Principal Member</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;width:45%;color:#888;font-size:13px;">Full Name</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#222;font-size:13px;font-weight:600;">${data.firstName ?? ''} ${data.surname ?? ''}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;">ID / Passport No.</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#222;font-size:13px;font-weight:600;">${data.idNumber ?? '—'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;">Mobile Number</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#222;font-size:13px;font-weight:600;">${data.mobile ?? '—'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;">Date of Birth</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#222;font-size:13px;font-weight:600;">${data.dob ?? '—'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;">Preferred Branch</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#222;font-size:13px;font-weight:600;">${data.preferredBranch ?? '—'}</td>
                </tr>
              </table>

              <!-- Plan Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td colspan="2" style="padding-bottom:10px;border-bottom:2px solid #92D050;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#5a9a1a;letter-spacing:1.5px;text-transform:uppercase;">Plan Details</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;width:45%;color:#888;font-size:13px;">Plan Type</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#222;font-size:13px;font-weight:600;">${data.planType ?? '—'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;">Payment Frequency</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#222;font-size:13px;font-weight:600;">${data.paymentFreq ?? '—'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#888;font-size:13px;">Agreed to Terms</td>
                  <td style="padding:10px 0;color:#222;font-size:13px;font-weight:600;">${data.declaration ? '✅ Yes' : '❌ No'}</td>
                </tr>
              </table>

              <!-- Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7fcef;border-left:4px solid #92D050;border-radius:6px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#4a7c10;line-height:1.6;">
                      📎 <strong>Full application details</strong> including medical history, banking information, and emergency contacts are captured in the <strong>PDF attachment</strong>.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #e8e8e8;text-align:center;">
              <p style="margin:0;font-size:11px;color:#aaa;">This email was sent automatically via <strong style="color:#00478f;">forms.starmednamibia.com</strong></p>
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
      from: 'Starmed Forms <forms@forms.starmednamibia.com>',
      to:   ['starmedicalservices@iway.na'],
      replyTo: data.mobile ? undefined : undefined,
      subject: `New Uluntu Medicare Application — ${data.firstName ?? ''} ${data.surname ?? ''}`,
      html: htmlBody,
      attachments: [
        {
          filename: `Uluntu_Application_${data.surname ?? 'Unknown'}.pdf`,
          content:  pdfBuffer.toString('base64'),
        },
      ],
    });

    if (result.error) {
      console.error(result.error);
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json({ success: true, message: 'Application submitted and email delivered!' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
