CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activo','inactivo') DEFAULT 'activo'
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
CREATE TABLE medicamentos (
    id_medicamento INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    id_frecuencia INT,
    id_almacenamiento INT,
    foto_path VARCHAR(255),
    formula_path VARCHAR(255),
    estado ENUM('activo','inactivo') DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_frecuencia) REFERENCES frecuencias(id_frecuencia),
    FOREIGN KEY (id_almacenamiento) REFERENCES almacenamientos(id_almacenamiento)
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
    tipo VARCHAR(100),
    lugar VARCHAR(150),
    fecha_hora DATETIME,
    estado ENUM('activo','inactivo') DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_especialidad) REFERENCES especialidades(id_especialidad)
);
CREATE TABLE entregas (
    id_entrega INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    lugar_compra VARCHAR(150),
    nombre_domiciliario VARCHAR(150),
    fecha_llegada DATE,
    id_medicamento INT,
    estado ENUM('aceptado','pendiente','entregado'),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_medicamento) REFERENCES medicamentos(id_medicamento)
);
