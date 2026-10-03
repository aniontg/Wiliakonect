export const cmsPluginCatalog = [
  {
    id: "seo-social",
    name: "SEO & social sharing",
    category: "Marketing",
    description: "Add Open Graph and social preview metadata to every published page.",
  },
  {
    id: "announcement-bar",
    name: "Announcement bar",
    category: "Design",
    description: "Show a short, linked announcement above your website navigation.",
  },
  {
    id: "social-links",
    name: "Social links",
    category: "Engagement",
    description: "Add your Instagram, Facebook, YouTube, and LinkedIn links to the footer.",
  },
];

export const cmsPluginIds = new Set(cmsPluginCatalog.map((plugin) => plugin.id));
