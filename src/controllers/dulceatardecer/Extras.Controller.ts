import { Response } from "express";
import mongoose from "mongoose";
import { DAuthRequest } from "../../middlewares/dulceatardecer/auth";
import Extras from "../../models/dulceatardecer/Extras";

export const createExtra = async (req: DAuthRequest, res: Response) => {
    try {
        const { name, price } = req.body;

        // Validar que el nombre no esté duplicado
        const existingExtra = await Extras.findOne({ name });
        if (existingExtra) {
            return res.status(400).json({
                status: 400,
                message: "Ya existe un extra con este nombre",
                data: null,
                error: null,
            });
        }

        const newExtra = await Extras.create({
            name,
            price,
        });

        res.status(201).json({
            status: 201,
            message: "Extra creado correctamente",
            data: newExtra,
            error: null,
        });
    } catch (error) {
        console.error("Error al crear extra:", error);
        res.status(500).json({
            status: 500,
            message: "Error al crear el extra",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const getAllExtras = async (req: DAuthRequest, res: Response) => {
    try {
        const { isActive } = req.query;
        const filter: any = {};

        // Filtrar por estado activo si se especifica
        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }

        const extras = await Extras.find(filter).sort({ name: 1 });

        res.status(200).json({
            status: 200,
            message: "Extras obtenidos correctamente",
            data: extras,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener extras:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener extras",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const getExtraById = async (req: DAuthRequest, res: Response) => {
    try {
        const extraId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(extraId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de extra inválido",
                data: null,
                error: null,
            });
        }

        const extra = await Extras.findById(extraId);

        if (!extra) {
            return res.status(404).json({
                status: 404,
                message: "Extra no encontrado",
                data: null,
                error: null,
            });
        }

        res.status(200).json({
            status: 200,
            message: "Extra obtenido correctamente",
            data: extra,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener extra:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener extra",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const updateExtra = async (req: DAuthRequest, res: Response) => {
    try {
        const extraId = req.params.id;
        const { name, description, price, isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(extraId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de extra inválido",
                data: null,
                error: null,
            });
        }

        const extra = await Extras.findById(extraId);
        if (!extra) {
            return res.status(404).json({
                status: 404,
                message: "Extra no encontrado",
                data: null,
                error: null,
            });
        }

        // Verificar nombre duplicado si se está cambiando
        if (name !== extra.name) {
            const existingExtra = await Extras.findOne({
                name,
                _id: { $ne: extraId },
            });
            if (existingExtra) {
                return res.status(400).json({
                    status: 400,
                    message: "Ya existe un extra con este nombre",
                    data: null,
                    error: null,
                });
            }
        }

        // Actualizar campos
        if (name) extra.name = name;
        if (price !== undefined) extra.price = price;
        if (isActive !== undefined) extra.isActive = isActive;

        await extra.save();

        res.status(200).json({
            status: 200,
            message: "Extra actualizado correctamente",
            data: extra,
            error: null,
        });
    } catch (error) {
        console.error("Error al actualizar extra:", error);
        res.status(500).json({
            status: 500,
            message: "Error al actualizar extra",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const deleteExtra = async (req: DAuthRequest, res: Response) => {
    try {
        const extraId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(extraId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de extra inválido",
                data: null,
                error: null,
            });
        }

        const extra = await Extras.findById(extraId);
        if (!extra) {
            return res.status(404).json({
                status: 404,
                message: "Extra no encontrado",
                data: null,
                error: null,
            });
        }

        // Desactivar en lugar de eliminar para mantener integridad referencial
        extra.isActive = false;
        await extra.save();

        res.status(200).json({
            status: 200,
            message: "Extra desactivado correctamente",
            data: extra,
            error: null,
        });
    } catch (error) {
        console.error("Error al eliminar extra:", error);
        res.status(500).json({
            status: 500,
            message: "Error al eliminar extra",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
