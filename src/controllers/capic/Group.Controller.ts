import { Response } from "express";
import mongoose from "mongoose";
import Group from "../../models/capic/Group";
import { AuthRequest } from "../../interfaces/capic/capic.interface";
import User from "../../models/capic/User";
import Contribution from "../../models/capic/Contribution";

export const createGroup = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                status: 401,
                message: "No autorizado",
                data: null,
                error: null,
            });
        }

        const { nombre, semanas, cantidadSemanal, limiteUsuarios } = req.body;

        const existingGroup = await Group.findOne({ nombre });
        if (existingGroup) {
            return res.status(400).json({
                status: 400,
                message: "Ya existe un grupo con ese nombre",
                data: null,
                error: null,
            });
        }

        const group = await Group.create({
            nombre,
            semanas,
            cantidadSemanal,
            limiteUsuarios,
            miembros: [],
            creador: req.user.id,
        });

        res.status(201).json({
            status: 201,
            message: "Grupo creado correctamente",
            data: group,
            error: null,
        });
    } catch (error) {
        console.error("Error al crear grupo:", error);
        res.status(500).json({
            status: 500,
            message: "Error al crear el grupo",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const getGroups = async (req: AuthRequest, res: Response) => {
    try {
        const groups = await Group.find().populate("creador", "nombre apellidoPaterno apellidoMaterno");

        res.status(200).json({
            status: 200,
            message: "Grupos obtenidos correctamente",
            data: groups,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener grupos:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener la lista de grupos",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const getGroupById = async (req: AuthRequest, res: Response) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate("creador", "nombre apellidoPaterno apellidoMaterno")
            .populate("miembros", "nombre apellidoPaterno apellidoMaterno email");

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
            message: "Grupo obtenido correctamente",
            data: group,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener grupo por ID:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener el grupo",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const addMemberToGroup = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                status: 401,
                message: "No autorizado",
                data: null,
                error: null,
            });
        }

        const { userId } = req.body;
        const groupId = req.params.id;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                status: 404,
                message: "Grupo no encontrado",
                data: null,
                error: null,
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "Usuario no encontrado",
                data: null,
                error: null,
            });
        }

        if (group.miembros.length >= group.limiteUsuarios) {
            return res.status(400).json({
                status: 400,
                message: "El grupo ya alcanzó su límite de miembros",
                data: null,
                error: null,
            });
        }

        if (group.miembros.includes(user._id)) {
            return res.status(400).json({
                status: 400,
                message: "El usuario ya es miembro de este grupo",
                data: null,
                error: null,
            });
        }

        group.miembros.push(user._id);
        await group.save();

        const updatedGroup = await Group.findById(groupId).populate("miembros", "nombre apellidoPaterno apellidoMaterno email");

        res.status(200).json({
            status: 200,
            message: "Miembro agregado correctamente al grupo",
            data: updatedGroup,
            error: null,
        });
    } catch (error) {
        console.error("Error al agregar miembro al grupo:", error);
        res.status(500).json({
            status: 500,
            message: "Error al agregar miembro al grupo",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const getMembersInGroup = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                status: 401,
                message: "No autorizado",
                data: null,
                error: null,
            });
        }

        const { id } = req.params;

        const group = await Group.findById(id).populate("miembros", "_id nombre apellidoPaterno apellidoMaterno");

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
            message: "Miembros obtenidos correctamente",
            data: group.miembros,
            error: null,
        });
    } catch (error) {
        console.error("Error al agregar miembro al grupo:", error);
        res.status(500).json({
            status: 500,
            message: "Error al agregar miembro al grupo",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const removeMemberFromGroup = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                status: 401,
                message: "No autorizado",
                data: null,
                error: null,
            });
        }

        const groupId = req.params.id;
        const userId = req.params.userId;

        // Verificar si el grupo existe
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                status: 404,
                message: "Grupo no encontrado",
                data: null,
                error: null,
            });
        }

        // Verificar si el usuario es miembro del grupo
        if (!group.miembros.includes(new mongoose.Types.ObjectId(userId))) {
            return res.status(400).json({
                status: 400,
                message: "El usuario no es miembro de este grupo",
                data: null,
                error: null,
            });
        }

        // Verificar si el usuario ha realizado alguna aportación en el grupo
        const contributions = await Contribution.findOne({
            grupo: groupId,
            miembro: userId,
        });

        if (contributions) {
            return res.status(400).json({
                status: 400,
                message: "No se puede eliminar al miembro porque ya ha realizado aportaciones en este grupo",
                data: null,
                error: null,
            });
        }

        // Eliminar al miembro del grupo
        group.miembros = group.miembros.filter((miembro) => miembro.toString() !== userId);
        await group.save();

        res.status(200).json({
            status: 200,
            message: "Miembro eliminado correctamente del grupo",
            data: group,
            error: null,
        });
    } catch (error) {
        console.error("Error al eliminar miembro del grupo:", error);
        res.status(500).json({
            status: 500,
            message: "Error al eliminar miembro del grupo",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const updateGroup = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                status: 401,
                message: "No autorizado",
                data: null,
                error: null,
            });
        }

        const groupId = req.params.id;
        const { nombre, semanas, cantidadSemanal, limiteUsuarios } = req.body;

        // Verificar si el grupo existe
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                status: 404,
                message: "Grupo no encontrado",
                data: null,
                error: null,
            });
        }

        // Verificar si el usuario es el creador del grupo
        if (group.creador.toString() !== req.user.id) {
            return res.status(403).json({
                status: 403,
                message: "No tienes permisos para actualizar este grupo",
                data: null,
                error: null,
            });
        }

        // Verificar si hay aportaciones para este grupo
        const contributionsExist = await Contribution.exists({ grupo: groupId });

        if (contributionsExist) {
            return res.status(400).json({
                status: 400,
                message: "No se puede actualizar el grupo porque ya tiene aportaciones registradas",
                data: null,
                error: null,
            });
        }

        // Verificar que el nombre no esté en uso por otro grupo
        if (nombre && nombre !== group.nombre) {
            const existingGroup = await Group.findOne({ nombre });
            if (existingGroup) {
                return res.status(400).json({
                    status: 400,
                    message: "Ya existe un grupo con ese nombre",
                    data: null,
                    error: null,
                });
            }
        }

        // Actualizar el grupo
        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            {
                nombre: nombre || group.nombre,
                semanas: semanas || group.semanas,
                cantidadSemanal: cantidadSemanal || group.cantidadSemanal,
                limiteUsuarios: limiteUsuarios || group.limiteUsuarios,
            },
            { new: true }
        ).populate("creador", "nombre apellidoPaterno apellidoMaterno");

        res.status(200).json({
            status: 200,
            message: "Grupo actualizado correctamente",
            data: updatedGroup,
            error: null,
        });
    } catch (error) {
        console.error("Error al actualizar grupo:", error);
        res.status(500).json({
            status: 500,
            message: "Error al actualizar el grupo",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const deleteGroup = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                status: 401,
                message: "No autorizado",
                data: null,
                error: null,
            });
        }

        const groupId = req.params.id;

        // Verificar si el grupo existe
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                status: 404,
                message: "Grupo no encontrado",
                data: null,
                error: null,
            });
        }

        // Verificar si hay aportaciones para este grupo
        const contributionsExist = await Contribution.exists({ grupo: groupId });

        if (contributionsExist) {
            return res.status(400).json({
                status: 400,
                message: "No se puede eliminar el grupo porque ya tiene aportaciones registradas",
                data: null,
                error: null,
            });
        }

        // Proceder con la eliminación
        await group.deleteOne();

        res.status(200).json({
            status: 200,
            message: "Grupo eliminado correctamente",
            data: null,
            error: null,
        });
    } catch (error) {
        console.error("Error al eliminar grupo:", error);
        res.status(500).json({
            status: 500,
            message: "Error al eliminar el grupo",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
