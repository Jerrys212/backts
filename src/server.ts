import dotenv from "dotenv";
import app from "./app";
import connectDB from "./config/db";

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

const PORT = process.env.PORT || 3000;

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en modo ${process.env.NODE_ENV} en el puerto ${PORT}`);
});
