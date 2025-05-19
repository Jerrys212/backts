import { Response } from "express";
import mongoose from "mongoose";
import { DAuthRequest } from "../../middlewares/dulceatardecer/auth";
import Category from "../../models/dulceatardecer/Category";
import Product from "../../models/dulceatardecer/Product";

// Obtener todas las categorías
export const getAllCategories = async (req: DAuthRequest, res: Response) => {
    try {
        const categories = await Category.find().sort("name");

        res.status(200).json({
            status: 200,
            message: "Categorías obtenidas correctamente",
            data: categories,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener categorías",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Obtener una categoría por ID
export const getCategoryById = async (req: DAuthRequest, res: Response) => {
    try {
        const categoryId = req.params.id;

        // Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de categoría inválido",
                data: null,
                error: null,
            });
        }

        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                status: 404,
                message: "Categoría no encontrada",
                data: null,
                error: null,
            });
        }

        res.status(200).json({
            status: 200,
            message: "Categoría obtenida correctamente",
            data: category,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener categoría:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener categoría",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Crear una nueva categoría
export const createCategory = async (req: DAuthRequest, res: Response) => {
    try {
        const { name, description } = req.body;

        // Verificar si ya existe una categoría con ese nombre
        const existingCategory = await Category.findOne({ name });

        if (existingCategory) {
            return res.status(400).json({
                status: 400,
                message: "Ya existe una categoría con ese nombre",
                data: null,
                error: null,
            });
        }

        // Crear la nueva categoría
        const newCategory = await Category.create({
            name,
            description,
        });

        res.status(201).json({
            status: 201,
            message: "Categoría creada correctamente",
            data: newCategory,
            error: null,
        });
    } catch (error) {
        console.error("Error al crear categoría:", error);
        res.status(500).json({
            status: 500,
            message: "Error al crear categoría",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Actualizar una categoría
export const updateCategory = async (req: DAuthRequest, res: Response) => {
    try {
        const categoryId = req.params.id;
        const { name, description } = req.body;

        // Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de categoría inválido",
                data: null,
                error: null,
            });
        }

        // Verificar si la categoría existe
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                status: 404,
                message: "Categoría no encontrada",
                data: null,
                error: null,
            });
        }

        // Verificar si ya existe otra categoría con ese nombre
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({ name });
            if (existingCategory) {
                return res.status(400).json({
                    status: 400,
                    message: "Ya existe una categoría con ese nombre",
                    data: null,
                    error: null,
                });
            }
        }

        // Actualizar la categoría
        const updatedCategory = await Category.findByIdAndUpdate(categoryId, { name, description }, { new: true });

        res.status(200).json({
            status: 200,
            message: "Categoría actualizada correctamente",
            data: updatedCategory,
            error: null,
        });
    } catch (error) {
        console.error("Error al actualizar categoría:", error);
        res.status(500).json({
            status: 500,
            message: "Error al actualizar categoría",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Eliminar una categoría
export const deleteCategory = async (req: DAuthRequest, res: Response) => {
    try {
        const categoryId = req.params.id;

        // Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de categoría inválido",
                data: null,
                error: null,
            });
        }

        // Verificar si la categoría existe
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                status: 404,
                message: "Categoría no encontrada",
                data: null,
                error: null,
            });
        }

        // Verificar si hay productos asociados a esta categoría
        const productsCount = await Product.countDocuments({ category: categoryId });

        if (productsCount > 0) {
            return res.status(400).json({
                status: 400,
                message: `No se puede eliminar la categoría porque tiene ${productsCount} productos asociados`,
                data: null,
                error: null,
            });
        }

        // Eliminar la categoría
        await Category.findByIdAndDelete(categoryId);

        res.status(200).json({
            status: 200,
            message: "Categoría eliminada correctamente",
            data: { id: categoryId },
            error: null,
        });
    } catch (error) {
        console.error("Error al eliminar categoría:", error);
        res.status(500).json({
            status: 500,
            message: "Error al eliminar categoría",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
