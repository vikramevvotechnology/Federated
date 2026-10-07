# FederatedOne website: launch checklist

## Done
- 18 pages: Home, Platform, How it fits, Agentis, Build, Cloud, DC, Ecosystem, Use cases, Case studies (listing and detail templates), FAQ, About, Contact, Privacy, Cookies, AI policy, 404.
- Favicon (`assets/img/favicon.svg`), phone home-screen icon (`apple-touch-icon.png`) and social sharing image (`og-image.png`, 1200×630).
- Sharing tags (Open Graph and X) and theme colour on every page; company structured data (JSON-LD) on the home page; FAQ structured data on the FAQ page.
- "Skip to content" link, visible keyboard focus, labelled fields and buttons, one main heading per page.
- Scripts load without blocking the page; logo images have fixed sizes to avoid layout jumps.
- Link check: no missing files or broken anchors (`tools/check-links.ps1`).

## Needed from you before launch
| Item | Where it is used |
|---|---|
| Domain (for example `https://www.federatedone.com`) | Build step: canonical links, sharing image, sitemap |
| Where enquiries should go (email inbox, CRM or form service) | Contact form (`assets/js/main.js`, marked “Prototype only”) |
| LinkedIn and X addresses | Footer on every page (currently `#`) |
| Company legal name, registered address, privacy email, regulator, retention period, date | Privacy, Cookies and AI policy pages (highlighted in yellow) |
| Legal review of the three policy pages, and the three commitments flagged for confirmation | Privacy and AI policy |
| Evvo Group’s role, and your story | About page (highlighted) |
| Real, client-approved case studies (client, industry, components, results, quote) | `case-studies.html` and `case-study.html`, hidden from search until filled in |

## Commands
Render the sharing image and phone icon again (after changing `tools/og-image.html` or `tools/touch-icon.html`):

    powershell -ExecutionPolicy Bypass -File tools\render-images.ps1

Check links:

    powershell -ExecutionPolicy Bypass -File tools\check-links.ps1

Build the live site into `dist\`:

    powershell -ExecutionPolicy Bypass -File tools\build.ps1 -Domain https://www.your-domain.com

Upload the contents of `dist\` to your hosting. `dist\` contains only the live site: no `variants\`, `tools\`, `References\` or preview files.

## After the legal pages are approved
1. Replace the highlighted gaps and remove the “Draft, subject to legal review” notice.
2. Remove `<meta name="robots" content="noindex" />` from `privacy.html`, `cookies.html` and `ai-policy.html`.
3. Run the build again, so the three pages are added to the sitemap.

## Hosting notes
- 404 page: `dist\.htaccess` handles this on Apache hosting. On other hosts, set the custom error page to `/404.html`.
- After going live, submit `https://your-domain/sitemap.xml` in Google Search Console.
