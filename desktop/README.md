# Wiliakonect Studio for Windows

Wiliakonect Studio is a lightweight Windows desktop wrapper for the website,
AI website editor, and a searchable library of 1,000 templates in 25 categories.
Each category has 40 visual combinations, and templates can be edited in the
workspace or downloaded as standalone HTML. It uses Tauri and the Windows
WebView2 runtime instead of bundling a full browser. Gemini generation, saved
projects, and Vercel publishing work only after their Supabase Edge Functions
and server-side secrets have been configured using
[`../SUPABASE_SETUP.md`](../SUPABASE_SETUP.md).

The CMS supports up to 12 pages per site, 20 editable content blocks per page,
page-specific search details, external image URLs, complete ZIP export, and
multi-page preview publishing. Its native add-ons provide SEO/social metadata,
an announcement bar, and social links. These are not third-party WordPress
plugins, and the CMS does not run arbitrary plugin code. A block marketplace,
custom domains, billing, collaboration, and project history remain out of scope.

## Build the Windows installer

The installer must be built on a Windows computer. The app does not require
Node.js because it uses static HTML, CSS, and JavaScript, but building the
installer requires the Rust toolchain and Microsoft's C++ build tools.

1. Install the stable Rust toolchain using [rustup](https://rustup.rs/).
2. Install **Microsoft C++ Build Tools** with the **Desktop development with
   C++** workload.
3. Confirm that the machine has WebView2 (Windows 10/11 usually includes the
   runtime).
4. Open PowerShell in this `desktop` folder and install the Tauri CLI:

   ```powershell
   cargo install tauri-cli --version "^2"
   ```

5. Build the NSIS installer:

   ```powershell
   Set-Location .\src-tauri
   cargo tauri build
   ```

The build copies a curated list of website files into `web-dist` and writes the
Windows installer under `src-tauri\target\release\bundle\nsis`. The installer
uses WebView2; Windows 10/11 machines without the runtime may need to install
Microsoft Edge WebView2 Runtime. The desktop build removes the remote Google
Fonts requests so it does not need to download fonts when it starts.

The desktop app is intentionally a small wrapper around the same website code.
It includes the current responsive page editor and account dashboard, but it is
not full WordPress parity: third-party WordPress plugins, ecommerce,
collaboration, revisions, and custom-domain hosting are not included. Live AI,
saved projects, and publishing still require the configured Supabase services.
The shared Wiliakonect logo is bundled as `brand.svg` and used across the
public site and software pages.

The company pages include a React chat assistant. The desktop wrapper does not
bundle PHP, so AI replies require a separately hosted PHP API; without it, the
assistant gives local guidance and points visitors to the contact options. The
chat UI loads React from esm.sh and therefore needs an internet connection.
