import "server-only"


import { prisma }		from "@/lib/db/db-pool";
import type { Prisma }	from "@/lib/generated/prisma/client";

export type NewSession = {
	userId: number
	tokenHash: string
	ip: string
	device: Prisma.InputJsonValue
	expiresAt: Date
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