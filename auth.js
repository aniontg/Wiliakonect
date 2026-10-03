import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

// EDIT: Shared status messages and setup checks for the auth and dashboard pages.
const page = document.body.dataset.page;
const messageElement = document.getElementById(
  page === "dashboard" ? "dashboard-message" : "auth-message",
);
const requestedDestination = new URLSearchParams(window.location.search).get("next");
const postAuthDestination =
  page === "auth" && requestedDestination === "builder.html"
    ? "builder.html"
    : "dashboard.html";

function showMessage(message, isError = false) {
  if (!messageElement) return;
  messageElement.textContent = message;
  messageElement.hidden = !message;
  messageElement.classList.toggle("is-error", isError);
}

function showProfileMessage(message, isError = false) {
  const element = document.getElementById("profile-message");
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

function isSupabaseConfigured() {
  return (
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY.length > 20 &&
    !SUPABASE_URL.includes("YOUR_PROJECT")
  );
}

if (!isSupabaseConfigured()) {
  showMessage(
    "Account sign-in is not connected yet. Follow SUPABASE_SETUP.md to connect your Supabase project.",
    true,
  );
} else {
  try {
    // Uses Supabase's browser client. The project URL and public key live in supabase-config.js.
    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2"
    );
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });

    if (page === "auth") {
      // EDIT: Email sign-in/sign-up forms, Google OAuth, and their success/error messages.
      const signInForm = document.getElementById("sign-in-form");
      const signUpForm = document.getElementById("sign-up-form");
      const signInTab = document.getElementById("show-sign-in");
      const signUpTab = document.getElementById("show-sign-up");
      const googleButton = document.getElementById("google-sign-in");
      const title = document.getElementById("auth-title");

      function setAuthMode(mode) {
        const isSignUp = mode === "sign-up";
        signInForm.hidden = isSignUp;
        signUpForm.hidden = !isSignUp;
        signInTab.classList.toggle("is-active", !isSignUp);
        signUpTab.classList.toggle("is-active", isSignUp);
        signInTab.setAttribute("aria-pressed", String(!isSignUp));
        signUpTab.setAttribute("aria-pressed", String(isSignUp));
        title.innerHTML = isSignUp
          ? "Create your <span>account.</span>"
          : "Welcome <span>back.</span>";
        showMessage("");
      }

      signInTab.addEventListener("click", () => setAuthMode("sign-in"));
      signUpTab.addEventListener("click", () => setAuthMode("sign-up"));

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (sessionData.session) {
        window.location.replace(postAuthDestination);
      }

      signInForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!signInForm.reportValidity()) return;
        const button = signInForm.querySelector('button[type="submit"]');
        button.disabled = true;
        showMessage("Signing you in…");
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email: document.getElementById("sign-in-email").value.trim(),
            password: document.getElementById("sign-in-password").value,
          });
          if (error) throw error;
          window.location.assign(postAuthDestination);
        } catch (error) {
          showMessage(error.message || "We couldn’t sign you in. Please try again.", true);
        } finally {
          button.disabled = false;
        }
      });

      signUpForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!signUpForm.reportValidity()) return;
        const button = signUpForm.querySelector('button[type="submit"]');
        button.disabled = true;
        showMessage("Creating your account…");
        try {
          const { data, error } = await supabase.auth.signUp({
            email: document.getElementById("sign-up-email").value.trim(),
            password: document.getElementById("sign-up-password").value,
            options: {
              data: {
                display_name: document.getElementById("sign-up-name").value.trim(),
              },
              emailRedirectTo: new URL(
                postAuthDestination,
                window.location.href,
              ).href,
            },
          });
          if (error) throw error;
          if (data.session) {
            window.location.assign(postAuthDestination);
          } else {
            showMessage("Account created. Check your email to confirm your address, then sign in.");
            signUpForm.reset();
          }
        } catch (error) {
          showMessage(error.message || "We couldn’t create your account. Please try again.", true);
        } finally {
          button.disabled = false;
        }
      });

      googleButton.addEventListener("click", async () => {
        googleButton.disabled = true;
        showMessage("Connecting to Google…");
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: new URL(
                postAuthDestination,
                window.location.href,
              ).href,
            },
          });
          if (error) throw error;
        } catch (error) {
          showMessage(error.message || "Google sign-in failed. Please try again.", true);
          googleButton.disabled = false;
        }
      });
    } else if (page === "dashboard") {
      // EDIT: Load and save the signed-in user's private profile and handle sign-out.
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!data.user) {
        window.location.replace("auth.html");
      } else {
        const user = data.user;
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("display_name, created_at")
          .eq("id", user.id)
          .single();
        if (profileError) throw profileError;

        const name =
          profile.display_name || user.user_metadata.display_name || "there";
        document.getElementById("dashboard-name").textContent = name;
        document.getElementById("dashboard-email").textContent = user.email;
        document.getElementById("profile-name").value = profile.display_name;
        document.getElementById("member-since").textContent = new Intl.DateTimeFormat(
          undefined,
          { dateStyle: "medium" },
        ).format(new Date(profile.created_at));

        const projectList = document.getElementById("dashboard-project-list");
        const projectMessage = document.getElementById("dashboard-projects-message");
        const { data: projects, error: projectsError } = await supabase
          .from("website_projects")
          .select("id, name, updated_at")
          .order("updated_at", { ascending: false });
        if (projectsError) throw projectsError;
        projectList.replaceChildren();
        if (projects.length === 0) {
          projectMessage.textContent = "You haven’t saved a website yet. Start from a template or create a new site.";
        } else {
          projectMessage.textContent = `${projects.length} saved website${projects.length === 1 ? "" : "s"} in your workspace.`;
          for (const project of projects) {
            const card = document.createElement("article");
            card.className = "dashboard-project-card";
            const details = document.createElement("div");
            const title = document.createElement("h3");
            title.textContent = project.name;
            const updated = document.createElement("p");
            updated.textContent = `Last saved ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(project.updated_at))}`;
            details.append(title, updated);
            const edit = document.createElement("a");
            edit.className = "project-action-button";
            edit.href = `editor.html?project=${encodeURIComponent(project.id)}`;
            edit.textContent = "Open editor";
            card.append(details, edit);
            projectList.append(card);
          }
        }

        document
          .getElementById("profile-form")
          .addEventListener("submit", async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            if (!form.reportValidity()) return;
            const saveButton = form.querySelector('button[type="submit"]');
            saveButton.disabled = true;
            showProfileMessage("Saving your profile…");
            try {
              const displayName = document
                .getElementById("profile-name")
                .value.trim();
              const { error: updateError } = await supabase
                .from("profiles")
                .update({ display_name: displayName })
                .eq("id", user.id);
              if (updateError) throw updateError;
              document.getElementById("dashboard-name").textContent =
                displayName || "there";
              showProfileMessage("Your profile has been updated.");
            } catch (error) {
              showProfileMessage(
                error.message || "We couldn’t save your profile. Please try again.",
                true,
              );
            } finally {
              saveButton.disabled = false;
            }
          });

        document
          .getElementById("sign-out")
          .addEventListener("click", async (event) => {
            const button = event.currentTarget;
            button.disabled = true;
            showMessage("Signing you out…");
            try {
              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) throw signOutError;
              window.location.replace("auth.html");
            } catch (signOutError) {
              showMessage(
                signOutError.message || "We couldn’t sign you out. Please try again.",
                true,
              );
              button.disabled = false;
            }
          });
      }
    }
  } catch (error) {
    showMessage(
      error.message ||
        "We couldn’t connect to your account service. Check your Supabase setup and try again.",
      true,
    );
  }
}
