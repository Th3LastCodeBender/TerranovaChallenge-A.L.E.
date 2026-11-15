import "server-only"

import { isIP } from "net"

export function getClientIp(req: Request): string
{
	const ip = req.headers.get("x-real-ip")?.trim()

	if (ip && isIP(ip))
		return ip
	return "0.0.0.0"
}