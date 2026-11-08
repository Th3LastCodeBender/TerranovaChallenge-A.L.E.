import { jsonError } from "@/lib/utils";
import { NextResponse } from "next/server";

export const POST = withAuth(async (req, { session }) =>
{
	try
	{

	}
	catch (error)
	{
		console.error(error)
		return jsonError("Server error", 500)
	}
})