import { Response } from "express";
import { DAuthRequest } from "../../middlewares/dulceatardecer/auth";
import Sale from "../../models/dulceatardecer/Sale";
import Product from "../../models/dulceatardecer/Product";
import Category from "../../models/dulceatardecer/Category";
import User from "../../models/dulceatardecer/User";
import mongoose from "mongoose";

interface PopulatedSeller {
    _id: mongoose.Types.ObjectId;
    username: string;
}

interface PopulatedCategory {
    _id: mongoose.Types.ObjectId;
    name: string;
}

interface ProductWithCategory {
    _id: mongoose.Types.ObjectId;
    name: string;
    category: {
        name: string;
    } | null;
}

interface SaleWithPopulatedSeller extends mongoose.Document {
    seller: PopulatedSeller;
    total: number;
    items: Array<{
        product: mongoose.Types.ObjectId;
        name: string;
        quantity: number;
        subtotal: number;
    }>;
    createdAt: Date;
}

interface ProductWithPopulatedCategory extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    price: number;
    category: PopulatedCategory;
    isActive: boolean;
}

// Reporte de ventas diarias simplificado
export const getDailySalesReport = async (req: DAuthRequest, res: Response) => {
    try {
        // Configurar fechas para hoy (desde 00:00:00 hasta 23:59:59)
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const sales = (await Sale.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
        })) as unknown as SaleWithPopulatedSeller[];

        // Calcular total vendido
        const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0);

        // Obtener todos los IDs de productos únicos
        const productIds = [...new Set(sales.flatMap((sale) => sale.items.map((item) => item.product.toString())))];

        // Obtener información de productos con sus categorías
        const products = (await Product.find({
            _id: { $in: productIds },
        }).populate("category", "name")) as any[];

        // Crear un mapa de productos para acceso rápido
        const productMap = new Map(
            products.map((product) => [
                product._id.toString(),
                {
                    name: product.name,
                    category: product.category?.name || "Sin categoría",
                },
            ])
        );

        // Agrupar por producto
        const productStats: Record<string, { count: number; total: number; name: string; category: string }> = {};

        sales.forEach((sale) => {
            sale.items.forEach((item) => {
                const productId = item.product.toString();
                const productInfo = productMap.get(productId);

                if (!productStats[productId]) {
                    productStats[productId] = {
                        count: 0,
                        total: 0,
                        name: productInfo?.name || item.name,
                        category: productInfo?.category || "Sin categoría",
                    };
                }
                productStats[productId].count += item.quantity;
                productStats[productId].total += item.subtotal;
            });
        });

        // Convertir a array y ordenar por cantidad vendida (de mayor a menor)
        const topProducts = Object.values(productStats).sort((a, b) => b.count - a.count);

        res.status(200).json({
            status: 200,
            message: "Reporte diario generado correctamente",
            data: {
                date: new Date().toISOString().split("T")[0],
                totalAmount,
                topProducts,
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al generar reporte diario:", error);
        res.status(500).json({
            status: 500,
            message: "Error al generar reporte",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const getDateRangeReport = async (req: DAuthRequest, res: Response) => {
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
        });

        // Calcular total vendido
        const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0);

        // Obtener todos los IDs de productos únicos
        const productIds = [...new Set(sales.flatMap((sale) => sale.items.map((item) => item.product.toString())))];

        // Obtener información de productos con sus categorías
        const products = (await Product.find({
            _id: { $in: productIds },
        }).populate("category", "name")) as any[];

        // Crear un mapa de productos para acceso rápido
        const productMap = new Map(
            products.map((product) => [
                product._id.toString(),
                {
                    name: product.name,
                    category: product.category?.name || "Sin categoría",
                },
            ])
        );

        // Agrupar por producto
        const productStats: Record<string, { count: number; total: number; name: string; category: string }> = {};

        sales.forEach((sale) => {
            sale.items.forEach((item) => {
                const productId = item.product.toString();
                const productInfo = productMap.get(productId);

                if (!productStats[productId]) {
                    productStats[productId] = {
                        count: 0,
                        total: 0,
                        name: productInfo?.name || item.name,
                        category: productInfo?.category || "Sin categoría",
                    };
                }
                productStats[productId].count += item.quantity;
                productStats[productId].total += item.subtotal;
            });
        });

        // Convertir a array y ordenar por cantidad vendida
        const allProducts = Object.values(productStats).sort((a, b) => b.count - a.count);

        // Productos más vendidos (top 10)
        const topProducts = allProducts.slice(0, 10);

        // Productos menos vendidos (últimos 10)
        const leastSoldProducts = allProducts.slice(-10).reverse(); // Reverse para mostrar del menos vendido al más vendido de los últimos

        res.status(200).json({
            status: 200,
            message: "Reporte por rango de fechas generado correctamente",
            data: {
                period: {
                    startDate: start.toISOString().split("T")[0],
                    endDate: end.toISOString().split("T")[0],
                },
                totalAmount,
                topProducts,
                leastSoldProducts,
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al generar reporte por rango de fechas:", error);
        res.status(500).json({
            status: 500,
            message: "Error al generar reporte",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Reporte de productos más vendidos
export const getTopProductsReport = async (req: DAuthRequest, res: Response) => {
    try {
        const { startDate, endDate, limit = 10 } = req.body;

        // Configurar fechas si se proporcionan
        let dateFilter = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            dateFilter = { createdAt: { $gte: start, $lte: end } };
        }

        const sales = await Sale.find(dateFilter);

        // Agrupar por producto
        const productStats: Record<string, { count: number; total: number; name: string; productId: string }> = {};

        sales.forEach((sale) => {
            sale.items.forEach((item) => {
                const productId = item.product.toString();
                if (!productStats[productId]) {
                    productStats[productId] = {
                        count: 0,
                        total: 0,
                        name: item.name,
                        productId,
                    };
                }
                productStats[productId].count += item.quantity;
                productStats[productId].total += item.subtotal;
            });
        });

        // Convertir a array y ordenar por cantidad vendida (de mayor a menor)
        const topProducts = Object.values(productStats)
            .sort((a, b) => b.count - a.count)
            .slice(0, Number(limit));

        // Identificar productos menos vendidos
        const bottomProducts = Object.values(productStats)
            .sort((a, b) => a.count - b.count)
            .slice(0, Number(limit));

        // Obtener todos los productos para identificar los que no se han vendido
        const allProducts = (await Product.find({ isActive: true }).populate("category", "name")) as unknown as ProductWithPopulatedCategory[];

        // Filtrar productos que no tienen ventas
        const notSoldProducts = allProducts
            .filter((product) => !productStats[product._id.toString()])
            .map((product) => ({
                productId: product._id,
                name: product.name,
                category: product.category.name,
                price: product.price,
                count: 0,
                total: 0,
            }));

        res.status(200).json({
            status: 200,
            message: "Reporte de productos generado correctamente",
            data: {
                period:
                    startDate && endDate
                        ? {
                              startDate,
                              endDate,
                          }
                        : "Todo el tiempo",
                summary: {
                    totalProductsSold: Object.values(productStats).reduce((sum, stat) => sum + stat.count, 0),
                    totalAmount: Object.values(productStats).reduce((sum, stat) => sum + stat.total, 0),
                    uniqueProductsSold: Object.keys(productStats).length,
                    totalActiveProducts: allProducts.length,
                },
                topProducts,
                bottomProducts,
                notSoldProducts,
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al generar reporte de productos:", error);
        res.status(500).json({
            status: 500,
            message: "Error al generar reporte",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Reporte de rendimiento por categorías
export const getCategoryPerformanceReport = async (req: DAuthRequest, res: Response) => {
    try {
        const { startDate, endDate } = req.body;

        // Configurar fechas si se proporcionan
        let dateFilter = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            dateFilter = { createdAt: { $gte: start, $lte: end } };
        }

        const sales = await Sale.find(dateFilter);

        // Obtener todas las categorías
        const categories = await Category.find();

        // Obtener todos los productos con su información de categoría
        const products = (await Product.find().populate("category", "name")) as unknown as ProductWithPopulatedCategory[];

        // Mapear productos a categorías
        const productToCategory: Record<string, { categoryId: string; categoryName: string }> = {};
        products.forEach((product) => {
            productToCategory[product._id.toString()] = {
                categoryId: product.category._id.toString(),
                categoryName: product.category.name,
            };
        });

        // Inicializar estadísticas por categoría
        const categoryStats: Record<
            string,
            {
                name: string;
                count: number;
                total: number;
                products: Set<string>;
                salesCount: number;
            }
        > = {};

        // Inicializar todas las categorías
        categories.forEach((category) => {
            categoryStats[category._id.toString()] = {
                name: category.name,
                count: 0,
                total: 0,
                products: new Set(),
                salesCount: 0,
            };
        });

        // Calcular estadísticas
        sales.forEach((sale) => {
            const categoriesInSale = new Set<string>();

            sale.items.forEach((item) => {
                const productId = item.product.toString();
                const categoryInfo = productToCategory[productId];

                if (categoryInfo) {
                    const { categoryId } = categoryInfo;

                    if (categoryStats[categoryId]) {
                        categoryStats[categoryId].count += item.quantity;
                        categoryStats[categoryId].total += item.subtotal;
                        categoryStats[categoryId].products.add(productId);
                        categoriesInSale.add(categoryId);
                    }
                }
            });

            // Incrementar el contador de ventas para cada categoría presente en esta venta
            categoriesInSale.forEach((categoryId) => {
                categoryStats[categoryId].salesCount++;
            });
        });

        // Convertir a array y calcular métricas adicionales
        const categoryReports = Object.entries(categoryStats).map(([categoryId, data]) => ({
            categoryId,
            name: data.name,
            itemsSold: data.count,
            total: data.total,
            uniqueProducts: data.products.size,
            salesCount: data.salesCount,
            averagePerSale: data.salesCount > 0 ? data.total / data.salesCount : 0,
            percentOfTotalSales: sales.length > 0 ? (data.salesCount / sales.length) * 100 : 0,
        }));

        // Ordenar por total de ventas
        const sortedByRevenue = [...categoryReports].sort((a, b) => b.total - a.total);

        // Ordenar por cantidad de productos vendidos
        const sortedByQuantity = [...categoryReports].sort((a, b) => b.itemsSold - a.itemsSold);

        res.status(200).json({
            status: 200,
            message: "Reporte de rendimiento por categorías generado correctamente",
            data: {
                period:
                    startDate && endDate
                        ? {
                              startDate,
                              endDate,
                          }
                        : "Todo el tiempo",
                summary: {
                    totalCategories: categories.length,
                    categoriesWithSales: categoryReports.filter((c) => c.salesCount > 0).length,
                    topCategoryByRevenue: sortedByRevenue[0],
                    topCategoryByQuantity: sortedByQuantity[0],
                },
                categoryReports: sortedByRevenue,
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al generar reporte de categorías:", error);
        res.status(500).json({
            status: 500,
            message: "Error al generar reporte",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Reporte de rendimiento de ventas por usuario
export const getUserPerformanceReport = async (req: DAuthRequest, res: Response) => {
    try {
        const { startDate, endDate } = req.body;

        // Configurar fechas si se proporcionan
        let dateFilter = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            dateFilter = { createdAt: { $gte: start, $lte: end } };
        }

        const sales = (await Sale.find(dateFilter).populate("seller", "username")) as unknown as SaleWithPopulatedSeller[];

        // Obtener todos los usuarios que pueden hacer ventas
        const users = await User.find({
            permissions: { $in: ["ventas", "admin"] },
            isActive: true,
        }).select("username");

        // Inicializar estadísticas por usuario
        const userStats: Record<
            string,
            {
                username: string;
                salesCount: number;
                total: number;
                items: number;
                products: Set<string>;
                categories: Set<string>;
                dailySales: Record<string, { count: number; total: number }>;
            }
        > = {};

        // Inicializar todos los usuarios
        users.forEach((user) => {
            userStats[user._id.toString()] = {
                username: user.username,
                salesCount: 0,
                total: 0,
                items: 0,
                products: new Set(),
                categories: new Set(),
                dailySales: {},
            };
        });

        // Obtener relación producto-categoría
        const products = await Product.find();
        const productCategories: Record<string, string> = {};
        products.forEach((product) => {
            productCategories[product._id.toString()] = product.category.toString();
        });

        // Calcular estadísticas
        sales.forEach((sale) => {
            const sellerId = sale.seller._id.toString();
            const saleDate = new Date(sale.createdAt).toISOString().split("T")[0];

            if (userStats[sellerId]) {
                userStats[sellerId].salesCount++;
                userStats[sellerId].total += sale.total;

                // Inicializar fecha si no existe
                if (!userStats[sellerId].dailySales[saleDate]) {
                    userStats[sellerId].dailySales[saleDate] = { count: 0, total: 0 };
                }

                // Actualizar estadísticas diarias
                userStats[sellerId].dailySales[saleDate].count++;
                userStats[sellerId].dailySales[saleDate].total += sale.total;

                // Procesar productos vendidos
                sale.items.forEach((item) => {
                    userStats[sellerId].items += item.quantity;
                    userStats[sellerId].products.add(item.product.toString());

                    // Agregar categoría si se conoce
                    const productId = item.product.toString();
                    if (productCategories[productId]) {
                        userStats[sellerId].categories.add(productCategories[productId]);
                    }
                });
            }
        });

        // Convertir a array y calcular métricas adicionales
        const userReports = Object.entries(userStats).map(([userId, data]) => {
            // Calcular días con ventas
            const daysWithSales = Object.keys(data.dailySales).length;

            // Calcular mejor día
            let bestDay = null;
            let bestDayTotal = 0;

            Object.entries(data.dailySales).forEach(([date, stats]) => {
                if (stats.total > bestDayTotal) {
                    bestDay = date;
                    bestDayTotal = stats.total;
                }
            });

            return {
                userId,
                username: data.username,
                salesCount: data.salesCount,
                total: data.total,
                itemsSold: data.items,
                uniqueProducts: data.products.size,
                uniqueCategories: data.categories.size,
                averagePerSale: data.salesCount > 0 ? data.total / data.salesCount : 0,
                daysWithSales,
                bestDay: bestDay ? { date: bestDay, total: bestDayTotal } : null,
                dailySales: Object.entries(data.dailySales)
                    .map(([date, stats]) => ({
                        date,
                        ...stats,
                    }))
                    .sort((a, b) => a.date.localeCompare(b.date)),
            };
        });

        // Ordenar por total de ventas
        const sortedByRevenue = [...userReports].sort((a, b) => b.total - a.total);

        res.status(200).json({
            status: 200,
            message: "Reporte de rendimiento por usuario generado correctamente",
            data: {
                period:
                    startDate && endDate
                        ? {
                              startDate,
                              endDate,
                          }
                        : "Todo el tiempo",
                summary: {
                    totalUsers: users.length,
                    usersWithSales: userReports.filter((u) => u.salesCount > 0).length,
                    topSellerByRevenue: sortedByRevenue[0],
                },
                userReports: sortedByRevenue,
            },
            error: null,
        });
    } catch (error) {
        console.error("Error al generar reporte de usuarios:", error);
        res.status(500).json({
            status: 500,
            message: "Error al generar reporte",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

// Función auxiliar para distribución horaria
function getHourlyDistribution(sales: any[]): { hour: string; count: number; total: number }[] {
    const hourly: Record<number, { count: number; total: number }> = {};

    // Inicializar todas las horas
    for (let i = 0; i < 24; i++) {
        hourly[i] = { count: 0, total: 0 };
    }

    // Agrupar ventas por hora
    sales.forEach((sale) => {
        const hour = new Date(sale.createdAt).getHours();
        hourly[hour].count++;
        hourly[hour].total += sale.total;
    });

    // Convertir a array y formatear hora
    return Object.entries(hourly)
        .map(([hourStr, data]) => {
            const hour = parseInt(hourStr);
            return {
                hour: `${hour.toString().padStart(2, "0")}:00`,
                count: data.count,
                total: data.total,
            };
        })
        .sort((a, b) => a.hour.localeCompare(b.hour));
}
