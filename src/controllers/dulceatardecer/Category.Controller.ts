import { Response } from "express";
import mongoose from "mongoose";
import { DAuthRequest } from "../../middlewares/dulceatardecer/auth";
import Category from "../../models/dulceatardecer/Category";
import Product from "../../models/dulceatardecer/Product";
import { broadcastToAll } from "../../config/websockets";

// Obtener todas las categorías
export const getAllCategories = async (req: DAuthRequest, res: Response) => {
    try {
        const categories = await Category.find({ isActive: true }).sort("name");

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
        const { name, description, subCategories } = req.body;

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
            subCategories: subCategories || [],
        });

        broadcastToAll("newCategory", newCategory);

        return res.status(201).json({
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
        const { name, description, subCategories } = req.body;

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
        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            {
                ...(name && { name }),
                ...(description && { description }),
                ...(subCategories !== undefined && { subCategories }),
            },
            { new: true }
        );

        broadcastToAll("updatedCategory", updateCategory);

        return res.status(200).json({
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

// Agregar subcategoría a una categoría existente
export const addSubCategory = async (req: DAuthRequest, res: Response) => {
    try {
        const categoryId = req.params.id;
        const { subCategoryName } = req.body;

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

        // Verificar si la subcategoría ya existe
        if (category.subCategories.includes(subCategoryName)) {
            return res.status(400).json({
                status: 400,
                message: "La subcategoría ya existe",
                data: null,
                error: null,
            });
        }

        // Agregar la subcategoría
        category.subCategories.push(subCategoryName);
        await category.save();

        broadcastToAll("updatedCategory", category);

        return res.status(200).json({
            status: 200,
            message: "Subcategoría agregada correctamente",
            data: category,
            error: null,
        });
    } catch (error) {
        console.error("Error al agregar subcategoría:", error);
        res.status(500).json({
            status: 500,
            message: "Error al agregar subcategoría",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Eliminar subcategoría de una categoría
export const removeSubCategory = async (req: DAuthRequest, res: Response) => {
    try {
        const categoryId = req.params.id;
        const { subCategoryName } = req.body;

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

        // Verificar productos asociados a la subcategoría
        const productsCount = await Product.countDocuments({
            category: categoryId,
            subCategory: subCategoryName,
        });

        if (productsCount > 0) {
            return res.status(400).json({
                status: 400,
                message: `No se puede eliminar la subcategoría porque tiene ${productsCount} productos asociados`,
                data: null,
                error: null,
            });
        }

        // Remover la subcategoría
        category.subCategories = category.subCategories.filter((sub) => sub !== subCategoryName);
        await category.save();

        broadcastToAll("updatedCategory", category);

        return res.status(200).json({
            status: 200,
            message: "Subcategoría eliminada correctamente",
            data: category,
            error: null,
        });
    } catch (error) {
        console.error("Error al eliminar subcategoría:", error);
        res.status(500).json({
            status: 500,
            message: "Error al eliminar subcategoría",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Eliminar una categoría (desactivándola)
export const deleteCategory = async (req: DAuthRequest, res: Response) => {
    try {
        const categoryId = req.params.id;

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

        const productsCount = await Product.countDocuments({ category: categoryId });

        if (productsCount > 0) {
            return res.status(400).json({
                status: 400,
                message: `No se puede eliminar la categoría porque tiene ${productsCount} productos asociados`,
                data: null,
                error: null,
            });
        }

        // Desactivar la categoría en lugar de eliminarla
        category.isActive = false;
        await category.save();

        broadcastToAll("deletedCategory", category);

        return res.status(200).json({
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
