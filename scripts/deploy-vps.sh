#!/bin/bash
set -e

# ==============================================================================
# SCRIPT DE DESPLIEGUE RÁPIDO Y ACTUALIZACIÓN - DONWEB VPS
# ==============================================================================

echo "======================================================"
echo "   ACTUALIZANDO CONTROL DE PERSONAL EN DONWEB VPS     "
echo "======================================================"

# 1. Traer los últimos cambios del repositorio
echo "=> Obteniendo última versión de Git..."
git pull origin main

# 2. Reconstruir y reiniciar los contenedores Docker
echo "=> Reconstruyendo imágenes e iniciando servicios..."
docker compose down
docker compose up -d --build

# 3. Esperar que el contenedor esté listo
echo "=> Esperando inicialización del servicio..."
sleep 5

# 4. Mostrar estado de los contenedores
docker compose ps

echo "======================================================"
echo "✓ DESPLIEGUE FINALIZADO EXITOSAMENTE"
echo "Para ver logs en vivo: docker compose logs -f"
echo "======================================================"
