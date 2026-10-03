const editorFrame = document.getElementById("template-editor-frame");
const editorStatus = document.getElementById("template-editor-status");
const query = new URLSearchParams(window.location.search);
const editorUrl = new URL("builder.html", window.location.href);
editorUrl.searchParams.set("editor", "1");
if (query.has("project")) editorUrl.searchParams.set("project", query.get("project"));
editorFrame.src = editorUrl.href;

editorFrame.addEventListener("load", () => {
  try {
    const frameDocument = editorFrame.contentDocument;
    const resizeFrame = () => {
      editorFrame.style.height = `${Math.max(
        window.innerHeight,
        frameDocument.documentElement.scrollHeight,
        frameDocument.body.scrollHeight,
      )}px`;
      editorStatus.hidden = true;
    };
    const resizeObserver = new ResizeObserver(resizeFrame);
    resizeObserver.observe(frameDocument.documentElement);
    resizeObserver.observe(frameDocument.body);
    window.addEventListener("resize", resizeFrame);
    resizeFrame();
  } catch (error) {
    editorStatus.textContent = "The editor could not load. Refresh this page and try again.";
    console.error("Wiliakonect editor frame failed to initialize.", error);
  }
});
