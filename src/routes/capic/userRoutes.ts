import express from "express";
import { authorize, protect } from "../../middlewares/capic/auth";
import { deleteUser, getUserById, getUsers, updateUserProfile } from "../../controllers/capic/User.Controller";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para usuarios normales
router.put("/profile/:id", updateUserProfile);

// Rutas solo para administradores
router.get("/", authorize("admin"), getUsers);
router.get("/:id", authorize("admin"), getUserById);
router.delete("/:id", authorize("admin"), deleteUser);

export default router;
