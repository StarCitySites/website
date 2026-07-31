# Star City Sites

A responsive small-business website for **starcitysites.com**, designed for deployment on Cloudflare Pages.

## Included

- Conversion-focused single-page marketing site
- Responsive desktop, tablet, and mobile layouts
- Services, example work, process, pricing, FAQ, website audit, and project inquiry sections
- Cloudflare Pages Function at `/api/lead`
- Resend email delivery integration
- Honeypot spam protection and server-side input validation
- Privacy page and custom 404 page
- SEO metadata, structured data, sitemap, robots file, social card, and favicon
- Security and caching headers for Cloudflare Pages
- Standalone logo mark and horizontal wordmark SVG files
- No external font, image, framework, or analytics dependency

## Project structure

```text
starcitysites/
├── public/                 Static website files deployed by Pages
│   ├── assets/
│   ├── index.html
│   ├── privacy.html
│   ├── 404.html
│   ├── styles.css
│   ├── script.js
│   ├── _headers
│   ├── _redirects
│   ├── robots.txt
│   └── sitemap.xml
├── functions/
│   └── api/
│       └── lead.js         Handles both website forms
├── preview/                Rendered reference images
├── .dev.vars.example
├── wrangler.jsonc
└── README.md
```

## Preview the static layout

From the project directory:

```bash
python3 -m http.server 8000 --directory public
```

Open `http://localhost:8000`. The site will render, but form submissions require Pages Functions.

## Test the complete site locally

1. Install Node.js if it is not already installed.
2. Copy `.dev.vars.example` to `.dev.vars`.
3. Add a Resend API key and your real destination inbox.
4. Run:

```bash
npx wrangler pages dev public
```

Wrangler serves the static files and the `/functions` route together. The local address is normally shown in the terminal.

## Configure form delivery

Both forms send to `/api/lead`. The function expects these environment variables:

| Variable | Required | Purpose |
|---|---:|---|
| `RESEND_API_KEY` | Yes | Resend API credential used to send the notification email |
| `LEAD_TO_EMAIL` | Yes | Inbox that receives website-audit and project requests |
| `FROM_EMAIL` | Recommended | Verified sender, such as `Star City Sites <website@forms.starcitysites.com>` |

Before launch:

1. Add and verify a sending domain in Resend. A dedicated subdomain such as `forms.starcitysites.com` keeps form-delivery DNS separate from normal business email.
2. Create a Resend API key.
3. Add the three values above to the Cloudflare Pages project as encrypted secrets or environment variables.
4. Redeploy the project after saving the values.
5. Submit both forms and verify delivery and reply behavior.

The function sets the visitor's email as the reply-to address. Replies therefore go to the person who submitted the form rather than to the automated sender address.

## Deploy through Cloudflare Pages using Git

This is the recommended setup because each Git push can create a new deployment and the `/functions` directory is included.

1. Put the entire `starcitysites` folder into a GitHub or GitLab repository.
2. Create a Cloudflare Pages project and connect the repository.
3. Use these build settings:

```text
Framework preset: None
Build command: exit 0
Build output directory: public
Root directory: /
```

4. Add the form environment variables listed above.
5. Deploy and test the temporary `pages.dev` address.
6. Add `starcitysites.com` and optionally `www.starcitysites.com` as custom domains.
7. Choose one primary hostname and redirect the other to it.

## Deploy with Wrangler instead

The included `wrangler.jsonc` identifies `public` as the Pages output directory. After authenticating Wrangler, deploy from the project root:

```bash
npx wrangler pages deploy
```

Important: Cloudflare's dashboard drag-and-drop upload does not deploy a normal `/functions` directory. Use Git integration or Wrangler so the contact forms are included.

## Before publishing

Review these items:

- Confirm the displayed email address, service area, prices, and care-plan terms.
- Create the `hello@starcitysites.com` mailbox or replace it throughout the files.
- Replace concept portfolio items with real projects as they become available; keep the “Concept project” label until then.
- Decide whether the listed package prices are public commitments or starting estimates.
- Review the privacy policy for the final business structure and any analytics, CRM, scheduling, or advertising tools you add.
- Test every navigation link and form on desktop and mobile.
- Confirm the apex domain and `www` redirect behavior.
- Add a Cloudflare WAF rate-limiting rule or Turnstile if form spam becomes significant.

## Common edits

Most content is in `public/index.html`. Colors and layout are controlled by variables at the top of `public/styles.css`.

```css
--navy-950: #071827;
--navy-900: #0b1f33;
--orange-500: #f97316;
```

The email sender and validation logic are in `functions/api/lead.js`.
