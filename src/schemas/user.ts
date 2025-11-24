import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    password: string; // Hashed
    balance: number;
    stocks: number[];
    // Phase One
    balancePhaseOne: number;
    stocksPhaseOne: number[];
}

const userSchema = new mongoose.Schema<IUser>({
    name: { type: String, required: true },
    password: { type: String, required: true }, // Hashed
    balance: { type: Number, required: true },
    stocks: { type: [Number], required: true },
    // Phase One
    balancePhaseOne: { type: Number, required: true },
    stocksPhaseOne: { type: [Number], required: true },
});

export const User = mongoose.model<IUser>('User', userSchema);