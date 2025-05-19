import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";

import { DefaultEventsMap } from "socket.io/dist/typed-events";
import User from "../models/dulceatardecer/User";

// Eventos que podemos emitir al frontend
export enum SocketEvents {
    // Ventas
    NEW_SALE = "newSale",

    // Productos
    PRODUCT_UPDATED = "productUpdated",
    PRODUCT_CREATED = "productCreated",
    PRODUCT_DELETED = "productDeleted",

    // Categorías
    CATEGORY_UPDATED = "categoryUpdated",
    CATEGORY_CREATED = "categoryCreated",
    CATEGORY_DELETED = "categoryDeleted",

    // Usuarios
    USER_UPDATED = "userUpdated",
    USER_CREATED = "userCreated",
    USER_DELETED = "userDeleted",

    // Inventario (si lo implementas en el futuro)
    INVENTORY_UPDATED = "inventoryUpdated",

    // Reportes en tiempo real
    DAILY_STATS_UPDATED = "dailyStatsUpdated",

    // Eventos globales para todos los usuarios
    MAINTENANCE_NOTIFICATION = "maintenanceNotification",
    SYSTEM_UPDATE = "systemUpdate",
    CONNECTED_USERS_COUNT = "connectedUsersCount",
    GLOBAL_ANNOUNCEMENT = "globalAnnouncement",
}

// Interfaz para el socket autenticado
interface AuthenticatedSocket extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> {
    user?: {
        id: string;
        username: string;
        permissions: string[];
    };
}

// Variables globales para manejar el estado
let io: SocketIOServer;
let connectedUsers: Map<string, string> = new Map(); // userId -> socketId

// Middleware de autenticación para Socket.IO
const socketAuthMiddleware = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
            return next(new Error("No token provided"));
        }

        // Verificar el token
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");

        // Buscar el usuario
        const user = await User.findById(decoded.id).select("-password");

        if (!user || !user.isActive) {
            return next(new Error("User not found or inactive"));
        }

        // Agregar información del usuario al socket
        socket.user = {
            id: user._id.toString(),
            username: user.username,
            permissions: user.permissions,
        };

        next();
    } catch (error) {
        next(new Error("Authentication failed"));
    }
};

// Manejar conexiones
const handleConnection = (socket: AuthenticatedSocket) => {
    console.log(`Usuario conectado: ${socket.user?.username} (${socket.id})`);

    // Agregar el usuario a la lista de conectados
    if (socket.user) {
        connectedUsers.set(socket.user.id, socket.id);
        socket.join(`user:${socket.user.id}`);

        // Unir a salas basadas en permisos
        socket.user.permissions.forEach((permission) => {
            socket.join(`permission:${permission}`);
        });
    }

    socket.on("disconnect", () => {
        console.log(`Usuario desconectado: ${socket.user?.username} (${socket.id})`);
        if (socket.user) {
            connectedUsers.delete(socket.user.id);
        }
    });
};

// Función para inicializar el servidor de sockets
export const initializeSocketManager = (server: HTTPServer): void => {
    io = new SocketIOServer(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    // Aplicar middleware de autenticación
    io.use(socketAuthMiddleware);

    // Manejar conexiones
    io.on("connection", handleConnection);

    console.log("WebSocket server inicializado");
};

// Función para emitir a TODOS los usuarios conectados (sin restricción de permisos)
export const broadcastToAll = (event: string, data: any) => {
    if (!io) throw new Error("Socket manager no ha sido inicializado");

    io.emit(event, {
        type: event.toUpperCase(),
        data,
        timestamp: new Date(),
    });
};

// Emitir a un usuario específico
export const emitToUser = (userId: string, event: string, data: any) => {
    if (!io) throw new Error("Socket manager no ha sido inicializado");

    const socketId = connectedUsers.get(userId);
    if (socketId) {
        io.to(socketId).emit(event, data);
    }
};
