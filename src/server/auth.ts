import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { compare, hash } from "bcryptjs";
import { ApiRouteError } from "./responses";
import { prisma } from "./prisma";

const COOKIE_NAME = "pawpals_token";
const encoder = new TextEncoder();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET ?? "dev-only-secret-change-me-at-least-32-characters";
  return encoder.encode(secret);
}

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  name: string;
};

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export async function signAuthToken(user: AuthUser) {
  return new SignJWT({
    email: user.email,
    username: user.username,
    name: user.name
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  if (!payload.sub) {
    throw new ApiRouteError(401, "UNAUTHORIZED", "Invalid auth token");
  }

  return {
    id: payload.sub,
    email: String(payload.email ?? ""),
    username: String(payload.username ?? ""),
    name: String(payload.name ?? "")
  };
}

export function getTokenFromRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }

  return request.cookies.get(COOKIE_NAME)?.value;
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const token = getTokenFromRequest(request);
  if (!token) {
    throw new ApiRouteError(401, "UNAUTHORIZED", "Authentication is required");
  }

  const payload = await verifyAuthToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, username: true, name: true }
  });

  if (!user) {
    throw new ApiRouteError(401, "UNAUTHORIZED", "User no longer exists");
  }

  return user;
}

export function setAuthCookie(response: Response, token: string) {
  response.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
  );
}

export function clearAuthCookie() {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}
