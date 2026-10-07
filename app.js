const state = {
  connected: false,
  project: "my-replit-platform"
};

const $ = (id) => document.getElementById(id);

async function api(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
}

async function checkServer() {
  const status = $("saveStatus");

  try {
    const data = await api("/api/health");

    state.connected = data.ok === true;

    if (state.connected) {
      status.textContent = "Backend connected";
      status.style.color = "#3fb950";

      if ($("terminal")) {
        addTerminal("Backend connection established.", "green");
      }
    }
  } catch {
    state.connected = false;
    status.textContent = "Backend offline";
    status.style.color = "#f85149";
  }
}

function addTerminal(message, type = "") {
  const terminal = $("terminal");

  if (!terminal) return;

  const row = document.createElement("div");

  if (type === "green") {
    row.innerHTML =
      '<span class="term-green">●</span> ' +
      escapeHtml(message);
  } else if (type === "blue") {
    row.innerHTML =
      '<span class="term-blue">$</span> ' +
      escapeHtml(message);
  } else {
    row.textContent = message;
  }

  terminal.appendChild(row);
  terminal.scrollTop = terminal.scrollHeight;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function createProject() {
  const input = prompt("Enter project name:");

  if (!input) return;

  const name = input.trim();

  if (!name) {
    alert("Project name is required.");
    return;
  }

  try {
    addTerminal(`Creating project: ${name}`, "blue");

    const data = await api("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name })
    });

    addTerminal(
      `Project "${data.project.name}" created.`,
      "green"
    );

    alert(
      `Project "${data.project.name}" created successfully in the platform API.`
    );
  } catch (error) {
    alert(error.message);
    addTerminal(`Project creation failed: ${error.message}`);
  }
}

async function askAI() {
  const input = $("aiInput");
  const output = $("aiResponse");

  if (!input || !output) return;

  const prompt = input.value.trim();

  if (!prompt) {
    output.textContent = "Type a request first.";
    return;
  }

  output.innerHTML = "Sending request to backend...";

  try {
    addTerminal(`AI request: ${prompt}`, "blue");

    const data = await api("/api/ai", {
      method: "POST",
      body: JSON.stringify({ prompt })
    });

    output.innerHTML =
      "<b>Backend response</b><br><br>" +
      escapeHtml(data.message);

    if (data.connected === false) {
      output.innerHTML +=
        "<br><br><small>AI provider is not connected yet.</small>";
    }

    addTerminal("AI request received by backend.", "green");
  } catch (error) {
    output.textContent =
      "AI request failed: " + error.message;

    addTerminal(
      `AI request failed: ${error.message}`
    );
  }
}

async function runProject() {
  try {
    addTerminal("Sending run request...", "blue");

    const data = await api("/api/run", {
      method: "POST",
      body: JSON.stringify({
        project: state.project
      })
    });

    addTerminal(data.message, data.success ? "green" : "");

    if (data.running) {
      addTerminal("Project execution started.", "green");
    } else {
      addTerminal(
        "Secure execution worker is not connected yet."
      );
    }
  } catch (error) {
    addTerminal(`Run request failed: ${error.message}`);
  }
}

async function deployProject() {
  try {
    addTerminal("Sending deployment request...", "blue");

    const data = await api("/api/deploy", {
      method: "POST",
      body: JSON.stringify({
        project: state.project
      })
    });

    addTerminal(data.message, data.success ? "green" : "");

    if (!data.deployed) {
      addTerminal(
        "Deployment provider is not connected yet."
      );
    }
  } catch (error) {
    addTerminal(
      `Deployment request failed: ${error.message}`
    );
  }
}

async function loadProjects() {
  try {
    const data = await api("/api/projects");

    addTerminal(
      `${data.projects.length} project loaded from backend.`,
      "green"
    );
  } catch {
    addTerminal("Could not load projects.");
  }
}

function setupEvents() {
  const newProject = $("newProject");
  const askButton = $("askAI");
  const aiInput = $("aiInput");
  const runButton = $("runBtn");
  const runTop = $("runTop");

  if (newProject) {
    newProject.addEventListener(
      "click",
      createProject
    );
  }

  if (askButton) {
    askButton.addEventListener(
      "click",
      askAI
    );
  }

  if (aiInput) {
    aiInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        askAI();
      }
    });
  }

  if (runButton) {
    runButton.addEventListener(
      "click",
      runProject
    );
  }

  if (runTop) {
    runTop.addEventListener(
      "click",
      runProject
    );
  }

  const deployButtons =
    document.querySelectorAll(
      '[data-action="deploy"]'
    );

  deployButtons.forEach((button) => {
    button.addEventListener(
      "click",
      deployProject
    );
  });
}

async function initializePlatform() {
  setupEvents();

  addTerminal(
    "Initializing My Replit Platform..."
  );

  await checkServer();

  if (state.connected) {
    await loadProjects();
  }

  addTerminal(
    "Frontend initialization complete.",
    "green"
  );
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializePlatform,
    { once: true }
  );
} else {
  initializePlatform();
}
