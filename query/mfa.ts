import "server-only"

import { prisma } from "@/lib/db/db-pool"

export type	NewMfaChallenge = {
	userId: number
	tokenHash: string
	codeHash: string
	sentTo: string
	expiresAt: Date
}

export function findMfaByUserId(userId: number)
{
	return prisma.wG_Mfa.findUnique({ where: { userId } })
}

export function enableMfa(userId: number)
{
	return prisma.wG_Mfa.upsert({
		where: { userId },
		create: { userId },
		update: {},
	})
}

export function disableMfa(userId: number)
{
	return prisma.$transaction([
		prisma.wG_MfaChallenge.deleteMany({ where: { userId } }),
		prisma.wG_Mfa.deleteMany({ where: { userId } }),
	])
}

export async function createMfaChallenge(data: NewMfaChallenge)
{
	const	[, challenge] = await prisma.$transaction([
		prisma.wG_MfaChallenge.deleteMany({ where: { userId: data.userId }}),
		prisma.wG_MfaChallenge.create({ data }),
	])

	return challenge
}