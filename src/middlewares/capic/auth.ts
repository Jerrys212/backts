import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../../interfaces/capic/capic.interface";
import config from "../../config/config";
import User from "../../models/capic/User";

interface JwtPayload {
    id: string;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

            const user = await User.findById(decoded.id).select("-password");

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "No se encontró el usuario asociado a este token",
                });
            }

            req.user = {
                id: user._id.toString(),
                role: user.role,
            };

            next();
        } catch (error) {
            console.error("Error en middleware de autenticación:", error);
            return res.status(401).json({
                success: false,
                message: "No autorizado, token inválido",
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No autorizado, no se proporcionó token",
        });
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "No tiene permisos para realizar esta acción",
            });
        }
        next();
    };
};
