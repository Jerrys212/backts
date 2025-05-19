import express from "express";
import { createSale, getAllSales, getSaleById, getTodaySales, getSalesByDateRange } from "../../controllers/dulceatardecer/Sale.Controller";
import { authorize, protect } from "../../middlewares/dulceatardecer/auth";
import { validate } from "../../utils/capic/validation";
import { validateDateRange, validateMongoId, validateSale } from "../../utils/dulceatardecer/validators";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Crear venta (usuarios con permiso de ventas)
router.post("/", authorize("admin", "ventas"), validate(validateSale), createSale);

// Obtener venta por ID
router.get("/:id", validate(validateMongoId), getSaleById);

// Ventas del día
router.get("/today", getTodaySales);

// Ventas por rango de fechas
router.post("/date-range", validate(validateDateRange), getSalesByDateRange);

// Listado de ventas (paginado)
router.get("/", getAllSales);

export default router;
