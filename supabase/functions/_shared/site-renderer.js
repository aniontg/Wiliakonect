import { cmsPluginIds } from "./cms-plugins.js";

export const siteThemes = {
  light: {
    background: "#f7f4ed",
    ink: "#29382f",
    accent: "#587a58",
    soft: "#e4ebdd",
    surface: "#fffefa",
  },
  warm: {
    background: "#fff4e8",
    ink: "#54372e",
    accent: "#bb674e",
    soft: "#f8dfd1",
    surface: "#fffaf5",
  },
  bold: {
    background: "#17192d",
    ink: "#fffaf2",
    accent: "#bf9cff",
    soft: "#302c50",
    surface: "#211f38",
  },
  dark: {
    background: "#151821",
    ink: "#f4f3ee",
    accent: "#a9c8ff",
    soft: "#242a38",
    surface: "#1d222e",
  },
};

const websiteDesigns = Object.fromEntries(
  Array.from({ length: 40 }, (_, index) => [
    `design-${String(index + 1).padStart(2, "0")}`,
    {
      layout: String(Math.floor(index / 8)),
      motif: String(index % 8),
    },
  ]),
);

export const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="17" fill="#f8f5ff"/>
  <path d="M9 50 20 30l7 12 9-18 8 13 10-25" fill="none" stroke="#f2a000" stroke-linecap="round" stroke-linejoin="round" stroke-width="6"/>
  <path d="m49 14 6-3 2 8" fill="none" stroke="#f2a000" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/>
  <rect x="12" y="24" width="5" height="5" rx="1" fill="#f2a000"/>
  <rect x="26" y="44" width="5" height="5" rx="1" fill="#38208f"/>
  <rect x="40" y="22" width="5" height="5" rx="1" fill="#38208f"/>
