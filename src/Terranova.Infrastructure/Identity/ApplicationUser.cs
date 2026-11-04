using Microsoft.AspNetCore.Identity;

namespace Terranova.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
// Qui non ci si pialla nulla dato che non aggiungamo colonne rispetto a quelle gia presenti in identity
//
// Fornite dall'utente:
//   UserName              varchar(256)   nome utente
//   Email                 varchar(256)   email
//
// Gestite da Identity:
//   Id                    text           chiave primaria, referenziata da Favourites
//   NormalizedUserName    varchar(256)   nome in maiuscolo per le ricerche, indice UNIQUE
//   NormalizedEmail       varchar(256)   email in maiuscolo per le ricerche, indice non UNIQUE
//   PasswordHash          text           hash della password, mai il testo in chiaro
//   SecurityStamp         text           cambia con la password, invalida le sessioni vecchie
//   ConcurrencyStamp      text           evita che due salvataggi si sovrascrivano
//   AccessFailedCount     integer        login falliti consecutivi
//   LockoutEnabled        boolean        l'utente può essere bloccato
//   LockoutEnd            timestamptz    fine del blocco
//
// Presenti ma non usate:
//   EmailConfirmed        boolean        email verificata
//   PhoneNumber           text           telefono
//   PhoneNumberConfirmed  boolean        telefono verificato
//   TwoFactorEnabled      boolean        accesso a due fattori
}
