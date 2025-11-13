// src/services/user.service.ts
import { AppError } from '../middleware/error.middleware';
import { CreateUserInput, UpdateUserInput } from '../schemas/user.schema';
import { UserModel, IUser } from '../models/user.model';

export class UserService {
  async createUser(data: CreateUserInput): Promise<IUser> {
    // Check if user already exists by Supabase id or email
    const existing = await UserModel.findOne({
      $or: [{ _id: data.id }, { email: data.email }],
    }).exec();

    if (existing) {
      throw new AppError(409, 'User with this id or email already exists');
    }

    const user = await UserModel.create({
      _id: data.id, // store Supabase id as Mongo _id
      email: data.email,
      username: data.username,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl || undefined,
      role: data.role || 'ADVENTURER',
    });

    return user;
  }

  async getUsers(): Promise<IUser[]> {
    const users = await UserModel.find().exec();
    return users;
  }

  async getUserById(id: string): Promise<IUser> {
    const user = await UserModel.findById(id).exec();
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    return user;
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<IUser> {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { ...data },
      { new: true }
    ).exec();

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await UserModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new AppError(404, 'User not found');
    }
  }
}

export const userService = new UserService();
