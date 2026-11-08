import "server-only"

import crypto from "crypto";
import { requireEnv } from "@/lib/utils";
import { NextResponse } from "next/server";
import { prisma }		from "@/lib/db/db-pool";
import type { Prisma }	from "@/lib/generated/prisma/client";

export const SESSION_COOKIE_NAME = "valid-login-session"
export const SESSION_COOKIE_DURATION_SECONDS = 60 * 60 * 24 * 30

export type NewSession = {
	userId: number
	tokenHash: string
	ip: string
	device: Prisma.InputJsonValue
	expiresAt: Date
}

export function setLoginCookie(res: NextResponse, token: string)
{
	res.cookies.set(
		SESSION_COOKIE_NAME,
		token,
		{
			httpOnly: true,
			secure: requireEnv("NODE_ENV") === "production",
			sameSite: "lax",
			path: "/",
			maxAge: SESSION_COOKIE_DURATION_SECONDS
		}
	)
}

export function generateSessionToken()
{
	return crypto.randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string)
{
	return crypto.createHash("sha256").update(token).digest("hex");
}

export function createSession(data: NewSession)
{
	return prisma.wG_Session.create({ data })
}

export function findValidSession(tokenHash: string)
{
	return prisma.wG_Session.findUnique({
		where: { tokenHash, expiresAt: { gt:new Date() } },
		include: { user: { omit: { passwordHash: true } } },
	})
}

export function deleteSession(tokenHash: string)
{
	return prisma.wG_Session.delete({ where: { tokenHash } })
}

// export function deleteExpiredSessions()
// {
// 	return prisma.wG_Session.deleteMany({ where: { expiresAt: { lte: new Date() } } })
// }