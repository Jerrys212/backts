import { Response } from "express";
import mongoose from "mongoose";
import { DAuthRequest } from "../../middlewares/dulceatardecer/auth";
import User from "../../models/dulceatardecer/User";

// Obtener todos los usuarios
export const getAllUsers = async (req: DAuthRequest, res: Response) => {
    try {
        const users = await User.find().select("-password").sort("-createdAt");

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
            message: "Error al obtener usuarios",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Obtener un usuario por ID
export const getUserById = async (req: DAuthRequest, res: Response) => {
    try {
        const userId = req.params.id;

        // Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de usuario inválido",
                data: null,
                error: null,
            });
        }

        const user = await User.findById(userId).select("-password");

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
        console.error("Error al obtener usuario:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al obtener usuario",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Crear un nuevo usuario
export const createUser = async (req: DAuthRequest, res: Response) => {
    try {
        const { username, password, permissions } = req.body;

        // Verificar si ya existe un usuario con ese nombre
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).json({
                status: 400,
                message: "Ya existe un usuario con ese nombre",
                data: null,
                error: null,
            });
        }

        // Crear el nuevo usuario
        const newUser = await User.create({
            username,
            password,
            permissions,
        });

        return res.status(201).json({
            status: 201,
            message: "Usuario creado correctamente",
            data: {
                id: newUser._id,
                username: newUser.username,
                permissions: newUser.permissions,
                isActive: newUser.isActive,
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al crear usuario:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al crear usuario",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Actualizar un usuario
export const updateUser = async (req: DAuthRequest, res: Response) => {
    try {
        const userId = req.params.id;
        const { username, permissions, isActive } = req.body;

        // Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de usuario inválido",
                data: null,
                error: null,
            });
        }

        // Verificar si el usuario existe
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "Usuario no encontrado",
                data: null,
                error: null,
            });
        }

        // Verificar si ya existe otro usuario con ese nombre
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({
                    status: 400,
                    message: "Ya existe un usuario con ese nombre",
                    data: null,
                    error: null,
                });
            }
        }

        // Actualizar el usuario
        const updatedUser = await User.findByIdAndUpdate(userId, { username, permissions, isActive }, { new: true }).select("-password");

        return res.status(200).json({
            status: 200,
            message: "Usuario actualizado correctamente",
            data: updatedUser,
            error: null,
        });
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al actualizar usuario",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Eliminar un usuario (desactivación lógica)
export const deleteUser = async (req: DAuthRequest, res: Response) => {
    try {
        const userId = req.params.id;

        // Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de usuario inválido",
                data: null,
                error: null,
            });
        }

        // Evitar eliminación del propio usuario
        if (userId === req.user?.id) {
            return res.status(400).json({
                status: 400,
                message: "No puedes eliminar tu propio usuario",
                data: null,
                error: null,
            });
        }

        // Verificar si el usuario existe
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "Usuario no encontrado",
                data: null,
                error: null,
            });
        }

        // Desactivar el usuario en lugar de eliminarlo
        await User.findByIdAndUpdate(userId, { isActive: false });

        return res.status(200).json({
            status: 200,
            message: "Usuario eliminado correctamente",
            data: { id: userId },
            error: null,
        });
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al eliminar usuario",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Restablecer contraseña de un usuario (solo admin)
export const resetPassword = async (req: DAuthRequest, res: Response) => {
    try {
        const userId = req.params.id;
        const { newPassword } = req.body;

        // Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de usuario inválido",
                data: null,
                error: null,
            });
        }

        // Verificar si el usuario existe
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "Usuario no encontrado",
                data: null,
                error: null,
            });
        }

        // Actualizar la contraseña
        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            status: 200,
            message: "Contraseña restablecida correctamente",
            data: null,
            error: null,
        });
    } catch (error) {
        console.error("Error al restablecer contraseña:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al restablecer contraseña",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
