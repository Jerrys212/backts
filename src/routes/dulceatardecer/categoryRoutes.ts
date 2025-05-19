import express from "express";
import { authorize, protect } from "../../middlewares/dulceatardecer/auth";
import { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from "../../controllers/dulceatardecer/Category.Controller";
import { validateCategory, validateMongoId } from "../../utils/dulceatardecer/validators";
import { validate } from "../../utils/capic/validation";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas de lectura (accesibles para todos los usuarios autenticados)
router.get("/", getAllCategories);
router.get("/:id", validate(validateMongoId), getCategoryById);

// Rutas de escritura (solo admin y usuarios con permiso de categorias)
router.post("/", authorize("admin", "categorias"), validate(validateCategory), createCategory);
router.put("/:id", authorize("admin", "categorias"), validate([...validateMongoId, ...validateCategory]), updateCategory);
router.delete("/:id", authorize("admin", "categorias"), validate(validateMongoId), deleteCategory);

export default router;
