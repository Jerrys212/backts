import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../../interfaces/capic/capic.interface";
import Group from "../../models/capic/Group";
import User from "../../models/capic/User";
import Contribution from "../../models/capic/Contribution";
import Loan from "../../models/capic/Loan";

/**
 * Obtiene estadísticas generales del sistema
 */
export const getSystemStats = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                status: 401,
                message: "No autorizado",
                data: null,
                error: "Unauthorized",
            });
        }

        // Conteos generales
        const totalUsers = await User.countDocuments();
        const totalGroups = await Group.countDocuments();
        const totalContributions = await Contribution.countDocuments();
        const totalLoans = await Loan.countDocuments();

        // Sumas generales
        const totalContributionAmount = await Contribution.aggregate([{ $group: { _id: null, total: { $sum: "$cantidad" } } }]);

        const totalLoanAmount = await Loan.aggregate([{ $group: { _id: null, total: { $sum: "$cantidad" } } }]);

        // Estadísticas de préstamos
        const loansByStatus = await Loan.aggregate([{ $group: { _id: "$estado", count: { $sum: 1 }, monto: { $sum: "$cantidad" } } }]);

        // Estadísticas de grupos
        const averageGroupWeeks = await Group.aggregate([{ $group: { _id: null, promedio: { $avg: "$semanas" } } }]);

        const averageWeeklyAmount = await Group.aggregate([{ $group: { _id: null, promedio: { $avg: "$cantidadSemanal" } } }]);

        return res.status(200).json({
            status: 200,
            message: "Estadísticas del sistema obtenidas correctamente",
            data: {
                usuarios: {
                    total: totalUsers,
                },
                grupos: {
                    total: totalGroups,
                    promedioSemanas: averageGroupWeeks.length > 0 ? Math.round(averageGroupWeeks[0].promedio) : 0,
                    promedioCantidadSemanal: averageWeeklyAmount.length > 0 ? Math.round(averageWeeklyAmount[0].promedio) : 0,
                },
                aportaciones: {
                    total: totalContributions,
                    montoTotal: totalContributionAmount.length > 0 ? totalContributionAmount[0].total : 0,
                },
                prestamos: {
                    total: totalLoans,
                    montoTotal: totalLoanAmount.length > 0 ? totalLoanAmount[0].total : 0,
                    porEstado: loansByStatus.reduce((acc, curr) => {
                        acc[curr._id] = { cantidad: curr.count, monto: curr.monto };
                        return acc;
                    }, {}),
                },
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener estadísticas del sistema:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al obtener estadísticas del sistema",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

/**
 * Obtiene tendencias de aportaciones mensuales
 */
export const getMonthlyContributionTrends = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                status: 401,
                message: "No autorizado",
                data: null,
                error: "Unauthorized",
            });
        }

        const { year } = req.query;
        const currentYear = year ? parseInt(year as string) : new Date().getFullYear();

        const monthlyContributions = await Contribution.aggregate([
            {
                $match: {
                    fechaAportacion: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lte: new Date(`${currentYear}-12-31`),
                    },
                },
            },
            {
                $group: {
                    _id: { $month: "$fechaAportacion" },
                    cantidad: { $sum: 1 },
                    monto: { $sum: "$cantidad" },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Convertir a formato de meses completo (incluyendo meses sin contribuciones)
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        const formattedData = monthNames.map((name, index) => {
            const monthData = monthlyContributions.find((m) => m._id === index + 1);
            return {
                mes: name,
                numeroMes: index + 1,
                cantidadAportaciones: monthData ? monthData.cantidad : 0,
                montoTotal: monthData ? monthData.monto : 0,
            };
        });

        return res.status(200).json({
            status: 200,
            message: "Tendencias mensuales de aportaciones obtenidas correctamente",
            data: {
                año: currentYear,
                tendencias: formattedData,
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener tendencias mensuales:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al obtener tendencias mensuales de aportaciones",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

/**
 * Obtiene el ranking de usuarios por aportaciones
 */
export const getUserContributionRanking = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                status: 401,
                message: "No autorizado",
                data: null,
                error: "Unauthorized",
            });
        }

        const { limit = 10 } = req.query;
        const parsedLimit = parseInt(limit as string) || 10;

        const userRanking = await Contribution.aggregate([
            {
                $group: {
                    _id: "$miembro",
                    totalAportaciones: { $sum: 1 },
                    montoTotal: { $sum: "$cantidad" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "usuario",
                },
            },
            { $unwind: "$usuario" },
            {
                $project: {
                    _id: 1,
                    nombre: { $concat: ["$usuario.nombre", " ", "$usuario.apellidoPaterno"] },
                    totalAportaciones: 1,
                    montoTotal: 1,
                },
            },
            { $sort: { montoTotal: -1 } },
            { $limit: parsedLimit },
        ]);

        return res.status(200).json({
            status: 200,
            message: "Ranking de usuarios por aportaciones obtenido correctamente",
            data: userRanking,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener ranking de usuarios:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al obtener ranking de usuarios por aportaciones",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

/**
 * Obtiene estadísticas de préstamos
 */
export const getLoanStats = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                status: 401,
                message: "No autorizado",
                data: null,
                error: "Unauthorized",
            });
        }

        // Estadísticas de duración de préstamos
        const loanDurationStats = await Loan.aggregate([
            {
                $group: {
                    _id: "$semanas",
                    cantidad: { $sum: 1 },
                    montoPromedio: { $avg: "$cantidad" },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Tasa de préstamos aprobados vs rechazados
        const loanApprovalRate = await Loan.aggregate([
            {
                $group: {
                    _id: "$estado",
                    cantidad: { $sum: 1 },
                },
            },
        ]);

        const totalLoans = loanApprovalRate.reduce((acc, curr) => acc + curr.cantidad, 0);

        const approvalRateFormatted = loanApprovalRate.map((item) => ({
            estado: item._id,
            cantidad: item.cantidad,
            porcentaje: parseFloat(((item.cantidad / totalLoans) * 100).toFixed(2)),
        }));

        // Promedio de tiempo de pago completo
        const completedLoans = await Loan.find({ estado: "pagado" });
        let tiempoPromedioPago = 0;

        if (completedLoans.length > 0) {
            let sumaTiempos = 0;
            for (const loan of completedLoans) {
                if (loan.pagos && loan.pagos.length > 0) {
                    const fechaPagoFinal = loan.pagos.find((p) => p.pagado && p.fechaPago)?.fechaPago;
                    if (fechaPagoFinal) {
                        const tiempoPago = fechaPagoFinal.getTime() - loan.createdAt.getTime();
                        sumaTiempos += tiempoPago;
                    }
                }
            }
            // Convertir a días
            tiempoPromedioPago = sumaTiempos / completedLoans.length / (1000 * 60 * 60 * 24);
        }

        return res.status(200).json({
            status: 200,
            message: "Estadísticas de préstamos obtenidas correctamente",
            data: {
                estadisticasDuracion: loanDurationStats,
                tasaAprobacion: approvalRateFormatted,
                tiempoPromedioPago: parseFloat(tiempoPromedioPago.toFixed(2)),
                prestamosPagados: completedLoans.length,
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener estadísticas de préstamos:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al obtener estadísticas de préstamos",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

/**
 * Obtiene reporte de rendimiento de los grupos
 */
export const getGroupPerformanceReport = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                status: 401,
                message: "No autorizado",
                data: null,
                error: "Unauthorized",
            });
        }

        const groups = await Group.find().lean();
        const groupPerformanceData = [];

        for (const group of groups) {
            // Total de contribuciones para este grupo
            const contributionsCount = await Contribution.countDocuments({ grupo: group._id });

            // Total de miembros
            const memberCount = group.miembros.length;

            // Total contribuciones esperadas (miembros * semanas)
            const expectedContributions = memberCount * group.semanas;

            // Tasa de cumplimiento
            const complianceRate = expectedContributions > 0 ? parseFloat(((contributionsCount / expectedContributions) * 100).toFixed(2)) : 0;

            // Préstamos asociados a miembros de este grupo
            const memberIds = group.miembros.map((m) => m.toString());
            const loans = await Loan.find({
                miembro: { $in: group.miembros },
                estado: { $in: ["aprobado", "pagado"] },
            });

            // Monto total prestado a este grupo
            const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.cantidad, 0);

            // Agregar datos al reporte
            groupPerformanceData.push({
                id: group._id,
                nombre: group.nombre,
                miembros: memberCount,
                cantidadSemanal: group.cantidadSemanal,
                semanas: group.semanas,
                contribucionesRealizadas: contributionsCount,
                contribucionesEsperadas: expectedContributions,
                tasaCumplimiento: complianceRate,
                prestamos: loans.length,
                montoPrestamos: totalLoanAmount,
            });
        }

        // Ordenar por tasa de cumplimiento
        groupPerformanceData.sort((a, b) => b.tasaCumplimiento - a.tasaCumplimiento);

        return res.status(200).json({
            status: 200,
            message: "Reporte de rendimiento de grupos obtenido correctamente",
            data: groupPerformanceData,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener reporte de rendimiento de grupos:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al obtener reporte de rendimiento de grupos",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

/**
 * Obtiene proyecciones financieras basadas en tendencias actuales
 */
export const getFinancialProjections = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id || req.user.role !== "admin") {
            return res.status(403).json({
                status: 403,
                message: "No tienes permisos para acceder a esta información",
                data: null,
                error: "Acceso denegado",
            });
        }

        // Obtener tendencias de los últimos 3 meses
        const threeMothsAgo = new Date();
        threeMothsAgo.setMonth(threeMothsAgo.getMonth() - 3);

        // Tendencia de aportaciones mensuales
        const contributionsTrend = await Contribution.aggregate([
            {
                $match: {
                    fechaAportacion: { $gte: threeMothsAgo },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$fechaAportacion" },
                        month: { $month: "$fechaAportacion" },
                    },
                    cantidad: { $sum: 1 },
                    monto: { $sum: "$cantidad" },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);

        // Tendencia de nuevos préstamos mensuales
        const loansTrend = await Loan.aggregate([
            {
                $match: {
                    createdAt: { $gte: threeMothsAgo },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    cantidad: { $sum: 1 },
                    monto: { $sum: "$cantidad" },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);

        // Calcular proyecciones para los próximos 3 meses
        const projections = [];

        // Si tenemos al menos 3 meses de datos, calculamos una proyección lineal simple
        if (contributionsTrend.length >= 3) {
            const currentDate = new Date();

            // Calcular tasas de crecimiento promedio
            let contributionGrowthRate = 0;
            let loanGrowthRate = 0;

            // Tasa de crecimiento de contribuciones
            for (let i = 1; i < contributionsTrend.length; i++) {
                const prevMonth = contributionsTrend[i - 1];
                const currMonth = contributionsTrend[i];
                const growthRate = (currMonth.monto - prevMonth.monto) / prevMonth.monto;
                contributionGrowthRate += growthRate;
            }
            contributionGrowthRate = contributionGrowthRate / (contributionsTrend.length - 1);

            // Tasa de crecimiento de préstamos
            if (loansTrend.length >= 2) {
                for (let i = 1; i < loansTrend.length; i++) {
                    const prevMonth = loansTrend[i - 1];
                    const currMonth = loansTrend[i];
                    // Evitar división por cero
                    if (prevMonth.monto > 0) {
                        const growthRate = (currMonth.monto - prevMonth.monto) / prevMonth.monto;
                        loanGrowthRate += growthRate;
                    }
                }
                loanGrowthRate = loanGrowthRate / (loansTrend.length - 1);
            }

            // Última contribución y préstamo conocidos
            const lastContribution = contributionsTrend[contributionsTrend.length - 1];
            const lastLoan = loansTrend.length > 0 ? loansTrend[loansTrend.length - 1] : { monto: 0 };

            // Generar proyecciones
            for (let i = 1; i <= 3; i++) {
                const projectedDate = new Date(currentDate);
                projectedDate.setMonth(currentDate.getMonth() + i);

                const projectedContributions = lastContribution.monto * Math.pow(1 + contributionGrowthRate, i);
                const projectedLoans = lastLoan.monto * Math.pow(1 + loanGrowthRate, i);

                projections.push({
                    mes: `${projectedDate.getMonth() + 1}/${projectedDate.getFullYear()}`,
                    aportacionesProyectadas: Math.round(projectedContributions),
                    prestamosProyectados: Math.round(projectedLoans),
                    balanceProyectado: Math.round(projectedContributions - projectedLoans),
                });
            }
        }

        return res.status(200).json({
            status: 200,
            message: "Proyecciones financieras obtenidas correctamente",
            data: {
                tendenciaAportaciones: contributionsTrend.map((item) => ({
                    periodo: `${item._id.month}/${item._id.year}`,
                    monto: item.monto,
                })),
                tendenciaPrestamos: loansTrend.map((item) => ({
                    periodo: `${item._id.month}/${item._id.year}`,
                    monto: item.monto,
                })),
                proyecciones: projections,
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener proyecciones financieras:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al obtener proyecciones financieras",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

/**
 * Obtiene reporte de usuarios con riesgo de incumplimiento
 */
export const getRiskAssessmentReport = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id || req.user.role !== "admin") {
            return res.status(403).json({
                status: 403,
                message: "No tienes permisos para acceder a esta información",
                data: null,
                error: "Acceso denegado",
            });
        }

        // Definir la interfaz para el usuario populado
        interface PopulatedMember {
            _id: mongoose.Types.ObjectId;
            nombre: string;
            apellidoPaterno: string;
            apellidoMaterno: string;
            email: string;
        }

        // Interfaz para préstamo con miembro populado
        interface LoanWithPopulatedMember extends mongoose.Document {
            _id: mongoose.Types.ObjectId;
            miembro: PopulatedMember;
            cantidad: number;
            createdAt: Date;
            pagos: Array<{
                semana: number;
                pagado: boolean;
                fechaPago?: Date;
            }>;
        }

        // Buscar préstamos activos
        const activeLoans = (await Loan.find({
            estado: "aprobado",
        }).populate("miembro", "nombre apellidoPaterno apellidoMaterno email")) as unknown as LoanWithPopulatedMember[];

        const riskAssessment = [];

        for (const loan of activeLoans) {
            // Verificar si hay semanas atrasadas
            let semanasAtrasadas = 0;
            let ultimaSemanaAtrasada = 0;

            if (loan.pagos && loan.pagos.length > 0) {
                const currentDate = new Date();

                // Asumimos que cada semana dura 7 días desde la creación del préstamo
                const loanDate = new Date(loan.createdAt);
                const daysSinceLoan = Math.floor((currentDate.getTime() - loanDate.getTime()) / (1000 * 60 * 60 * 24));
                const currentWeek = Math.floor(daysSinceLoan / 7) + 1;

                // Contar semanas atrasadas
                for (let i = 0; i < loan.pagos.length; i++) {
                    const pago = loan.pagos[i];
                    if (!pago.pagado && pago.semana <= currentWeek) {
                        semanasAtrasadas++;
                        ultimaSemanaAtrasada = Math.max(ultimaSemanaAtrasada, pago.semana);
                    }
                }
            }

            // Si hay al menos una semana atrasada, agregar al reporte
            if (semanasAtrasadas > 0) {
                // Calcular nivel de riesgo basado en semanas atrasadas
                let nivelRiesgo: "bajo" | "medio" | "alto" = "bajo";
                if (semanasAtrasadas >= 3) {
                    nivelRiesgo = "alto";
                } else if (semanasAtrasadas >= 1) {
                    nivelRiesgo = "medio";
                }

                // Agregar al reporte de riesgo
                riskAssessment.push({
                    prestamoId: loan._id,
                    miembro: {
                        id: loan.miembro._id,
                        nombre: `${loan.miembro.nombre} ${loan.miembro.apellidoPaterno}`,
                        email: loan.miembro.email,
                    },
                    monto: loan.cantidad,
                    semanasAtrasadas,
                    ultimaSemanaAtrasada,
                    nivelRiesgo,
                });
            }
        }

        // Ordenar por nivel de riesgo (alto, medio, bajo)
        const riskOrder: Record<string, number> = { alto: 0, medio: 1, bajo: 2 };
        riskAssessment.sort((a, b) => {
            const riskA = a.nivelRiesgo as keyof typeof riskOrder;
            const riskB = b.nivelRiesgo as keyof typeof riskOrder;

            if (riskOrder[riskA] !== riskOrder[riskB]) {
                return riskOrder[riskA] - riskOrder[riskB];
            }
            // Si el nivel de riesgo es el mismo, ordenar por cantidad de semanas atrasadas
            return b.semanasAtrasadas - a.semanasAtrasadas;
        });

        return res.status(200).json({
            status: 200,
            message: "Reporte de evaluación de riesgos obtenido correctamente",
            data: {
                totalPrestamosActivos: activeLoans.length,
                prestamosConRiesgo: riskAssessment.length,
                porcentajeEnRiesgo: parseFloat(((riskAssessment.length / activeLoans.length) * 100).toFixed(2)),
                evaluacionRiesgos: riskAssessment,
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener reporte de evaluación de riesgos:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al obtener reporte de evaluación de riesgos",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
