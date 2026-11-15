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

// Senza page restituisce tutti i preferiti, con page solo la porzione che chiedi
// listFavourites(3)							 => tutti
// listFavourites(3, { limit: 20, offset: 40 }) => dal 41 al 60
export function listFavourites(userId: number, page?: { limit: number, offset: number })
{
	return prisma.wG_Favourite.findMany({
		where: { userId },
		orderBy: [{ createdAt: "desc" }, { gameId: "desc" }],
		take: page?.limit,
		skip: page?.offset
	})
}

export function countFavourites(userId: number)
{
	return prisma.wG_Favourite.count({ where: { userId } })
}

export async function isFavourite(userId: number, gameId: number)
{
	const row = await prisma.wG_Favourite.findUnique({
		where: { userId_gameId: { userId, gameId } },
	})
	return row !== null
}