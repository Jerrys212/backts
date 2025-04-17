import express from "express";
import { authorize, protect } from "../../middlewares/capic/auth";
import {
    addMemberToGroup,
    createGroup,
    deleteGroup,
    getGroupById,
    getGroups,
    getMembersInGroup,
    removeMemberFromGroup,
    updateGroup,
} from "../../controllers/capic/Group.Controller";
import { validate } from "../../utils/capic/validation";
import { validateAddMember, validateDeleteMember, validateGroupCreation } from "../../utils/capic/validators";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para todos los usuarios autenticados
router.get("/", getGroups);
router.get("/:id", getGroupById);
router.get("/:id/members", getMembersInGroup);

// Rutas solo para administradores
router.post("/", authorize("admin"), validate(validateGroupCreation), createGroup);
router.post("/:id/members", authorize("admin"), validate(validateAddMember), addMemberToGroup);
router.put("/:id", authorize("admin"), validate(validateGroupCreation), updateGroup);
router.delete("/:id/members/:userId", authorize("admin"), validate(validateDeleteMember), removeMemberFromGroup);
router.delete("/:id", authorize("admin"), deleteGroup);

export default router;
