import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Simple CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Origin: ${origin}`);
  
  // Set CORS headers
  res.header("Access-Control-Allow-Origin", origin || "https://financeiroplus.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    console.log("OPTIONS request - returning 204");
    return res.status(204).end();
  }
  
  next();
});

// Test endpoints
app.get("/", (req, res) => {
  res.json({ message: "CORS Test Server", timestamp: new Date().toISOString() });
});

app.post("/test", (req, res) => {
  res.json({ message: "POST test successful", body: req.body });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Error:", error);
  res.status(500).json({ error: error.message });
});

export default app;
