import express from "express";
import cors from "cors";
import helmet from "helmet";
import sessionsRouter from "./routers/sessions.router.js";
import "dotenv/config";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charge openapi.yaml (à la racine du projet)
const openapiPath = path.join(__dirname, "..", "openapi.yaml");
const openapiDoc = YAML.parse(fs.readFileSync(openapiPath, "utf8"));

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc, { explorer: true }));

app.get("/", (_req, res) => {
  res.send("Bienvenue sur l'API Good or Bad !");
});

app.use("/sessions", sessionsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
