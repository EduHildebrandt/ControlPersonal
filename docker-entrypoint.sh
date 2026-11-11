#!/bin/sh
set -e

echo "============================================="
echo "   CONTROL DE PERSONAL - INICIALIZACIÓN VPS   "
echo "============================================="

# 1. Esperar a que PostgreSQL acepte conexiones
echo "=> Verificando disponibilidad de PostgreSQL..."
until nc -z db 5432 2>/dev/null; do
  echo "=> Esperando a que el servicio PostgreSQL (db:5432) esté listo..."
  sleep 2
done
echo "=> PostgreSQL conectado correctamente."

# 2. Sincronizar esquema de Prisma en PostgreSQL
echo "=> Sincronizando esquema de base de datos..."
./node_modules/.bin/prisma db push --skip-generate || true

# 3. Iniciar la aplicación Next.js
echo "=> Arrancando servidor Next.js en puerto 3000..."
exec "$@"
