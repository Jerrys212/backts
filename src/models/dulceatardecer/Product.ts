import mongoose, { Schema, Document } from "mongoose";
import { IProduct } from "../../interfaces/dulceatardecer/dulce.interface";

const ProductSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: [true, "El nombre del producto es obligatorio"],
            trim: true,
        },
        description: {
            type: String,
            required: [true, "La descripción es obligatoria"],
            trim: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "dulce.category",
            required: [true, "La categoría es obligatoria"],
        },
        price: {
            type: Number,
            required: [true, "El precio es obligatorio"],
            min: [0, "El precio no puede ser negativo"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IProduct>("dulce.product", ProductSchema);
