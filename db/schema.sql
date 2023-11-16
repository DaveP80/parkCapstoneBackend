--
-- PostgreSQL database dump
--
-- Dumped from database version 14.10
--
-- Name: cube; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS cube WITH SCHEMA public;


--
-- Name: EXTENSION cube; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION cube IS 'data type for multidimensional cubes';


--
-- Name: earthdistance; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS earthdistance WITH SCHEMA public;


--
-- Name: EXTENSION earthdistance; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION earthdistance IS 'calculate great-circle distances on the surface of the Earth';


--
-- Name: cube; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS cube WITH SCHEMA public;


--
-- Name: EXTENSION cube; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION cube IS 'data type for multidimensional cubes';


--
-- Name: earthdistance; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS earthdistance WITH SCHEMA public;


--
-- Name: EXTENSION earthdistance; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION earthdistance IS 'calculate great-circle distances on the surface of the Earth';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: insert_auth_user(); Type: FUNCTION; Schema: public; Owner: parking_i5nr_user
--

CREATE FUNCTION public.insert_auth_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO auth_users (user_id, user_email, all_is_auth)
    VALUES (NEW.id, NEW.email, false);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.insert_auth_user() OWNER TO parking_i5nr_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auth_users; Type: TABLE; Schema: public; Owner: parking_i5nr_user
--

CREATE TABLE public.auth_users (
    user_id integer NOT NULL,
    user_email text NOT NULL,
    renter_email text,
    all_is_auth boolean DEFAULT false NOT NULL,
    is_renter boolean DEFAULT false NOT NULL,
    payment_verif boolean DEFAULT false NOT NULL
);


ALTER TABLE public.auth_users OWNER TO parking_i5nr_user;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: parking_i5nr_user
--

CREATE TABLE public.bookings (
    booking_id integer NOT NULL,
    customer_booking_id integer NOT NULL,
    booking_space_id integer NOT NULL,
    final_cost double precision NOT NULL,
    rating integer DEFAULT 5,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone,
    is_occupied boolean DEFAULT false,
    commit_timestamp timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bookings_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT bookings_time_check CHECK ((end_time > start_time))
);


ALTER TABLE public.bookings OWNER TO parking_i5nr_user;

--
-- Name: bookings_booking_id_seq; Type: SEQUENCE; Schema: public; Owner: parking_i5nr_user
--

CREATE SEQUENCE public.bookings_booking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bookings_booking_id_seq OWNER TO parking_i5nr_user;

--
-- Name: bookings_booking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: parking_i5nr_user
--

ALTER SEQUENCE public.bookings_booking_id_seq OWNED BY public.bookings.booking_id;


--
-- Name: client_user; Type: TABLE; Schema: public; Owner: parking_i5nr_user
--

CREATE TABLE public.client_user (
    first_name text NOT NULL,
    last_name text NOT NULL,
    address text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    pmt_verified boolean DEFAULT false NOT NULL,
    is_auth boolean DEFAULT false NOT NULL,
    client_background_verified boolean DEFAULT false NOT NULL,
    id integer NOT NULL,
    CONSTRAINT client_user_address_check CHECK ((length(address) > 8)),
    CONSTRAINT client_user_email_check CHECK ((length(email) > 5)),
    CONSTRAINT client_user_first_name_check CHECK ((length(first_name) > 1)),
    CONSTRAINT client_user_last_name_check CHECK ((length(last_name) > 2))
);


ALTER TABLE public.client_user OWNER TO parking_i5nr_user;

--
-- Name: client_user_client_id_seq; Type: SEQUENCE; Schema: public; Owner: parking_i5nr_user
--

CREATE SEQUENCE public.client_user_client_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.client_user_client_id_seq OWNER TO parking_i5nr_user;

--
-- Name: client_user_client_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: parking_i5nr_user
--

ALTER SEQUENCE public.client_user_client_id_seq OWNED BY public.client_user.id;


--
-- Name: parking_spaces; Type: TABLE; Schema: public; Owner: parking_i5nr_user
--

