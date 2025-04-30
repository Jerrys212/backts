import mongoose, { Schema } from "mongoose";
import { ILoan } from "../../interfaces/capic/capic.interface";

const PagoSchema: Schema = new Schema(
    {
        semana: {
            type: Number,
            required: true,
        },
        pagado: {
            type: Boolean,
            default: false,
        },
        fechaPago: {
            type: Date,
            default: null,
        },
        cantidad: {
            type: Number,
            default: null,
        },
    },
    { _id: false }
);

const LoanSchema: Schema = new Schema(
    {
        miembro: {
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
        pagos: {
            type: [PagoSchema],
            default: [],
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
