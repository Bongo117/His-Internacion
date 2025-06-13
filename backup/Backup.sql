-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 13-06-2025 a las 02:59:55
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `his_internacion`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `admision`
--

CREATE TABLE `admision` (
  `id_admision` int(11) NOT NULL,
  `id_paciente` int(11) NOT NULL,
  `fecha_admision` datetime DEFAULT current_timestamp(),
  `motivo` text DEFAULT NULL,
  `tipo_ingreso` enum('derivado','emergencia','quirurgico') DEFAULT NULL,
  `estado` enum('activa','cancelada','finalizada') DEFAULT 'activa',
  `id_cama_asignada` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `admision`
--

INSERT INTO `admision` (`id_admision`, `id_paciente`, `fecha_admision`, `motivo`, `tipo_ingreso`, `estado`, `id_cama_asignada`) VALUES
(1, 4, '2025-05-27 00:00:00', 'Se amputó el dedo anular con un cuchillo cortando zapallo', 'emergencia', 'activa', 2),
(2, 8, '2025-06-09 00:00:00', 'Infarto', 'emergencia', 'activa', 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cama`
--

CREATE TABLE `cama` (
  `id_cama` int(11) NOT NULL,
  `id_habitacion` int(11) NOT NULL,
  `numero` tinyint(4) NOT NULL,
  `estado` enum('libre','ocupada','higienizando') DEFAULT 'libre'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cama`
--

INSERT INTO `cama` (`id_cama`, `id_habitacion`, `numero`, `estado`) VALUES
(1, 1, 1, 'libre'),
(2, 1, 2, 'ocupada'),
(3, 2, 1, 'ocupada'),
(4, 2, 2, 'libre'),
(5, 3, 1, 'libre');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `evaluacion_enfermeria`
--

CREATE TABLE `evaluacion_enfermeria` (
  `id_eval_enf` int(11) NOT NULL,
  `id_admision` int(11) DEFAULT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  `signos_vitales` text DEFAULT NULL,
  `historial_medico` text DEFAULT NULL,
  `motivo_internacion` text DEFAULT NULL,
  `plan_cuidados` text DEFAULT NULL,
  `enfermero_responsable` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `evaluacion_medica`
--

CREATE TABLE `evaluacion_medica` (
  `id_eval_med` int(11) NOT NULL,
  `id_admision` int(11) DEFAULT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  `diagnostico` text DEFAULT NULL,
  `tratamientos` text DEFAULT NULL,
  `estudios_solicitados` text DEFAULT NULL,
  `medico_responsable` int(11) DEFAULT NULL,
  `alta` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `habitacion`
--

CREATE TABLE `habitacion` (
  `id_habitacion` int(11) NOT NULL,
  `ala` varchar(50) DEFAULT NULL,
  `numero` int(11) DEFAULT NULL,
  `capacidad` tinyint(4) DEFAULT NULL CHECK (`capacidad` in (1,2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `habitacion`
--

INSERT INTO `habitacion` (`id_habitacion`, `ala`, `numero`, `capacidad`) VALUES
(1, 'Ala Norte', 1, 2),
(2, 'Ala Sur', 2, 2),
(3, 'Ala Este', 3, 2),
(4, 'Ala Norte', 4, 2),
(5, 'Ala Sur', 5, 1),
(6, 'Ala Oeste', 6, 2),
(7, 'Ala Este', 7, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `paciente`
--

CREATE TABLE `paciente` (
  `id_paciente` int(11) NOT NULL,
  `dni` varchar(15) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `sexo` enum('M','F','X') NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `direccion` varchar(200) NOT NULL,
  `contacto_emergencia` varchar(100) NOT NULL,
  `obra_social` varchar(100) NOT NULL,
  `nro_afiliado` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `paciente`
--

INSERT INTO `paciente` (`id_paciente`, `dni`, `nombre`, `apellido`, `fecha_nacimiento`, `sexo`, `telefono`, `direccion`, `contacto_emergencia`, `obra_social`, `nro_afiliado`) VALUES
(4, '3546456645', 'jorge', 'añañin', '2010-01-27', 'M', '56565656', 'fasfs', '45454545', 'osde', '7'),
(5, '24897189', 'Juana', 'DeArco', '2000-02-02', 'F', '654654654', 'aca a la vuelta 321', '6556565965', 'osecac', '4'),
(6, '767787', 'Eusebio', 'Cramabolt', '1994-12-02', 'M', '12312312321', 'su casa', '45324324', 'dosep', '1'),
(7, '1', 'Jaun Manuel', 'Fangio', '1911-06-24', 'M', '123456789', 'El Podio', '5454545445', 'osde', '6'),
(8, '2026042', 'Clotilde', 'Tía', '1980-02-29', 'F', '22222222', 'donde topa', '3', 'swiss medical', '4');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id_usuario` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','enfermero','medico','recepcionista') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id_usuario`, `username`, `password`, `rol`) VALUES
(1, 'recep1', '1234', 'recepcionista'),
(2, 'enfer1', '1234', 'enfermero'),
(3, 'medico1', '1234', 'medico'),
(4, 'admin1', '1234', 'admin');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `admision`
--
ALTER TABLE `admision`
  ADD PRIMARY KEY (`id_admision`),
  ADD KEY `id_paciente` (`id_paciente`),
  ADD KEY `id_cama_asignada` (`id_cama_asignada`);

--
-- Indices de la tabla `cama`
--
ALTER TABLE `cama`
  ADD PRIMARY KEY (`id_cama`),
  ADD KEY `id_habitacion` (`id_habitacion`);

--
-- Indices de la tabla `evaluacion_enfermeria`
--
ALTER TABLE `evaluacion_enfermeria`
  ADD PRIMARY KEY (`id_eval_enf`),
  ADD KEY `id_admision` (`id_admision`),
  ADD KEY `enfermero_responsable` (`enfermero_responsable`);

--
-- Indices de la tabla `evaluacion_medica`
--
ALTER TABLE `evaluacion_medica`
  ADD PRIMARY KEY (`id_eval_med`),
  ADD KEY `id_admision` (`id_admision`),
  ADD KEY `medico_responsable` (`medico_responsable`);

--
-- Indices de la tabla `habitacion`
--
ALTER TABLE `habitacion`
  ADD PRIMARY KEY (`id_habitacion`);

--
-- Indices de la tabla `paciente`
--
ALTER TABLE `paciente`
  ADD PRIMARY KEY (`id_paciente`),
  ADD UNIQUE KEY `dni` (`dni`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `admision`
--
ALTER TABLE `admision`
  MODIFY `id_admision` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `cama`
--
ALTER TABLE `cama`
  MODIFY `id_cama` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `evaluacion_enfermeria`
--
ALTER TABLE `evaluacion_enfermeria`
  MODIFY `id_eval_enf` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `evaluacion_medica`
--
ALTER TABLE `evaluacion_medica`
  MODIFY `id_eval_med` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `habitacion`
--
ALTER TABLE `habitacion`
  MODIFY `id_habitacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `paciente`
--
ALTER TABLE `paciente`
  MODIFY `id_paciente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `admision`
--
ALTER TABLE `admision`
  ADD CONSTRAINT `admision_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `paciente` (`id_paciente`),
  ADD CONSTRAINT `admision_ibfk_2` FOREIGN KEY (`id_cama_asignada`) REFERENCES `cama` (`id_cama`);

--
-- Filtros para la tabla `cama`
--
ALTER TABLE `cama`
  ADD CONSTRAINT `cama_ibfk_1` FOREIGN KEY (`id_habitacion`) REFERENCES `habitacion` (`id_habitacion`);

--
-- Filtros para la tabla `evaluacion_enfermeria`
--
ALTER TABLE `evaluacion_enfermeria`
  ADD CONSTRAINT `evaluacion_enfermeria_ibfk_1` FOREIGN KEY (`id_admision`) REFERENCES `admision` (`id_admision`),
  ADD CONSTRAINT `evaluacion_enfermeria_ibfk_2` FOREIGN KEY (`enfermero_responsable`) REFERENCES `usuario` (`id_usuario`);

--
-- Filtros para la tabla `evaluacion_medica`
--
ALTER TABLE `evaluacion_medica`
  ADD CONSTRAINT `evaluacion_medica_ibfk_1` FOREIGN KEY (`id_admision`) REFERENCES `admision` (`id_admision`),
  ADD CONSTRAINT `evaluacion_medica_ibfk_2` FOREIGN KEY (`medico_responsable`) REFERENCES `usuario` (`id_usuario`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
