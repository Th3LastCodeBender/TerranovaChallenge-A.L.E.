import "dotenv/config";
import { defineConfig } from "prisma/config";

function databaseUrl(): string | undefined
{
	const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env
	
	if ( !DB_USER || !DB_PASSWORD || !DB_HOST || !DB_PORT || !DB_NAME )
		return undefined

	return `postgresql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`
} 

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl(),
  },
});