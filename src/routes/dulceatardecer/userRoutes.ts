import express from "express";
import { authorize, protect } from "../../middlewares/dulceatardecer/auth";
import { createUser, deleteUser, getAllUsers, getUserById, resetPassword, updateUser } from "../../controllers/dulceatardecer/User.Controller";
import { validateMongoId, validateUser } from "../../utils/dulceatardecer/validators";
import { validate } from "../../utils/capic/validation";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Todas las rutas requieren permiso de admin
router.use(authorize("admin"));

// Rutas para administradores
router.get("/", getAllUsers);
router.get("/:id", validate(validateMongoId), getUserById);
router.post("/", validate(validateUser), createUser);
router.put("/:id", validate([...validateMongoId, ...validateUser]), updateUser);
router.delete("/:id", validate(validateMongoId), deleteUser);
router.post("/:id/reset-password", validate(validateMongoId), resetPassword);

export default router;
