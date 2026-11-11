import { jsonError } from "@/lib/utils"
import { NextResponse } from "next/server"	
import { getPcSpecs } from "@/query/pcSpecs"
import { withAuth } from "@/lib/auth/authWrapper"

export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const specs = await getPcSpecs(session.userId)

		return NextResponse.json({specs: specs})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})