</svg>`;

function boundedText(candidate, fallback, maxLength) {
  return typeof candidate === "string"
    ? candidate.trim().slice(0, maxLength)
    : fallback;
}

function safeImageUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function safeExternalUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function normalizeCmsPlugins(value) {
  const supplied = value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
  const installed = Array.isArray(supplied.installed)
    ? [...new Set(supplied.installed.filter((id) => cmsPluginIds.has(id)))]
    : [];
  const active = Array.isArray(supplied.active)
    ? [...new Set(supplied.active.filter((id) => installed.includes(id)))]
    : [];
  const settings = supplied.settings && typeof supplied.settings === "object"
    ? supplied.settings
    : {};
  const announcement = settings.announcement && typeof settings.announcement === "object"
    ? settings.announcement
    : {};
  const socialLinks = settings.socialLinks && typeof settings.socialLinks === "object"
    ? settings.socialLinks
    : {};
  return {
    installed,
    active,
    settings: {
      announcement: {
        message: boundedText(announcement.message, "", 120),
        linkLabel: boundedText(announcement.linkLabel, "", 35),
        url: safeExternalUrl(announcement.url),
      },
      socialLinks: {
        instagram: safeExternalUrl(socialLinks.instagram),
        facebook: safeExternalUrl(socialLinks.facebook),
        youtube: safeExternalUrl(socialLinks.youtube),
        linkedin: safeExternalUrl(socialLinks.linkedin),
      },
    },
  };
}

function normalizeSections(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20).map((section, index) => ({
    id: boundedText(section?.id, `section-${index + 1}`, 60)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-"),
    heading: boundedText(section?.heading, "", 90),
    body: boundedText(section?.body, "", 1000),
    image: safeImageUrl(section?.image),
    imageAlt: boundedText(section?.imageAlt, "", 160),
  })).filter((section) => section.heading || section.body || section.image);
}

function normalizePages(value, legacy) {
  const supplied = Array.isArray(value) ? value.slice(0, 12) : [];
  if (supplied.length === 0) {
    return [{
      id: "home",
      title: "Home",
      slug: "index",
      eyebrow: legacy.eyebrow,
      headline: legacy.headline,
      description: legacy.description,
      cta: legacy.cta,
      seoTitle: legacy.seoTitle,
      seoDescription: legacy.seoDescription,
      heroImage: legacy.heroImage,
      heroImageAlt: legacy.heroImageAlt,
      sections: normalizeSections(legacy.sections),
    }];
  }

  const usedSlugs = new Set();
  return supplied.map((page, index) => {
    const rawSlug = boundedText(page?.slug, index === 0 ? "index" : `page-${index + 1}`, 48)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    let slug = rawSlug || `page-${index + 1}`;
    if (index === 0) slug = "index";
    if (usedSlugs.has(slug)) {
      slug = `${slug}-${index + 1}`;
    }
    usedSlugs.add(slug);
    return {
      id: boundedText(page?.id, `page-${index + 1}`, 60)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-"),
      title: boundedText(page?.title, index === 0 ? "Home" : "New page", 60),
      slug,
      eyebrow: boundedText(page?.eyebrow, "MADE WITH YOU IN MIND", 90),
      headline: boundedText(page?.headline, "A good idea starts here.", 120),
      description: boundedText(
        page?.description,
        "Add a few words about this page and what visitors will find here.",
        500,
      ),
      cta: boundedText(page?.cta, "GET IN TOUCH", 35),
      seoTitle: boundedText(page?.seoTitle, "", 70),
      seoDescription: boundedText(page?.seoDescription, "", 160),
      heroImage: safeImageUrl(page?.heroImage),
      heroImageAlt: boundedText(page?.heroImageAlt, "", 160),
      sections: normalizeSections(page?.sections),
    };
  });
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function normalizeSiteData(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("The saved website content is invalid.");
  }

  const legacy = {
    brand: boundedText(value.brand, "Your business", 80),
    eyebrow: boundedText(value.eyebrow, "MADE WITH YOU IN MIND", 90),
    headline: boundedText(value.headline, "A good idea starts here.", 120),
    description: boundedText(
      value.description,
      "Add a few words about your business and how you help.",
      500,
    ),
    cta: boundedText(value.cta, "GET IN TOUCH", 35),
    email: boundedText(value.email, "", 160),
    seoTitle: boundedText(value.seoTitle, "", 70),
    seoDescription: boundedText(value.seoDescription, "", 160),
    heroImage: safeImageUrl(value.heroImage),
    heroImageAlt: boundedText(value.heroImageAlt, "", 160),
    sections: value.sections,
  };
  const pages = normalizePages(value.pages, legacy);
  const firstPage = pages[0];

  return {
    ...legacy,
    eyebrow: firstPage.eyebrow,
    headline: firstPage.headline,
    description: firstPage.description,
    cta: firstPage.cta,
    seoTitle: firstPage.seoTitle,
    seoDescription: firstPage.seoDescription,
    heroImage: firstPage.heroImage,
    heroImageAlt: firstPage.heroImageAlt,
    templateDesign:
      typeof value.templateDesign === "string" &&
      websiteDesigns[value.templateDesign]
        ? value.templateDesign
        : "design-01",
    plugins: normalizeCmsPlugins(value.plugins),
    sections: firstPage.sections,
    pages,
  };
}

function renderPageHtml(site, theme, page) {
  const design = websiteDesigns[site.templateDesign];
  const sectionHtml = page.sections
    .map((section, index) => `
      <article class="info-card">
        ${section.image ? `<img class="section-image" src="${escapeHtml(section.image)}" alt="${escapeHtml(section.imageAlt)}" loading="lazy">` : ""}
        <span class="section-number">${String(index + 1).padStart(2, "0")}</span>
        <h2>${escapeHtml(section.heading)}</h2>
        <p>${escapeHtml(section.body)}</p>
      </article>`)
    .join("");
  const emailLink = site.email
    ? `<a class="contact-link" href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a>`
    : `<p class="contact-note">Add your contact details here before publishing.</p>`;
  const heroArt = page.heroImage
    ? `<div class="hero-art hero-photo"><img src="${escapeHtml(page.heroImage)}" alt="${escapeHtml(page.heroImageAlt || page.headline)}"></div>`
    : `<div class="hero-art" aria-hidden="true"><span class="hero-star">✳</span><span class="hero-sun"></span><span class="hero-orbit"></span></div>`;
  const navLinks = site.pages.map((navPage) => {
    const href = navPage.slug === "index" ? "index.html" : `${navPage.slug}.html`;
    const current = navPage.slug === page.slug ? ' aria-current="page"' : "";
    return `<a href="${escapeHtml(href)}"${current}>${escapeHtml(navPage.title)}</a>`;
  }).join("");
  const pageTitle = page.seoTitle || `${site.brand} — ${page.title}`;
  const pageDescription = page.seoDescription || page.description;
  const activePlugins = new Set(site.plugins.active);
  const socialNetworks = [
    ["instagram", "Instagram"],
    ["facebook", "Facebook"],
    ["youtube", "YouTube"],
    ["linkedin", "LinkedIn"],
  ];
  const socialLinks = activePlugins.has("social-links")
    ? socialNetworks.map(([key, label]) => {
      const url = site.plugins.settings.socialLinks[key];
      return url
        ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : "";
    }).filter(Boolean).join("")
    : "";
  const announcement = site.plugins.settings.announcement;
  const announcementBar = activePlugins.has("announcement-bar") && announcement.message
    ? `<aside class="announcement-bar"><span>${escapeHtml(announcement.message)}</span>${announcement.linkLabel && announcement.url ? `<a href="${escapeHtml(announcement.url)}" rel="noopener noreferrer">${escapeHtml(announcement.linkLabel)} ↗</a>` : ""}</aside>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(pageDescription)}">
  <meta name="theme-color" content="${theme.background}">
  ${activePlugins.has("seo-social") ? `<meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(pageTitle)}"><meta property="og:description" content="${escapeHtml(pageDescription)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(pageTitle)}"><meta name="twitter:description" content="${escapeHtml(pageDescription)}">` : ""}
  <title>${escapeHtml(pageTitle)}</title>
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { color-scheme: ${theme.background === "#17192d" || theme.background === "#151821" ? "dark" : "light"}; }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; background: ${theme.background}; color: ${theme.ink}; font-family: "DM Sans", Arial, sans-serif; }
    a { color: inherit; }
    .site-header { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 19px max(6%, calc((100% - 1180px) / 2)); border-bottom: 1px solid ${theme.soft}; background: color-mix(in srgb, ${theme.background} 90%, transparent); backdrop-filter: blur(18px); }
    .brand { color: ${theme.ink}; font: 800 18px "Manrope", sans-serif; letter-spacing: -.04em; text-decoration: none; }
    nav { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; font-size: 12px; }
    nav a { padding: 9px 12px; border-radius: 999px; opacity: .76; text-decoration: none; transition: background .2s, opacity .2s, transform .2s; }
    nav a:hover, nav a[aria-current="page"] { background: ${theme.soft}; opacity: 1; transform: translateY(-1px); }
    .hero { position: relative; min-height: 510px; display: grid; grid-template-columns: 1.05fr .95fr; align-items: center; gap: clamp(30px, 6vw, 90px); overflow: hidden; padding: 78px max(6%, calc((100% - 1180px) / 2)); }
    .hero-copy { position: relative; z-index: 2; animation: rise-in .65s both; }
    .eyebrow { color: ${theme.accent}; font-size: 10px; font-weight: 700; letter-spacing: .17em; text-transform: uppercase; }
    h1 { max-width: 690px; margin: 18px 0; font: 800 clamp(48px, 6.5vw, 82px)/.99 "Manrope", sans-serif; letter-spacing: -.07em; }
    .hero-copy > p:last-of-type { max-width: 540px; font-size: 16px; line-height: 1.85; opacity: .74; }
    .button { display: inline-flex; align-items: center; gap: 15px; margin-top: 16px; padding: 15px 20px; border: 0; border-radius: 6px 18px 6px 18px; background: ${theme.accent}; color: white; font-size: 12px; font-weight: 700; text-decoration: none; transition: transform .2s, box-shadow .2s; }
    .button:hover { box-shadow: 0 12px 28px color-mix(in srgb, ${theme.accent} 32%, transparent); transform: translateY(-3px); }
    .hero-art { position: relative; min-height: 350px; display: grid; place-items: center; overflow: hidden; isolation: isolate; border-radius: 48% 52% 32% 68% / 53% 35% 65% 47%; background: radial-gradient(circle at 25% 20%, ${theme.surface}, transparent 45%), linear-gradient(140deg, ${theme.soft}, ${theme.background}); color: ${theme.accent}; animation: float-art 8s ease-in-out infinite; }
    .hero-star { z-index: 1; font-size: 108px; text-shadow: 0 12px 45px color-mix(in srgb, ${theme.accent} 22%, transparent); }
    .hero-sun { position: absolute; top: 9%; right: 10%; width: 100px; height: 100px; border-radius: 50%; background: color-mix(in srgb, ${theme.accent} 20%, ${theme.surface}); filter: blur(1px); }
    .hero-orbit { position: absolute; width: 75%; height: 45%; border: 1px solid color-mix(in srgb, ${theme.accent} 28%, transparent); border-radius: 50%; transform: rotate(-30deg); }
    .hero-photo { border-radius: 30px 120px 30px 120px; box-shadow: 0 25px 75px rgba(34, 25, 43, .15); }
    .hero-photo::after { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 48%, rgba(20, 18, 30, .2)); content: ""; }
    .hero-photo img { position: absolute; width: 100%; height: 100%; object-fit: cover; }
    .details { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; padding: 32px max(6%, calc((100% - 1180px) / 2)) 92px; }
    .info-card { position: relative; min-height: 215px; overflow: hidden; padding: 26px; border: 1px solid color-mix(in srgb, ${theme.accent} 13%, transparent); border-radius: 7px 26px 7px 26px; background: ${theme.surface}; box-shadow: 0 14px 45px rgba(30, 25, 45, .045); animation: rise-in .55s both; transition: transform .25s, box-shadow .25s; }
    .info-card:nth-child(2) { animation-delay: .08s; }
    .info-card:nth-child(3) { animation-delay: .16s; }
    .info-card:hover { box-shadow: 0 22px 55px rgba(30, 25, 45, .1); transform: translateY(-5px); }
    .section-number { display: inline-grid; width: 34px; height: 34px; place-items: center; border-radius: 50%; background: ${theme.soft}; color: ${theme.accent}; font-size: 10px; font-weight: 700; }
    .info-card h2 { margin: 22px 0 9px; font: 700 21px "Manrope", sans-serif; letter-spacing: -.035em; }
    .info-card p { margin: 0; font-size: 13px; line-height: 1.8; opacity: .73; }
    .section-image { width: 100%; max-height: 200px; margin-bottom: 18px; border-radius: 5px 18px 5px 18px; object-fit: cover; }
    .contact { position: relative; overflow: hidden; padding: 76px max(6%, calc((100% - 1180px) / 2)); background: ${theme.soft}; }
    .contact::after { position: absolute; right: -75px; bottom: -180px; width: 430px; height: 430px; border: 1px solid color-mix(in srgb, ${theme.accent} 28%, transparent); border-radius: 50%; box-shadow: 0 0 0 32px color-mix(in srgb, ${theme.accent} 5%, transparent), 0 0 0 64px color-mix(in srgb, ${theme.accent} 4%, transparent); content: ""; }
    .contact h2 { margin-top: 0; font: 800 clamp(30px, 4vw, 48px) "Manrope", sans-serif; letter-spacing: -.05em; }
    .contact p { max-width: 600px; font-size: 14px; line-height: 1.8; opacity: .76; }
    .contact-link { display: inline-flex; margin-top: 8px; padding: 13px 18px; border-radius: 5px 14px; background: ${theme.accent}; color: white; font-weight: 700; text-decoration: none; }
    .announcement-bar { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px 18px; padding: 11px 6%; background: ${theme.accent}; color: white; font-size: 13px; text-align: center; }
    .announcement-bar a { color: white; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
    .social-links { display: flex; flex-wrap: wrap; gap: 12px; }
    .social-links a { color: ${theme.accent}; font-weight: 700; text-decoration: none; }
    footer { display: flex; justify-content: space-between; gap: 16px; padding: 24px max(6%, calc((100% - 1180px) / 2)); font-size: 11px; opacity: .72; }
    [data-layout="1"] .hero { grid-template-columns: 1fr; min-height: 540px; text-align: center; }
    [data-layout="1"] .hero-copy > p:last-of-type { margin-right: auto; margin-left: auto; }
    [data-layout="1"] .hero-art { min-height: 250px; border-radius: 28px 90px; }
    [data-layout="2"] .hero { grid-template-columns: .85fr 1.15fr; }
    [data-layout="2"] .hero-copy { order: 2; }
    [data-layout="2"] .hero-art { order: 1; min-height: 440px; }
    [data-layout="2"] h1, [data-layout="2"] .info-card h2 { font-family: Georgia, "Times New Roman", serif; font-weight: 500; letter-spacing: -.045em; }
    [data-layout="3"] .hero-art { min-height: 400px; border-radius: 14px; }
    [data-layout="3"] .details { gap: 0; }
    [data-layout="3"] .info-card { min-height: 190px; border-width: 1px 0 0; border-radius: 0; background: transparent; box-shadow: none; }
    [data-layout="4"] .site-header { border: 0; }
    [data-layout="4"] .hero { min-height: 370px; grid-template-columns: 1fr; padding-top: 55px; padding-bottom: 40px; }
    [data-layout="4"] .hero-art { min-height: 115px; border-radius: 4px 36px; }
    [data-layout="4"] .details { gap: 0; }
    [data-layout="4"] .info-card { min-height: 0; border-width: 1px 0 0; border-radius: 0; background: transparent; box-shadow: none; }
    [data-motif="0"] .hero-art { background: radial-gradient(circle at 30% 25%, white 0 4%, transparent 4.5%), linear-gradient(140deg, ${theme.soft}, ${theme.background}); }
    [data-motif="1"] .hero-art { border-radius: 52% 48% 38% 62%; background: radial-gradient(ellipse at 70% 20%, rgba(255,255,255,.75), transparent 42%), ${theme.soft}; }
    [data-motif="2"] .hero-art { border-radius: 8px 48% 8px 48%; background: linear-gradient(135deg, ${theme.soft}, ${theme.background} 55%, ${theme.soft}); }
    [data-motif="3"] .hero-art { border-radius: 42% 8px 42% 8px; background: linear-gradient(155deg, ${theme.soft}, ${theme.background}); }
    [data-motif="4"] .hero-art { border-radius: 8px; background: radial-gradient(circle at 50% 50%, ${theme.background} 0 4%, transparent 4.5%), ${theme.soft}; }
    [data-motif="5"] .hero-art { border-radius: 50%; background: radial-gradient(circle at 25% 75%, ${theme.background} 0 12%, transparent 12.5%), ${theme.soft}; }
    [data-motif="6"] .hero-art { border-radius: 50% 8px 50% 8px; background: repeating-linear-gradient(135deg, ${theme.soft}, ${theme.soft} 12px, ${theme.background} 13px, ${theme.background} 24px); }
    [data-motif="7"] .hero-art { border-radius: 2px; background: linear-gradient(145deg, ${theme.soft} 0 48%, ${theme.background} 48% 52%, ${theme.soft} 52%); }
    @keyframes rise-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes float-art { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-9px) rotate(1deg); } }
    @media (max-width: 700px) { .site-header { align-items: flex-start; flex-direction: column; padding: 17px 6%; } nav { gap: 3px; } nav a { padding: 8px; font-size: 10px; } .hero, [data-layout="2"] .hero { min-height: 0; grid-template-columns: 1fr; gap: 28px; padding: 48px 6%; } [data-layout="2"] .hero-copy, [data-layout="2"] .hero-art { order: initial; } h1 { font-size: 51px; } .hero-art, [data-layout="2"] .hero-art, [data-layout="3"] .hero-art { min-height: 240px; } .details { grid-template-columns: 1fr; padding: 18px 6% 55px; } .info-card { min-height: 0; } .contact { padding: 48px 6%; } footer { flex-direction: column; padding: 20px 6%; } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }
  </style>
