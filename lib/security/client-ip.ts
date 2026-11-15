import "server-only"

import { isIP } from "net"

// X-Real-IP lo scrive nginx con $remote_addr: il client non può sceglierlo.
export function getClientIp(req: Request): string
{
	const ip = req.headers.get("x-real-ip")?.trim()

	if (ip && isIP(ip))
		return ip
	return "0.0.0.0"
}