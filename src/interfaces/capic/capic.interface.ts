import { Request } from "express";
import { Document, Types } from "mongoose";

// Interfaces para los modelos
export interface IUser extends Document {
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    curp: string;
    email: string;
    password: string;
    role: "usuario" | "admin";
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IGroup extends Document {
    nombre: string;
    semanas: number;
    cantidadSemanal: number;
    limiteUsuarios: number;
    miembros: Types.ObjectId[];
    creador: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IContribution extends Document {
    grupo: Types.ObjectId;
    miembro: Types.ObjectId;
    cantidad: number;
    semana: number;
    fechaAportacion: Date;
    createdAt: Date;
    updatedAt: Date;
}

interface IPago {
    semana: number;
    pagado: boolean;
    fechaPago?: Date | null;
    cantidad?: number;
}

export interface ILoan extends Document {
    miembro: Types.ObjectId;
    cantidad: number;
    semanas: number;
    cantidadSemanal: number;
    interes: number;
    totalPagar: number;
    pagos: IPago[];
    estado: "pendiente" | "aprobado" | "rechazado" | "pagado";
    createdAt: Date;
    updatedAt: Date;
}

// Extender Express Request para incluir el usuario autenticado
export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}
