const menuToggle = document.getElementById("menu-toggle");
const primaryNav = document.getElementById("primary-nav");

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

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
      primaryNav.classList.remove("is-open");
    });
  });
}

document.querySelectorAll(".current-year").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const contactForm = document.getElementById("contact-form");
if (contactForm) {
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
