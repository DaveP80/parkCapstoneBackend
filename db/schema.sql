--
-- PostgreSQL database dump
--
SET client_encoding = 'UTF8';

--
-- Name: insert_auth_user(); Type: FUNCTION; Schema: public; Owner: cars_dx8r_user
--

CREATE FUNCTION public.insert_auth_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO auth_users (user_id, user_email, is_auth)
    VALUES (NEW.id, NEW.email, false);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.insert_auth_user() OWNER TO cars_dx8r_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auth_users; Type: TABLE; Schema: public; Owner: cars_dx8r_user
--

CREATE TABLE public.auth_users (
    user_id integer NOT NULL,
    user_email text NOT NULL,
    renter_email text,
    is_auth boolean DEFAULT false NOT NULL,
    is_renter boolean DEFAULT false NOT NULL,
    payment_verif boolean DEFAULT false NOT NULL
);


ALTER TABLE public.auth_users OWNER TO cars_dx8r_user;

--
-- Name: client_user; Type: TABLE; Schema: public; Owner: cars_dx8r_user
--

CREATE TABLE public.client_user (
    id integer NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    address text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    pmt_verified boolean DEFAULT false NOT NULL,
    is_auth boolean DEFAULT false NOT NULL,
    client_background_verified boolean DEFAULT false NOT NULL,
    CONSTRAINT client_user_address_check CHECK ((length(address) > 8)),
    CONSTRAINT client_user_email_check CHECK ((length(email) > 5)),
    CONSTRAINT client_user_first_name_check CHECK ((length(first_name) > 1)),
    CONSTRAINT client_user_last_name_check CHECK ((length(last_name) > 2))
);


ALTER TABLE public.client_user OWNER TO cars_dx8r_user;

--
-- Name: client_user_id_seq; Type: SEQUENCE; Schema: public; Owner: cars_dx8r_user
--

CREATE SEQUENCE public.client_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.client_user_id_seq OWNER TO cars_dx8r_user;

--
-- Name: client_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cars_dx8r_user
--

ALTER SEQUENCE public.client_user_id_seq OWNED BY public.client_user.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: cars_dx8r_user
--

CREATE TABLE public.refresh_tokens (
    client_id integer NOT NULL,
    token text
);


ALTER TABLE public.refresh_tokens OWNER TO cars_dx8r_user;

--
-- Name: renter_user; Type: TABLE; Schema: public; Owner: cars_dx8r_user
--

CREATE TABLE public.renter_user (
    renter_id integer,
    first_name text,
    last_name text,
    renter_address text NOT NULL,
    renter_email text NOT NULL,
    background_verified boolean DEFAULT false NOT NULL,
    r_pmt_verified boolean DEFAULT false NOT NULL,
    CONSTRAINT renter_user_address_check CHECK ((length(renter_address) > 8)),
    CONSTRAINT renter_user_email_check CHECK ((length(renter_email) > 5))
);


ALTER TABLE public.renter_user OWNER TO cars_dx8r_user;

--
-- Name: client_user id; Type: DEFAULT; Schema: public; Owner: cars_dx8r_user
--

ALTER TABLE ONLY public.client_user ALTER COLUMN id SET DEFAULT nextval('public.client_user_id_seq'::regclass);


--
-- Name: auth_users auth_users_user_email_key; Type: CONSTRAINT; Schema: public; Owner: cars_dx8r_user
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_user_email_key UNIQUE (user_email);


--
-- Name: auth_users auth_users_user_id_key; Type: CONSTRAINT; Schema: public; Owner: cars_dx8r_user
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_user_id_key UNIQUE (user_id);


--
-- Name: client_user client_user_email_key; Type: CONSTRAINT; Schema: public; Owner: cars_dx8r_user
--

ALTER TABLE ONLY public.client_user
    ADD CONSTRAINT client_user_email_key UNIQUE (email);


--
-- Name: client_user client_user_pkey; Type: CONSTRAINT; Schema: public; Owner: cars_dx8r_user
--

ALTER TABLE ONLY public.client_user
    ADD CONSTRAINT client_user_pkey PRIMARY KEY (id, first_name, last_name);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: cars_dx8r_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: renter_user renter_user_address_key; Type: CONSTRAINT; Schema: public; Owner: cars_dx8r_user
--

ALTER TABLE ONLY public.renter_user
    ADD CONSTRAINT renter_user_address_key UNIQUE (renter_address);


--
-- Name: renter_user renter_user_email_key; Type: CONSTRAINT; Schema: public; Owner: cars_dx8r_user
--

ALTER TABLE ONLY public.renter_user
    ADD CONSTRAINT renter_user_email_key UNIQUE (renter_email);


--
-- Name: client_user unique_client_user; Type: CONSTRAINT; Schema: public; Owner: cars_dx8r_user
--

ALTER TABLE ONLY public.client_user
    ADD CONSTRAINT unique_client_user UNIQUE (first_name, last_name, address);


--
-- Name: renter_user unique_renter_user; Type: CONSTRAINT; Schema: public; Owner: cars_dx8r_user
--

ALTER TABLE ONLY public.renter_user
    ADD CONSTRAINT unique_renter_user UNIQUE (first_name, last_name, renter_address);


--
-- Name: client_user users_insert_trigger; Type: TRIGGER; Schema: public; Owner: cars_dx8r_user
--

CREATE TRIGGER users_insert_trigger AFTER INSERT ON public.client_user FOR EACH ROW EXECUTE FUNCTION public.insert_auth_user();


--
-- Name: renter_user renter_user_renter_id_first_name_last_name_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cars_dx8r_user
--

ALTER TABLE ONLY public.renter_user
    ADD CONSTRAINT renter_user_renter_id_first_name_last_name_fkey FOREIGN KEY (renter_id, first_name, last_name) REFERENCES public.client_user(id, first_name, last_name);


--
-- PostgreSQL database dump complete
--

