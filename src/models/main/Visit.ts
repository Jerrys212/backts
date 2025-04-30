import mongoose, { Schema } from "mongoose";

const visitSchema: Schema = new Schema(
    {
        visit: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("main.visitas", visitSchema);
