import bcrypt from "bcrypt";
import { AppError } from "../middleware/error.middleware";
import { UserModel, IUser } from "../models/user.model";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";
import { signJwt } from "../config/jwt.config";

export class AuthService {
  async register(data: RegisterInput) {
    const exists = await UserModel.findOne({
      $or: [
        { email: data.email },
        { username: data.username },
      ],
    }).lean();
    if (exists) {
      throw new AppError(
        409,
        "User with this email/username already exists"
      );
    }

    const hash = await bcrypt.hash(data.password, 10);

    const user = await UserModel.create({
      email: data.email,
      username: data.username,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      role: data.role || "ADVENTURER",
      password: hash,
    });

    // 👇 Make sure sub is a string and don't fight TS on _id type
    const token = signJwt({
      sub: String((user as any)._id),
      role: user.role,
    } as any);

    return { token, user: this.publicUser(user) };
  }

  async login(data: LoginInput) {
    // allow login via email or username
    const user = await UserModel.findOne({
      $or: [
        { email: data.emailOrUsername },
        { username: data.emailOrUsername },
      ],
    }).select("+password");

    if (!user) {
      throw new AppError(401, "Invalid credentials");
    }

    const ok = await bcrypt.compare(data.password, user.password);
    if (!ok) {
      throw new AppError(401, "Invalid credentials");
    }

    const token = signJwt({
      sub: String((user as any)._id),
      role: user.role,
    } as any);

    return { token, user: this.publicUser(user) };
  }

  async me(userId: string) {
    const userDoc = await UserModel.findById(userId).lean<IUser>();
    if (!userDoc) {
      throw new AppError(404, "User not found");
    }
    return this.publicUser(userDoc);
  }

  // 👇 Be lenient here to avoid type headaches around _id
  publicUser(u: any) {
    return {
      id: String(u._id),
      email: u.email,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  }
}

export const authService = new AuthService();

