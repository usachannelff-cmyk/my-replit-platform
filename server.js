import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = "main";

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    platform: "My Replit Platform",
    version: "0.2.0",
    status: "running",
    githubConfigured: Boolean(
      GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO
    )
  });
});

app.get("/api/info", (req, res) => {
  res.json({
    name: "My Replit Platform",
    description:
      "AI-powered, GitHub-based online coding and development platform",
    branch: GITHUB_BRANCH,
    features: [
      "Project management",
      "Online code editor",
      "AI coding assistant",
      "Live preview",
      "Terminal",
      "GitHub integration",
      "Cloud deployment",
      "GitHub project persistence"
    ]
  });
});

function githubHeaders() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  };
}

function githubConfigured() {
  return Boolean(
    GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO
  );
}

async function githubRequest(url, options = {}) {
  if (!githubConfigured()) {
    throw new Error("GitHub environment variables are not configured");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...githubHeaders(),
      ...(options.headers || {})
    }
  });

  const text = await response.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message =
      data?.message || `GitHub API error: ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function githubContentsUrl(filePath = "") {
  const encodedPath = filePath
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedPath}`;
}

// Read project folders from GitHub
app.get("/api/projects", async (req, res) => {
  if (!githubConfigured()) {
    return res.status(503).json({
      error: "GitHub is not configured"
    });
  }

  try {
    const url = githubContentsUrl("projects");

    const data = await githubRequest(
      `${url}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
    );

    const projects = Array.isArray(data)
      ? data
          .filter((item) => item.type === "dir")
          .map((item) => ({
            id: item.name,
            name: item.name,
            branch: GITHUB_BRANCH,
            status: "active"
          }))
      : [];

    res.json({ projects });
  } catch (error) {
    if (error.message.includes("404")) {
      return res.json({ projects: [] });
    }

    console.error(error);

    res.status(500).json({
      error: "Unable to load projects from GitHub",
      details: error.message
    });
  }
});

// Create a new project and persist it in GitHub
app.post("/api/projects", async (req, res) => {
  const name = String(req.body?.name || "").trim();

  if (!name) {
    return res.status(400).json({
      error: "Project name is required"
    });
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return res.status(400).json({
      error:
        "Project name may contain only letters, numbers, hyphens and underscores"
    });
  }

  if (!githubConfigured()) {
    return res.status(503).json({
      error: "GitHub is not configured"
    });
  }

  try {
    const filePath = `projects/${name}/README.md`;

    const content = `# ${name}

Created with My Replit Platform.

- Project: ${name}
- Branch: ${GITHUB_BRANCH}
`;

    const encodedContent = Buffer.from(content, "utf8").toString(
      "base64"
    );

    const result = await githubRequest(
      githubContentsUrl(filePath),
      {
        method: "PUT",
        body: JSON.stringify({
          message: `Create project ${name}`,
          content: encodedContent,
          branch: GITHUB_BRANCH
        })
      }
    );

    res.status(201).json({
      success: true,
      project: {
        id: name.toLowerCase(),
        name,
        branch: GITHUB_BRANCH,
        status: "created"
      },
      github: {
        path: filePath,
        commit: result.commit?.sha || null
      },
      message: "Project created and saved to GitHub."
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to create project in GitHub",
      details: error.message
    });
  }
});

// AI endpoint
app.post("/api/ai", (req, res) => {
  const prompt = String(req.body?.prompt || "").trim();

  if (!prompt) {
    return res.status(400).json({
      error: "AI prompt is required"
    });
  }

  res.json({
    success: true,
    connected: false,
    mode: "prototype",
    message:
      "AI request received. Connect an AI provider in the backend configuration to enable real code generation.",
    prompt
  });
});

// Run endpoint
app.post("/api/run", (req, res) => {
  res.json({
    success: true,
    mode: "prototype",
    running: false,
    message:
      "Run request received. Secure project sandbox execution will be connected in the execution-worker stage."
  });
});

// Deployment endpoint
app.post("/api/deploy", (req, res) => {
  res.json({
    success: true,
    mode: "prototype",
    deployed: false,
    message:
      "Deployment request received. Cloud deployment will be connected after the secure execution layer is ready."
  });
});

app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found"
  });
});

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: "Internal server error"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`My Replit Platform running on port ${PORT}`);
});
