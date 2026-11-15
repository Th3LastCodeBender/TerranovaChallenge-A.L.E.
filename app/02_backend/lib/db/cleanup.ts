import "server-only"

import { deleteExpiredSessions } from "@/query/sessions"
import { deleteExpiredChallenges } from "@/query/mfa"

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000

async function cleanupExpired()
{
	try
	{
		const [sessions, challenges] = await Promise.all([
			deleteExpiredSessions(),
			deleteExpiredChallenges()
		])

		if (sessions.count > 0 || challenges.count > 0)
			console.log(`Cleanup: ${sessions.count} sessions, ${challenges.count} MFA challenges deleted`)
	}
	catch (error)
	{
		console.error("Cleanup failed:", error)
	}
}

export function startCleanupJob()
{
	void	cleanupExpired()
	setInterval(cleanupExpired, CLEANUP_INTERVAL_MS)
}