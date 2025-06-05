import mongoose, { Schema, Document } from "mongoose";
import { ISale, ISaleItem } from "../../interfaces/dulceatardecer/dulce.interface";

// Enum para los status de venta
export enum SaleStatus {
    EN_PROCESO = "En proceso",
    CERRADA = "Cerrada",
    CANCELADA = "Cancelada",
}

const SaleItemSchema: Schema = new Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "dulce.product",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        extras: {
            type: Array,
        },
        price: {
            type: Number,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        subtotal: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
);

const SaleSchema: Schema = new Schema(
    {
        customer: {
            type: String,
            required: true,
        },
        items: {
            type: [SaleItemSchema],
            required: true,
            validate: {
                validator: function (items: ISaleItem[]) {
                    return items.length > 0;
                },
                message: "Una venta debe tener al menos un producto",
            },
        },
        total: {
            type: Number,
            required: true,
            min: [0, "El total no puede ser negativo"],
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "dulce.user",
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(SaleStatus),
            default: SaleStatus.EN_PROCESO,
            required: true,
        },
        statusUpdatedAt: {
            type: Date,
            default: Date.now,
        },
        statusUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "dulce.user",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Middleware para actualizar statusUpdatedAt cuando cambie el status
SaleSchema.pre("save", function (next) {
    if (this.isModified("status")) {
        this.statusUpdatedAt = new Date();
    }
    next();
});

export default mongoose.model<ISale>("dulce.sale", SaleSchema);
