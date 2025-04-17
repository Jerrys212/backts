import { Request, Response } from "express";
import User from "../../models/capic/User";
import { AuthRequest } from "../../interfaces/capic/capic.interface";

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({ activo: true }).select("-password");

        return res.status(200).json({
            status: 200,
            message: "Usuarios obtenidos correctamente",
            data: users,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al obtener la lista de usuarios",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "Usuario no encontrado",
                data: null,
                error: null,
            });
        }

        return res.status(200).json({
            status: 200,
            message: "Usuario obtenido correctamente",
            data: user,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener usuario por ID:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al obtener el usuario",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "Usuario no encontrado",
                data: null,
                error: null,
            });
        }

        const { nombre, apellidoPaterno, apellidoMaterno, email } = req.body;

        if (nombre) user.nombre = nombre;
        if (apellidoPaterno) user.apellidoPaterno = apellidoPaterno;
        if (apellidoMaterno) user.apellidoMaterno = apellidoMaterno;
        if (email) user.email = email;

        const updatedUser = await user.save();

        return res.status(200).json({
            status: 200,
            message: "Perfil actualizado correctamente",
            data: {
                _id: updatedUser._id,
                nombre: updatedUser.nombre,
                apellidoPaterno: updatedUser.apellidoPaterno,
                apellidoMaterno: updatedUser.apellidoMaterno,
                email: updatedUser.email,
                role: updatedUser.role,
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al actualizar el perfil",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "Usuario no encontrado",
                data: null,
                error: null,
            });
        }

        user.activo = false;

        await user.save();

        return res.status(200).json({
            status: 200,
            message: "Usuario eliminado correctamente",
            data: null,
            error: null,
        });
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al eliminar el usuario",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
