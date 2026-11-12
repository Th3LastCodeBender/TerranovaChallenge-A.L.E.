import "server-only"

import type { Prisma, WG_Mfa, WG_MfaChallenge } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/db/db-pool"
import { BatchPayload } from "@/lib/generated/prisma/internal/prismaNamespace"
import { randomInt, timingSafeEqual, createHmac } from "crypto"
import { requireEnv } from "@/lib/utils"

export const MFA_COOKIE_NAME = "2fa_cookie"
export const MFA_COOKIE_DURATION_SECONDS = 60 * 15
export const MFA_MAX_ATTEMPTS = 5

export type	NewMfaChallenge = {
	userId: number
	tokenHash: string
	codeHash: string
	sentTo: string
}

export function findMfaByUserId(userId: number): Promise<WG_Mfa | null>
{
	return prisma.wG_Mfa.findUnique({ where: { userId } })
}

export function enableMfa(userId: number): Promise<WG_Mfa>
{
	return prisma.wG_Mfa.upsert({
		where: { userId },
		create: { userId },
		update: {},
	})
}

export function disableMfa(userId: number): Promise<[Prisma.BatchPayload, Prisma.BatchPayload]>
{
	return prisma.$transaction([
		prisma.wG_MfaChallenge.deleteMany({ where: { userId } }),
		prisma.wG_Mfa.deleteMany({ where: { userId } }),
	])
}

export async function createMfaChallenge(data: NewMfaChallenge): Promise<WG_MfaChallenge>
{
	const expiresAt = new Date(Date.now() + MFA_COOKIE_DURATION_SECONDS)

	const	[, challenge] = await prisma.$transaction([
		prisma.wG_MfaChallenge.deleteMany({ where: { userId: data.userId }}),
		prisma.wG_MfaChallenge.create({ data: {...data, expiresAt } }),
	])

	return challenge
}

export function findValidChallenge(tokenHash: string, maxAttempts: number): Promise<WG_MfaChallenge | null>
{
	return prisma.wG_MfaChallenge.findUnique({
		where: { 
			tokenHash,
			lastUsedAt: null,
			expiresAt: { gt: new Date },
			attempts: { lt: maxAttempts },
		 }
	})
}

export async function addFailedAttempt(id: number, maxAttempts: number): Promise<boolean>
{
	const result = await prisma.wG_MfaChallenge.updateMany({
		where: {
			id,
			lastUsedAt: null,
			attempts: { lt: maxAttempts },
		},
		data: { attempts: { increment: 1 } },
	})

	return result.count === 1
}

export function consumeChallenge(id: number, userId: number, maxAttempts: number): Promise<boolean>
{
	return prisma.$transaction(async (tx) => {
		const now = new Date()

		const result = await tx.wG_MfaChallenge.updateMany({
			where: {
				id,
				userId,
				lastUsedAt: null,
				expiresAt: { gt: now },
				attempts: { lt: maxAttempts },
			},
			data: { lastUsedAt: now },
		})

		if (result.count !== 1)
			return false

		await tx.wG_Mfa.updateMany({
			where: { userId },
			data: { lastUsedAt: now },
		})

		return true
	})
}

export function deleteExpiredChallenges(): Promise<Prisma.BatchPayload>
{
	return prisma.wG_MfaChallenge.deleteMany({ where: { expiresAt: { lte: new Date() } } })
}

export function generateOTP()
{
	return randomInt(100000, 1000000).toString() 
}

export function hashOTP(otp: string)
{
	return createHmac('sha256', requireEnv("OTP_PEPPER")).update(otp).digest('hex')
}

export function hashCmp(left: string, right: string)
{
	const leftBuffer = Buffer.from(left, "hex")
	const rightBuffer = Buffer.from(right, "hex")

	return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}