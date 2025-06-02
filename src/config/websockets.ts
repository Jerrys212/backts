import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import User from "../models/dulceatardecer/User";

// Socket con usuario autenticado
interface AuthenticatedSocket extends Socket {
    userId?: string;
    username?: string;
}

// Variable global para el servidor
let io: SocketIOServer;

// Middleware de autenticación
const authMiddleware = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error("No token"));
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
        const user = await User.findById(decoded.id).select("username");

        if (!user) {
            return next(new Error("User not found"));
        }

        socket.userId = user._id.toString();
        socket.username = user.username;

        next();
    } catch (error) {
        next(new Error("Auth failed"));
    }
};

// Manejar conexión
const handleConnection = (socket: AuthenticatedSocket) => {
    console.log(`Usuario conectado: ${socket.username}`);

    socket.on("disconnect", () => {
        console.log(`Usuario desconectado: ${socket.username}`);
    });
};

// Inicializar servidor
export const initializeSocketManager = (server: HTTPServer): void => {
    io = new SocketIOServer(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.use(authMiddleware);
    io.on("connection", handleConnection);

    console.log("Socket server inicializado");
};

// UNA SOLA FUNCIÓN para enviar cualquier cosa al frontend
export const broadcastToAll = (eventName: string, data: any) => {
    if (!io) {
        console.error("Socket no inicializado");
        return;
    }

    io.emit(eventName, data);
};
