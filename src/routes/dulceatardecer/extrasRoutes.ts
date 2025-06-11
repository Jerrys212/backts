import { Router } from "express";
import { createExtra, getAllExtras, getExtraById, updateExtra, deleteExtra } from "../../controllers/dulceatardecer/Extras.Controller";
import { protect } from "../../middlewares/dulceatardecer/auth";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas CRUD para extras
router.post("/", createExtra); // POST /api/extras
router.get("/", getAllExtras); // GET /api/extras
router.get("/:id", getExtraById); // GET /api/extras/:id
router.put("/:id", updateExtra); // PUT /api/extras/:id
router.delete("/:id", deleteExtra); // DELETE /api/extras/:id

export default router;
