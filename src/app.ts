import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import capicAuthRoutes from "./routes/capic/authRoutes";
import capicUserRouter from "./routes/capic/userRoutes";
import capicGroupsRouter from "./routes/capic/groupRoutes";
import capicContributionsRoutes from "./routes/capic/contributionroutes";
import capicLoanRoutes from "./routes/capic/loanRoutes";
import mainRouter from "./routes/main/mainRoutes";

const app: Express = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use("/uploads", express.static("src/uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/main", mainRouter);

// Montar las rutas de la API capic en /capic/api
app.use("/capic/api/auth", capicAuthRoutes);
app.use("/capic/api/users", capicUserRouter);
app.use("/capic/api/groups", capicGroupsRouter);
app.use("/capic/api/contributions", capicContributionsRoutes);
app.use("/capic/api/loans", capicLoanRoutes);

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

export default app;
