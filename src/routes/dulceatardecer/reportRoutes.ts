import express from "express";
import {
    getDailySalesReport,
    getDateRangeReport,
    getTopProductsReport,
    getCategoryPerformanceReport,
    getUserPerformanceReport,
} from "../../controllers/dulceatardecer/Report.Controller";
import { authorize, protect } from "../../middlewares/dulceatardecer/auth";
import { validate } from "../../utils/capic/validation";
import { validateDateRange } from "../../utils/dulceatardecer/validators";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Todas las rutas requieren permiso de reportes o admin
router.use(authorize("admin", "reportes"));

// Reporte diario
router.get("/daily", getDailySalesReport);

// Reporte por rango de fechas
router.post("/date-range", validate(validateDateRange), getDateRangeReport);

// Reporte de productos más vendidos
router.post("/top-products", validate(validateDateRange), getTopProductsReport);

// Reporte de categorías
router.post("/categories", validate(validateDateRange), getCategoryPerformanceReport);

// Reporte de usuarios
router.post("/users", validate(validateDateRange), getUserPerformanceReport);

export default router;