</head>
<body data-layout="${design.layout}" data-motif="${design.motif}">
  ${announcementBar}
  <header class="site-header"><a class="brand" href="index.html">${escapeHtml(site.brand)}</a><nav aria-label="Main navigation">${navLinks}</nav></header>
  <main id="top">
    <section class="hero" id="about"><div class="hero-copy"><p class="eyebrow">${escapeHtml(page.eyebrow)}</p><h1>${escapeHtml(page.headline)}</h1><p>${escapeHtml(page.description)}</p><a class="button" href="#contact">${escapeHtml(page.cta)} <span aria-hidden="true">↗</span></a></div>${heroArt}</section>
    <section class="details" id="services" aria-label="Page content">${sectionHtml}</section>
    <section class="contact" id="contact"><h2>Let’s make something good happen.</h2><p>Tell your visitors the best way to reach you or take the next step.</p>${emailLink}</section>
  </main>
  <footer><span>© ${new Date().getFullYear()} ${escapeHtml(site.brand)}. All rights reserved.</span><span>${escapeHtml(page.title)}</span>${socialLinks ? `<nav class="social-links" aria-label="Social links">${socialLinks}</nav>` : ""}</footer>
</body>
</html>`;
}

export function renderWebsiteHtml(siteData, themeName = "light", requestedSlug = "index") {
  const site = normalizeSiteData(siteData);
  const theme = siteThemes[themeName] || siteThemes.light;
  const page = site.pages.find((entry) => entry.slug === requestedSlug) || site.pages[0];
  return renderPageHtml(site, theme, page);
}

export function renderWebsiteFiles(siteData, themeName = "light") {
  const site = normalizeSiteData(siteData);
  return [
    { file: "favicon.svg", data: faviconSvg },
    ...site.pages.map((page) => ({
      file: `${page.slug}.html`,
      data: renderPageHtml(site, siteThemes[themeName] || siteThemes.light, page),
    })),
  ];
}
