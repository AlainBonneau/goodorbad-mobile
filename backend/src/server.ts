import express from "express";
import cors from "cors";
import helmet from "helmet";
import sessionsRouter from "./routers/sessions.router.js";
import "dotenv/config";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Bienvenue sur l'API Good or Bad !");
});

app.use("/sessions", sessionsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
