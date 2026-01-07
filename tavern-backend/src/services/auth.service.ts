import bcrypt from "bcrypt";
import { AppError } from "../middleware/error.middleware";
import { UserModel, IUser } from "../models/user.model";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";
import { signJwt } from "../config/jwt.config";
import { npcOrganizationService } from "./npcOrganization.service";

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

    // Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(data.email);

    const user = await UserModel.create({
      email: data.email,
      username: data.username,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      role: data.role || "ADVENTURER",
      // Only NEW NPC/ADVENTURER must create a profile before seeing dashboard.
      // Existing users won't have this field set, so they are not forced through onboarding.
      needsProfileSetup: (data.role || "ADVENTURER") !== "GUILD_MASTER",
      emailVerified: isValidEmail, // Set verified=true if email format is valid
      password: hash,
    });

   
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
    if (!userId) {
      throw new AppError(401, "Unauthenticated");
    }

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
      gold: u.gold || 0, // Include gold in public user data
      needsProfileSetup: Boolean(u.needsProfileSetup),
      emailVerified: Boolean(u.emailVerified),
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  }

  async verifyEmail(userId: string): Promise<void> {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { emailVerified: true } },
      { new: true }
    ).exec();
    
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // If user is NPC, update their organization's verified status and trust score
    if (user.role === 'NPC') {
      try {
        const org = await npcOrganizationService.getMyOrganization(String(user._id));
        if (org) {
          // Update verified status and recalculate trust score
          await npcOrganizationService.getTrustOverview(String(org._id));
        }
      } catch (err) {
        // Organization might not exist yet, that's okay
        console.log('No organization found for user, skipping organization update');
      }
    }
  }
}

export const authService = new AuthService();

