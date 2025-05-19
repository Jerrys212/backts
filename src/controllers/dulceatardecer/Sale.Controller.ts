import { Response } from "express";
import mongoose from "mongoose";
import { DAuthRequest } from "../../middlewares/dulceatardecer/auth";
import Product from "../../models/dulceatardecer/Product";
import Sale from "../../models/dulceatardecer/Sale";

// Crear una nueva venta
export const createSale = async (req: DAuthRequest, res: Response) => {
    try {
        const { items, total } = req.body;

        // Validar que los productos existan y estén activos
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product || !product.isActive) {
                return res.status(400).json({
                    status: 400,
                    message: `Producto ${item.name} no encontrado o no está activo`,
                    data: null,
                    error: null,
                });
            }
        }

        // Crear la venta
        const newSale = await Sale.create({
            items,
            total,
            seller: req.user?.id,
        });

        // Poblar datos del vendedor para la respuesta
        const populatedSale = await Sale.findById(newSale._id).populate("seller", "username");

        res.status(201).json({
            status: 201,
            message: "Venta registrada correctamente",
            data: populatedSale,
            error: null,
        });
    } catch (error) {
        console.error("Error al crear venta:", error);
        res.status(500).json({
            status: 0.5,
            message: "Error al registrar la venta",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Obtener todas las ventas
export const getAllSales = async (req: DAuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Filtros opcionales
        const query: any = {};

        // Filtro por fecha
        if (req.query.startDate && req.query.endDate) {
            query.createdAt = {
                $gte: new Date(req.query.startDate as string),
                $lte: new Date(req.query.endDate as string),
            };
        } else if (req.query.startDate) {
            query.createdAt = { $gte: new Date(req.query.startDate as string) };
        } else if (req.query.endDate) {
            query.createdAt = { $lte: new Date(req.query.endDate as string) };
        }

        // Filtro por vendedor
        if (req.query.seller && mongoose.Types.ObjectId.isValid(req.query.seller as string)) {
            query.seller = req.query.seller;
        }

        // Contar total de registros para paginación
        const total = await Sale.countDocuments(query);

        // Obtener registros
        const sales = await Sale.find(query).populate("seller", "username").sort({ createdAt: -1 }).skip(skip).limit(limit);

        res.status(200).json({
            status: 200,
            message: "Ventas obtenidas correctamente",
            data: {
                sales,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener ventas:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener ventas",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Obtener una venta por ID
export const getSaleById = async (req: DAuthRequest, res: Response) => {
    try {
        const saleId = req.params.id;

        // Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(saleId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de venta inválido",
                data: null,
                error: null,
            });
        }

        const sale = await Sale.findById(saleId).populate("seller", "username");

        if (!sale) {
            return res.status(404).json({
                status: 404,
                message: "Venta no encontrada",
                data: null,
                error: null,
            });
        }

        res.status(200).json({
            status: 200,
            message: "Venta obtenida correctamente",
            data: sale,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener venta:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener venta",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Obtener ventas del día actual
export const getTodaySales = async (req: DAuthRequest, res: Response) => {
    try {
        // Configurar fechas para hoy (desde 00:00:00 hasta 23:59:59)
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const sales = await Sale.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
        }).populate("seller", "username");

        // Calcular total vendido
        const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0);

        // Contar productos vendidos
        const productsSold: Record<string, { count: number; total: number; name: string }> = {};

        sales.forEach((sale) => {
            sale.items.forEach((item) => {
                const productId = item.product.toString();
                if (!productsSold[productId]) {
                    productsSold[productId] = {
                        count: 0,
                        total: 0,
                        name: item.name,
                    };
                }
                productsSold[productId].count += item.quantity;
                productsSold[productId].total += item.subtotal;
            });
        });

        res.status(200).json({
            status: 200,
            message: "Ventas del día obtenidas correctamente",
            data: {
                sales,
                summary: {
                    totalSales: sales.length,
                    totalAmount,
                    productsSold: Object.values(productsSold),
                },
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener ventas del día:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener ventas del día",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Obtener ventas por rango de fechas
export const getSalesByDateRange = async (req: DAuthRequest, res: Response) => {
    try {
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({
                status: 400,
                message: "Fecha inicial y final son requeridas",
                data: null,
                error: null,
            });
        }

        // Convertir a fechas y ajustar para incluir el día completo
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Validar que la fecha inicial no sea posterior a la final
        if (start > end) {
            return res.status(400).json({
                status: 400,
                message: "La fecha inicial no puede ser posterior a la fecha final",
                data: null,
                error: null,
            });
        }

        const sales = await Sale.find({
            createdAt: { $gte: start, $lte: end },
        })
            .populate("seller", "username")
            .sort({ createdAt: -1 });

        // Calcular total vendido
        const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0);

        // Contar productos vendidos
        const productsSold: Record<string, { count: number; total: number; name: string }> = {};

        sales.forEach((sale) => {
            sale.items.forEach((item) => {
                const productId = item.product.toString();
                if (!productsSold[productId]) {
                    productsSold[productId] = {
                        count: 0,
                        total: 0,
                        name: item.name,
                    };
                }
                productsSold[productId].count += item.quantity;
                productsSold[productId].total += item.subtotal;
            });
        });

        // Ventas por día
        const dailySales: Record<string, { count: number; total: number }> = {};

        sales.forEach((sale) => {
            const date = new Date(sale.createdAt).toISOString().split("T")[0];

            if (!dailySales[date]) {
                dailySales[date] = { count: 0, total: 0 };
            }

            dailySales[date].count++;
            dailySales[date].total += sale.total;
        });

        res.status(200).json({
            status: 200,
            message: "Ventas obtenidas correctamente",
            data: {
                sales,
                summary: {
                    totalSales: sales.length,
                    totalAmount,
                    productsSold: Object.values(productsSold),
                    dailySales: Object.entries(dailySales).map(([date, data]) => ({
                        date,
                        ...data,
                    })),
                    period: {
                        startDate: start,
                        endDate: end,
                        days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
                    },
                },
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener ventas por fechas:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener ventas",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
