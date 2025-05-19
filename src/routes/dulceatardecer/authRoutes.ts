import express from "express";
import { validate } from "../../utils/capic/validation";
import { validateLogin } from "../../utils/dulceatardecer/validators";
import { changePassword, getCurrentUser, login } from "../../controllers/dulceatardecer/Auth.Controller";
import { protect } from "../../middlewares/dulceatardecer/auth";
const router = express.Router();

// Ruta pública para login
router.post("/login", validate(validateLogin), login);

// Rutas protegidas
router.use(protect);
router.get("/me", getCurrentUser);
router.post("/change-password", changePassword);

export default router;
