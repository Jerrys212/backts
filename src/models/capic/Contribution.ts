import mongoose, { Schema } from "mongoose";
import { IContribution } from "../../interfaces/capic/capic.interface";

const ContributionSchema: Schema = new Schema(
    {
        grupo: {
            type: Schema.Types.ObjectId,
            ref: "capic.Group",
            required: true,
        },
        miembro: {
            type: Schema.Types.ObjectId,
            ref: "capic.User",
            required: true,
        },
        cantidad: {
            type: Number,
            required: true,
        },
        semana: {
            type: Number,
            required: true,
        },
        fechaAportacion: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IContribution>("capic.Contribution", ContributionSchema);
