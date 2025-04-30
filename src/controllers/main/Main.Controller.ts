import { Request, Response } from "express";
import Main from "../../models/main/Main";
import Visit from "../../models/main/Visit";

export const createMessage = async (req: Request, res: Response) => {
    try {
        await Main.create(req.body);

        return res.status(201).json({
            status: 201,
            message: "Mensaje creado correctamente",
            data: {},
            error: null,
        });
    } catch (error) {
        console.error("Error en registro:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al registrar mensaje",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};

export const visitweb = async (req: Request, res: Response) => {
    try {
        const visit = new Visit();
        await visit.save();

        return res.status(201).json({
            status: 201,
            message: "Visita registrada correctamente",
            data: {},
            error: null,
        });
    } catch (error) {
        console.error("Error en registro:", error);
        return res.status(500).json({
            status: 500,
            message: "Error al registrar mensaje",
            data: null,
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
