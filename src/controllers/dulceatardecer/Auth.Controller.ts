import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { DAuthRequest } from "../../middlewares/dulceatardecer/auth";
import User from "../../models/dulceatardecer/User";
import { generateToken } from "../../utils/capic/helpers";

// Iniciar sesión
export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // Buscar el usuario por nombre de usuario
        const user = await User.findOne({ username }).select("+password");

        if (!user || !user.isActive) {
            return res.status(401).json({
                status: 401,
                message: "Credenciales inválidas o usuario inactivo",
                data: null,
                error: null,
            });
        }

        // Verificar contraseña
        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                status: 401,
                message: "Credenciales inválidas",
                data: null,
                error: null,
            });
        }

        // Generar token
        const token = generateToken(user._id.toString());

        res.status(200).json({
            status: 200,
            message: "Inicio de sesión exitoso",
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    permissions: user.permissions,
                },
                token,
            },
            error: null,
        });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({
            status: 500,
            message: "Error al iniciar sesión",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Obtener perfil de usuario actual
export const getCurrentUser = async (req: DAuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user?.id).select("-password");

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "Usuario no encontrado",
                data: null,
                error: null,
            });
        }

        res.status(200).json({
            status: 200,
            message: "Perfil obtenido correctamente",
            data: {
                id: user._id,
                username: user.username,
                permissions: user.permissions,
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener perfil",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Cambiar contraseña
export const changePassword = async (req: DAuthRequest, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Buscar el usuario
        const user = await User.findById(req.user?.id).select("+password");

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "Usuario no encontrado",
                data: null,
                error: null,
            });
        }

        // Verificar contraseña actual
        const isPasswordMatch = await user.comparePassword(currentPassword);

        if (!isPasswordMatch) {
            return res.status(400).json({
                status: 400,
                message: "La contraseña actual es incorrecta",
                data: null,
                error: null,
            });
        }

        // Actualizar contraseña
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            status: 200,
            message: "Contraseña actualizada correctamente",
            data: null,
            error: null,
        });
    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        res.status(500).json({
            status: 500,
            message: "Error al cambiar contraseña",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
