# Visualizador de Datos Inmobiliarios Idealista

Este proyecto es una aplicación web local para visualizar datos inmobiliarios obtenidos desde la API de Idealista.

## Estructura del Proyecto

- `data/`: Archivos JSON descargados de Idealista
- `backend/`: Backend en Python con Flask
- `frontend/`: Frontend web con HTML, CSS y JavaScript

## Instalación y Ejecución

1. Instalar dependencias:
   ```
   pip install flask
   ```
   O si usas pip3:
   ```
   pip3 install flask
   ```

2. Ejecutar el backend:
   ```
   python backend/app.py
   ```

3. Abrir en el navegador: `http://localhost:5000`

## Funcionalidades

- Mapa interactivo con marcadores de propiedades
- Filtros dinámicos
- Listado de propiedades
- Estadísticas básicas

## Añadir Nuevos Datos

Simplemente añade nuevos archivos JSON en la carpeta `data/` y reinicia la aplicación.