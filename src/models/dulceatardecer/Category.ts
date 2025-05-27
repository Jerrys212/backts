import mongoose, { Schema, Document } from "mongoose";
import { ICategory } from "../../interfaces/dulceatardecer/dulce.interface";

const CategorySchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        subCategories: {
            type: Array,
            default: [],
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

export default mongoose.model<ICategory>("dulce.category", CategorySchema);