CREATE TABLE public.parking_spaces (
    space_id integer NOT NULL,
    space_owner_id integer NOT NULL,
    property_lookup_id uuid,
    space_no integer,
    sp_type text,
    last_used timestamp with time zone,
    customer_id integer DEFAULT '-1'::integer NOT NULL,
    price double precision DEFAULT 15.00 NOT NULL,
    address text,
    CONSTRAINT parking_spaces_check CHECK ((customer_id <> space_owner_id)),
    CONSTRAINT parking_spaces_last_used_check CHECK ((last_used <= now())),
    CONSTRAINT parking_spaces_sp_type_check CHECK ((sp_type = ANY (ARRAY['car'::text, 'truck'::text]))),
    CONSTRAINT parking_spaces_space_no_check CHECK (((space_no >= 1) AND (space_no <= 10)))
);


ALTER TABLE public.parking_spaces OWNER TO parking_i5nr_user;

--
-- Name: parking_spaces_space_id_seq; Type: SEQUENCE; Schema: public; Owner: parking_i5nr_user
--

CREATE SEQUENCE public.parking_spaces_space_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.parking_spaces_space_id_seq OWNER TO parking_i5nr_user;

--
-- Name: parking_spaces_space_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: parking_i5nr_user
--

ALTER SEQUENCE public.parking_spaces_space_id_seq OWNED BY public.parking_spaces.space_id;


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: parking_i5nr_user
--

