import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";

// Middleware para validar campos usando express-validator
export const validate = (validations: ValidationChain[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Ejecutar todas las validaciones
        await Promise.all(validations.map((validation) => validation.run(req)));

        // Verificar si hay errores
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        // Si hay errores, devolver respuesta con errores
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    };
};
