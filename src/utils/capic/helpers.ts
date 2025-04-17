import jwt from "jsonwebtoken";
import config from "../../config/config";

export const generateToken = (id: string): string => {
    return jwt.sign({ id }, config.jwtSecret, {
        expiresIn: "30d",
    });
};

export const calcularCantidadSemanal = (monto: number, semanas: number, interes: number = 5): number => {
    const montoConInteres = monto * (1 + interes / 100);
    return Math.ceil(montoConInteres / semanas);
};

export const verificarAportaciones = (aportacionesRealizadas: number, totalSemanas: number): boolean => {
    const porcentajeMinimo = 0.8;
    const minimoAportaciones = Math.floor(totalSemanas * porcentajeMinimo);

    return aportacionesRealizadas >= minimoAportaciones;
};

export const calcularMontoMaximoPrestamo = (cantidadSemanal: number, totalSemanas: number): number => {
    const totalAcumulado = cantidadSemanal * totalSemanas;
    return totalAcumulado * 0.5;
};
