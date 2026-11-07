import "server-only"

import { prisma } from "@/lib/db/db-pool"
import { jsonError } from "@/lib/utils"

export function findUserById(id: number)
{
	return prisma.wG_User.findUnique({
		where: { id: id },
		omit: { passwordHash: true },
	})
}

export function findUserForLogin(email: string)
{
	return prisma.wG_User.findUnique({
		where: { email },
	})
}

export type NewUser = {
	username: string
	email: string
	passwordHash: string
	firstName: string
	lastName: string
}

export function createUser(data: NewUser)
{
	return prisma.wG_User.create({
		data,
		omit: { passwordHash: true }
	})
}

export function deleteUser(id: number)
{
	return prisma.wG_User.delete({
		where: { id }
	})
}