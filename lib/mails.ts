import nodemailer from "nodemailer"
import { requireEnv } from "./utils"

const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 465,
	secure: true,
	auth: {
		user: requireEnv("EMAIL_CLIENT_ID"),
		pass: requireEnv("EMAIL_CLIENT_SECRET"),
	}
})

export async function sendOtpEmail(email: string, code: string)
{
	await transporter.sendMail({
		from: `"WikiGame" <>`,
		to: email,
		subject: "Verification code",
		html: `
			<h2>Verify your identity</h2>
			<p>Your security code is:</p>
			<h1>${code}</h1>
			<p>Code will expire in 15 minutes</p>
		`,
	})
}