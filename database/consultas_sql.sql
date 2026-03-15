USE railway;
#SHOW TABLES;
#UPDATE usuarios
#SET rol = 'admin'
#WHERE email = 'admin@sante.com';

#ALTER TABLE sesiones_usuario
#ADD COLUMN estado ENUM('activa','cerrada') DEFAULT 'activa';
#ALTER TABLE sesiones_usuario 
#MODIFY dispositivo VARCHAR(255);
ALTER TABLE sesiones_usuario 
#MODIFY dispositivo TEXT;
ADD COLUMN refresh_token VARCHAR(500) NULL;

