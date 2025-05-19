import "dotenv/config";
import mongoose from "mongoose";
import { httpServer, initWebSockets } from "./app";

const PORT = process.env.PORT || 4000;

// Función para conectar a MongoDB
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/tu-base-datos";
        await mongoose.connect(mongoUri);
        console.log("Conectado a MongoDB");
    } catch (error) {
        console.error("Error conectando a MongoDB:", error);
        process.exit(1);
    }
};

// Función para iniciar el servidor
const startServer = async () => {
    try {
        // Conectar a la base de datos
        await connectDB();

        // Inicializar WebSockets
        initWebSockets();

        // Iniciar el servidor
        httpServer.listen(PORT, () => {
            console.log(`Servidor corriendo en puerto ${PORT}`);
            console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
        });
    } catch (error) {
        console.error("Error al iniciar el servidor:", error);
        process.exit(1);
    }
};

// Manejar errores no capturados
process.on("uncaughtException", (err) => {
    console.error("ERROR NO CAPTURADO! Cerrando el servidor...");
    console.error(err.name, err.message);
    process.exit(1);
});

// Manejar rechazos de promesas no capturados
process.on("unhandledRejection", (err) => {
    console.error("RECHAZO DE PROMESA NO MANEJADO! Cerrando el servidor...");
    console.error(err);
    httpServer.close(() => {
        process.exit(1);
    });
});

// Iniciar el servidor
startServer();
