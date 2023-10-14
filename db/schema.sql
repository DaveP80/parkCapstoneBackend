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

-- Create table in DATABASE FIRST. on each successful addition of new user to users table, new log is made in auth_users table
create table auth_users (user_id integer not null unique, user_email text not null unique, is_auth Boolean default false);

CREATE OR REPLACE FUNCTION insert_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO auth_users (user_id, user_email, is_auth)
    VALUES (NEW.id, NEW.email, false);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_insert_trigger
AFTER INSERT ON client_user
FOR EACH ROW
EXECUTE FUNCTION insert_auth_user();

