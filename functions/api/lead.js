const MAX_BODY_BYTES = 24_000;

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const clean = (value, maxLength = 2_000) =>
  String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isSafeUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const buildEmail = (data) => {
  const formLabel = data.form_type === 'website-audit' ? 'Website Audit Request' : 'Project Inquiry';
  const rows = [
    ['Name', data.name],
    ['Email', data.email],
    ['Business', data.business],
    ['Website', data.website],
    ['Project type', data.project_type],
    ['Budget', data.budget],
    ['Message', data.message]
  ].filter(([, value]) => value);

  const rowsHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#64748b;font-size:13px;vertical-align:top;width:145px;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#0f172a;font-size:14px;white-space:pre-wrap;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join('');

  const text = [
    formLabel,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`)
  ].join('\n');

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,sans-serif;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="padding:22px 26px;background:#0b1f33;color:#ffffff;">
            <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#fb923c;font-weight:700;">Star City Sites</div>
            <h1 style="margin:7px 0 0;font-size:24px;line-height:1.25;">${escapeHtml(formLabel)}</h1>
          </div>
          <table role="presentation" style="width:100%;border-collapse:collapse;">
            ${rowsHtml}
          </table>
          <div style="padding:16px 26px;color:#64748b;font-size:12px;">Submitted from starcitysites.com</div>
        </div>
      </body>
    </html>`;

  return { formLabel, text, html };
};

export async function onRequestPost(context) {
  const { request, env } = context;

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ message: 'The submission was too large.' }, 413);
  }

  let raw;
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      raw = await request.json();
    } else {
      raw = Object.fromEntries((await request.formData()).entries());
    }
  } catch {
    return jsonResponse({ message: 'The submitted form data was invalid.' }, 400);
  }

  if (clean(raw.company_site, 100)) {
    // Silently accept likely bot submissions so the endpoint is less useful to spammers.
    return jsonResponse({ message: 'Thank you. Your request has been sent.' });
  }

  const data = {
    form_type: clean(raw.form_type, 40),
    name: clean(raw.name, 120),
    email: clean(raw.email, 180).toLowerCase(),
    business: clean(raw.business, 180),
    website: clean(raw.website, 500),
    project_type: clean(raw.project_type, 120),
    budget: clean(raw.budget, 80),
    message: clean(raw.message, 4_000)
  };

  if (!['website-audit', 'project-inquiry'].includes(data.form_type)) {
    return jsonResponse({ message: 'The form type was not recognized.' }, 400);
  }

  if (!data.name || !data.email || !isEmail(data.email)) {
    return jsonResponse({ message: 'Please provide a valid name and email address.' }, 400);
  }

  if (!isSafeUrl(data.website)) {
    return jsonResponse({ message: 'Please provide a valid website URL beginning with http:// or https://.' }, 400);
  }

  if (data.form_type === 'website-audit' && !data.website) {
    return jsonResponse({ message: 'Please provide the website you want reviewed.' }, 400);
  }

  if (data.form_type === 'project-inquiry' && (!data.project_type || !data.message)) {
    return jsonResponse({ message: 'Please select a service and include a few project details.' }, 400);
  }

  if (!env.RESEND_API_KEY || !env.LEAD_TO_EMAIL) {
    return jsonResponse(
      { message: 'The contact form is not configured yet.' },
      503
    );
  }

  const fromEmail = env.FROM_EMAIL || 'Star City Sites <website@forms.starcitysites.com>';
  const { formLabel, text, html } = buildEmail(data);

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [env.LEAD_TO_EMAIL],
      reply_to: data.email,
      subject: `${formLabel}: ${data.name}${data.business ? ` — ${data.business}` : ''}`,
      text,
      html
    })
  });

  if (!resendResponse.ok) {
    console.error('Resend request failed', resendResponse.status, await resendResponse.text());
    return jsonResponse({ message: 'The message service did not accept the submission.' }, 502);
  }

  return jsonResponse({
    message:
      data.form_type === 'website-audit'
        ? 'Your audit request has been sent. You will receive a direct response by email.'
        : 'Your project details have been sent. You will receive a direct response by email.'
  });
}

export function onRequest(context) {
  if (context.request.method === 'POST') {
    return onRequestPost(context);
  }
  return jsonResponse({ message: 'Method not allowed.' }, 405);
}
