import { body, param } from "express-validator";

// Validaciones para crear y editar usuarios
export const validateUser = [
    body("username")
        .trim()
        .notEmpty()
        .withMessage("El nombre de usuario es obligatorio")
        .isLength({ min: 3, max: 50 })
        .withMessage("El nombre de usuario debe tener entre 3 y 50 caracteres"),

    body("password")
        .if(body("_id").not().exists())
        .trim()
        .notEmpty()
        .withMessage("La contraseña es obligatoria")
        .isLength({ min: 6 })
        .withMessage("La contraseña debe tener al menos 6 caracteres"),

    body("permissions")
        .isArray()
        .withMessage("Los permisos deben ser un array")
        .custom((permissions) => {
            const validPermissions = ["admin", "ventas", "reportes", "productos", "categorias"];
            return permissions.every((permission: string) => validPermissions.includes(permission));
        })
        .withMessage("Contiene permisos no válidos"),
];

// Validaciones para login
export const validateLogin = [
    body("username").trim().notEmpty().withMessage("El nombre de usuario es obligatorio"),

    body("password").trim().notEmpty().withMessage("La contraseña es obligatoria"),
];

// Validaciones para categorías
export const validateCategory = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("El nombre de la categoría es obligatorio")
        .isLength({ min: 2, max: 50 })
        .withMessage("El nombre debe tener entre 2 y 50 caracteres"),

    body("description")
        .trim()
        .notEmpty()
        .withMessage("La descripción es obligatoria")
        .isLength({ min: 5, max: 200 })
        .withMessage("La descripción debe tener entre 5 y 200 caracteres"),
];

// Validaciones para productos
export const validateProduct = [
    body("name").trim().notEmpty().withMessage("El nombre del producto es obligatorio").isLength({ min: 2, max: 50 }).withMessage("El nombre debe tener entre 2 y 50 caracteres"),

    body("description")
        .trim()
        .notEmpty()
        .withMessage("La descripción es obligatoria")
        .isLength({ min: 5, max: 200 })
        .withMessage("La descripción debe tener entre 5 y 200 caracteres"),

    body("category").notEmpty().withMessage("La categoría es obligatoria").isMongoId().withMessage("ID de categoría no válido"),

    body("price").isFloat({ min: 0.01 }).withMessage("El precio debe ser un número mayor a 0"),
];

// Validaciones para ventas
export const validateSale = [
    body("items").isArray({ min: 1 }).withMessage("La venta debe tener al menos un producto"),

    body("items.*.product").notEmpty().withMessage("El ID del producto es obligatorio").isMongoId().withMessage("ID de producto no válido"),

    body("items.*.quantity").isInt({ min: 1 }).withMessage("La cantidad debe ser un número entero mayor a 0"),

    body("items.*.price").isFloat({ min: 0.01 }).withMessage("El precio debe ser un número mayor a 0"),

    body("items.*.subtotal").isFloat({ min: 0.01 }).withMessage("El subtotal debe ser un número mayor a 0"),

    body("total").isFloat({ min: 0.01 }).withMessage("El total debe ser un número mayor a 0"),
];

// Validación para IDs de MongoDB
export const validateMongoId = [param("id").isMongoId().withMessage("ID no válido")];

// Validación para reporte por fechas
export const validateDateRange = [
    body("startDate").optional().isISO8601().withMessage("Formato de fecha inicial no válido"),

    body("endDate").optional().isISO8601().withMessage("Formato de fecha final no válido"),
];
