import mongoose, { Schema } from "mongoose";
import { ILoan } from "../../interfaces/capic/capic.interface";

const LoanSchema: Schema = new Schema(
    {
        usuario: {
            type: Schema.Types.ObjectId,
            ref: "capic.User",
            required: true,
        },
        cantidad: {
            type: Number,
            required: true,
        },
        semanas: {
            type: Number,
            required: true,
        },
        cantidadSemanal: {
            type: Number,
            required: true,
        },
        interes: {
            type: Number,
            default: 5,
        },
        totalPagar: {
            type: Number,
            required: true,
        },
        estado: {
            type: String,
            enum: ["pendiente", "aprobado", "rechazado", "pagado"],
            default: "pendiente",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<ILoan>("capic.Loan", LoanSchema);
