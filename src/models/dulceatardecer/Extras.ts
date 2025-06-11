import mongoose, { Schema, Document } from "mongoose";
import { IExtras } from "../../interfaces/dulceatardecer/dulce.interface";

const ExtraSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        price: {
            type: Number,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Índice para búsquedas eficientes
ExtraSchema.index({ name: 1 });
ExtraSchema.index({ isActive: 1 });

export default mongoose.model<IExtras>("dulce.extras", ExtraSchema);
