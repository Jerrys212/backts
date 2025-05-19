import mongoose, { Schema, Document } from "mongoose";
import { ICategory } from "../../interfaces/dulceatardecer/dulce.interface";

const CategorySchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: [true, "El nombre de la categoría es obligatorio"],
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            required: [true, "La descripción es obligatoria"],
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<ICategory>("dulce.category", CategorySchema);
