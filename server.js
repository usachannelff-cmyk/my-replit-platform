import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve the frontend
app.use(express.static(__dirname));

// Basic health check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    platform: "My Replit Platform",
    version: "0.1.0",
    status: "running"
  });
});

// Platform information
app.get("/api/info", (req, res) => {
  res.json({
    name: "My Replit Platform",
    description:
      "AI-powered, GitHub-based online coding and development platform",
    branch: "main",
    features: [
      "Project management",
      "Online code editor",
      "AI coding assistant",
      "Live preview",
      "Terminal",
      "GitHub integration",
      "Cloud deployment"
    ]
  });
});

// Demo project list
app.get("/api/projects", (req, res) => {
  res.json({
    projects: [
      {
        id: "my-replit-platform",
        name: "my-replit-platform",
        branch: "main",
        status: "active"
      }
    ]
  });
});

// Create-project API foundation
app.post("/api/projects", (req, res) => {
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

  res.status(201).json({
    success: true,
    project: {
      id: name.toLowerCase(),
      name,
      branch: "main",
      status: "created"
    },
    message:
      "Project created in the platform API. GitHub persistence will be connected in the next backend stage."
  });
});

// Simple AI endpoint placeholder.
// This intentionally does NOT pretend that an AI model is connected.
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

// Run endpoint foundation
app.post("/api/run", (req, res) => {
  res.json({
    success: true,
    mode: "prototype",
    running: false,
    message:
      "Run request received. Secure project sandbox execution will be connected in the execution-worker stage."
  });
});

// Deployment endpoint foundation
app.post("/api/deploy", (req, res) => {
  res.json({
    success: true,
    mode: "prototype",
    deployed: false,
    message:
      "Deployment request received. Cloud deployment will be connected after the secure execution layer is ready."
  });
});

// API 404 handler
app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found"
  });
});

// Frontend fallback
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: "Internal server error"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`My Replit Platform running on port ${PORT}`);
});
