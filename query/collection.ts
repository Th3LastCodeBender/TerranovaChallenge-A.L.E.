import "server-only"

import { prisma } from "@/lib/db/db-pool"
import type { WG_GameStatus } from "@/lib/generated/prisma/client"

//Se la combinazione chiave gioco esiste fa l'update dello status, se non esiste crea la trinità di valori
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
// Con page restituisce solo la porzione richiesta
// listCollection(3)                                         -> tutta la collezione
// listCollection(3, "PLAYING")                              -> solo quelli in corso
// listCollection(3, "PLAYING", { limit: 20, offset: 40 })   -> quelli in corso, dal 41 al 60
// listCollection(3, undefined, { limit: 20, offset: 0 })    -> tutta la collezione, i primi 20
export function listCollection(userId: number, status?: WG_GameStatus, page?: { limit: number, offset: number })
{
	return prisma.wG_GameUser.findMany({
		where: { userId, status },
		orderBy: [{ updatedAt: "desc" }, { gameId: "desc" }],
		take: page?.limit,
		skip: page?.offset,
	})
}

// countCollection(3)             -> quanti giochi in tutta la collezione
// countCollection(3, "TO_BUY")   -> quanti da comprare
export function countCollection(userId: number, status?: WG_GameStatus)
{
	return prisma.wG_GameUser.count({ where: { userId, status } })
}

export function getGameStatus(userId: number, gameId: number) {
	return prisma.wG_GameUser.findFirst({
		where: { userId, gameId },
		select: { status: true },
	})
}
