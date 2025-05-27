import { Response } from "express";
import mongoose from "mongoose";
import { DAuthRequest } from "../../middlewares/dulceatardecer/auth";
import Product from "../../models/dulceatardecer/Product";
import Category from "../../models/dulceatardecer/Category";

// Obtener todos los productos
export const getAllProducts = async (req: DAuthRequest, res: Response) => {
    try {
        const products = await Product.find().populate("category", "name").sort("name");

        res.status(200).json({
            status: 200,
            message: "Productos obtenidos correctamente",
            data: products,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener productos",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Obtener productos por categoría
export const getProductsByCategory = async (req: DAuthRequest, res: Response) => {
    try {
        const categoryId = req.params.categoryId;

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

        // Obtener los productos de la categoría
        const products = await Product.find({ category: categoryId }).populate("category", "name").sort("name");

        res.status(200).json({
            status: 200,
            message: "Productos obtenidos correctamente",
            data: products,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener productos por categoría:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener productos",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Obtener un producto por ID
export const getProductById = async (req: DAuthRequest, res: Response) => {
    try {
        const productId = req.params.id;

        // Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de producto inválido",
                data: null,
                error: null,
            });
        }

        const product = await Product.findById(productId).populate("category", "name");

        if (!product) {
            return res.status(404).json({
                status: 404,
                message: "Producto no encontrado",
                data: null,
                error: null,
            });
        }

        res.status(200).json({
            status: 200,
            message: "Producto obtenido correctamente",
            data: product,
            error: null,
        });
    } catch (error) {
        console.error("Error al obtener producto:", error);
        res.status(500).json({
            status: 500,
            message: "Error al obtener producto",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Crear un nuevo producto
export const createProduct = async (req: DAuthRequest, res: Response) => {
    try {
        const { name, description, category, subCategory, price } = req.body;

        // Verificar si la categoría existe
        if (!mongoose.Types.ObjectId.isValid(category)) {
            return res.status(400).json({
                status: 400,
                message: "ID de categoría inválido",
                data: null,
                error: null,
            });
        }

        const categoryExists = await Category.findById(category);

        if (!categoryExists) {
            return res.status(404).json({
                status: 404,
                message: "Categoría no encontrada",
                data: null,
                error: null,
            });
        }

        // Verificar si ya existe un producto con ese nombre
        const existingProduct = await Product.findOne({ name });

        if (existingProduct) {
            return res.status(400).json({
                status: 400,
                message: "Ya existe un producto con ese nombre",
                data: null,
                error: null,
            });
        }

        // Crear el nuevo producto
        const newProduct = await Product.create({
            name,
            description,
            category,
            subCategory,
            price,
        });

        // Poblar la categoría para la respuesta
        const populatedProduct = await Product.findById(newProduct._id).populate("category", "name");

        res.status(201).json({
            status: 201,
            message: "Producto creado correctamente",
            data: populatedProduct,
            error: null,
        });
    } catch (error) {
        console.error("Error al crear producto:", error);
        res.status(500).json({
            status: 500,
            message: "Error al crear producto",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Actualizar un producto
export const updateProduct = async (req: DAuthRequest, res: Response) => {
    try {
        const productId = req.params.id;
        const { name, description, category, price, isActive } = req.body;

        // Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de producto inválido",
                data: null,
                error: null,
            });
        }

        // Verificar si el producto existe
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                status: 404,
                message: "Producto no encontrado",
                data: null,
                error: null,
            });
        }

        // Verificar si ya existe otro producto con ese nombre
        if (name && name !== product.name) {
            const existingProduct = await Product.findOne({ name });
            if (existingProduct) {
                return res.status(400).json({
                    status: 400,
                    message: "Ya existe un producto con ese nombre",
                    data: null,
                    error: null,
                });
            }
        }

        // Si se intenta cambiar la categoría, verificar que exista
        if (category && category !== product.category.toString()) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                return res.status(400).json({
                    status: 400,
                    message: "ID de categoría inválido",
                    data: null,
                    error: null,
                });
            }

            const categoryExists = await Category.findById(category);

            if (!categoryExists) {
                return res.status(404).json({
                    status: 404,
                    message: "Categoría no encontrada",
                    data: null,
                    error: null,
                });
            }
        }

        // Actualizar el producto
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                name,
                description,
                category,
                price,
                isActive,
            },
            { new: true }
        ).populate("category", "name");

        res.status(200).json({
            status: 200,
            message: "Producto actualizado correctamente",
            data: updatedProduct,
            error: null,
        });
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).json({
            status: 500,
            message: "Error al actualizar producto",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Eliminar un producto (desactivación lógica)
export const deleteProduct = async (req: DAuthRequest, res: Response) => {
    try {
        const productId = req.params.id;

        // Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                status: 400,
                message: "ID de producto inválido",
                data: null,
                error: null,
            });
        }

        // Verificar si el producto existe
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                status: 404,
                message: "Producto no encontrado",
                data: null,
                error: null,
            });
        }

        // Desactivar el producto en lugar de eliminarlo
        await Product.findByIdAndUpdate(productId, { isActive: false });

        res.status(200).json({
            status: 200,
            message: "Producto eliminado correctamente",
            data: { id: productId },
            error: null,
        });
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        res.status(500).json({
            status: 500,
            message: "Error al eliminar producto",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
