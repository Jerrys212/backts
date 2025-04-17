import express from "express";
import { protect } from "../../middlewares/capic/auth";
import { validate } from "../../utils/capic/validation";
import { validateContribution } from "../../utils/capic/validators";
import {
    createContribution,
    deleteContribution,
    getContributionById,
    getContributions,
    getGroupContributions,
    getUserContributions,
    getUserContributionStats,
} from "../../controllers/capic/Contributions.Controller";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para usuarios autenticados
router.get("/", getContributions);
router.get("/:id", getContributionById);
router.post("/", validate(validateContribution), createContribution);
router.get("/user", getUserContributions);
router.get("/group/:groupId", getGroupContributions);
router.get("/stats/:groupId", getUserContributionStats);
router.delete("/:id", deleteContribution);

export default router;
