import express from "express";
import { getAllProducts, getProductsByCategory, getProductById, createProduct, updateProduct, deleteProduct } from "../../controllers/dulceatardecer/Product.Controller";
import { authorize, protect } from "../../middlewares/dulceatardecer/auth";
import { validateMongoId, validateProduct } from "../../utils/dulceatardecer/validators";
import { validate } from "../../utils/capic/validation";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas de lectura (accesibles para todos los usuarios autenticados)
router.get("/", getAllProducts);
router.get("/category/:categoryId", validate(validateMongoId), getProductsByCategory);
router.get("/:id", validate(validateMongoId), getProductById);

// Rutas de escritura (solo admin y usuarios con permiso de productos)
router.post("/", authorize("admin", "productos"), validate(validateProduct), createProduct);
router.put("/:id", authorize("admin", "productos"), validate([...validateMongoId, ...validateProduct]), updateProduct);
router.delete("/:id", authorize("admin", "productos"), validate(validateMongoId), deleteProduct);

export default router;
