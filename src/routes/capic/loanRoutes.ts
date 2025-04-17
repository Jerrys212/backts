import express from "express";
import { authorize, protect } from "../../middlewares/capic/auth";
import { validate } from "../../utils/capic/validation";
import { validateLoanRequest } from "../../utils/capic/validators";
import { getLoans, getUserLoans, markLoanAsPaid, requestLoan, updateLoanStatus } from "../../controllers/capic/Loan.Controller";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para usuarios autenticados
router.get("/", getLoans);
router.post("/", validate(validateLoanRequest), requestLoan);
router.get("/user", getUserLoans);

// Rutas solo para administradores
router.put("/:id/status", authorize("admin"), updateLoanStatus);
router.put("/:id/pay", authorize("admin"), markLoanAsPaid);

export default router;
