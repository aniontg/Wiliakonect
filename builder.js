import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";
import {
  normalizeSiteData,
  renderWebsiteFiles,
  renderWebsiteHtml,
  siteThemes,
} from "./builder-render.js";
import {
  templateCategories,
  websiteTemplates,
  websiteTemplateCount,
} from "./website-templates.js";
import { cmsPluginCatalog } from "./supabase/functions/_shared/cms-plugins.js";

if (new URLSearchParams(window.location.search).has("editor")) {
  document.body.classList.add("builder-editor-mode");
}

const builderForm = document.getElementById("builder-form");
const previewFrame = document.getElementById("website-preview");
const downloadButton = document.getElementById("download-site");
const feedback = document.getElementById("builder-feedback");
const previewAddress = document.getElementById("preview-address");
const templateFeedback = document.getElementById("template-feedback");
const templateGrid = document.getElementById("template-grid");
const templateSearch = document.getElementById("template-search");
const templateCategory = document.getElementById("template-category");
const templatePageSize = 12;
const projectFeedback = document.getElementById("project-feedback");
const projectAccountMessage = document.getElementById("project-account-message");
const projectActions = document.getElementById("project-actions");
const savedProjects = document.getElementById("saved-projects");
const editor = document.getElementById("site-editor");
const sectionEditor = document.getElementById("site-sections-editor");
const emailInput = document.getElementById("business-email");
const styleInput = document.getElementById("website-style");
const pluginList = document.getElementById("cms-plugin-list");

let supabase;
let currentUser;
let currentProjectId;
let currentPageId = "home";
let currentPublishedUrl;
let siteData;
let currentTheme = "light";
let templatePage = 1;

