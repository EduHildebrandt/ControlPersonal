const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de datos con los 5 locales solicitados...");

  // 1. Limpiar datos existentes
  await prisma.registroHoras.deleteMany({});
  await prisma.asignacionTurno.deleteMany({});
  await prisma.empleadoLocal.deleteMany({});
  await prisma.empleado.deleteMany({});
  await prisma.local.deleteMany({});

  // 2. Crear los 5 Locales oficiales
  const localMarMau = await prisma.local.create({
    data: {
      codigo: "MARMAU",
      nombreLocal: "MarMau",
      direccion: "Av. Principal 1020",
      activo: true,
    },
  });

  const localModaShop = await prisma.local.create({
    data: {
      codigo: "MODASHOP",
      nombreLocal: "ModaShop",
      direccion: "Paseo Comercial Local 4",
      activo: true,
    },
  });

  const localPunto1 = await prisma.local.create({
    data: {
      codigo: "PUNTO-1",
      nombreLocal: "Punto 1",
      direccion: "Calle Central 450",
      activo: true,
    },
  });

  const localPunto2 = await prisma.local.create({
    data: {
      codigo: "PUNTO-2",
      nombreLocal: "Punto 2",
      direccion: "Av. San Martín 820",
      activo: true,
    },
  });

  const localPunto3 = await prisma.local.create({
    data: {
      codigo: "PUNTO-3",
      nombreLocal: "Punto 3",
      direccion: "Ruta 8 Km 12 (24hs)",
      activo: true,
    },
  });

  console.log("5 Locales creados exitosamente: MarMau, ModaShop, Punto 1, Punto 2, Punto 3.");

  // 3. Crear Empleados
  const empCarlos = await prisma.empleado.create({
    data: {
      nombre: "Carlos",
      apellido: "Gómez",
      dni: "34891204",
      telefono: "+54 9 11 5543-1209",
      rol: "Seguridad (24hs)",
      activo: true,
      locales: {
        create: [
          { localId: localPunto3.id },
          { localId: localMarMau.id },
        ],
      },
    },
  });

  const empMariana = await prisma.empleado.create({
    data: {
      nombre: "Mariana",
      apellido: "Rodríguez",
      dni: "37429188",
      telefono: "+54 9 11 4432-8871",
      rol: "Cajero",
      activo: true,
      locales: {
        create: [
          { localId: localMarMau.id },
          { localId: localModaShop.id },
          { localId: localPunto1.id },
        ],
      },
    },
  });

  const empFederico = await prisma.empleado.create({
    data: {
      nombre: "Federico",
      apellido: "Álvarez",
      dni: "31205943",
      telefono: "+54 9 11 6789-0123",
      rol: "Encargado de Local",
      activo: true,
      locales: {
        create: [
          { localId: localPunto1.id },
          { localId: localPunto2.id },
        ],
      },
    },
  });

  const empLucia = await prisma.empleado.create({
    data: {
      nombre: "Lucía",
      apellido: "Morales",
      dni: "40192837",
      telefono: "+54 9 11 9876-5432",
      rol: "Operador",
      activo: true,
      locales: {
        create: [
          { localId: localModaShop.id },
        ],
      },
    },
  });

  console.log("Personal creado y vinculado a sucursales.");

  // 4. Crear Turnos Recurrentes (incluyendo Nocturno de 22:00 a 06:00)
  // Carlos Gómez: Turno Nocturno en Punto 3 (22:00 a 06:00 = 8h) Viernes y Sábados
  await prisma.asignacionTurno.create({
    data: {
      empleadoId: empCarlos.id,
      localId: localPunto3.id,
      tipo: "RECURRENTE",
      diaSemana: 5, // Viernes
      horaInicio: "22:00",
      horaFin: "06:00",
      cruzaMedianoche: true,
      duracionHoras: 8.0,
      notas: "Guardia nocturna Punto 3",
    },
  });

  await prisma.asignacionTurno.create({
    data: {
      empleadoId: empCarlos.id,
      localId: localPunto3.id,
      tipo: "RECURRENTE",
      diaSemana: 6, // Sábado
      horaInicio: "22:00",
      horaFin: "06:00",
      cruzaMedianoche: true,
      duracionHoras: 8.0,
      notas: "Guardia nocturna Punto 3",
    },
  });

  // Mariana: Turno Mañana en MarMau (08:00 a 16:00) Lunes, Miércoles y Viernes
  for (const dia of [1, 3, 5]) {
    await prisma.asignacionTurno.create({
      data: {
        empleadoId: empMariana.id,
        localId: localMarMau.id,
        tipo: "RECURRENTE",
        diaSemana: dia,
        horaInicio: "08:00",
        horaFin: "16:00",
        cruzaMedianoche: false,
        duracionHoras: 8.0,
        notas: "Turno regular de caja en MarMau",
      },
    });
  }

  // Federico: Turno Tarde en Punto 1 y Punto 2
  await prisma.asignacionTurno.create({
    data: {
      empleadoId: empFederico.id,
      localId: localPunto1.id,
      tipo: "RECURRENTE",
      diaSemana: 2, // Martes
      horaInicio: "16:00",
      horaFin: "00:00",
      cruzaMedianoche: false,
      duracionHoras: 8.0,
      notas: "Supervisión cierre Punto 1",
    },
  });

  await prisma.asignacionTurno.create({
    data: {
      empleadoId: empFederico.id,
      localId: localPunto2.id,
      tipo: "RECURRENTE",
      diaSemana: 4, // Jueves
      horaInicio: "16:00",
      horaFin: "00:00",
      cruzaMedianoche: false,
      duracionHoras: 8.0,
      notas: "Supervisión cierre Punto 2",
    },
  });

  console.log("Turnos cargados exitosamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
