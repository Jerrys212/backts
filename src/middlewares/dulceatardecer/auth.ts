import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../../models/dulceatardecer/User";

export interface DAuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        permissions: string[];
    };
}

export const protect = async (req: DAuthRequest, res: Response, next: NextFunction) => {
    try {
        let token;

        // Verificar si existe el token en los headers
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        // Verificar si el token existe
        if (!token) {
            return res.status(401).json({
                status: 401,
                message: "No estás autorizado para acceder a este recurso",
                data: null,
                error: "No token provided",
            });
        }

        // Verificar el token
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");

        // Buscar el usuario asociado al token
        const user = await User.findById(decoded.id).select("-password");

        if (!user || !user.isActive) {
            return res.status(401).json({
                status: 401,
                message: "Usuario no encontrado o inactivo",
                data: null,
                error: "User not found or inactive",
            });
        }

        // Agregar el usuario a la solicitud - convertir ObjectId a string
        req.user = {
            id: user._id.toString(), // Convertir ObjectId a string
            username: user.username,
            permissions: user.permissions,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            status: 401,
            message: "No estás autorizado para acceder a este recurso",
            data: null,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const authorize = (...requiredPermissions: string[]) => {
    return (req: DAuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                status: 401,
                message: "No estás autorizado para acceder a este recurso",
                data: null,
                error: "No user found in request",
            });
        }

        // Administradores tienen acceso a todo
        if (req.user.permissions.includes("admin")) {
            return next();
        }

        // Verificar si el usuario tiene al menos uno de los permisos requeridos
        const hasPermission = requiredPermissions.some((permission) => req.user!.permissions.includes(permission));

        if (!hasPermission) {
            return res.status(403).json({
                status: 403,
                message: "No tienes permiso para realizar esta acción",
                data: null,
                error: "Insufficient permissions",
            });
        }

        next();
    };
};
