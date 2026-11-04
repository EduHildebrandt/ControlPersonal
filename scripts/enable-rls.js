const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Verificando conexión y habilitando RLS...");

  const tables = [
    "usuarios",
    "empleados",
    "locales",
    "empleado_locales",
    "asignaciones_turnos",
    "registros_horas",
  ];

  for (const table of tables) {
    console.log(`Habilitando Row Level Security en public.${table}...`);
    await prisma.$executeRawUnsafe(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);
    console.log(`RLS activado con éxito en public.${table}.`);
  }

  // Revocar acceso a las tablas públicas para anon y authenticated
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`REVOKE ALL ON TABLE public."${table}" FROM anon, authenticated;`);
      console.log(`Permisos revocados para anon y authenticated en public.${table}.`);
    } catch (err) {
      console.log(`Nota sobre permisos en public.${table}:`, err.message);
    }
  }

  console.log("¡Operación completada con éxito!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
