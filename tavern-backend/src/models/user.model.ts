import { Schema, model, Document } from 'mongoose';

export type UserRole = 'ADVENTURER' | 'NPC' | 'GUILD_MASTER';

export interface IUser extends Document {
  _id: string;                 // we store Supabase/UUID or any string id here
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  password: string;            // hashed
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true }, // accept external id if you want
    email: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    avatarUrl: { type: String },
    role: {
      type: String,
      enum: ['ADVENTURER', 'NPC', 'GUILD_MASTER'],
      default: 'ADVENTURER',
      index: true,
    },
    password: { type: String, required: true, select: false }, // select:false hides it by default
  },
  { timestamps: true }
);

export const UserModel = model<IUser>('User', UserSchema);
