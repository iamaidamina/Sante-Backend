USE railway;
#SHOW TABLES;
#UPDATE usuarios
#SET rol = 'admin'
#WHERE email = 'admin@sante.com';

#ALTER TABLE sesiones_usuario
#ADD COLUMN estado ENUM('activa','cerrada') DEFAULT 'activa';
#ALTER TABLE sesiones_usuario 
#MODIFY dispositivo VARCHAR(255);
#ALTER TABLE sesiones_usuario 
#MODIFY dispositivo TEXT;
#ADD COLUMN refresh_token VARCHAR(500) NULL;

ALTER TABLE usuarios

#ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE,
#ADD COLUMN terms_accepted_at TIMESTAMP;


#ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE,
#ADD COLUMN terms_version VARCHAR(10),
#ADD COLUMN terms_accepted_at TIMESTAMP;


ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Notificaciones WhatsApp (Meta WhatsApp Cloud API)
-- Si se actualiza desde la version CallMeBot, ejecutar:
-- ALTER TABLE usuarios DROP COLUMN whatsapp_apikey;
ALTER TABLE usuarios
ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT FALSE;