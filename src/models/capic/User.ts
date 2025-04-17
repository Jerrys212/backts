import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../../interfaces/capic/capic.interface";

const UserSchema: Schema = new Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true,
        },
        apellidoPaterno: {
            type: String,
            required: true,
            trim: true,
        },
        apellidoMaterno: {
            type: String,
            required: true,
            trim: true,
        },
        curp: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["usuario", "admin"],
            default: "usuario",
        },
        activo: {
            type: Boolean,
            required: true,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

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

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("capic.User", UserSchema);
