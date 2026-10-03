import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import htm from "htm";

const html = htm.bind(React.createElement);
const emailAddress = "wiliakonect.store@gmail.com";

function getConversationId() {
  if (typeof window.wiliakonectVisitorId === "string") {
    return window.wiliakonectVisitorId;
  }
  try {
    const existingId = window.sessionStorage.getItem("wiliakonect-chat-id");
    if (existingId) return existingId;
    const id = window.crypto.randomUUID();
    window.sessionStorage.setItem("wiliakonect-chat-id", id);
    return id;
  } catch {
    return window.crypto.randomUUID();
  }
}

function localAnswer(message) {
  const question = message.toLowerCase();
  if (/\b(service|services|what do you do|offer)\b/.test(question)) {
    return "Wiliakonect helps with websites and digital experiences, software and business tools, and IT support. Tell me what you’re working on and I can help you find the right next step.";
  }
  if (/\b(builder|template|cms|website maker)\b/.test(question)) {
    return "The Wiliakonect website builder includes AI-assisted drafts, a library of 1,000 templates, and a CMS for editing and exporting your site. Open Website builder in the navigation to explore it.";
  }
  if (/\b(contact|email|phone|call|whatsapp|talk|quote|price|cost)\b/.test(question)) {
    return `You can reach the team at ${emailAddress} or on WhatsApp at +234 911 463 8331. I can also help prepare an enquiry for you below.`;
  }
  return `I can help with Wiliakonect’s website, software, and IT services. The AI reply service is not connected on this host yet, but you can still contact the team at ${emailAddress}.`;
}

