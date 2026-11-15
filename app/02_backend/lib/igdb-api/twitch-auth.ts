import "server-only"

import "dotenv/config"
import { requireEnv } from "../utils"

interface TwitchTokenResponse {
	access_token: string
	expires_in: number
	token_type: string
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getTwitchAccessToken(): Promise<string>
{
	if (cachedToken && Date.now() < tokenExpiresAt)
		return cachedToken;

	const response = await fetch(
		"https://id.twitch.tv/oauth2/token",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
				body: new URLSearchParams({
				client_id: requireEnv("TWITCH_CLIENT_ID"),
				client_secret: requireEnv("TWITCH_CLIENT_SECRET"),
				grant_type: "client_credentials"
			}),
		}
	);

	if (!response.ok)
		throw new Error("Unable to authenticate with Twitch");

	const data = await response.json() as TwitchTokenResponse;

	cachedToken = data.access_token;

	tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

	return cachedToken;
}
