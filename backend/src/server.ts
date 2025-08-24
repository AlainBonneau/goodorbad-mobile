import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import sessionsRouter from "./routers/sessions.router.js";
import statsRouter from "./routers/stats.router.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openapiPath = path.join(__dirname, "..", "openapi.yaml");
const openapiDoc = YAML.parse(fs.readFileSync(openapiPath, "utf8"));

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

// 100 requêtes / 15 min / IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: "RATE_LIMITED", message: "Too many requests." },
    },
  })
);

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiDoc, { explorer: true })
);

app.get("/", (_req, res) => {
  res.send("Bienvenue sur l'API Good or Bad !");
});

app.use("/api/v1/sessions", sessionsRouter);
app.use("/api/v1/stats", statsRouter);

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on http://0.0.0.0:3000");
  console.log("Also available on http://192.168.1.55:3000");
});
