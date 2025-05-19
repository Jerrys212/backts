import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../../interfaces/dulceatardecer/dulce.interface";

const UserSchema: Schema = new Schema(
    {
        username: {
            type: String,
            required: [true, "El nombre de usuario es obligatorio"],
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "La contraseña es obligatoria"],
            select: false,
        },
        permissions: {
            type: [String],
            default: [],
            enum: ["admin", "ventas", "reportes", "productos", "categorias"],
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

// Middleware para hashear la contraseña antes de guardar
UserSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("dulce.user", UserSchema);
