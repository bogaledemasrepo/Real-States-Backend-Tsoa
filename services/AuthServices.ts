import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_code";

export class AuthService {
  public async generateToken(userId: string) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1d" });
  }

  public async validatePassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  }

  public async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }
}
