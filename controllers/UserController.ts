import { Controller, Route, Get, Path, Security, Request, Tags } from "tsoa";

import { HttpError } from "../services/HttpError";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

@Tags("User Management")
@Route("users")
export class UsersController extends Controller {
  @Get()
  @Security("jwt")
  public async getUsers() {
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
      })
      .from(users);
  }

  @Get("me")
  @Security("jwt")
  public async getMe(@Request() request: any) {
    const userId = request.user.userId;
    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
      })
      .from(users)
      .where(eq(users.id, userId));
    return user[0];
  }

  @Get("{id}")
  @Security("jwt")
  public async getUser(@Path() id: string): Promise<any> {
    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (user.length === 0) {
      // Professional way to trigger a 404
      throw new HttpError(404, "User not found");
    }
    console.log(user);

    return user[0];
  }
}
