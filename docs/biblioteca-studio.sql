--
-- PostgreSQL database dump
--

\restrict N2Wui8oHJnmKcwKuPidRx8KMTDvTqeXK74FaFyMD95gkzvkMPpZJclXWMoXRnJ1

-- Dumped from database version 17.11 (Debian 17.11-1.pgdg13+2)
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: stato_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stato_enum AS ENUM (
    'accettazione',
    'smistamento',
    'disponibile',
    'riparazione',
    'smarrito'
);


--
-- Name: stato_utenti_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stato_utenti_enum AS ENUM (
    'in_attesa',
    'attivo',
    'bloccato',
    'anonimizzato'
);


--
-- Name: tipo_formato; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_formato AS ENUM (
    'tascabile',
    'flessibile',
    'rilegato',
    'audiolibro',
    'rigido'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: autore_libri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.autore_libri (
    id integer NOT NULL,
    id_libro integer NOT NULL,
    id_autore integer NOT NULL
);


--
-- Name: autore_libri_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.autore_libri ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.autore_libri_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: autori; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.autori (
    alias text,
    nome text,
    cognome text,
    "nazionalità" text,
    lingua text,
    data_nascita text,
    id integer NOT NULL,
    CONSTRAINT at_least_a_name_checker CHECK (((alias IS NOT NULL) OR (nome IS NOT NULL) OR (cognome IS NOT NULL)))
);


--
-- Name: autori_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.autori ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.autori_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: copie; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.copie (
    id integer NOT NULL,
    libro integer NOT NULL,
    scaffale text,
    stato public.stato_enum DEFAULT 'accettazione'::public.stato_enum NOT NULL,
    CONSTRAINT scaffale CHECK ((scaffale ~ '^[0-9]{1}[A-Z]{1}$'::text)),
    CONSTRAINT scaffale_stato_checker CHECK (((stato <> ALL (ARRAY['disponibile'::public.stato_enum, 'riparazione'::public.stato_enum])) OR (scaffale IS NOT NULL)))
);


--
-- Name: copie_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.copie ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.copie_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: formati; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.formati (
    id integer NOT NULL,
    formato text NOT NULL
);


--
-- Name: formati_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.formati ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.formati_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: libri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.libri (
    id integer NOT NULL,
    titolo text NOT NULL,
    edizione text,
    editore text,
    anno_di_pubblicazione smallint,
    isbn_13 character varying(13),
    lingua text NOT NULL,
    formato integer NOT NULL,
    CONSTRAINT data_checker CHECK (((anno_di_pubblicazione)::numeric <= EXTRACT(year FROM CURRENT_DATE))),
    CONSTRAINT isbn_checker CHECK (((isbn_13)::text ~ '^[0-9]{13}$'::text)),
    CONSTRAINT lingua_checker CHECK ((lingua = ANY (ARRAY['it'::text, 'en'::text, 'de'::text, 'es'::text, 'la'::text, 'pl'::text])))
);


--
-- Name: libri_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.libri ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.libri_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: prestiti; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prestiti (
    id integer NOT NULL,
    utente_id integer NOT NULL,
    copia_id integer NOT NULL,
    data_inizio timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_fine timestamp with time zone,
    multa numeric(5,2),
    CONSTRAINT date_checker CHECK ((data_fine > data_inizio)),
    CONSTRAINT multa_checker CHECK ((multa >= (0)::numeric))
);


--
-- Name: prestiti_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.prestiti ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.prestiti_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: utenti; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utenti (
    id integer NOT NULL,
    nome text,
    cognome text,
    email text,
    telefono text,
    data_nascita date,
    numero_tessera integer,
    data_iscrizione date DEFAULT CURRENT_DATE,
    stato public.stato_utenti_enum DEFAULT 'in_attesa'::public.stato_utenti_enum NOT NULL,
    CONSTRAINT null_solo_se_anonimo CHECK (((stato = 'anonimizzato'::public.stato_utenti_enum) OR ((nome IS NOT NULL) AND (cognome IS NOT NULL) AND (email IS NOT NULL) AND (telefono IS NOT NULL) AND (data_nascita IS NOT NULL) AND (numero_tessera IS NOT NULL) AND (data_iscrizione IS NOT NULL))))
);


--
-- Name: utenti_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.utenti ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.utenti_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: autore_libri; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.autore_libri (id, id_libro, id_autore) FROM stdin;
1	5	2
2	5	1
3	6	1
4	7	1
5	8	2
6	9	3
7	10	3
8	11	3
\.


--
-- Data for Name: autori; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.autori (alias, nome, cognome, "nazionalità", lingua, data_nascita, id) FROM stdin;
Taty	Terry	Pratchett	en	en	1948-04-28	1
Nello	Neil	Gaiman	en	en	1960-11-10	2
\N	Italo	Calvino	it	it	1923-10-15	3
\.


--
-- Data for Name: copie; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.copie (id, libro, scaffale, stato) FROM stdin;
3	3	2A	accettazione
6	3	1D	accettazione
7	3	\N	smarrito
8	3	2A	smarrito
12	3	3C	riparazione
13	5	2A	disponibile
14	6	1A	disponibile
15	7	1A	disponibile
16	8	1A	disponibile
17	9	1A	disponibile
18	10	1A	disponibile
19	11	1A	disponibile
\.


--
-- Data for Name: formati; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.formati (id, formato) FROM stdin;
1	flessibile
2	audiolibro
3	rigido
4	rilegato
\.


--
-- Data for Name: libri; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.libri (id, titolo, edizione, editore, anno_di_pubblicazione, isbn_13, lingua, formato) FROM stdin;
3	Polveri esplosive	prima	self published	2026	9788804123456	it	1
5	Good Omens	prima	bruno	2026	1234567890123	it	1
6	Mort	prima	Gollancz	1987	\N	en	1
7	Guards! Guards!	prima	Gollancz	1989	\N	en	3
8	Coraline	prima	Bloomsbury	2002	\N	en	1
9	Il barone rampante	prima	Einaudi	1957	\N	it	1
10	Le città invisibili	prima	Einaudi	1972	\N	it	3
11	Se una notte d'inverno un viaggiatore	prima	Einaudi	1979	\N	it	1
12	Pinocchio	prima	geppetto	1998	1231231231231	it	3
\.


--
-- Data for Name: prestiti; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.prestiti (id, utente_id, copia_id, data_inizio, data_fine, multa) FROM stdin;
1	1	3	2026-11-01 17:45:25.683837+00	\N	\N
4	5	14	2026-10-20 00:00:00+00	\N	\N
5	4	14	2026-02-15 00:00:00+00	2026-03-01 00:00:00+00	\N
6	3	14	2026-01-10 00:00:00+00	2026-02-01 00:00:00+00	\N
7	3	15	2026-04-02 00:00:00+00	2026-04-20 00:00:00+00	\N
8	3	16	2026-03-05 00:00:00+00	2026-03-25 00:00:00+00	\N
9	4	17	2026-05-10 00:00:00+00	2026-06-01 00:00:00+00	\N
\.


--
-- Data for Name: utenti; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utenti (id, nome, cognome, email, telefono, data_nascita, numero_tessera, data_iscrizione, stato) FROM stdin;
1	\N	\N	\N	\N	\N	\N	2026-11-01	anonimizzato
3	Mario	Rossi	mario@mail.it	3331112222	1990-05-01	1001	2026-11-01	attivo
4	Giulia	Bianchi	giulia@mail.it	3334445555	1985-09-12	1002	2026-11-01	attivo
5	Luca	Verdi	luca@mail.it	3337778888	2001-02-20	1003	2026-11-01	bloccato
\.


--
-- Name: autore_libri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.autore_libri_id_seq', 8, true);


--
-- Name: autori_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.autori_id_seq', 3, true);


--
-- Name: copie_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.copie_id_seq', 19, true);


--
-- Name: formati_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.formati_id_seq', 5, true);


--
-- Name: libri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.libri_id_seq', 12, true);


--
-- Name: prestiti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.prestiti_id_seq', 11, true);


--
-- Name: utenti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.utenti_id_seq', 5, true);


--
-- Name: autore_libri autore_libri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.autore_libri
    ADD CONSTRAINT autore_libri_pkey PRIMARY KEY (id);


--
-- Name: autori autori_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.autori
    ADD CONSTRAINT autori_pkey PRIMARY KEY (id);


--
-- Name: copie copie_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.copie
    ADD CONSTRAINT copie_pkey PRIMARY KEY (id);


--
-- Name: formati formati_formato_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formati
    ADD CONSTRAINT formati_formato_key UNIQUE (formato);


--
-- Name: formati formati_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formati
    ADD CONSTRAINT formati_pkey PRIMARY KEY (id);


--
-- Name: libri isbn_unico; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.libri
    ADD CONSTRAINT isbn_unico UNIQUE (isbn_13);


--
-- Name: libri libri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.libri
    ADD CONSTRAINT libri_pkey PRIMARY KEY (id);


--
-- Name: libri no_duplicati; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.libri
    ADD CONSTRAINT no_duplicati UNIQUE NULLS NOT DISTINCT (titolo, edizione, editore, anno_di_pubblicazione, lingua, formato);


--
-- Name: prestiti prestiti_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prestiti
    ADD CONSTRAINT prestiti_pkey PRIMARY KEY (id);


--
-- Name: autore_libri unicità_autori_libri; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.autore_libri
    ADD CONSTRAINT "unicità_autori_libri" UNIQUE (id_autore, id_libro);


--
-- Name: utenti unique_tessera; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti
    ADD CONSTRAINT unique_tessera UNIQUE (numero_tessera);


--
-- Name: utenti utenti_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti
    ADD CONSTRAINT utenti_pkey PRIMARY KEY (id);


--
-- Name: una_copia_un_prestito_aperto; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX una_copia_un_prestito_aperto ON public.prestiti USING btree (copia_id) WHERE (data_fine IS NULL);


--
-- Name: autore_libri autore_libri_id_autore_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.autore_libri
    ADD CONSTRAINT autore_libri_id_autore_fkey FOREIGN KEY (id_autore) REFERENCES public.autori(id) ON DELETE CASCADE;


--
-- Name: autore_libri autore_libri_id_libro_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.autore_libri
    ADD CONSTRAINT autore_libri_id_libro_fkey FOREIGN KEY (id_libro) REFERENCES public.libri(id) ON DELETE CASCADE;


--
-- Name: copie copie_libro_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.copie
    ADD CONSTRAINT copie_libro_fkey FOREIGN KEY (libro) REFERENCES public.libri(id) ON DELETE RESTRICT;


--
-- Name: libri libri_formato_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.libri
    ADD CONSTRAINT libri_formato_fkey FOREIGN KEY (formato) REFERENCES public.formati(id);


--
-- Name: prestiti prestiti_copia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prestiti
    ADD CONSTRAINT prestiti_copia_id_fkey FOREIGN KEY (copia_id) REFERENCES public.copie(id) ON DELETE RESTRICT;


--
-- Name: prestiti prestiti_utente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prestiti
    ADD CONSTRAINT prestiti_utente_id_fkey FOREIGN KEY (utente_id) REFERENCES public.utenti(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict N2Wui8oHJnmKcwKuPidRx8KMTDvTqeXK74FaFyMD95gkzvkMPpZJclXWMoXRnJ1

