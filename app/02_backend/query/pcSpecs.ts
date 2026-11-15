import "server-only"

import { prisma } from "@/lib/db/db-pool"
import { Prisma } from "@/lib/generated/prisma/client"

export type PcSpecs = {
	cpu: string
	gpu: string
	ramGb: number
	vramGb?: number
	os: string
}

export function setPcSpecs(userId: number, specs: PcSpecs)
{
	return prisma.wG_User.update({
		where: { id: userId },
		data: { pcSpecs: specs },
		select: { pcSpecs: true },
	})
}

export async function getPcSpecs(userId: number)
{
	const user = await prisma.wG_User.findUnique({
		where: { id: userId },
		select: { pcSpecs: true },
	})
	return (user?.pcSpecs ?? null) as PcSpecs | null
}

export function clearPcSpecs(userId: number)
{
	return prisma.wG_User.update({
		where: { id: userId },
		data: { pcSpecs: Prisma.DbNull },
	})
}