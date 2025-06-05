import mongoose from "mongoose";

export interface IUser extends Document {
    username: string;
    password: string;
    permissions: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    isModified(path: string): boolean;
    comparePassword: (candidatePassword: string) => Promise<boolean>;
}

export interface ICategory extends Document {
    name: string;
    description: string;
    subCategories: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IProduct extends Document {
    name: string;
    description: string;
    category: mongoose.Types.ObjectId;
    price: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ISaleItem {
    product: string;
    name: string;
    extras?: any[];
    price: number;
    quantity: number;
    subtotal: number;
}

export interface ISale extends Document {
    customer: string;
    items: ISaleItem[];
    total: number;
    seller: string;
    status: "En proceso" | "Cerrada" | "Cancelada";
    statusUpdatedAt: Date;
    statusUpdatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
