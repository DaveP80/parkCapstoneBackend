INSERT INTO client_user (first_name, last_name, address, email, password, pmt_verified, is_auth, client_background_verified)
VALUES ('John', 'Doe', '89 Vanderveer st Queens Village NY 11427', 'ledg@example.com', 'passwrd124', true, true, true)
RETURNING id;


-- Insert a property associated with the new user
INSERT INTO public.properties (owner_id, prop_address, zip, number_spaces, billing_type)
VALUES (currval('client_user_id_seq'), '395 W 74th St New York NY 10001', '10001', 3, 'fixed');