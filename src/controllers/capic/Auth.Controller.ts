import { Request, Response } from "express";
import User from "../../models/capic/User";
import { generateToken } from "../../utils/capic/helpers";
import { AuthRequest } from "../../interfaces/capic/capic.interface";
import bcrypt from "bcryptjs";

export const register = async (req: Request, res: Response) => {
    try {
        const { nombre, apellidoPaterno, apellidoMaterno, curp, email, password, role } = req.body;

        // Verificar si el usuario ya existe
        const userExists = await User.findOne({
            $or: [{ email }, { curp }],
        });

        if (userExists) {
            return res.status(400).json({
                status: 400,
                message: userExists.email === email ? "El correo electrónico ya está registrado" : "La CURP ya está registrada",
                data: null,
                error: null,
            });
        }

        const user = await User.create({
            nombre,
            apellidoPaterno,
            apellidoMaterno,
            curp: curp.toUpperCase(),
            email,
            password,
            role: role === "admin" ? "admin" : "usuario",
        });

        const { password: _, ...userWithoutPassword } = user.toObject();

        return res.status(201).json({
            status: 201,
            message: "Usuario creado correctamente",
            data: userWithoutPassword,
            error: null,
        });
    } catch (error) {
        console.error("Error en registro:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al registrar usuario",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario por email
        const user = await User.findOne({ email });

        // Verificar usuario y contraseña
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                status: 401,
                message: "Correo o contraseña incorrectos",
                data: null,
                error: null,
            });
        }

        // Generar token
        const token = generateToken(user._id.toString());

        return res.status(200).json({
            status: 200,
            message: "Inicio de sesión exitoso",
            data: {
                _id: user._id,
                nombre: user.nombre,
                apellidoPaterno: user.apellidoPaterno,
                apellidoMaterno: user.apellidoMaterno,
                curp: user.curp,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                token,
            },
            error: null,
        });
    } catch (error) {
        console.error("Error en login:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al iniciar sesión",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
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

        return res.status(200).json({
            status: 200,
            message: "Perfil obtenido correctamente",
            data: user,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al obtener el perfil del usuario",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { newPassword } = req.body;

        // Validar que se proporcione la nueva contraseña
        if (!newPassword) {
            return res.status(400).json({
                status: 400,
                message: "Datos incompletos",
                data: null,
                error: "Se requiere la nueva contraseña",
            });
        }

        // Validar longitud mínima de la nueva contraseña
        if (newPassword.length < 8) {
            return res.status(400).json({
                status: 400,
                message: "Contraseña inválida",
                data: null,
                error: "La nueva contraseña debe tener al menos 8 caracteres",
            });
        }

        // Buscar el usuario
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "Usuario no encontrado",
                data: null,
                error: null,
            });
        }

        // Encriptar la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Actualizar la contraseña
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({
            status: 200,
            message: "Contraseña actualizada correctamente",
            data: null,
            error: null,
        });
    } catch (error) {
        console.error("Error al actualizar contraseña:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al actualizar la contraseña",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
