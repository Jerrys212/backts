import { body, param } from "express-validator";

// Validaciones para registro de usuario
export const validateUserRegistration = [
    body("nombre").trim().notEmpty().withMessage("El nombre es obligatorio").isLength({ min: 2, max: 50 }).withMessage("El nombre debe tener entre 2 y 50 caracteres"),

    body("apellidoPaterno")
        .trim()
        .notEmpty()
        .withMessage("El apellido paterno es obligatorio")
        .isLength({ min: 2, max: 50 })
        .withMessage("El apellido paterno debe tener entre 2 y 50 caracteres"),

    body("apellidoMaterno")
        .trim()
        .notEmpty()
        .withMessage("El apellido materno es obligatorio")
        .isLength({ min: 2, max: 50 })
        .withMessage("El apellido materno debe tener entre 2 y 50 caracteres"),

    body("curp")
        .trim()
        .notEmpty()
        .withMessage("La CURP es obligatoria")
        .matches(
            /^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/
        )
        .withMessage("El formato de la CURP no es válido"),

    body("email").trim().notEmpty().withMessage("El correo electrónico es obligatorio").isEmail().withMessage("El formato del correo electrónico no es válido").normalizeEmail(),

    body("password").trim().notEmpty().withMessage("La contraseña es obligatoria").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
];

// Validaciones para login
export const validateLogin = [
    body("email").trim().notEmpty().withMessage("El correo electrónico es obligatorio").isEmail().withMessage("El formato del correo electrónico no es válido"),

    body("password").trim().notEmpty().withMessage("La contraseña es obligatoria"),
];

// Validaciones para creación de grupo
export const validateGroupCreation = [
    body("nombre").trim().notEmpty().withMessage("El nombre del grupo es obligatorio").isLength({ min: 3, max: 50 }).withMessage("El nombre debe tener entre 3 y 50 caracteres"),

    body("semanas").isInt({ min: 4 }).withMessage("Las semanas deben ser un número entero mayor o igual a 4"),

    body("cantidadSemanal").isFloat({ min: 50 }).withMessage("La cantidad semanal debe ser un número mayor o igual a 50"),

    body("limiteUsuarios").isInt({ min: 2 }).withMessage("El límite de usuarios debe ser un número entero mayor o igual a 2"),
];

// Validaciones para agregar miembros al grupo
export const validateAddMember = [
    body("userId").notEmpty().withMessage("El ID del usuario es obligatorio").isMongoId().withMessage("El ID del usuario no es válido"),

    param("id").notEmpty().withMessage("El ID del grupo es obligatorio").isMongoId().withMessage("El ID del grupo no es válido"),
];

export const validateDeleteMember = [
    param("userId").notEmpty().withMessage("El ID del usuario es obligatorio").isMongoId().withMessage("El ID del usuario no es válido"),

    param("id").notEmpty().withMessage("El ID del grupo es obligatorio").isMongoId().withMessage("El ID del grupo no es válido"),
];

// Validaciones para aportaciones
export const validateContribution = [
    body("grupo").notEmpty().withMessage("El ID del grupo es obligatorio").isMongoId().withMessage("El ID del grupo no es válido"),

    body("cantidad").isFloat({ min: 1 }).withMessage("La cantidad debe ser un número mayor a 0"),

    body("semana").isInt({ min: 1 }).withMessage("La semana debe ser un número entero positivo"),

    body("miembro").notEmpty().withMessage("El ID del miembro es obligatorio").isMongoId().withMessage("El ID del miembro no es válido"),
];

// Validaciones para solicitud de préstamo
export const validateLoanRequest = [
    body("cantidad").isFloat({ min: 100 }).withMessage("La cantidad debe ser un número mayor o igual a 100"),

    body("semanas").isInt({ min: 4, max: 12 }).withMessage("Las semanas deben ser un número entero entre 4 y 12"),
];
