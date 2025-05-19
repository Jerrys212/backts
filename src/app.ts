import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import capicAuthRoutes from "./routes/capic/authRoutes";
import capicUserRouter from "./routes/capic/userRoutes";
import capicGroupsRouter from "./routes/capic/groupRoutes";
import capicContributionsRoutes from "./routes/capic/contributionroutes";
import capicLoanRoutes from "./routes/capic/loanRoutes";
import mainRouter from "./routes/main/mainRoutes";
import reportsRoutes from "./routes/capic/reportRoutes";
import dulceAuthRoutes from "./routes/dulceatardecer/authRoutes";
import dulceUserRouter from "./routes/dulceatardecer/userRoutes";
import dulceCategoryRouter from "./routes/dulceatardecer/categoryRoutes";
import dulceProductRoutes from "./routes/dulceatardecer/productRoutes";
import dulceSaleRoutes from "./routes/dulceatardecer/saleRoutes";
import dulcereportsRoutes from "./routes/dulceatardecer/reportRoutes";
import { initializeSocketManager } from "./config/websockets";

const app: Express = express();

const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/main", mainRouter);

// Montar las rutas de la API capic en /capic/api
app.use("/capic/api/auth", capicAuthRoutes);
app.use("/capic/api/users", capicUserRouter);
app.use("/capic/api/groups", capicGroupsRouter);
app.use("/capic/api/contributions", capicContributionsRoutes);
app.use("/capic/api/loans", capicLoanRoutes);
app.use("/capic/api/reports", reportsRoutes);

// Montar las rutas de la API dulce en /dulce/api
app.use("/dulce/api/auth", dulceAuthRoutes);
app.use("/dulce/api/users", dulceUserRouter);
app.use("/dulce/api/categories", dulceCategoryRouter);
app.use("/dulce/api/products", dulceProductRoutes);
app.use("/dulce/api/sales", dulceSaleRoutes);
app.use("/dulce/api/reports", dulcereportsRoutes);

// Ruta para el health check
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

// Middleware para manejar rutas no encontradas
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: "Ruta no encontrada",
    });
});

// Middleware para manejar errores
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Error interno del servidor",
    });
});

// Función para inicializar WebSockets
export const initWebSockets = () => {
    initializeSocketManager(httpServer);
    console.log("WebSockets inicializados");
};

// Exportar tanto el app como el servidor
export { app, httpServer };
export default app;
