import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const config = {
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/caja-ahorro",
    jwtSecret: process.env.JWT_SECRET || "tu_secreto_jwt_seguro",
};

export default config;
