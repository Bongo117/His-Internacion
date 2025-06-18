# HIS - Módulo de Admisión e Internación

Proyecto Integrador para la materia Programación Web II.

---

## **Descripción**

Este proyecto implementa el módulo de admisión y recepción de pacientes de un sistema hospitalario.  
Permite simular el flujo completo de internación, desde la recepción del paciente hasta la asignación de cama.

---

## **URLs de entrega**

Repositorio GitHub: https://github.com/Bongo117/His-Internacion.git  
Endpoint de inicio del módulo: https://his-internacion-production.up.railway.app  
Video: https://drive.google.com/file/d/1te5qMOYBC8UDsjP6SHXvZ2_kTTQOl7BQ/view?usp=sharing

---

## **Funcionalidades principales**

- Registro y listado de pacientes  
- Selección de tipo de ingreso: emergencia, derivado, quirúrgico  
- Asignación de habitaciones y camas disponibles  
- Estado de admisión (activa, finalizada, cancelada)  
- **Scripts para poblar BD con datos de prueba** (usuarios, motivos, turnos, etc.)

---

## **Requisitos previos**

- Node.js (v14+)  
- npm  
- MySQL / MariaDB

---

## **Instalación y despliegue local**

1. Cloná el repositorio o descargalo

2. Instalá dependencias:
   ```bash
   npm install
   ```

3. Crear la base de datos:
   - Está en la carpeta `backup`

4. Ejecutar:
   ```bash
   npm start
   ```

5. Abrir en el navegador: http://localhost:3000

**Pacientes de prueba para poder ingresar:**  
`recep1`, `admin1`, `enfer1`, `medico1`  
**Contraseña:** `1234`

---

## **Base de Datos**

**Nombre:** `his_internacion`

**Tablas principales:**
- paciente  
- admision  
- cama  
- habitacion  
- usuario  
- evaluacion_enfermeria  
- evaluacion_medica

**El backup.sql incluye:**
- Usuarios de prueba con roles (recepcionista, enfermero, medico, admin)  
- Datos ejemplos de admisiones y camas

---

## **Referencias**

- Express Documentation  
- Sequelize ORM  
- Pug Templating  
- pexels.com











