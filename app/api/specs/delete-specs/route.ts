import { jsonError } from "@/lib/utils"
import { NextResponse } from "next/server"
import { clearPcSpecs } from "@/query/pcSpecs"
import { withAuth } from "@/lib/auth/authWrapper"

export const DELETE = withAuth(async (req, { session }) =>
{
	try
	{
		await clearPcSpecs(session.userId)
		return NextResponse.json({success: true})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})