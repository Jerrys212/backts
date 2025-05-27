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
    product: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
}

export interface ISale extends Document {
    items: ISaleItem[];
    total: number;
    customer: string;
    seller: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
