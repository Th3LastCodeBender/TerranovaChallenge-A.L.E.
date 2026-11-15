import "server-only"

// Unico punto in cui si legge l'IP del client (rate limit e sessioni).
// ATTENZIONE: il primo valore di X-Forwarded-For lo sceglie il client, quindi è falsificabile.
// Il fix (leggere X-Real-IP scritto da nginx e validarlo con isIP) va fatto qui, una volta sola.
export function getClientIp(req: Request): string
{
	return req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
}