function report(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

function filenameSlug(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

function downloadHtml(filename, html) {
  const file = new Blob([html], { type: "text/html;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

function buildZip(files) {
  const encoder = new TextEncoder();
  const localFiles = [];
  const centralDirectory = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.file);
    const data = encoder.encode(file.data);
    let checksum = 0xffffffff;
    for (const byte of data) {
      checksum ^= byte;
      for (let bit = 0; bit < 8; bit += 1) {
        checksum = checksum & 1 ? (checksum >>> 1) ^ 0xedb88320 : checksum >>> 1;
      }
    }
    checksum = (checksum ^ 0xffffffff) >>> 0;

    const local = new Uint8Array(30 + name.length + data.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(data, 30 + name.length);
    localFiles.push(local);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    central.set(name, 46);
    centralDirectory.push(central);
    offset += local.length;
  }

  const directoryLength = centralDirectory.reduce(
    (total, entry) => total + entry.length,
    0,
  );
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, directoryLength, true);
  endView.setUint32(16, offset, true);
  return new Blob([...localFiles, ...centralDirectory, end], {
    type: "application/zip",
  });
}

function downloadBlob(filename, blob) {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

function templateButton(label, action, templateId, icon) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "template-download";
  button.dataset.action = action;
  button.dataset.templateId = templateId;
  button.append(document.createTextNode(label));
  const mark = document.createElement("span");
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = icon;
  button.append(mark);
  return button;
}

function renderTemplateLibrary() {
  const query = templateSearch.value.trim().toLowerCase();
  const category = templateCategory.value;
  const filtered = websiteTemplates.filter((template) => {
    const matchesCategory = !category || template.category === category;
    const matchesSearch =
      !query ||
      `${template.category} ${template.title} ${template.themeName}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / templatePageSize));
  templatePage = Math.min(templatePage, pageCount);
  const pageTemplates = filtered.slice(
    (templatePage - 1) * templatePageSize,
    templatePage * templatePageSize,
  );
  templateGrid.replaceChildren();

  for (const template of pageTemplates) {
    const designIndex = Number(template.design.slice("design-".length)) - 1;
    const card = document.createElement("article");
    card.className = "template-card";

    const preview = document.createElement("div");
    preview.className = "template-card-preview";
    preview.dataset.layout = String(Math.floor(designIndex / 8));
    preview.dataset.motif = String(designIndex % 8);
    preview.dataset.theme = template.theme;
    preview.dataset.photo = "true";
    const overlays = {
      light: ["rgba(16, 22, 20, .56)", "rgba(16, 22, 20, .08)"],
      dark: ["rgba(13, 16, 25, .78)", "rgba(13, 16, 25, .16)"],
      warm: ["rgba(78, 39, 24, .66)", "rgba(78, 39, 24, .08)"],
      bold: ["rgba(54, 29, 88, .72)", "rgba(54, 29, 88, .08)"],
    };
    const [overlayStart, overlayEnd] = overlays[template.theme];
    preview.style.backgroundImage =
      `linear-gradient(120deg, ${overlayStart}, ${overlayEnd}), url("${template.site.heroImage}")`;
    preview.setAttribute("aria-hidden", "true");
    const previewLabel = document.createElement("span");
    previewLabel.textContent = template.category.toUpperCase();
    const previewHeadline = document.createElement("i");
    previewHeadline.textContent = template.site.headline;
    const previewStyle = document.createElement("b");
    previewStyle.textContent = `${template.layout} · ${template.motif}`;
    preview.append(previewLabel, previewHeadline, previewStyle);

    const categoryLabel = document.createElement("p");
    categoryLabel.className = "dashboard-label";
    categoryLabel.textContent = template.category.toUpperCase();
    const title = document.createElement("h3");
    title.textContent = template.title;
    const description = document.createElement("p");
    description.textContent = template.site.description;
    const actions = document.createElement("div");
    actions.className = "template-card-actions";
    actions.append(
      templateButton("Edit this design", "use", template.id, "↗"),
      templateButton("Download HTML", "download", template.id, "↓"),
    );
    card.append(preview, categoryLabel, title, description, actions);
    templateGrid.append(card);
  }

  document.getElementById("template-count").textContent =
    `Showing ${filtered.length} of ${websiteTemplateCount.toLocaleString()} designs`;
  document.getElementById("template-page-label").textContent =
    `${templatePage} / ${pageCount}`;
  document.getElementById("template-previous").disabled = templatePage <= 1;
  document.getElementById("template-next").disabled = templatePage >= pageCount;

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "template-empty";
    empty.textContent = "No templates match that search. Try another category or keyword.";
    templateGrid.append(empty);
  }
}

function useWebsiteTemplate(template) {
  currentProjectId = undefined;
  updatePublishLink("");
  savedProjects.value = "";
  document.getElementById("business-name").value = template.site.brand;
  document.getElementById("business-description").value = template.site.description;
  document.getElementById("business-email").value = "";
  styleInput.value = template.theme;
  loadEditor(template.site, template.theme);
  document.getElementById("delete-project").disabled = true;
  document.getElementById("publish-project").disabled = true;
  report(
    feedback,
    `${template.title} is ready. Edit it below, then save or download your website.`,
  );
  report(projectFeedback, currentUser
    ? "This template is a new draft. Save it to keep it in your account."
    : "This template is ready to edit and download. Sign in to save it to your account.");
  report(templateFeedback, `${template.title} is open in your live preview.`);
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPreview() {
  if (!siteData) return;
  const page = getCurrentPage();
  const html = renderWebsiteHtml(siteData, currentTheme, page.slug);
  previewFrame.srcdoc = html;
  previewAddress.textContent =
    `${filenameSlug(siteData.brand) || "your-website"}.example/${page.slug === "index" ? "" : page.slug}`;
  document.getElementById("preview-title").textContent =
    `${siteData.brand} · ${page.title}`;
  downloadButton.disabled = false;
}

function clearEditor() {
  siteData = undefined;
  currentProjectId = undefined;
  currentPageId = "home";
  currentPublishedUrl = undefined;
  editor.hidden = true;
  document.getElementById("edit-brand").value = "";
  document.getElementById("edit-eyebrow").value = "";
  document.getElementById("edit-headline").value = "";
  document.getElementById("edit-description").value = "";
  document.getElementById("edit-cta").value = "";
  document.getElementById("edit-email").value = "";
  for (const id of [
    "edit-page-title",
    "edit-page-slug",
    "edit-hero-image",
    "edit-hero-image-alt",
    "edit-seo-title",
    "edit-seo-description",
  ]) {
    document.getElementById(id).value = "";
  }
  sectionEditor.replaceChildren();
  pluginList.replaceChildren();
  document.getElementById("cms-page-select").replaceChildren();
  savedProjects.value = "";
  const publishButton = document.getElementById("publish-project");
  document.getElementById("save-project").disabled = true;
  publishButton.disabled = true;
  document.getElementById("delete-project").disabled = true;
  document.getElementById("published-project-link").hidden = true;
  document.getElementById("preview-title").textContent = "A first look at your idea";
  previewAddress.textContent = "your-website.example";
  downloadButton.disabled = true;
  previewFrame.srcdoc =
    "<!doctype html><html lang='en'><meta charset='utf-8'><body style='margin:0;display:grid;place-items:center;min-height:100vh;background:#f6f3fb;color:#51466a;font-family:Arial,sans-serif;text-align:center'><main style='padding:30px'><div style='font-size:35px;color:#8b6ccb'>✳</div><h1 style='font-size:28px'>Your idea goes here</h1><p style='color:#797283;line-height:1.6'>Fill in your website brief and create a preview.<br>Your first draft will show up right here.</p></main></body></html>";
}

function updatePublishLink(url) {
  const link = document.getElementById("published-project-link");
  currentPublishedUrl = url || undefined;
  if (!currentPublishedUrl) {
    link.hidden = true;
    link.removeAttribute("href");
    return;
  }
  link.href = currentPublishedUrl;
  link.hidden = false;
}

function renderSections() {
  sectionEditor.replaceChildren();
  const sections = getCurrentPage().sections;
  sections.forEach((section, index) => {
    const card = document.createElement("article");
    card.className = "site-section-editor-card";
    card.dataset.sectionIndex = String(index);
    const cardHeading = document.createElement("strong");
    cardHeading.className = "cms-block-number";
    cardHeading.textContent = `CONTENT BLOCK ${String(index + 1).padStart(2, "0")}`;

    const headingLabel = document.createElement("label");
    headingLabel.append(document.createTextNode("Block heading"));
    const headingInput = document.createElement("input");
    headingInput.type = "text";
    headingInput.maxLength = 90;
    headingInput.value = section.heading;
    headingInput.dataset.field = "heading";
    headingLabel.append(headingInput);

    const bodyLabel = document.createElement("label");
    bodyLabel.append(document.createTextNode("Block text"));
    const bodyInput = document.createElement("textarea");
    bodyInput.maxLength = 1000;
    bodyInput.rows = 3;
    bodyInput.value = section.body;
    bodyInput.dataset.field = "body";
    bodyLabel.append(bodyInput);

    const imageLabel = document.createElement("label");
    imageLabel.className = "cms-block-image";
    imageLabel.append(document.createTextNode("Image URL (optional)"));
    const imageInput = document.createElement("input");
    imageInput.type = "url";
    imageInput.maxLength = 2048;
    imageInput.placeholder = "https://…";
    imageInput.value = section.image || "";
    imageInput.dataset.field = "image";
    imageLabel.append(imageInput);

    const imageAltLabel = document.createElement("label");
    imageAltLabel.className = "cms-block-image";
    imageAltLabel.append(document.createTextNode("Image description"));
    const imageAltInput = document.createElement("input");
    imageAltInput.type = "text";
    imageAltInput.maxLength = 160;
    imageAltInput.placeholder = "Describe the image";
    imageAltInput.value = section.imageAlt || "";
    imageAltInput.dataset.field = "imageAlt";
    imageAltLabel.append(imageAltInput);

    const actions = document.createElement("div");
    actions.className = "site-section-actions";
    for (const [action, label, disabled] of [
      ["up", "Move up", index === 0],
      ["down", "Move down", index === sections.length - 1],
      ["remove", "Remove section", false],
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "project-action-button";
      button.dataset.action = action;
      button.textContent = label;
      button.disabled = disabled;
      actions.append(button);
    }

    card.append(cardHeading, headingLabel, bodyLabel, imageLabel, imageAltLabel, actions);
    sectionEditor.append(card);
  });
  document.getElementById("cms-block-count").textContent =
    `${sections.length} / 20`;
  document.getElementById("add-section").disabled = sections.length >= 20;
}

function getCurrentPage() {
  return siteData.pages.find((page) => page.id === currentPageId) || siteData.pages[0];
}

function renderCmsPages() {
  const select = document.getElementById("cms-page-select");
  select.replaceChildren();
  for (const page of siteData.pages) {
    const address = page.slug === "index" ? "/" : `/${page.slug}`;
    select.add(new Option(`${page.title} · ${address}`, page.id));
  }
  select.value = currentPageId;
  document.getElementById("cms-delete-page").disabled =
    siteData.pages.length <= 1 || getCurrentPage().slug === "index";
}

function renderCurrentPageFields() {
  const page = getCurrentPage();
  currentPageId = page.id;
  for (const [id, field] of [
    ["edit-page-title", "title"],
    ["edit-page-slug", "slug"],
    ["edit-eyebrow", "eyebrow"],
    ["edit-headline", "headline"],
    ["edit-description", "description"],
    ["edit-cta", "cta"],
    ["edit-hero-image", "heroImage"],
    ["edit-hero-image-alt", "heroImageAlt"],
    ["edit-seo-title", "seoTitle"],
    ["edit-seo-description", "seoDescription"],
  ]) {
    document.getElementById(id).value = page[field] || "";
  }
  renderCmsPages();
  renderSections();
  renderPreview();
}

function loadEditor(value, theme) {
  siteData = normalizeSiteData(value);
  currentPageId = siteData.pages[0].id;
  currentTheme = siteThemes[theme] ? theme : "light";
  editor.hidden = false;
  document.getElementById("edit-brand").value = siteData.brand;
  document.getElementById("edit-email").value = siteData.email;
  document.getElementById("website-style-editor").value = currentTheme;
  renderPluginManager();
  renderCurrentPageFields();
  document.getElementById("save-project").disabled = !currentUser;
  document.getElementById("publish-project").disabled =
    !currentUser || !currentProjectId;
  document.getElementById("delete-project").disabled = !currentProjectId;
}

function renderPluginManager() {
  if (!siteData) return;
  const plugins = siteData.plugins;
  pluginList.replaceChildren();
  for (const plugin of cmsPluginCatalog) {
    const installed = plugins.installed.includes(plugin.id);
    const active = plugins.active.includes(plugin.id);
    const card = document.createElement("article");
    card.className = "cms-plugin-card";
    const details = document.createElement("div");
    const name = document.createElement("h4");
    name.textContent = plugin.name;
    const description = document.createElement("p");
    description.textContent = plugin.description;
    const status = document.createElement("span");
    status.className = `cms-plugin-status${active ? " is-active" : ""}`;
    status.textContent = active ? "Active" : installed ? "Installed" : plugin.category;
    details.append(name, description, status);

    const actions = document.createElement("div");
    actions.className = "cms-plugin-actions";
    const action = document.createElement("button");
    action.type = "button";
    action.className = "project-action-button";
    action.dataset.pluginAction = active ? "deactivate" : installed ? "activate" : "install";
    action.dataset.pluginId = plugin.id;
    action.textContent = active ? "Deactivate" : installed ? "Activate" : "Install";
    actions.append(action);
    if (installed) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "project-action-button project-delete-button";
      remove.dataset.pluginAction = "uninstall";
      remove.dataset.pluginId = plugin.id;
      remove.textContent = "Uninstall";
      actions.append(remove);
    }
    card.append(details, actions);

    if (active && plugin.id === "announcement-bar") {
      const settings = document.createElement("div");
      settings.className = "cms-plugin-settings";
      settings.append(
        pluginSetting("Announcement text", "announcement-message", plugins.settings.announcement.message, 120),
        pluginSetting("Link label (optional)", "announcement-label", plugins.settings.announcement.linkLabel, 35),
        pluginSetting("Link URL (HTTPS)", "announcement-url", plugins.settings.announcement.url, 2048),
      );
      card.append(settings);
    } else if (active && plugin.id === "social-links") {
      const settings = document.createElement("div");
      settings.className = "cms-plugin-settings cms-plugin-social-settings";
      for (const [network, value] of Object.entries(plugins.settings.socialLinks)) {
        settings.append(pluginSetting(`${network[0].toUpperCase()}${network.slice(1)} URL`, `social-${network}`, value, 2048));
      }
      card.append(settings);
    }
    pluginList.append(card);
  }
}

function pluginSetting(labelText, field, value, maxLength) {
  const label = document.createElement("label");
  label.textContent = labelText;
  const input = document.createElement("input");
  input.type = field.endsWith("-url") || field.startsWith("social-") ? "url" : "text";
  input.maxLength = maxLength;
  input.value = value || "";
  input.dataset.pluginSetting = field;
  if (input.type === "url") input.placeholder = "https://";
  label.append(input);
  return label;
}

pluginList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-plugin-action]");
  if (!button || !siteData) return;
  const { pluginAction, pluginId } = button.dataset;
  const plugins = siteData.plugins;
  if (pluginAction === "install" || pluginAction === "activate") {
    if (!plugins.installed.includes(pluginId)) plugins.installed.push(pluginId);
    if (!plugins.active.includes(pluginId)) plugins.active.push(pluginId);
    report(document.getElementById("cms-plugin-feedback"), "Add-on activated. Save the website to keep your changes.");
  } else if (pluginAction === "deactivate") {
    plugins.active = plugins.active.filter((id) => id !== pluginId);
    report(document.getElementById("cms-plugin-feedback"), "Add-on deactivated. Save the website to keep your changes.");
  } else if (pluginAction === "uninstall") {
    plugins.installed = plugins.installed.filter((id) => id !== pluginId);
    plugins.active = plugins.active.filter((id) => id !== pluginId);
    report(document.getElementById("cms-plugin-feedback"), "Add-on uninstalled. Save the website to keep your changes.");
  }
  renderPluginManager();
  renderPreview();
  markProjectChanged();
});

pluginList.addEventListener("input", (event) => {
  const field = event.target.dataset.pluginSetting;
  if (!field || !siteData) return;
  if (event.target.type === "url") {
    if (!event.target.value) {
      event.target.setCustomValidity("");
    } else {
      try {
        const valid = new URL(event.target.value).protocol === "https:";
        event.target.setCustomValidity(valid ? "" : "Use a secure HTTPS address.");
      } catch {
        event.target.setCustomValidity("Enter a valid HTTPS address.");
      }
    }
  }
  if (field.startsWith("social-")) {
    siteData.plugins.settings.socialLinks[field.slice("social-".length)] = event.target.value;
  } else if (field.startsWith("announcement-")) {
    const key = {
      "announcement-message": "message",
      "announcement-label": "linkLabel",
      "announcement-url": "url",
    }[field];
    siteData.plugins.settings.announcement[key] = event.target.value;
  }
  renderPreview();
  markProjectChanged();
});

function markProjectChanged() {
  document.getElementById("save-project").disabled = !currentUser || !siteData;
  document.getElementById("publish-project").disabled = true;
  updatePublishLink("");
  report(
    projectFeedback,
    currentProjectId
      ? "You have unsaved changes. Save this version before publishing it."
      : "Preview ready. Save this website to your account before publishing.",
  );
}

function updateSiteField(field, value) {
  if (!siteData) return;
  siteData[field] = value;
  renderPreview();
  markProjectChanged();
}

function updatePageField(field, value) {
  if (!siteData) return;
  getCurrentPage()[field] = value;
  const page = getCurrentPage();
  if (page.slug === "index") {
    siteData[field] = value;
    if (field === "sections") siteData.sections = value;
  }
  renderCmsPages();
  renderPreview();
  markProjectChanged();
}

function validateImageInputs() {
  const fields = [
    ...document.querySelectorAll(
      '#edit-hero-image, .site-section-editor-card input[data-field="image"], .cms-plugin-settings input[type="url"]',
    ),
  ];
  const invalid = fields.find((field) => {
    if (!field.value) {
      field.setCustomValidity("");
      return false;
    }
    try {
      const valid = new URL(field.value).protocol === "https:";
      field.setCustomValidity(valid ? "" : "Use a secure HTTPS URL.");
      return !valid;
    } catch {
      field.setCustomValidity("Enter a valid HTTPS URL.");
      return true;
    }
  });
  if (invalid) {
    report(
      projectFeedback,
      "Image and add-on links need valid HTTPS addresses. Update or remove the highlighted URL before saving or exporting.",
      true,
    );
    invalid.focus();
    return false;
  }
  return true;
}

function getFunctionError(error) {
  return (async () => {
    if (error?.context instanceof Response) {
      try {
        const body = await error.context.json();
        if (typeof body.error === "string") return body.error;
      } catch {
        return error.message || "The request could not be completed.";
      }
    }
    return error?.message || "The request could not be completed.";
  })();
}

async function refreshSavedProjects(selectedId) {
  if (!supabase || !currentUser) return;
  const { data, error } = await supabase
    .from("website_projects")
    .select("id, name, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;

  savedProjects.replaceChildren(new Option("New website", ""));
  for (const project of data) {
    savedProjects.add(new Option(project.name, project.id));
  }
  savedProjects.value = selectedId || "";
}

for (const category of templateCategories) {
  templateCategory.add(new Option(category, category));
}
renderTemplateLibrary();
templateSearch.addEventListener("input", () => {
  templatePage = 1;
  renderTemplateLibrary();
});
templateCategory.addEventListener("change", () => {
  templatePage = 1;
  renderTemplateLibrary();
});
document.getElementById("template-previous").addEventListener("click", () => {
  templatePage -= 1;
  renderTemplateLibrary();
});
document.getElementById("template-next").addEventListener("click", () => {
  templatePage += 1;
  renderTemplateLibrary();
});
templateGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-template-id]");
  if (!button) return;
  const template = websiteTemplates.find(
    (entry) => entry.id === button.dataset.templateId,
  );
  if (!template) {
    report(templateFeedback, "That template is not available. Please refresh and try again.", true);
    return;
  }
  if (button.dataset.action === "use") {
    sessionStorage.setItem("wiliakonect-editor-template", template.id);
    window.location.assign("editor.html");
    return;
  }
  downloadHtml(template.filename, renderWebsiteHtml(template.site, template.theme));
  report(
    templateFeedback,
    `${template.title} is ready. Open the downloaded HTML file in your browser.`,
  );
});

async function setSignedInUser(user) {
  currentUser = user;
  if (!user) {
    projectActions.hidden = true;
    document.getElementById("builder-sign-in").hidden = false;
    document.getElementById("builder-sign-out").hidden = true;
    document.getElementById("builder-dashboard-link").hidden = true;
    projectAccountMessage.textContent =
      "Sign in to generate AI websites and save projects.";
    return;
  }

  projectAccountMessage.textContent = `Signed in as ${user.email}. Your saved projects are private to your account.`;
  document.getElementById("builder-sign-in").hidden = true;
  document.getElementById("builder-sign-out").hidden = false;
  document.getElementById("builder-dashboard-link").hidden = false;
  projectActions.hidden = false;
  try {
    await refreshSavedProjects(currentProjectId);
    report(projectFeedback, "Your workspace is ready.");
  } catch (error) {
    report(projectFeedback, error.message || "Could not load your saved projects.", true);
  }
}

builderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!builderForm.reportValidity()) return;
  if (!currentUser) {
    report(projectFeedback, "Sign in before generating and saving an AI website.", true);
    return;
  }

  const name = document.getElementById("business-name").value.trim();
  const description = document.getElementById("business-description").value.trim();
  const email = emailInput.value.trim();
  const theme = styleInput.value;
  const button = builderForm.querySelector('button[type="submit"]');
  button.disabled = true;
  report(feedback, "Creating your first draft with Gemini…");
  try {
    const { data, error } = await supabase.functions.invoke("generate-website", {
      body: { name, description, email, theme },
    });
    if (error) throw new Error(await getFunctionError(error));
    if (!data?.site) throw new Error("The AI response did not contain a website. Please try again.");

    currentProjectId = undefined;
    updatePublishLink("");
    savedProjects.value = "";
    loadEditor(data.site, data.theme || theme);
    document.getElementById("save-project").disabled = false;
    document.getElementById("delete-project").disabled = true;
    document.getElementById("publish-project").disabled = true;
    report(feedback, "Your AI website draft is ready. Edit the content below, then save it.");
    report(projectFeedback, "This draft is not saved yet. Save it to keep it in your account.");
  } catch (error) {
    report(feedback, error.message || "We couldn’t generate a website. Please try again.", true);
  } finally {
    button.disabled = false;
  }
});

builderForm.addEventListener("input", () => {
  if (!siteData) return;
  document.getElementById("save-project").disabled = !currentUser;
  document.getElementById("publish-project").disabled = true;
  updatePublishLink("");
});

document.getElementById("download-site").addEventListener("click", () => {
  if (!siteData) {
    report(feedback, "Generate or open a website before downloading it.", true);
    return;
  }
  if (!validateImageInputs()) return;
  const files = renderWebsiteFiles(siteData, currentTheme);
  downloadBlob(
    `${filenameSlug(siteData.brand) || "my-website"}-site.zip`,
    buildZip(files),
  );
  report(feedback, `Exported ${siteData.pages.length} website page${siteData.pages.length === 1 ? "" : "s"} with favicon and responsive styling.`);
});

document.getElementById("edit-brand").addEventListener("input", (event) =>
  updateSiteField("brand", event.currentTarget.value),
);
document.getElementById("edit-email").addEventListener("input", (event) =>
  updateSiteField("email", event.currentTarget.value),
);
for (const [id, field] of [
  ["edit-page-title", "title"],
  ["edit-page-slug", "slug"],
  ["edit-eyebrow", "eyebrow"],
  ["edit-headline", "headline"],
  ["edit-description", "description"],
  ["edit-cta", "cta"],
  ["edit-hero-image", "heroImage"],
  ["edit-hero-image-alt", "heroImageAlt"],
  ["edit-seo-title", "seoTitle"],
  ["edit-seo-description", "seoDescription"],
]) {
  document.getElementById(id).addEventListener("input", (event) => {
    let value = event.currentTarget.value;
    if (field === "slug") {
      value = value
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48);
      event.currentTarget.value = value;
      if (getCurrentPage() === siteData.pages[0]) {
        value = "index";
        event.currentTarget.value = value;
      }
      if (!value) {
        report(
          document.getElementById("cms-page-feedback"),
          "Page addresses must contain at least one letter or number.",
          true,
        );
        return;
      }
      const duplicate = siteData.pages.some(
        (page) => page.id !== currentPageId && page.slug === value,
      );
      if (duplicate) {
        report(
          document.getElementById("cms-page-feedback"),
          "Each page needs a unique address.",
          true,
        );
        return;
      }
    }
    updatePageField(field, value);
  });
}
document.getElementById("website-style-editor").addEventListener("change", (event) => {
  currentTheme = event.currentTarget.value;
  styleInput.value = currentTheme;
  renderPreview();
  markProjectChanged();
});
styleInput.addEventListener("change", (event) => {
  currentTheme = event.currentTarget.value;
  document.getElementById("website-style-editor").value = currentTheme;
  if (siteData) {
    renderPreview();
    markProjectChanged();
  }
});

sectionEditor.addEventListener("input", (event) => {
  const field = event.target.dataset.field;
  const card = event.target.closest("[data-section-index]");
  if (!field || !card || !siteData) return;
  const sections = getCurrentPage().sections;
  sections[Number(card.dataset.sectionIndex)][field] = event.target.value;
  if (getCurrentPage().slug === "index") siteData.sections = sections;
  renderPreview();
  markProjectChanged();
});

sectionEditor.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  const card = button?.closest("[data-section-index]");
  if (!button || !card || !siteData) return;
  const index = Number(card.dataset.sectionIndex);
  const action = button.dataset.action;
  const sections = getCurrentPage().sections;
  if (action === "remove") {
    sections.splice(index, 1);
  } else {
    const destination = action === "up" ? index - 1 : index + 1;
    if (destination < 0 || destination >= sections.length) return;
    [sections[index], sections[destination]] = [
      sections[destination],
      sections[index],
    ];
  }
  if (getCurrentPage().slug === "index") siteData.sections = sections;
  renderSections();
  renderPreview();
  markProjectChanged();
});

document.getElementById("add-section").addEventListener("click", () => {
  if (!siteData || getCurrentPage().sections.length >= 20) return;
  const sections = getCurrentPage().sections;
  sections.push({
    id: `section-${crypto.randomUUID()}`,
    heading: "New section",
    body: "Write a short description for this part of your website.",
    image: "",
    imageAlt: "",
  });
  if (getCurrentPage().slug === "index") siteData.sections = sections;
  renderSections();
  renderPreview();
  markProjectChanged();
});

document.getElementById("cms-page-select").addEventListener("change", (event) => {
  currentPageId = event.currentTarget.value;
  renderCurrentPageFields();
});

document.getElementById("cms-add-page").addEventListener("click", () => {
  if (!siteData || siteData.pages.length >= 12) {
    report(document.getElementById("cms-page-feedback"), "A website can have up to 12 pages.", true);
    return;
  }
  const nextNumber = siteData.pages.length + 1;
  const page = {
    id: `page-${crypto.randomUUID()}`,
    title: `New page ${nextNumber}`,
    slug: `new-page-${nextNumber}`,
    eyebrow: "MORE TO EXPLORE",
    headline: "Another good idea starts here.",
    description: "Add a clear introduction to this page and tell visitors what they can find here.",
    cta: "GET IN TOUCH",
    seoTitle: "",
    seoDescription: "",
    heroImage: "",
    heroImageAlt: "",
    sections: [],
  };
  siteData.pages.push(page);
  currentPageId = page.id;
  renderCurrentPageFields();
  report(document.getElementById("cms-page-feedback"), "New page added. Add content blocks, then save your site.");
  markProjectChanged();
});

document.getElementById("cms-delete-page").addEventListener("click", () => {
  const page = getCurrentPage();
  if (!siteData || page.slug === "index" || siteData.pages.length <= 1) return;
  if (!window.confirm(`Delete the “${page.title}” page? This cannot be undone after saving.`)) return;
  siteData.pages = siteData.pages.filter((entry) => entry.id !== page.id);
  currentPageId = siteData.pages[0].id;
  renderCurrentPageFields();
  report(document.getElementById("cms-page-feedback"), "Page removed from the draft. Save to keep this change.");
  markProjectChanged();
});

document.getElementById("new-project").addEventListener("click", () => {
  clearEditor();
  builderForm.reset();
  currentTheme = "light";
  document.getElementById("website-style-editor").value = currentTheme;
  report(projectFeedback, "Start a new website, or choose one of your saved projects.");
});

document.getElementById("save-project").addEventListener("click", async (event) => {
  if (!currentUser || !siteData) return;
  if (!validateImageInputs()) return;
  const button = event.currentTarget;
  button.disabled = true;
  report(projectFeedback, "Saving your website…");
  try {
    const savedSiteData = normalizeSiteData(siteData);
    const record = {
      name: siteData.brand.slice(0, 80) || "Untitled website",
      prompt: document.getElementById("business-description").value.trim(),
      site_data: savedSiteData,
      theme: currentTheme,
      user_id: currentUser.id,
    };
    let savedProject;
    if (currentProjectId) {
      const { data, error } = await supabase
        .from("website_projects")
        .update(record)
        .eq("id", currentProjectId)
        .select("id, name")
        .single();
      if (error) throw error;
      savedProject = data;
    } else {
      const { data, error } = await supabase
        .from("website_projects")
        .insert(record)
        .select("id, name")
        .single();
      if (error) throw error;
      savedProject = data;
    }
    currentProjectId = savedProject.id;
    await refreshSavedProjects(currentProjectId);
    document.getElementById("publish-project").disabled = false;
    document.getElementById("delete-project").disabled = false;
    report(projectFeedback, "Website saved to your private projects.");
  } catch (error) {
    report(projectFeedback, error.message || "We couldn’t save your website.", true);
  } finally {
    button.disabled = !currentUser || !siteData;
  }
});

savedProjects.addEventListener("change", async (event) => {
  const id = event.currentTarget.value;
  if (!id) {
    clearEditor();
    return;
  }
  report(projectFeedback, "Opening your saved website…");
  try {
    const { data, error } = await supabase
      .from("website_projects")
      .select("id, name, prompt, site_data, theme, published_url")
      .eq("id", id)
      .single();
    if (error) throw error;
    currentProjectId = data.id;
    document.getElementById("business-name").value = data.name;
    document.getElementById("business-description").value = data.prompt || "";
    emailInput.value = data.site_data.email || "";
    styleInput.value = data.theme;
    loadEditor(data.site_data, data.theme);
    currentProjectId = data.id;
    document.getElementById("publish-project").disabled = false;
    document.getElementById("delete-project").disabled = false;
    updatePublishLink(data.published_url);
    report(projectFeedback, "Saved website opened.");
  } catch (error) {
    report(projectFeedback, error.message || "We couldn’t open that website.", true);
  }
});

document.getElementById("delete-project").addEventListener("click", async () => {
  if (!currentProjectId || !currentUser) return;
  if (!window.confirm("Delete this saved website? This cannot be undone.")) return;
  try {
    const { error } = await supabase
      .from("website_projects")
      .delete()
      .eq("id", currentProjectId);
    if (error) throw error;
    await refreshSavedProjects();
    clearEditor();
    report(projectFeedback, "Saved website deleted.");
  } catch (error) {
    report(projectFeedback, error.message || "We couldn’t delete that website.", true);
  }
});

document.getElementById("publish-project").addEventListener("click", async (event) => {
  if (!currentProjectId || !currentUser) {
    report(projectFeedback, "Save this website before publishing it.", true);
    return;
  }
  const button = event.currentTarget;
  button.disabled = true;
  report(projectFeedback, "Sending your website to Vercel…");
  try {
    const { data, error } = await supabase.functions.invoke("publish-website", {
      body: { projectId: currentProjectId },
    });
    if (error) throw new Error(await getFunctionError(error));
    if (!data?.url || !/^https:\/\/[a-z0-9.-]+$/i.test(data.url)) {
      throw new Error("Vercel did not return a valid public website URL.");
    }
    updatePublishLink(data.url);
    report(
      projectFeedback,
      data.state === "READY"
        ? "Your website is published."
        : "Vercel is preparing your website. Your unique preview URL is saved below.",
    );
  } catch (error) {
    report(projectFeedback, error.message || "We couldn’t publish your website.", true);
  } finally {
    button.disabled = false;
  }
});

document.getElementById("builder-sign-out").addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    report(projectFeedback, error.message, true);
    return;
  }
  currentProjectId = undefined;
  clearEditor();
  await setSignedInUser(null);
  document.getElementById("builder-sign-in").hidden = false;
});

async function initializeBuilder() {
  if (
    !SUPABASE_URL.startsWith("https://") ||
    SUPABASE_ANON_KEY.length < 20
  ) {
    projectAccountMessage.textContent =
      "Connect the Supabase project URL and publishable key to enable AI and saved websites.";
    document.getElementById("builder-sign-in").hidden = true;
    report(projectFeedback, "Supabase is not configured for this builder.", true);
    return;
  }

  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: true, detectSessionInUrl: true, persistSession: true },
    });
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    await setSignedInUser(data.session?.user || null);
    supabase.auth.onAuthStateChange((_event, session) => {
      void setSignedInUser(session?.user || null);
      document.getElementById("builder-sign-in").hidden = Boolean(session?.user);
      document.getElementById("builder-sign-out").hidden = !session?.user;
      document.getElementById("builder-dashboard-link").hidden = !session?.user;
    });
  } catch (error) {
    report(
      projectFeedback,
      error.message || "We couldn’t connect your account. Refresh and try again.",
      true,
    );
  }
}

void initializeBuilder().then(() => {
  const projectId = new URLSearchParams(window.location.search).get("project");
  if (projectId) {
    savedProjects.value = projectId;
    if (savedProjects.value !== projectId) {
      report(projectFeedback, "That saved website is not in your account.", true);
    } else {
      savedProjects.dispatchEvent(new Event("change"));
    }
    return;
  }
  const templateId = sessionStorage.getItem("wiliakonect-editor-template");
  if (!templateId) return;
  sessionStorage.removeItem("wiliakonect-editor-template");
  const template = websiteTemplates.find((entry) => entry.id === templateId);
  if (!template) {
    report(templateFeedback, "That template is not available. Return to the library and choose another design.", true);
    return;
  }
  useWebsiteTemplate(template);
}).catch((error) => {
  report(projectFeedback, error.message || "The editor could not be opened. Please try again.", true);
});
