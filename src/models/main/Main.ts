import mongoose, { Schema } from "mongoose";
import { IMain } from "../../interfaces/main/main.interface";

const MainSchema: Schema = new Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        mensaje: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IMain>("main.mensajes", MainSchema);
