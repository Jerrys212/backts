import mongoose, { Schema } from "mongoose";
import { IGroup } from "../../interfaces/capic/capic.interface";

const GroupSchema: Schema = new Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        semanas: {
            type: Number,
            required: true,
        },
        cantidadSemanal: {
            type: Number,
            required: true,
        },
        limiteUsuarios: {
            type: Number,
            required: true,
        },
        miembros: [
            {
                type: Schema.Types.ObjectId,
                ref: "capic.User",
            },
        ],
        creador: {
            type: Schema.Types.ObjectId,
            ref: "capic.User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IGroup>("capic.Group", GroupSchema);
