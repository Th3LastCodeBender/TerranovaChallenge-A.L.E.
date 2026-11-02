libri
id | titolo		|	edizione	|	editore		| anno
1  | Good Omens	|	prima		|	giorgio&co	| 2026	
2  | Good Omens	|	prima		|	giorgio&co	| 2026	
3  | Mort
4  | Coraline

autori
id | nome      | altre info che non ho voglia di invetarmi
1  | Pratchett
2  | Gaiman

libri_autori
id | id_libro | id autore | altre informazioni utili
1  | 1 | 1
2  | 1 | 2
3  | 2 | 1
4  | 3 | 2

prestiti
utente_nome | utente_email      | libro_titolo | autore_nome | data
Mario       | mario@mail.it     | Mort         | Pratchett   | 2026-01-10
Mario       | mario@mail.it     | Good Omens   | Pratchett   | 2026-02-03
Giulia      | giulia@mail.it    | Mort         | Pratchett   | 2026-03-15
Mario       | mario@mail.it     | Coraline     | Gaiman      | 2026-04-01

libri
id | titolo | AINVI (altre info che non ho voglia di invetarmi)
1  | Good Omens
2  | Mort
3  | Coraline
4  | Come farsi il bidet

copie
id	|	libro	|	scaffale
1	|	1		|	2A
2	|	4		|	2B
3	|	3		|	4H
4	|	2		|	Golden

autori
id	|	nome		|	AINVI	
1	|	Pratchett	|
2	|	Gaiman		|
3	|	Magico		|

autore_libri
id |	id_libro	|	id autore	|	AINVI
1  |	1			|	1
2  |	1			|	2
3  |	2			|	1
4  |	3			|	2

utenti
id	|	Nome		| AINVI
1	|	Giorgio		|	
2	|	Marco		|
3	|	Papa'		|
4	|	Gay(Andre)	|
5	|	Magico		|

prestiti
id	|	utente_id	|	copia	|	data_inizio	| data_fine
1	|	1			|	4		|	10-10-2026	|	NULL
2	|	4			|	2		|	09-09-2026	|	10-10-2026
3	|				|			|				|
4	|				|			|				|

formati
id	|	formato
1	|	flessibile
2	|	audiolibro
3	|	rigido
4	|	rilegato

libri
id	|	titolo				|	edizione	|	editore			|	anno_di_pubblicazione	|	isbn_13			|	lingua	|	formato
3	|	Polveri esplosive	|	prima		|	self published	|	2026					|	9788804123456	|	it		|	1

stato_enum
accettazione, smistamento, disponibile, riparazione, smarrito
bri	
copie
id	|	libro	|	scaffale	|	stato
3	|	3		|	2A			|	accettazione
6	|	3		|	1D			|	accettazione
7	|	3		|	NULL		|	smarrito
8	|	3		|	2A			|	smarrito
12	|	3		|	3C			|	riparazione

autori
alias	|	nome	|	cognome	|	nazionalità	|	lingua	|	data_nascita	|	id

stato_utenti_enum
in_attesa, attivo, bloccato, anonimizzato

utenti
id	|	nome	|	cognome	|	email	|	telefono	|	data_nascita	|	numero_tessera	|	data_iscrizione	|	stato
1	|	NULL	|	NULL	|	NULL	|	NULL		|	NULL			|	NULL			|	2026-11-01		|	anonimizzato

autore_libri
id	|	id_libro	|	id_autore

prestiti
id	|	utente_id	|	copia_id	|	data_inizio			|	data_fine	|	multa
1	|	1			|	3			|	2026-11-01 17:45	|	NULL		|	NULL
