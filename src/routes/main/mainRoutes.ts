import express from "express";
import { createMessage, visitweb } from "../../controllers/main/Main.Controller";

const router = express.Router();

// Rutas públicas
router.get("/", visitweb);
router.post("/", createMessage);

export default router;
