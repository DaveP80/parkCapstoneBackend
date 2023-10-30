CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.auth_users (
	user_id int4 NOT NULL,
	user_email text NOT NULL,
	renter_email text NULL,
	all_is_auth bool NOT NULL DEFAULT false,
	is_renter bool NOT NULL DEFAULT false,
	payment_verif bool NOT NULL DEFAULT false,
	CONSTRAINT auth_users_user_email_key UNIQUE (user_email),
	CONSTRAINT auth_users_user_id_key UNIQUE (user_id)
);


-- public.client_user definition

CREATE TABLE public.client_user (
	first_name text NOT NULL,
	last_name text NOT NULL,
	address text NOT NULL,
	email text NOT NULL,
	"password" text NOT NULL,
	pmt_verified bool NOT NULL DEFAULT false,
	is_auth bool NOT NULL DEFAULT false,
	client_background_verified bool NOT NULL DEFAULT false,
	id int4 NOT NULL DEFAULT nextval('client_user_client_id_seq'::regclass),
	CONSTRAINT client_user_address_check CHECK ((length(address) > 8)),
	CONSTRAINT client_user_email_check CHECK ((length(email) > 5)),
	CONSTRAINT client_user_email_key UNIQUE (email),
	CONSTRAINT client_user_first_name_check CHECK ((length(first_name) > 1)),
	CONSTRAINT client_user_last_name_check CHECK ((length(last_name) > 2)),
	CONSTRAINT client_user_pkey PRIMARY KEY (id),
	CONSTRAINT unique_client_user UNIQUE (first_name, last_name, address)
);

-- Table Triggers

create trigger users_insert_trigger after
insert
    on
    public.client_user for each row execute function insert_auth_user();


-- public.refresh_tokens definition

CREATE TABLE public.refresh_tokens (
	client_id int4 NOT NULL,
	"token" text NULL,
	CONSTRAINT refresh_tokens_token_key UNIQUE (token)
);


-- public.properties definition

CREATE TABLE public.properties (
	property_id uuid NOT NULL DEFAULT uuid_generate_v4(),
	owner_id int4 NOT NULL,
	prop_address text NOT NULL,
	zip text NOT NULL,
	number_spaces int4 NULL,
	picture text NULL,
	location_verified bool NOT NULL DEFAULT false,
	billing_type text NULL,
	CONSTRAINT properties_billing_type_check CHECK ((billing_type = ANY (ARRAY['fixed'::text, 'hourly'::text]))),
	CONSTRAINT properties_number_spaces_check CHECK (((number_spaces >= 1) AND (number_spaces <= 10))),
	CONSTRAINT properties_pkey PRIMARY KEY (property_id),
	CONSTRAINT unique_owner_address_zip UNIQUE (owner_id, prop_address, zip),
	CONSTRAINT fk_property_owner_id FOREIGN KEY (owner_id) REFERENCES public.client_user(id)
);


-- public.renter_user definition

CREATE TABLE public.renter_user (
	renter_id int4 NOT NULL,
	renter_address text NOT NULL,
	renter_email text NOT NULL,
	background_verified bool NOT NULL DEFAULT false,
	r_pmt_verified bool NOT NULL DEFAULT false,
	CONSTRAINT renter_user_address_check CHECK ((length(renter_address) > 8)),
	CONSTRAINT renter_user_email_check CHECK ((length(renter_email) > 5)),
	CONSTRAINT renter_user_renter_email_key UNIQUE (renter_email),
	CONSTRAINT renter_user_renter_id_fkey FOREIGN KEY (renter_id) REFERENCES public.client_user(id) ON DELETE CASCADE
);


-- public.parking_spaces definition

CREATE TABLE public.parking_spaces (
	space_id serial4 NOT NULL,
	space_owner_id int4 NOT NULL,
	property_lookup_id uuid NULL,
	space_no int4 NULL,
	sp_type text NULL,
	occupied bool NOT NULL DEFAULT false,
	last_used timestamptz NULL,
	customer_id int4 NOT NULL DEFAULT '-1'::integer,
	price float8 NOT NULL DEFAULT 15.00,
	CONSTRAINT parking_spaces_check CHECK ((customer_id <> space_owner_id)),
	CONSTRAINT parking_spaces_last_used_check CHECK ((last_used <= now())),
	CONSTRAINT parking_spaces_pkey PRIMARY KEY (space_id),
	CONSTRAINT parking_spaces_sp_type_check CHECK ((sp_type = ANY (ARRAY['car'::text, 'truck'::text]))),
	CONSTRAINT parking_spaces_space_no_check CHECK (((space_no >= 1) AND (space_no <= 10))),
	CONSTRAINT unique_space_id_no UNIQUE (space_id, space_no),
	CONSTRAINT fk_space_owner FOREIGN KEY (space_owner_id) REFERENCES public.client_user(id),
	CONSTRAINT fk_space_property_id FOREIGN KEY (property_lookup_id) REFERENCES public.properties(property_id)
);


-- public.bookings definition

CREATE TABLE public.bookings (
	booking_id serial4 NOT NULL,
	customer_booking_id int4 NOT NULL,
	booking_space_id int4 NOT NULL,
	final_cost float8 NOT NULL,
	rating int4 NULL DEFAULT 5,
	start_time timestamp NOT NULL,
	end_time timestamp NULL,
	tsrange tsrange NOT NULL,
	CONSTRAINT booking_time_future CHECK ((start_time > (now() + '02:00:00'::interval))),
	CONSTRAINT bookings_pkey PRIMARY KEY (booking_id),
	CONSTRAINT bookings_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
	CONSTRAINT bookings_booking_space_id_fkey FOREIGN KEY (booking_space_id) REFERENCES public.parking_spaces(space_id),
	CONSTRAINT bookings_customer_booking_id_fkey FOREIGN KEY (customer_booking_id) REFERENCES public.client_user(id)
);
CREATE INDEX event_range_idx ON public.bookings USING gist (tsrange);

-- Table Triggers

create trigger event_update_t before
insert
    or
update
    on
    public.bookings for each row execute function event_update_tf();



CREATE OR REPLACE FUNCTION public.event_update_tf()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    if NEW.end_time IS NOT NULL then
        NEW.tsrange = tsrange(NEW.start_time, NEW.end_time, '[]');
    else
        NEW.tsrange = tsrange(NEW.start_time, null, '[)');
    end if;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO auth_users (user_id, user_email, all_is_auth)
    VALUES (NEW.id, NEW.email, false);
    RETURN NEW;
END;
$function$
;