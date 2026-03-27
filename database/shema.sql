CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('usuario','admin') DEFAULT 'usuario',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE frecuencias (
    id_frecuencia INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL,
    intervalo_horas INT NOT NULL
);
CREATE TABLE almacenamientos (
    id_almacenamiento INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE especialidades (
    id_especialidad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);
CREATE TABLE citas (
    id_cita INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    nombre_medico VARCHAR(150) NOT NULL,
    id_especialidad INT,
	descripcion TEXT,
    tipo VARCHAR(100),
    lugar VARCHAR(150),
    fecha_hora DATETIME,
    estado ENUM('activo','inactivo') DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,
    FOREIGN KEY (id_especialidad) REFERENCES especialidades(id_especialidad)
        ON DELETE SET NULL
);
CREATE TABLE entregas (
                id_entrega INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT NOT NULL,
                lugar_compra VARCHAR(150),
                id_domiciliario INT,
                fecha_llegada DATE,
                nombre_producto VARCHAR(250),
                orden_medica VARCHAR(250),
                lugar_entrega VARCHAR(250),
                comentario VARCHAR(250),
                estado ENUM('aceptado','pendiente','entregado'),
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
                FOREIGN KEY (id_domiciliario) REFERENCES domiciliarios(id_domiciliario) ON DELETE SET NULL
            );

CREATE TABLE domiciliarios (  -- ← IF NOT EXISTS evita error
                id_domiciliario INT AUTO_INCREMENT PRIMARY KEY,
                nombre_domiciliario VARCHAR(250),
                direccion_domiciliario VARCHAR(150),
                tipo_documento VARCHAR(150),
                numero_documento VARCHAR(250),
                documento_identidad VARCHAR(250),
                estado ENUM('activo','inactivo') DEFAULT 'activo',  -- ← COMA AQUÍ
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE sesiones_usuario (
    id_sesion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    hora_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    hora_salida DATETIME NULL,
    tiempo_estadia_segundos INT NULL,
    ip_usuario VARCHAR(45),
    dispositivo VARCHAR(100),

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
);
CREATE TABLE dispositivos (
    id_dispositivo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    id_usuario INT NOT NULL,
    estado ENUM('activo','inactivo') DEFAULT 'activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
);
CREATE TABLE registros_uv (
    id_registro INT AUTO_INCREMENT PRIMARY KEY,
    id_dispositivo INT NOT NULL,
    valor_uv DECIMAL(5,2) NOT NULL,
    nivel_riesgo ENUM('bajo','moderado','alto','muy_alto') NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_dispositivo) REFERENCES dispositivos(id_dispositivo)
        ON DELETE CASCADE
);
CREATE TABLE tests (
                id_test INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT NOT NULL,
                nombre_medico VARCHAR(250) NOT NULL,
                nombre_examen VARCHAR(250) NOT NULL,
                descripcion VARCHAR(250),
                lugar VARCHAR(250),
                fecha_hora DATETIME,
                ruta_orden_medica VARCHAR(250),
                estado ENUM('activo','inactivo') DEFAULT 'activo',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
                    ON DELETE CASCADE
);
CREATE INDEX idx_medicamentos_usuario ON medicamentos(id_usuario);
CREATE INDEX idx_citas_usuario ON citas(id_usuario);
CREATE INDEX idx_entregas_usuario ON entregas(id_usuario);
CREATE INDEX idx_sesiones_usuario ON sesiones_usuario(id_usuario);
CREATE INDEX idx_dispositivos_usuario ON dispositivos(id_usuario);
CREATE INDEX idx_registros_uv_dispositivo ON registros_uv(id_dispositivo);
CREATE INDEX idx_tests_usuario ON tests(id_usuario);
