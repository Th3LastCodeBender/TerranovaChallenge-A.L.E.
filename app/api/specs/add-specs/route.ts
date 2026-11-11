import { jsonError } from "@/lib/utils"
import { NextResponse } from "next/server"
import { setPcSpecs } from "@/query/pcSpecs"
import { withAuth } from "@/lib/auth/authWrapper"

export const DELETE = withAuth(async (req, { session }) =>
{
	try
	{
		let body: unknown

		try
		{
			body = await req.json()
		}
		catch (error)
		{
			console.error(error)
			return jsonError("Invalid JSON body", 400)
		}

		setPcSpecs(session.userId, )
		return NextResponse.json({success: true})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})