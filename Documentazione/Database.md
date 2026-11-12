Tabelle:
sessioni, utenti (username, email, password, nome, cognome), preferiti (id utente, gioco), catalogo_utente (finito, da giocare, in corso)

-- Preferiti: l'id IGDB è sempre positivo
ALTER TABLE "wgFavourites" ADD CONSTRAINT "wgFavourites_game_id_check"
  CHECK ("game_id" > 0);

-- Sessioni: una sessione non può scadere prima di essere creata
ALTER TABLE "wgSessions" ADD CONSTRAINT "wgSessions_expires_check"
  CHECK ("expires_at" > "created_at");

ALTER TABLE "wgFavourites" ADD CONSTRAINT "wgFavourites_game_id_check" CHECK ("game_id" > 0);
ALTER TABLE "wgUserGames"  ADD CONSTRAINT "wgUserGames_game_id_check"  CHECK ("game_id" > 0);

Le sessioni scadute vanno cancellate automaticamente dal db

2 Tabelle

WG_2FA
id riga, id utente, createdAt, lastUsed
	costraint = (id riga, id utente) unique

WG_Attempt

CREATE TABLE public.mfa_challenges (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    challenge_token_hash text NOT NULL,
    code_hash text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    sent_to text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    success_at timestamp with time zone
);


Query
export async function findUserBy2FA(email: string)
{
    const query = 
        SELECT m.id_mfa
        FROM mfa m
        INNER JOIN users u
            ON u.id = m.user_id
        WHERE u.email = $1
        LIMIT 1
    

    const result = await pool.query(query, [email])

    return result.rows[0] ?? null
}

export async function enable2FA(email: string, mfaType: string = "email")
{
    const query = 
        INSERT INTO mfa (user_id, mfa_type)
        SELECT
            u.id,
            $2::mfa_type
        FROM users u
        WHERE u.email = $1
        ON CONFLICT (user_id)
        DO UPDATE SET
            mfa_type = EXCLUDED.mfa_type
        RETURNING *
    

    const result = await pool.query(query, [email, mfaType])

    return result.rows[0] ?? null
}

export async function createOtpChallenge(email: string)
{
    const otp = randomInt(100000, 1000000).toString()
    const challengeToken = randomBytes(32).toString("base64url")

    console.log(otp) //DEBUG
    const query = 
        WITH target_user AS (
            SELECT
                u.id,
                u.email,
                m.mfa_type
            FROM users u
            JOIN mfa m ON m.user_id = u.id
            WHERE u.email = $1
        ),
        invalidate_old_challenges AS (
            UPDATE mfa_challenges
            SET time_of_success = NOW()
            WHERE user_id = (SELECT id FROM target_user)
                AND time_of_success IS NULL
        )
        INSERT INTO mfa_challenges (user_id, challenge_token, code, time_of_expiration, sent_to)
        SELECT
            id,
            $2,
            $3,
            NOW() + ($4::text || ' minutes')::interval,
            email
        FROM target_user
        RETURNING id
    

    const result = await pool.query(query, [email, hashValue(challengeToken), hashValue(otp), OTP_EXP_MIN])

    if (!result.rows[0])
        return null

    return { otp, challengeToken, expiresInSeconds: OTP_EXP_MIN * 60 }
}

export async function find2FaChallengeByToken(challengeToken: string)
{
    const query = 
        SELECT mc.id, mc.sent_to
        FROM mfa_challenges mc
        WHERE mc.challenge_token = $1
            AND mc.time_of_success IS NULL
            AND mc.time_of_expiration > NOW()
        LIMIT 1
    

    const result = await pool.query(query, [hashValue(challengeToken)])

    return result.rows[0] ?? null
}