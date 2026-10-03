const menuToggle = document.getElementById("menu-toggle");
const primaryNav = document.getElementById("primary-nav");
const contentPages = new Set(["index.html", "services.html", "about.html", "contact.html"]);
let navigationVersion = 0;

function updatePageContent() {
  document.querySelectorAll(".current-year").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  const contactForm = document.getElementById("contact-form");
  if (!contactForm) return;

  const params = new URLSearchParams(window.location.search);
  const requestedService = params.get("service");
  const serviceChoices = {
    website: "Website or digital experience",
    software: "Software or business tools",
    support: "IT support and guidance",
  };
  const serviceSelect = document.getElementById("service");
  if (serviceSelect && serviceChoices[requestedService]) {
    serviceSelect.value = serviceChoices[requestedService];
  }

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const service = serviceSelect ? serviceSelect.value : "";
    const message = document.getElementById("message").value.trim();
    const subject = encodeURIComponent(
      service ? `${service} enquiry from ${name}` : `Website enquiry from ${name}`,
    );
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n${service ? `Interested in: ${service}\n` : ""}\n${message}`,
    );
    const mailto = `mailto:wiliakonect.store@gmail.com?subject=${subject}&body=${body}`;
    const formNote = document.getElementById("form-note");
    formNote.replaceChildren(
      document.createTextNode("If your email app didn’t open, "),
    );
    const emailLink = document.createElement("a");
    emailLink.href = mailto;
    emailLink.textContent = "tap here to send your message";
    formNote.append(emailLink, document.createTextNode("."));
    window.location.href = mailto;
  });
}

function closeNavigationMenu() {
  if (!menuToggle || !primaryNav) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  primaryNav.classList.remove("is-open");
}

function setActiveNavigation(pathname) {
  if (!primaryNav) return;
  const currentPath = pathname.endsWith("/")
    ? `${pathname}index.html`
    : pathname;

  primaryNav.querySelectorAll("a").forEach((link) => {
    const linkUrl = new URL(link.href, window.location.href);
    const linkPath = linkUrl.pathname.endsWith("/")
      ? `${linkUrl.pathname}index.html`
      : linkUrl.pathname;
    if (linkPath === currentPath) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

async function loadContentPage(url, addHistoryEntry, requestVersion) {
  try {
    const response = await fetch(url.href, {
      headers: { "X-Requested-With": "Wiliakonect-Navigation" },
    });
    if (!response.ok) {
      throw new Error(`Could not load page content (${response.status}).`);
    }

    const html = await response.text();
    const nextDocument = new DOMParser().parseFromString(html, "text/html");
    const nextMain = nextDocument.querySelector("main");
    const currentMain = document.querySelector("main");
    if (!nextMain || !currentMain) {
      throw new Error("The requested page does not contain its main content.");
    }
    if (requestVersion !== navigationVersion) return;

    currentMain.replaceWith(nextMain);
    document.title = nextDocument.title;
    const nextDescription = nextDocument.querySelector('meta[name="description"]');
    const currentDescription = document.querySelector('meta[name="description"]');
    if (nextDescription && currentDescription) {
      currentDescription.content = nextDescription.content;
    }
    if (addHistoryEntry) {
      window.history.pushState({}, "", url.href);
    }
    setActiveNavigation(url.pathname);
    closeNavigationMenu();
    updatePageContent();
    window.scrollTo({ top: 0, behavior: "instant" });
    nextMain.setAttribute("tabindex", "-1");
    nextMain.focus({ preventScroll: true });
  } catch (error) {
    if (requestVersion === navigationVersion) throw error;
  }
}

if (menuToggle && primaryNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Open navigation menu" : "Close navigation menu",
    );
    primaryNav.classList.toggle("is-open", !isOpen);
  });

  primaryNav.addEventListener("click", async (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    closeNavigationMenu();

    const url = new URL(link.href, window.location.href);
    const pageName = url.pathname.split("/").pop() || "index.html";
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target ||
      url.origin !== window.location.origin ||
      !contentPages.has(pageName)
    ) {
      return;
    }

    event.preventDefault();
    const requestVersion = ++navigationVersion;
    try {
      await loadContentPage(url, true, requestVersion);
    } catch {
      if (requestVersion === navigationVersion) {
        window.location.assign(url.href);
      }
    }
  });
}

window.addEventListener("popstate", async () => {
  const url = new URL(window.location.href);
  const pageName = url.pathname.split("/").pop() || "index.html";
  if (!contentPages.has(pageName)) {
    window.location.reload();
    return;
  }
  const requestVersion = ++navigationVersion;
  try {
    await loadContentPage(url, false, requestVersion);
  } catch {
    if (requestVersion === navigationVersion) {
      window.location.reload();
    }
  }
});

updatePageContent();

// EDIT: Change the WhatsApp URL here to point the chat button to another number.
const whatsappLink = document.createElement("a");
whatsappLink.className = "whatsapp-float";
whatsappLink.href = "https://wa.me/2349114638331";
whatsappLink.target = "_blank";
whatsappLink.rel = "noopener noreferrer";
whatsappLink.setAttribute("aria-label", "Chat with Wiliakonect on WhatsApp");
whatsappLink.title = "Chat with us on WhatsApp";
whatsappLink.innerHTML =
  '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.2a12.5 12.5 0 0 0-10.7 19l-1.7 6.2 6.4-1.7A12.5 12.5 0 1 0 16 3.2Zm0 22.7c-2 0-3.9-.5-5.6-1.6l-.4-.2-3.8 1 1-3.7-.3-.4A10.2 10.2 0 1 1 16 25.9Zm5.6-7.6c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.2 8.2 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.7l.5-.5.3-.5c.1-.2 0-.4 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.3 1 2.7 1.2 2.9c.1.2 2 3.1 4.8 4.2.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2.1-1.4.3-.7.3-1.3.2-1.4s-.3-.2-.6-.4Z"/></svg>';
document.body.append(whatsappLink);
