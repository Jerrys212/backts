import mongoose from "mongoose";
import config from "./config";

// Función para conectar a MongoDB
const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(config.mongoUri);
        console.log(`MongoDB Conectado: ${conn.connection.host}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        } else {
            console.error("Error desconocido al conectar a MongoDB");
        }
        process.exit(1);
    }
};

export default connectDB;
