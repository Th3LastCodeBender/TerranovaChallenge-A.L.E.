import "server-only"

import { prisma } from "@/lib/db/db-pool"

export function addFavourite(userId: number, gameId: number)
{
	return prisma.wG_Favourite.upsert({
		where: { userId_gameId: { userId, gameId } },
		create: { userId, gameId },
		update: {},
	})
}

export function removeFavourite(userId: number, gameId: number)
{
	return prisma.wG_Favourite.deleteMany({ where: { userId, gameId } })
}

export function listFavourites(userId: number)
{
	return prisma.wG_Favourite.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
	})
}

export async function isFavourite(userId: number, gameId: number)
{
	const row = await prisma.wG_Favourite.findUnique({
		where: { userId_gameId: { userId, gameId } },
	})
	return row !== null
}