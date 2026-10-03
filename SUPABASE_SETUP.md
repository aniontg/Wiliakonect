# Wiliakonect setup

## What the builder does

The website builder now has an AI-generation endpoint, editable website content,
per-user saved projects, a searchable library of 1,000 editable and downloadable
templates across 25 categories, and a private publishing function that creates
a unique Vercel preview deployment. Each user can only access their own saved
projects. The CMS supports up to 12 pages per site, with up to 20 editable
content blocks on each page, page-specific navigation addresses, image URLs,
page search titles/descriptions, full-site ZIP export, and multi-page publishing.

It is still an early CMS, not a full WordPress replacement: it does not run
third-party WordPress/PHP plugins or arbitrary plugin code. Its built-in
Wiliakonect add-ons are listed below. A block marketplace, custom domains,
billing, collaboration, and project version history are not included.
Publishing depends on your Vercel account and plan.

The main Wiliakonect site remains focused on its original technology services:
websites and digital experiences, software and business tools, and IT support.
The website builder is an additional Wiliakonect tool. The Home, Services,
About, and Contact navigation links load their page content in place when the
site is served over HTTP, while retaining regular page links for direct visits,
refreshes, and fallback navigation. Authentication and the builder open as
their own pages.

Template photography uses image URLs hosted by Unsplash and therefore needs an
internet connection to display. CMS image URLs are restricted to HTTPS, and
image alternatives can be edited for accessibility.
These CMS fields are stored in the existing `website_projects.site_data`
JSONB column, so this addition does not require a new SQL migration.
Choosing **Edit this design** in the template library opens the separate
[`editor.html`](./editor.html) workspace. The library and editor are responsive
and can be used on mobile screens. Template cover photography rotates through
the curated Unsplash collection instead of reusing one cover for every design
in a category.
The account dashboard lists the signed-in user's saved websites and links
directly to each project's editor. Template variants now use different
category-specific copy, three category-matched cover photos, and varied layouts
and motifs. Website themes include Light, Dark, Warm, and Bold; the chosen theme
is used in the live preview, saved project, downloaded files, and AI generation.
The software dashboard uses a WordPress-inspired admin layout, and the company
pages and software pages share the same `brand.svg` logo asset. The CMS also
has a small native add-on catalog: SEO/social preview metadata, an announcement
bar, and social links. Add-ons are enabled per site, saved with the existing
JSONB project data, and included in preview, ZIP export, and publishing.
They are Wiliakonect features, not third-party WordPress plugins; the CMS does
not execute arbitrary plugin code.

The public Home, Services, About, and Contact pages also have a React-powered
chat assistant. When the PHP/Supabase connection is configured, visitor chat
and consented contact enquiries are saved in the
Supabase `support_inbox` table and stream into the signed-in admin dashboard
using Supabase Realtime. The protected inbox uses row-level security; visitors
cannot read inbox records, and regular users cannot set their own admin flag.
Chat text is sent to Gemini and stored for follow-up, so visitors are warned not
to send passwords, payment details, or sensitive personal information. The
contact form requires consent before storing contact details. The email link
only prepares a draft; the visitor must choose whether to send it.

React/ReactDOM are loaded from esm.sh, so the chat interface needs an internet
connection. The current static/Vercel pages do not run PHP themselves: deploy
the PHP API on a PHP-capable host and proxy `/api/chat.php` and `/api/lead.php`
through the same origin. The local FAQ guidance clearly reports when AI or
inbox storage is unavailable.

## Run the site with PHP locally

Install PHP 8.1 or newer with the cURL extension. In Supabase, apply the latest
[`supabase/schema.sql`](./supabase/schema.sql) as described below before using
chat or enquiries. Open PowerShell in the repository root and set the Gemini
key and Supabase service-role key only in the current shell (never in a website
file):

```powershell
$env:SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co"
$secureGemini = Read-Host "Gemini API key" -AsSecureString
$geminiPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureGemini)
try {
  $env:GEMINI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($geminiPointer)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($geminiPointer)
}
$secureServiceKey = Read-Host "Supabase secret key (server only)" -AsSecureString
$serviceKeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureServiceKey)
try {
  $env:SUPABASE_SECRET_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($serviceKeyPointer)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($serviceKeyPointer)
}
php -S 127.0.0.1:8000 -t . router.php
```

Then open `http://127.0.0.1:8000`. The router serves the existing HTML pages
and forwards the chat and enquiry APIs to PHP. Never publish `SUPABASE_SECRET_KEY` in HTML, JavaScript, or
`supabase-config.js`; put it only in server-side environment variables or the
PHP host's secret manager. Create a fresh secret key in Supabase for this
server; do not reuse a key that has been revoked.
The API applies per-visitor request limits, rejects cross-site/non-JSON
requests, and uses the service key only from PHP to write inbox rows.

## 1. Check the Supabase project connection

