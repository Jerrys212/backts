import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../../interfaces/capic/capic.interface";
import User from "../../models/capic/User";
import Group from "../../models/capic/Group";
import Loan from "../../models/capic/Loan";
import Contribution from "../../models/capic/Contribution";
import { calcularCantidadSemanal, calcularMontoMaximoPrestamo } from "../../utils/capic/helpers";

export const getLoans = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                status: 401,
                message: "No autorizado",
                data: null,
                error: "Unauthorized",
            });
        }

        const loans = await Loan.find();
        return res.status(200).json({
            status: 200,
            message: "Préstamos obtenidos correctamente",
            data: loans,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener préstamos:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al obtener la lista de préstamos",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const requestLoan = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                status: 401,
                message: "No autorizado",
                data: null,
                error: "Unauthorized",
            });
        }

        const { cantidad, semanas, usuarioId } = req.body;

        const usuario = await User.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({
                status: 404,
                message: "Usuario no encontrado",
                data: null,
                error: "Usuario inválido",
            });
        }

        const prestamo = await Loan.findOne({ usuario });
        if (prestamo) {
            return res.status(400).json({
                status: 400,
                message: "Ya solicitaste un préstamo",
                data: null,
                error: "Solicitud duplicada",
            });
        }

        if (semanas < 4 || semanas > 12) {
            return res.status(400).json({
                status: 400,
                message: "Las semanas de pago deben estar entre 4 y 12",
                data: null,
                error: "Rango inválido",
            });
        }

        const grupos = await Group.find({
            miembros: new mongoose.Types.ObjectId(usuarioId),
        });

        if (grupos.length === 0) {
            return res.status(400).json({
                status: 400,
                message: "No perteneces a ningún grupo",
                data: null,
                error: "Sin grupo",
            });
        }

        let grupoElegible = null;
        let porcentajeParticipacion = 0;
        let montoMaximo = 0;

        for (const grupo of grupos) {
            const aportaciones = await Contribution.find({
                grupo: grupo._id,
                miembro: usuarioId,
            });

            const totalAportaciones = aportaciones.length;
            porcentajeParticipacion = (totalAportaciones / grupo.semanas) * 100;

            if (porcentajeParticipacion >= 80) {
                montoMaximo = calcularMontoMaximoPrestamo(grupo.cantidadSemanal, grupo.semanas);
                grupoElegible = grupo;
                break;
            }
        }

        if (!grupoElegible) {
            return res.status(400).json({
                status: 400,
                message: "No cumples con el requisito mínimo de participación (80%) en ningún grupo",
                data: null,
                error: "Participación insuficiente",
            });
        }

        if (cantidad > montoMaximo) {
            return res.status(400).json({
                status: 400,
                message: `El monto solicitado excede el límite permitido. Monto máximo: ${montoMaximo}`,
                data: null,
                error: "Monto excedido",
            });
        }

        const cantidadSemanal = calcularCantidadSemanal(cantidad, semanas);

        const loan = await Loan.create([
            {
                usuario: usuarioId,
                cantidad,
                semanas,
                cantidadSemanal,
                interes: 5,
                totalPagar: semanas * cantidadSemanal,
                estado: "pendiente",
            },
        ]);

        return res.status(201).json({
            status: 201,
            message: "Préstamo solicitado correctamente",
            data: loan[0],
            error: null,
        });
    } catch (error) {
        console.error("Error al solicitar préstamo:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al solicitar el préstamo",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const updateLoanStatus = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id || req.user.role !== "admin") {
            return res.status(403).json({
                status: 403,
                message: "No tienes permisos para realizar esta acción",
                data: null,
                error: "No autorizado",
            });
        }

        const { estado } = req.body;

        if (!["aprobado", "rechazado"].includes(estado)) {
            return res.status(400).json({
                status: 400,
                message: 'Estado no válido. Debe ser "aprobado" o "rechazado"',
                data: null,
                error: "Estado inválido",
            });
        }

        const loan = await Loan.findById(req.params.id);
        if (!loan) {
            return res.status(404).json({
                status: 404,
                message: "Préstamo no encontrado",
                data: null,
                error: "ID inválido",
            });
        }

        if (loan.estado !== "pendiente") {
            return res.status(400).json({
                status: 400,
                message: `No se puede actualizar el estado. El préstamo ya está ${loan.estado}`,
                data: null,
                error: "Estado no editable",
            });
        }

        loan.estado = estado;
        await loan.save();

        return res.status(200).json({
            status: 200,
            message: `Préstamo ${estado} correctamente`,
            data: loan,
            error: null,
        });
    } catch (error) {
        console.error("Error al actualizar estado de préstamo:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al actualizar el estado del préstamo",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const getUserLoans = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                status: 401,
                message: "No autorizado",
                data: null,
                error: "Unauthorized",
            });
        }

        const loans = await Loan.find({ usuario: req.user.id }).populate("nombre semanas cantidadSemanal").sort({ createdAt: -1 });

        return res.status(200).json({
            status: 200,
            message: "Préstamos del usuario obtenidos correctamente",
            data: loans,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener préstamos del usuario:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al obtener los préstamos",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const markLoanAsPaid = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id || req.user.role !== "admin") {
            return res.status(403).json({
                status: 403,
                message: "No tienes permisos para realizar esta acción",
                data: null,
                error: "No autorizado",
            });
        }

        const loan = await Loan.findById(req.params.id);
        if (!loan) {
            return res.status(404).json({
                status: 404,
                message: "Préstamo no encontrado",
                data: null,
                error: "ID inválido",
            });
        }

        if (loan.estado !== "aprobado") {
            return res.status(400).json({
                status: 400,
                message: `No se puede marcar como pagado. El préstamo está ${loan.estado}`,
                data: null,
                error: "Estado inválido",
            });
        }

        loan.estado = "pagado";
        await loan.save();

        return res.status(200).json({
            status: 200,
            message: "Préstamo marcado como pagado correctamente",
            data: loan,
            error: null,
        });
    } catch (error) {
        console.error("Error al marcar préstamo como pagado:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al marcar el préstamo como pagado",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
