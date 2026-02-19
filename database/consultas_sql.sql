USE railway;
#SHOW TABLES;
UPDATE usuarios
SET rol = 'admin'
WHERE email = 'admin@sante.com';

