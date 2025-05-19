import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../../interfaces/capic/capic.interface";
import Group from "../../models/capic/Group";
import Contribution from "../../models/capic/Contribution";

export const createContribution = async (req: AuthRequest, res: Response) => {
    try {
        const { grupo, cantidad, semana, miembro } = req.body;

        const group = await Group.findById(grupo);
        if (!group) {
            return res.status(404).json({
                status: 404,
                message: "Grupo no encontrado",
                data: null,
                error: null,
            });
        }

        if (!group.miembros.includes(new mongoose.Types.ObjectId(miembro))) {
            return res.status(403).json({
                status: 403,
                message: "No eres miembro de este grupo",
                data: null,
                error: null,
            });
        }

        if (semana > group.semanas) {
            return res.status(400).json({
                status: 400,
                message: `La semana ${semana} no es válida. El grupo tiene ${group.semanas} semanas en total`,
                data: null,
                error: null,
            });
        }

        const existingContribution = await Contribution.findOne({
            grupo,
            miembro: miembro,
            semana,
        });

        if (existingContribution) {
            return res.status(400).json({
                status: 400,
                message: "Ya has realizado una aportación para esta semana",
                data: null,
                error: null,
            });
        }

        if (cantidad !== group.cantidadSemanal) {
            return res.status(400).json({
                status: 400,
                message: `La cantidad de aportación debe ser de ${group.cantidadSemanal}`,
                data: null,
                error: null,
            });
        }

        const contribution = await Contribution.create([
            {
                grupo,
                miembro,
                cantidad,
                semana,
                fechaAportacion: new Date(),
            },
        ]);

        res.status(201).json({
            status: 201,
            message: "Aportación creada correctamente",
            data: contribution[0],
            error: null,
        });
    } catch (error) {
        console.error("Error al crear aportación:", error);
        res.status(500).json({
            status: 500,
            message: "Error al crear la aportación",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const getContributions = async (req: AuthRequest, res: Response) => {
    try {
        const contributions = await Contribution.find()
            .populate([
                { path: "grupo", select: "_id nombre" },
                { path: "miembro", select: "-password -role -activo -createdAt -updatedAt -__v" },
            ])
            .sort({ createdAt: -1 });

        return res.status(200).json({
            status: 200,
            message: "Aportaciones obtenidas correctamente",
            data: contributions,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener aportaciones", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener las aportaciones",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const getUserContributions = async (req: AuthRequest, res: Response) => {
    try {
        const contributions = await Contribution.find({ miembro: req.user?.id }).populate("grupo", "miembro").sort({ createdAt: -1 });

        return res.status(200).json({
            status: 200,
            message: "Aportaciones obtenidas correctamente",
            data: contributions,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener aportaciones del usuario:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener las aportaciones",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const getContributionById = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                status: 401,
                message: "No autorizado",
                data: null,
                error: null,
            });
        }

        const contributionId = req.params.id;

        // Validar que el ID tenga un formato válido
        if (!mongoose.Types.ObjectId.isValid(contributionId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de aportación inválido",
                data: null,
                error: null,
            });
        }

        // Buscar la aportación por ID
        const contribution = await Contribution.findById(contributionId)
            .populate("grupo", "nombre cantidadSemanal semanas")
            .populate("miembro", "nombre apellidoPaterno apellidoMaterno email");

        if (!contribution) {
            return res.status(404).json({
                status: 404,
                message: "Aportación no encontrada",
                data: null,
                error: null,
            });
        }

        // Verificar que el usuario sea el dueño de la aportación, un miembro del grupo o un administrador
        const group = await Group.findById(contribution.grupo);
        if (!group) {
            return res.status(404).json({
                status: 404,
                message: "Grupo no encontrado",
                data: null,
                error: null,
            });
        }

        res.status(200).json({
            status: 200,
            message: "Aportación obtenida correctamente",
            data: contribution,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener la aportación:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener la aportación",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const getGroupContributions = async (req: AuthRequest, res: Response) => {
    try {
        const groupId = req.params.groupId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                status: 404,
                message: "Grupo no encontrado",
                data: null,
                error: null,
            });
        }

        const isMember = group.miembros.includes(new mongoose.Types.ObjectId(req.user?.id));
        const isAdmin = req.user?.role === "admin";

        if (!isMember && !isAdmin) {
            return res.status(403).json({
                status: 403,
                message: "No tienes permisos para ver las aportaciones de este grupo",
                data: null,
                error: null,
            });
        }

        const contributions = await Contribution.find({ grupo: groupId })
            .populate("miembro", "nombre apellidoPaterno apellidoMaterno email")
            .sort({ semana: 1, fechaAportacion: -1 });

        res.status(200).json({
            status: 200,
            message: "Aportaciones del grupo obtenidas correctamente",
            data: contributions,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener aportaciones del grupo:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener las aportaciones",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const getUserContributionStats = async (req: AuthRequest, res: Response) => {
    try {
        const groupId = req.params.groupId;
        const userId = req.user?.id;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                status: 404,
                message: "Grupo no encontrado",
                data: null,
                error: null,
            });
        }

        if (!group.miembros.includes(new mongoose.Types.ObjectId(userId))) {
            return res.status(403).json({
                status: 403,
                message: "No eres miembro de este grupo",
                data: null,
                error: null,
            });
        }

        const contributions = await Contribution.find({
            grupo: groupId,
            miembro: userId,
        });

        const totalContributions = contributions.length;
        const totalAmount = contributions.reduce((sum, c) => sum + c.cantidad, 0);
        const participationPercentage = (totalContributions / group.semanas) * 100;

        res.status(200).json({
            status: 200,
            message: "Estadísticas obtenidas correctamente",
            data: {
                totalContributions,
                totalAmount,
                expectedContributions: group.semanas,
                participationPercentage: parseFloat(participationPercentage.toFixed(2)),
                isEligibleForLoan: participationPercentage >= 80,
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener estadísticas de aportaciones:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener estadísticas",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const deleteContribution = async (req: AuthRequest, res: Response) => {
    try {
        const contributionId = req.params.id;

        // Validar que el ID tenga un formato válido
        if (!mongoose.Types.ObjectId.isValid(contributionId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de aportación inválido",
                data: null,
                error: null,
            });
        }

        // Buscar la aportación primero para verificar permisos
        const contribution = await Contribution.findById(contributionId);

        if (!contribution) {
            return res.status(404).json({
                status: 404,
                message: "Aportación no encontrada",
                data: null,
                error: null,
            });
        }

        // Obtener el grupo para verificaciones adicionales
        const group = await Group.findById(contribution.grupo);
        if (!group) {
            return res.status(404).json({
                status: 404,
                message: "Grupo no encontrado",
                data: null,
                error: null,
            });
        }

        const newerContribution = await Contribution.findOne({
            miembro: contribution.miembro,
            grupo: contribution.grupo,
            fechaAportacion: { $gt: contribution.fechaAportacion },
        });

        if (newerContribution) {
            return res.status(403).json({
                status: 403,
                message: "Solo puedes eliminar tu aportación más reciente",
                data: null,
                error: null,
            });
        }

        // Eliminar la aportación
        await Contribution.findByIdAndDelete(contributionId);

        res.status(200).json({
            status: 200,
            message: "Aportación eliminada correctamente",
            data: { id: contributionId },
            error: null,
        });
    } catch (error) {
        console.error("Error al eliminar la aportación:", error);
        res.status(500).json({
            status: 500,
            message: "Error al eliminar la aportación",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
