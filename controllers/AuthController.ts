import {
  Controller,
  Post,
  Body,
  Route,
  Tags,
  SuccessResponse,
  Res,
  type TsoaResponse,
} from "tsoa";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { AuthService } from "../services/AuthServices";

interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string };
}

@Route("auth")
@Tags("Authentication")
export class AuthController extends Controller {
  private authService = new AuthService();

  @Post("signup")
  @SuccessResponse("201", "Created")
  public async signup(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      phone: string;
    },
  ): Promise<AuthResponse> {
    const hashedPassword = await this.authService.hashPassword(body.password);

    const [newUser] = await db
      .insert(users)
      .values({
        name: body.name,
        phone: body.phone,
        email: body.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(body.name)}&background=random`,
        password: hashedPassword,
      })
      .returning();
    if (!newUser) throw Error("Unknown server error!");
    const token = await this.authService.generateToken(newUser.id);
    return {
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
    };
  }

  @Post("login")
  public async login(
    @Body() body: { email: string; password: string },
    @Res() notFound: TsoaResponse<401, { message: string }>,
  ): Promise<AuthResponse> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email));

    if (
      !user ||
      !(await this.authService.validatePassword(body.password, user.password))
    ) {
      return notFound(401, { message: "Invalid email or password" });
    }

    const token = await this.authService.generateToken(user.id);
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }
}
