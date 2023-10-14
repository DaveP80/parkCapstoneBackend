DROP DATABASE IF EXISTS parking;

CREATE DATABASE parking;

\c client_user;

CREATE TABLE client_user (
    id serial PRIMARY KEY,
    first_name text NOT NULL CHECK (length(first_name) > 1),
    last_name text NOT NULL CHECK (length(last_name) > 2),
    address text NOT NULL CHECK (length(address) > 8),
    email text NOT NULL UNIQUE CHECK (length(email) > 5),
    password text NOT NULL,
    pmt_verified boolean DEFAULT false NOT NULL,
    is_auth boolean DEFAULT false NOT NULL,
    CONSTRAINT unique_client_user UNIQUE (first_name, last_name, address)
);

