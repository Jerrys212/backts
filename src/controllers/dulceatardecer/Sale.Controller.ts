import { Response } from "express";
import mongoose from "mongoose";
import { DAuthRequest } from "../../middlewares/dulceatardecer/auth";
import Product from "../../models/dulceatardecer/Product";
import Extra from "../../models/dulceatardecer/Extras";
import Sale, { SaleStatus } from "../../models/dulceatardecer/Sale";
import { broadcastToAll } from "../../config/websockets";

export const createSale = async (req: DAuthRequest, res: Response) => {
    try {
        const { customer, items, total } = req.body;

        // Validar productos y extras
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

            // Validar extras si existen
            if (item.extras && item.extras.length > 0) {
                for (const extraId of item.extras) {
                    if (!mongoose.Types.ObjectId.isValid(extraId)) {
                        return res.status(400).json({
                            status: 400,
                            message: `ID de extra inválido: ${extraId}`,
                            data: null,
                            error: null,
                        });
                    }

                    const extra = await Extra.findById(extraId);
                    if (!extra || !extra.isActive) {
                        return res.status(400).json({
                            status: 400,
                            message: `Extra con ID ${extraId} no encontrado o no está activo`,
                            data: null,
                            error: null,
                        });
                    }
                }
            }
        }

        const newSale = await Sale.create({
            customer,
            items,
            total,
            seller: req.user?.id,
            status: SaleStatus.EN_PROCESO,
            statusUpdatedBy: req.user?.id,
        });

        const populatedSale = await Sale.findById(newSale._id)
            .populate("seller", "username")
            .populate("statusUpdatedBy", "username")
            .populate({
                path: "items.product",
                populate: {
                    path: "category",
                    select: "name description",
                },
            })
            .populate("items.extras", "name price");

        broadcastToAll("newSale", populatedSale);

        res.status(201).json({
            status: 201,
            message: "Venta registrada correctamente",
            data: populatedSale,
            error: null,
        });
    } catch (error) {
        console.error("Error al crear venta:", error);
        res.status(500).json({
            status: 500,
            message: "Error al registrar la venta",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const getAllSales = async (req: DAuthRequest, res: Response) => {
    try {
        const { status, startDate, endDate } = req.query;
        const filter: any = {};

        if (status && Object.values(SaleStatus).includes(status as SaleStatus)) {
            filter.status = status;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate as string);
            if (endDate) filter.createdAt.$lte = new Date(endDate as string);
        }

        const sales = await Sale.find(filter)
            .populate("seller", "username")
            .populate("statusUpdatedBy", "username")
            .sort({ createdAt: -1 })
            .populate({
                path: "items.product",
                populate: {
                    path: "category",
                    select: "name description",
                },
            })
            .populate("items.extras", "name price");

        res.status(200).json({
            status: 200,
            message: "Ventas obtenidas correctamente",
            data: sales,
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

export const getSaleById = async (req: DAuthRequest, res: Response) => {
    try {
        const saleId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(saleId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de venta inválido",
                data: null,
                error: null,
            });
        }

        const sale = await Sale.findById(saleId)
            .populate("seller", "username")
            .populate("statusUpdatedBy", "username")
            .populate({
                path: "items.product",
                populate: {
                    path: "category",
                    select: "name",
                },
            })
            .populate("items.extras", "name price");

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

export const updateSaleStatus = async (req: DAuthRequest, res: Response) => {
    try {
        const saleId = req.params.id;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(saleId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de venta inválido",
                data: null,
                error: null,
            });
        }

        if (!Object.values(SaleStatus).includes(status)) {
            return res.status(400).json({
                status: 400,
                message: "Status inválido. Debe ser: En proceso, Cerrada o Cancelada",
                data: null,
                error: null,
            });
        }

        const sale = await Sale.findById(saleId);
        if (!sale) {
            return res.status(404).json({
                status: 404,
                message: "Venta no encontrada",
                data: null,
                error: null,
            });
        }

        if (sale.status === SaleStatus.CERRADA || sale.status === SaleStatus.CANCELADA) {
            if (status === sale.status) {
                return res.status(400).json({
                    status: 400,
                    message: `La venta ya está ${status.toLowerCase()}`,
                    data: null,
                    error: null,
                });
            }
        }

        sale.status = status;
        sale.statusUpdatedBy = req.user?.id;
        sale.statusUpdatedAt = new Date();
        await sale.save();

        const updatedSale = await Sale.findById(saleId).populate("seller", "username").populate("statusUpdatedBy", "username").populate("items.extras", "name price");

        broadcastToAll("updatedSale", updatedSale);

        res.status(200).json({
            status: 200,
            message: `Status de venta actualizado a ${status}`,
            data: updatedSale,
            error: null,
        });
    } catch (error) {
        console.error("Error al actualizar status:", error);
        res.status(500).json({
            status: 500,
            message: "Error al actualizar status de venta",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const updateSale = async (req: DAuthRequest, res: Response) => {
    try {
        const saleId = req.params.id;
        const { customer, items, total } = req.body;

        if (!mongoose.Types.ObjectId.isValid(saleId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de venta inválido",
                data: null,
                error: null,
            });
        }

        const sale = await Sale.findById(saleId);
        if (!sale) {
            return res.status(404).json({
                status: 404,
                message: "Venta no encontrada",
                data: null,
                error: null,
            });
        }

        if (sale.status !== SaleStatus.EN_PROCESO) {
            return res.status(400).json({
                status: 400,
                message: "Solo se pueden editar ventas que estén en proceso",
                data: null,
                error: null,
            });
        }

        // Validar productos y extras si se están actualizando
        if (items) {
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

                // Validar extras si existen
                if (item.extras && item.extras.length > 0) {
                    for (const extraId of item.extras) {
                        if (!mongoose.Types.ObjectId.isValid(extraId)) {
                            return res.status(400).json({
                                status: 400,
                                message: `ID de extra inválido: ${extraId}`,
                                data: null,
                                error: null,
                            });
                        }

                        const extra = await Extra.findById(extraId);
                        if (!extra || !extra.isActive) {
                            return res.status(400).json({
                                status: 400,
                                message: `Extra con ID ${extraId} no encontrado o no está activo`,
                                data: null,
                                error: null,
                            });
                        }
                    }
                }
            }
        }

        if (customer) sale.customer = customer;
        if (items) sale.items = items;
        if (total) sale.total = total;

        await sale.save();

        const updatedSale = await Sale.findById(saleId)
            .populate("seller", "username")
            .populate("statusUpdatedBy", "username")
            .populate({
                path: "items.product",
                populate: {
                    path: "category",
                    select: "name",
                },
            })
            .populate("items.extras", "name price");

        broadcastToAll("updatedSale", updatedSale);

        return res.status(200).json({
            status: 200,
            message: "Venta actualizada correctamente",
            data: updatedSale,
            error: null,
        });
    } catch (error) {
        console.error("Error al editar venta:", error);
        res.status(500).json({
            status: 500,
            message: "Error al editar venta",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
