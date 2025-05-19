-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 20-05-2025 a las 01:27:47
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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cama`
--

CREATE TABLE `cama` (
  `id_cama` int(11) NOT NULL,
  `id_habitacion` int(11) DEFAULT NULL,
  `numero` tinyint(4) DEFAULT NULL,
  `estado` enum('libre','ocupada','higienizando') DEFAULT 'libre'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `paciente`
--

CREATE TABLE `paciente` (
  `id_paciente` int(11) NOT NULL,
  `dni` varchar(15) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `sexo` enum('M','F','X') DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `contacto_emergencia` varchar(100) DEFAULT NULL,
  `obra_social` varchar(100) DEFAULT NULL,
  `nro_afiliado` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  MODIFY `id_admision` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `cama`
--
ALTER TABLE `cama`
  MODIFY `id_cama` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id_habitacion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `paciente`
--
ALTER TABLE `paciente`
  MODIFY `id_paciente` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT;

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
