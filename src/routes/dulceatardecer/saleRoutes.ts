import express from "express";
import { createSale, getAllSales, getSaleById, updateSaleStatus, updateSale } from "../../controllers/dulceatardecer/Sale.Controller";
import { authorize, protect } from "../../middlewares/dulceatardecer/auth";
import { validate } from "../../utils/capic/validation";
import { validateMongoId, validateSale, validateSaleStatus, validateSaleEdit } from "../../utils/dulceatardecer/validators";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Crear venta (usuarios con permiso de ventas)
router.post("/", authorize("admin", "ventas"), validate(validateSale), createSale);

// Editar venta (solo ventas en proceso)
router.put("/:id", authorize("admin", "ventas"), validate(validateMongoId), validate(validateSaleEdit), updateSale);

// Actualizar status de venta
router.patch("/:id/status", authorize("admin", "ventas"), validate(validateMongoId), validate(validateSaleStatus), updateSaleStatus);

// Obtener venta por ID
router.get("/:id", validate(validateMongoId), getSaleById);

// Listado de ventas (con filtros opcionales)
router.get("/", getAllSales);

export default router;
