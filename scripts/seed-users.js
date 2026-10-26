const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Creando superusuario y supervisor iniciales...");

  const superPassword = await bcrypt.hash("Admin2026!", 10);
  const supervisorPassword = await bcrypt.hash("Supervisor2026!", 10);

  const superuser = await prisma.usuario.upsert({
    where: { email: "admin@turnomaster.com" },
    update: {
      password: superPassword,
      rol: "SUPERUSUARIO",
      activo: true,
    },
    create: {
      nombre: "Administrador Principal",
      email: "admin@turnomaster.com",
      password: superPassword,
      rol: "SUPERUSUARIO",
      activo: true,
    },
  });

  const supervisor = await prisma.usuario.upsert({
    where: { email: "supervisor@turnomaster.com" },
    update: {
      password: supervisorPassword,
      rol: "SUPERVISOR",
      activo: true,
    },
    create: {
      nombre: "Supervisor General",
      email: "supervisor@turnomaster.com",
      password: supervisorPassword,
      rol: "SUPERVISOR",
      activo: true,
    },
  });

  console.log("Usuarios listos:");
  console.log("Superusuario:", superuser.email);
  console.log("Supervisor:", supervisor.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