[`supabase-config.js`](./supabase-config.js) must contain the **Project URL** and
**publishable/anon key** from Supabase **Project Settings → API**. Never put a
`service_role`, secret, or `sb_secret_` key in the website or this file.

## 2. Apply the latest database schema

The SQL schema includes private website projects, the AI usage limit, and the
support inbox. In Supabase, open **SQL Editor → New query**, paste all of
[`supabase/schema.sql`](./supabase/schema.sql), and click **Run**. The schema
enables Realtime for `support_inbox`, enables row-level security, and is designed
to be rerun safely. Reapply it if you have already created the earlier schema.

After signing in with the account that should manage enquiries, run this query
in Supabase SQL Editor, replacing the email with that account's email:

```sql
update public.profiles
set is_admin = true
where id = (
  select id from auth.users
  where lower(email) = lower('YOUR_ADMIN_EMAIL')
);
```

Only mark accounts you control as admins. Admin status is not self-service:
users can edit their display name but cannot update `profiles.is_admin`.
Admins see the live inbox in `dashboard.html`; they can read conversations and
enquiries, update an item's status, and permanently delete an item. Visitors
may create records only through the rate-limited PHP API and cannot read the
inbox. Delete records when they are no longer needed.

## 3. Create a Gemini API key

1. Open [Google AI Studio API keys](https://aistudio.google.com/apikey) while
   signed in with your Google account.
2. Create a Gemini API key. **Do not send the key to me or place it in a website
   file.** Google offers a free tier with limits that can change. The builder
   also restricts each account to five generation attempts per UTC day.
3. Free Gemini API use may allow Google to use submitted prompts and responses
   to improve Google products. The builder asks users to be at least 18 and not
   submit confidential or sensitive personal information.
4. Google's terms require paid Gemini services if the app is made available to
   users in the UK, European Economic Area, or Switzerland. Check the current
   [Gemini API terms](https://ai.google.dev/gemini-api/terms), [pricing](https://ai.google.dev/gemini-api/docs/pricing),
   and [available regions](https://ai.google.dev/gemini-api/docs/available-regions)
   before opening the builder to users there.

## 4. Prepare Vercel publishing

The Vercel project ID you supplied is configured below as the value for the
server-side `VERCEL_PROJECT_ID` secret:

```text
prj_37WApWoZod5LVsZMzYVQiMAxZcA5
```

1. In Vercel, create a token with access to that project. Copy it only into the
   Supabase function secret called `VERCEL_TOKEN`; **never paste it into this
   repository or chat**.
2. If the project belongs to a Vercel team, get its team ID and also set the
   `VERCEL_TEAM_ID` secret. Personal projects can leave this unset.
3. The publisher uses Vercel preview deployments, so each published version
   gets its own Vercel URL instead of replacing the main domain of your Vercel
   project. Custom domains and production-domain aliases are not configured.
4. Check that your Vercel plan permits your intended use and publication
   volume. Review the [Vercel Hobby plan](https://vercel.com/docs/plans/hobby)
   and usage limits; do not put private or customer-sensitive data in a public
   site.

## 5. Deploy the two secure Edge Functions

The AI and Vercel keys must remain server-side in Supabase Edge Function
Secrets. On Windows, install the Supabase CLI with
[Scoop](https://scoop.sh/) and open a new PowerShell window:

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
supabase login
supabase functions deploy generate-website --project-ref ljisbrzfevkqfwkthyur
supabase functions deploy publish-website --project-ref ljisbrzfevkqfwkthyur
```

The CLI opens a browser so you can sign into Supabase. It deploys the function
source in `supabase/functions/`; do not add secret values to those source files.
Redeploy `publish-website` whenever its shared renderer changes so newly
published sites include the latest native add-ons.

Then open the Supabase project's **Edge Functions → Secrets** page and add:

| Name | Value |
| --- | --- |
| `GEMINI_API_KEY` | The key from Google AI Studio |
| `VERCEL_TOKEN` | The private token you created in Vercel |
| `VERCEL_PROJECT_ID` | `prj_37WApWoZod5LVsZMzYVQiMAxZcA5` |
| `VERCEL_TEAM_ID` | Your Vercel team ID, if this is a team project |

Supabase supplies the project's own URL and publishable keys to Edge Functions.
The functions verify the signed-in Supabase user, keep provider credentials
server-side, validate generated content, and enforce per-user project access.

## 6. Test it

Run the website with VS Code Live Server or another local HTTP server. Open
`builder.html` on a desktop computer, create an account or sign in, accept the
AI notice, describe a test business, and generate a site. Edit its content and
sections, save it, reopen it from **Saved projects**, download the HTML, then
try publishing it to Vercel.

Google sign-in is separate from Gemini API access. To enable Google account
sign-in, configure the Google provider and OAuth credentials under Supabase
Authentication. Email/password sign-in does not need Google OAuth.
