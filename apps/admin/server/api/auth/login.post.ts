import { loginSchema } from "@selftaught/core";
import { userService } from "@selftaught/core/server";

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse);

  const user = await userService.verifyCredentials(body.email, body.password);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Invalid email or password" });
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName
    }
  });

  return { id: user.id, email: user.email, displayName: user.displayName };
});