CREATE TABLE public.payment_transactions (
    pmt_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_pmt_id integer,
    expiry text,
    pmt_booking_id integer,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payment_transactions OWNER TO parking_i5nr_user;

--
-- Name: properties; Type: TABLE; Schema: public; Owner: parking_i5nr_user
--

CREATE TABLE public.properties (
    property_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    owner_id integer NOT NULL,
    prop_address text NOT NULL,
    zip text NOT NULL,
    number_spaces integer,
    picture text,
    location_verified boolean DEFAULT false NOT NULL,
    billing_type text,
    latitude double precision,
    longitude double precision,
    CONSTRAINT properties_billing_type_check CHECK ((billing_type = ANY (ARRAY['fixed'::text, 'hourly'::text]))),
    CONSTRAINT properties_number_spaces_check CHECK (((number_spaces >= 1) AND (number_spaces <= 10)))
);


ALTER TABLE public.properties OWNER TO parking_i5nr_user;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: parking_i5nr_user
--

CREATE TABLE public.refresh_tokens (
    client_id integer NOT NULL,
    token text,
    refresh_token_id integer NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO parking_i5nr_user;

--
-- Name: refresh_tokens_refresh_token_id_seq; Type: SEQUENCE; Schema: public; Owner: parking_i5nr_user
--

CREATE SEQUENCE public.refresh_tokens_refresh_token_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.refresh_tokens_refresh_token_id_seq OWNER TO parking_i5nr_user;

--
-- Name: refresh_tokens_refresh_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: parking_i5nr_user
--

ALTER SEQUENCE public.refresh_tokens_refresh_token_id_seq OWNED BY public.refresh_tokens.refresh_token_id;


--
-- Name: renter_user; Type: TABLE; Schema: public; Owner: parking_i5nr_user
--

CREATE TABLE public.renter_user (
    renter_id integer NOT NULL,
    renter_address text NOT NULL,
    renter_email text NOT NULL,
    background_verified boolean DEFAULT false NOT NULL,
    r_pmt_verified boolean DEFAULT false NOT NULL,
    CONSTRAINT renter_user_address_check CHECK ((length(renter_address) > 8)),
    CONSTRAINT renter_user_email_check CHECK ((length(renter_email) > 5))
);


ALTER TABLE public.renter_user OWNER TO parking_i5nr_user;

--
-- Name: bookings booking_id; Type: DEFAULT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.bookings ALTER COLUMN booking_id SET DEFAULT nextval('public.bookings_booking_id_seq'::regclass);


--
-- Name: client_user id; Type: DEFAULT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.client_user ALTER COLUMN id SET DEFAULT nextval('public.client_user_client_id_seq'::regclass);


--
-- Name: parking_spaces space_id; Type: DEFAULT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.parking_spaces ALTER COLUMN space_id SET DEFAULT nextval('public.parking_spaces_space_id_seq'::regclass);


--
-- Name: refresh_tokens refresh_token_id; Type: DEFAULT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN refresh_token_id SET DEFAULT nextval('public.refresh_tokens_refresh_token_id_seq'::regclass);


--
-- Name: auth_users auth_users_user_email_key; Type: CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_user_email_key UNIQUE (user_email);


--
-- Name: auth_users auth_users_user_id_key; Type: CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_user_id_key UNIQUE (user_id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (booking_id);


--
-- Name: client_user client_user_email_key; Type: CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.client_user
    ADD CONSTRAINT client_user_email_key UNIQUE (email);


--
-- Name: client_user client_user_pkey; Type: CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.client_user
    ADD CONSTRAINT client_user_pkey PRIMARY KEY (id);


--
-- Name: parking_spaces parking_spaces_pkey; Type: CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.parking_spaces
    ADD CONSTRAINT parking_spaces_pkey PRIMARY KEY (space_id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (property_id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (refresh_token_id);


--
-- Name: renter_user renter_user_renter_email_key; Type: CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.renter_user
    ADD CONSTRAINT renter_user_renter_email_key UNIQUE (renter_email);


--
-- Name: payment_transactions unique_booking_id; Type: CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT unique_booking_id UNIQUE (pmt_booking_id);


--
-- Name: client_user unique_client_user; Type: CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.client_user
    ADD CONSTRAINT unique_client_user UNIQUE (first_name, last_name, address);


--
-- Name: properties unique_owner_address_zip; Type: CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT unique_owner_address_zip UNIQUE (owner_id, prop_address, zip);


--
-- Name: parking_spaces unique_sp_no_prop_id; Type: CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.parking_spaces
    ADD CONSTRAINT unique_sp_no_prop_id UNIQUE (property_lookup_id, space_no);


--
-- Name: parking_spaces unique_space_id_no; Type: CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.parking_spaces
    ADD CONSTRAINT unique_space_id_no UNIQUE (space_id, space_no);


--
-- Name: client_user users_insert_trigger; Type: TRIGGER; Schema: public; Owner: parking_i5nr_user
--

CREATE TRIGGER users_insert_trigger AFTER INSERT ON public.client_user FOR EACH ROW EXECUTE FUNCTION public.insert_auth_user();


--
-- Name: bookings bookings_booking_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_booking_space_id_fkey FOREIGN KEY (booking_space_id) REFERENCES public.parking_spaces(space_id);


--
-- Name: bookings bookings_customer_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_customer_booking_id_fkey FOREIGN KEY (customer_booking_id) REFERENCES public.client_user(id);


--
-- Name: properties fk_property_owner_id; Type: FK CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT fk_property_owner_id FOREIGN KEY (owner_id) REFERENCES public.client_user(id);


--
-- Name: parking_spaces fk_space_owner; Type: FK CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.parking_spaces
    ADD CONSTRAINT fk_space_owner FOREIGN KEY (space_owner_id) REFERENCES public.client_user(id);


--
-- Name: parking_spaces fk_space_property_id; Type: FK CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.parking_spaces
    ADD CONSTRAINT fk_space_property_id FOREIGN KEY (property_lookup_id) REFERENCES public.properties(property_id);


--
-- Name: payment_transactions payment_transactions_pmt_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pmt_booking_id_fkey FOREIGN KEY (pmt_booking_id) REFERENCES public.bookings(booking_id);


--
-- Name: payment_transactions payment_transactions_user_pmt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_user_pmt_id_fkey FOREIGN KEY (user_pmt_id) REFERENCES public.client_user(id);


--
-- Name: renter_user renter_user_renter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parking_i5nr_user
--

ALTER TABLE ONLY public.renter_user
    ADD CONSTRAINT renter_user_renter_id_fkey FOREIGN KEY (renter_id) REFERENCES public.client_user(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

