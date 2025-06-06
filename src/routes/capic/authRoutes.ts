import express from "express";
import { getUserProfile, login, register, updatePassword } from "../../controllers/capic/Auth.Controller";
import { protect } from "../../middlewares/capic/auth";
import { validate } from "../../utils/capic/validation";
import { validateLogin, validateUserRegistration } from "../../utils/capic/validators";

const router = express.Router();

// Rutas públicas
router.post("/register", validate(validateUserRegistration), register);
router.post("/login", validate(validateLogin), login);

// Rutas protegidas
router.get("/profile", protect, getUserProfile);
router.post("/update-password", protect, updatePassword);

export default router;
