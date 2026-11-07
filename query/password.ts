import "server-only"

import { randomBytes, scrypt, timingSafeEqual }	from "node:crypto"
import { promisify }							from "node:util"

const scryptAsync = promisify(script) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>

const KEY_LENGHT = 64