function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: "Hello! I’m the Wiliakonect assistant. Ask about our services or website builder, or tell me what you’re hoping to create.",
      offerContact: false,
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [emailDraftUrl, setEmailDraftUrl] = useState("");
  const [inquiryStatus, setInquiryStatus] = useState("");
  const conversationIdRef = useRef(getConversationId());
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, isSending]);

  async function sendMessage(value = draft) {
    const message = value.trim();
    if (!message || isSending) return;

    const conversation = [
      ...messages,
      { id: Date.now(), role: "user", text: message, offerContact: false },
    ];
    setMessages(conversation);
    setDraft("");
    setIsSending(true);
    setEmailDraftUrl("");

    try {
      const response = await fetch("/api/chat.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversation_id: conversationIdRef.current,
          history: messages
            .filter((entry) => entry.role !== "user" || entry.text.length <= 600)
            .slice(-6)
            .map(({ role, text }) => ({ role: role === "user" ? "user" : "model", text })),
        }),
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("The PHP chat endpoint is unavailable on this host.");
      }
      if (!response.ok) {
        throw new Error(result.error || "The assistant could not reply just now.");
      }
      if (typeof result.answer !== "string" || !result.answer.trim()) {
        throw new Error("The assistant returned an empty reply.");
      }
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: result.answer,
          offerContact: result.offerContact === true,
        },
      ]);
    } catch (error) {
      const failure = error instanceof Error
        ? error.message
        : "The PHP chat endpoint could not be reached.";
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: `${localAnswer(message)}\n\nNote: the AI reply service is unavailable right now (${failure}). This is local guidance.`,
          offerContact: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function prepareEmail(event) {
    event.preventDefault();
    const inquiryForm = event.currentTarget;
    if (!inquiryForm.reportValidity()) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const service = String(form.get("service") || "").trim();
    const request = String(form.get("request") || "").trim();
    const consent = form.get("consent") === "on";
    setInquiryStatus("Saving your enquiry securely…");
    setEmailDraftUrl("");
    const payload = {
      name,
      email,
      service,
      message: request,
      consent,
      visitor_id: conversationIdRef.current,
    };
    try {
      const response = await fetch("/api/lead.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("The live inbox endpoint is unavailable on this host.");
      }
      if (!response.ok || result.saved !== true) {
        throw new Error(result.error || "Your enquiry could not be saved.");
      }
      setInquiryStatus("Your enquiry is in the live Wiliakonect inbox. Open the email draft if you also want to email the team.");
    } catch (error) {
      const fallbackError = error instanceof Error
        ? error.message
        : "Your enquiry could not be saved.";
      setInquiryStatus(`${fallbackError} You can still open an email draft below.`);
    }
    const subject = encodeURIComponent(`Website enquiry from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n${service ? `Interested in: ${service}\n` : ""}\n${request}`,
    );
    setEmailDraftUrl(`mailto:${emailAddress}?subject=${subject}&body=${body}`);
  }

  return html`
    <div className="assistant-widget">
      ${isOpen && html`
        <section
          className="assistant-panel"
          id="wiliakonect-assistant-panel"
          aria-label="Chat with Wiliakonect"
        >
          <header className="assistant-panel-header">
            <div>
              <span className="assistant-online-dot" aria-hidden="true"></span>
              <strong>Wiliakonect assistant</strong>
              <small>Here to help you get started</small>
            </div>
            <button
              className="assistant-close"
              type="button"
              aria-label="Close chat"
              onClick=${() => setIsOpen(false)}
            >×</button>
          </header>
          <div className="assistant-messages" role="log" aria-live="polite" aria-relevant="additions">
            ${messages.map((entry) => html`
              <article className=${`assistant-message is-${entry.role}`} key=${entry.id}>
                <p>${entry.text}</p>
                ${entry.offerContact && html`
                  <button
                    className="assistant-contact-action"
                    type="button"
                    onClick=${() => {
                      setShowInquiry(true);
                      setEmailDraftUrl("");
                    }}
                  >Prepare an enquiry</button>
                `}
              </article>
            `)}
            ${isSending && html`<p className="assistant-thinking" role="status">Thinking…</p>`}
            <div ref=${messagesEndRef}></div>
          </div>
          ${showInquiry && html`
            <form
              className="assistant-inquiry"
              onSubmit=${prepareEmail}
              onChange=${() => {
                setEmailDraftUrl("");
                setInquiryStatus("");
              }}
            >
              <div className="assistant-inquiry-heading">
                <strong>Prepare an enquiry</strong>
                <button type="button" aria-label="Close enquiry form" onClick=${() => setShowInquiry(false)}>×</button>
              </div>
              <label>Name<input name="name" autoComplete="name" maxLength="80" required /></label>
              <label>Email<input name="email" type="email" autoComplete="email" maxLength="160" required /></label>
              <label>What can we help with?
                <select name="service">
                  <option value="">Choose a topic (optional)</option>
                  <option>Website or digital experience</option>
                  <option>Wiliakonect website builder or CMS</option>
                  <option>Software or business tools</option>
                  <option>IT support and guidance</option>
                  <option>Something else</option>
                </select>
              </label>
              <label>Your request<textarea name="request" rows="3" maxLength="1200" required></textarea></label>
              <label className="assistant-consent">
                <input name="consent" type="checkbox" required />
                I agree my contact details and enquiry can be stored in Wiliakonect’s private inbox so the team can respond.
              </label>
              <button className="assistant-send" type="submit">Save enquiry & prepare email</button>
              ${inquiryStatus && html`<p className="assistant-inquiry-status" role="status">${inquiryStatus}</p>`}
              ${emailDraftUrl && html`
                <a className="assistant-email-link" href=${emailDraftUrl}>Open the draft in your email app ↗</a>
              `}
              <small>Saving adds this enquiry to the private Wiliakonect live inbox. It does not send an email; review and send the optional email draft yourself.</small>
            </form>
          `}
          <div className="assistant-prompts">
            ${["What services do you offer?", "Tell me about the website builder"].map((prompt) => html`
              <button type="button" key=${prompt} disabled=${isSending} onClick=${() => sendMessage(prompt)}>${prompt}</button>
            `)}
          </div>
          <form
            className="assistant-composer"
            onSubmit=${(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <label className="assistant-sr-only" htmlFor="assistant-message">Your message</label>
            <input
              id="assistant-message"
              ref=${inputRef}
              value=${draft}
              maxLength="600"
              placeholder="Ask us anything…"
              onChange=${(event) => setDraft(event.currentTarget.value)}
              disabled=${isSending}
            />
            <button type="submit" aria-label="Send message" disabled=${isSending || !draft.trim()}>↑</button>
          </form>
          <p className="assistant-privacy">When chat services are connected, messages are sent to the AI provider and stored in Wiliakonect’s private inbox for follow-up. Don’t share passwords, payment details, or sensitive information.</p>
        </section>
      `}
      <button
        className="assistant-launcher"
        type="button"
        aria-label=${isOpen ? "Close Wiliakonect chat" : "Chat with Wiliakonect"}
        aria-expanded=${isOpen}
        aria-controls=${isOpen ? "wiliakonect-assistant-panel" : undefined}
        onClick=${() => setIsOpen((current) => !current)}
      >
        <span aria-hidden="true">${isOpen ? "×" : "✳"}</span>
        <span className="assistant-launcher-label">${isOpen ? "Close chat" : "Ask us"}</span>
      </button>
    </div>
  `;
}

const container = document.getElementById("wiliakonect-assistant");
if (container) createRoot(container).render(html`<${ChatAssistant} />`);
