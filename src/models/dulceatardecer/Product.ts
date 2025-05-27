import mongoose, { Schema, Document } from "mongoose";
import { IProduct } from "../../interfaces/dulceatardecer/dulce.interface";

const ProductSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "dulce.category",
            required: true,
        },
        subCategory: {
            type: String,
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
    }
);

export default mongoose.model<IProduct>("dulce.product", ProductSchema);
