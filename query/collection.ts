import "server-only"

import { prisma } from "@/lib/db/db-pool"
import type { WG_GameStatus } from "@/lib/generated/prisma/client"

export function setGameStatus(userId: number, gameId: number, status: WG_GameStatus)
{
	return prisma.wG_GameUser.upsert({
		where: { userId_gameId: { userId, gameId } },
		create: { userId, gameId, status },
		update: { status },
	})
}

export function removeFromCollection(userId: number, gameId: number)
{
	return prisma.wG_GameUser.deleteMany({ where: { userId, gameId } })
}

// Restituisce l'intera collezione del giocatore se non viene passato lo status richiesto
// altrimenti restituisce solo le righe dei giochi che possiedono lo status richiesto
// listCollection(3)              -> tutta la collezione
// listCollection(3, "PLAYING")   -> solo quelli in corso
export function listCollection(userId: number, status?: WG_GameStatus)
{
	return prisma.wG_GameUser.findMany({
		where: { userId, status },
		orderBy: { updatedAt: "desc" },
	})
}
