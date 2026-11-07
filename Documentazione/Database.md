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
