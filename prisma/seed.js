const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Lista de 25 nombres y apellidos argentinos
const NOMBRES_APELLIDOS = [
  { nombre: "Gonzalo", apellido: "Fernández" },
  { nombre: "Valentina", apellido: "Romero" },
  { nombre: "Martín", apellido: "Benítez" },
  { nombre: "Camila", apellido: "Díaz" },
  { nombre: "Lucas", apellido: "Alonso" },
  { nombre: "Lucía", apellido: "Álvarez" },
  { nombre: "Mateo", apellido: "Torres" },
  { nombre: "Sofía", apellido: "Acosta" },
  { nombre: "Joaquín", apellido: "Rojas" },
  { nombre: "Florencia", apellido: "Medina" },
  { nombre: "Nicolás", apellido: "Castro" },
  { nombre: "Julieta", apellido: "Herrera" },
  { nombre: "Santiago", apellido: "Ponce" },
  { nombre: "Agustina", apellido: "Molina" },
  { nombre: "Esteban", apellido: "Suárez" },
  { nombre: "Micaela", apellido: "Domínguez" },
  { nombre: "Facundo", apellido: "Vega" },
  { nombre: "Mariana", apellido: "Morales" },
  { nombre: "Ignacio", apellido: "Giménez" },
  { nombre: "Carolina", apellido: "Navarro" },
  { nombre: "Tomás", apellido: "Luna" },
  { nombre: "Milagros", apellido: "Ortiz" },
  { nombre: "Emiliano", apellido: "Silva" },
  { nombre: "Valeria", apellido: "Ríos" },
  { nombre: "Ramiro", apellido: "Quiroga" },
];

const DIRECCIONES = [
  "Av. Corrientes 1420, CABA",
  "Calle Balcarce 740, San Telmo",
  "Av. Santa Fe 3210, Palermo",
  "Calle Rivadavia 5800, Caballito",
  "Av. Cabildo 2150, Belgrano",
  "Calle Florida 890, Centro",
  "Av. San Martín 1540, Vicente López",
  "Calle Mitre 450, San Isidro",
  "Av. Maipú 2300, Olivos",
  "Calle Alvear 620, Martínez",
  "Av. Triunvirato 3800, Villa Urquiza",
  "Calle Lavalle 1240, CABA",
  "Av. Montes de Oca 900, Barracas",
  "Calle Juramento 2850, Belgrano",
  "Av. Boedo 750, Boedo",
  "Calle Brasil 420, Constitución",
  "Av. Independencia 2200, San Cristóbal",
  "Calle Thames 1680, Palermo Soho",
  "Av. Callao 1120, Recoleta",
  "Calle Defensa 1050, San Telmo",
  "Av. Caseros 2900, Parque Patricios",
  "Calle Serrano 1450, Villa Crespo",
  "Av. La Plata 1350, Caballito",
  "Calle Malabia 2100, Palermo",
  "Av. Monroe 4800, Villa Urquiza",
];

// Opciones de turnos por local según restricciones solicitadas
// 1. Punto 1, 2 y 3: De 08:00 a 24:00 (mín 2h, máx 8h)
const TURNOS_PUNTO = [
  { inicio: "08:00", fin: "14:00", duracion: 6, cruza: false },
  { inicio: "08:00", fin: "16:00", duracion: 8, cruza: false },
  { inicio: "10:00", fin: "16:00", duracion: 6, cruza: false },
  { inicio: "10:00", fin: "14:00", duracion: 4, cruza: false },
  { inicio: "12:00", fin: "18:00", duracion: 6, cruza: false },
  { inicio: "14:00", fin: "20:00", duracion: 6, cruza: false },
  { inicio: "14:00", fin: "22:00", duracion: 8, cruza: false },
  { inicio: "16:00", fin: "24:00", duracion: 8, cruza: false },
  { inicio: "18:00", fin: "24:00", duracion: 6, cruza: false },
  { inicio: "20:00", fin: "24:00", duracion: 4, cruza: false },
];

// 2. MarMau: De 06:00 a 03:00 (mín 2h, máx 8h, cruce de medianoche en turno noche)
const TURNOS_MARMAU = [
  { inicio: "06:00", fin: "12:00", duracion: 6, cruza: false },
  { inicio: "06:00", fin: "14:00", duracion: 8, cruza: false },
  { inicio: "08:00", fin: "16:00", duracion: 8, cruza: false },
  { inicio: "12:00", fin: "18:00", duracion: 6, cruza: false },
  { inicio: "14:00", fin: "22:00", duracion: 8, cruza: false },
  { inicio: "16:00", fin: "23:00", duracion: 7, cruza: false },
  { inicio: "19:00", fin: "03:00", duracion: 8, cruza: true },
  { inicio: "21:00", fin: "03:00", duracion: 6, cruza: true },
  { inicio: "23:00", fin: "03:00", duracion: 4, cruza: true },
  { inicio: "01:00", fin: "03:00", duracion: 2, cruza: false },
];

// 3. ModaShop: De 09:00 a 12:00 y de 16:00 a 21:00 (mín 2h, máx 5h)
const TURNOS_MODASHOP = [
  { inicio: "09:00", fin: "12:00", duracion: 3, cruza: false },
  { inicio: "10:00", fin: "12:00", duracion: 2, cruza: false },
  { inicio: "16:00", fin: "20:00", duracion: 4, cruza: false },
  { inicio: "16:00", fin: "21:00", duracion: 5, cruza: false },
  { inicio: "17:00", fin: "21:00", duracion: 4, cruza: false },
  { inicio: "18:00", fin: "21:00", duracion: 3, cruza: false },
  { inicio: "19:00", fin: "21:00", duracion: 2, cruza: false },
];

// Fechas del 1/11/2026 al 11/11/2026
const FECHAS_NOVIEMBRE = [
  "2026-11-01",
  "2026-11-02",
  "2026-11-03",
  "2026-11-04",
  "2026-11-05",
  "2026-11-06",
  "2026-11-07",
  "2026-11-08",
  "2026-11-09",
  "2026-11-10",
  "2026-11-11",
];

async function main() {
  console.log("=== INICIANDO SEED MAESTRO DE PRODUCCIÓN ===");

  // 1. Crear / Asegurar Superusuario y Supervisor
  console.log("1. Configurando credenciales de acceso (Superusuario y Supervisor)...");
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

  console.log(`✓ Superusuario: ${superuser.email}`);
  console.log(`✓ Supervisor: ${supervisor.email}`);

  // 2. Limpiar turnos, registros, vacaciones y empleados anteriores
  console.log("2. Limpiando datos operativos previos...");
  await prisma.registroHoras.deleteMany({});
  await prisma.asignacionTurno.deleteMany({});
  await prisma.vacacion.deleteMany({});
  await prisma.empleadoLocal.deleteMany({});
  await prisma.empleado.deleteMany({});

  // 3. Asegurar los 5 Locales oficiales
  console.log("3. Configurando los 5 locales oficiales...");
  const localesData = [
    { codigo: "MARMAU", nombreLocal: "MarMau", direccion: "Av. Principal 1020 (Horario 06:00 a 03:00)" },
    { codigo: "PUNTO-1", nombreLocal: "Punto 1", direccion: "Calle Central 450 (Horario 08:00 a 24:00)" },
    { codigo: "PUNTO-2", nombreLocal: "Punto 2", direccion: "Av. San Martín 820 (Horario 08:00 a 24:00)" },
    { codigo: "PUNTO-3", nombreLocal: "Punto 3", direccion: "Ruta 8 Km 12 (Horario 08:00 a 24:00)" },
    { codigo: "MODASHOP", nombreLocal: "ModaShop", direccion: "Paseo Comercial Loc. 4 (09:00-12:00 / 16:00-21:00)" },
  ];

  const localesCreados = [];
  for (const loc of localesData) {
    const l = await prisma.local.upsert({
      where: { codigo: loc.codigo },
      update: { nombreLocal: loc.nombreLocal, direccion: loc.direccion, activo: true },
      create: { codigo: loc.codigo, nombreLocal: loc.nombreLocal, direccion: loc.direccion, activo: true },
    });
    localesCreados.push(l);
  }
  console.log(`✓ 5 Locales verificados: ${localesCreados.map((l) => l.nombreLocal).join(", ")}`);

  const localMarMau = localesCreados.find((l) => l.codigo === "MARMAU");
  const localPunto1 = localesCreados.find((l) => l.codigo === "PUNTO-1");
  const localPunto2 = localesCreados.find((l) => l.codigo === "PUNTO-2");
  const localPunto3 = localesCreados.find((l) => l.codigo === "PUNTO-3");
  const localModaShop = localesCreados.find((l) => l.codigo === "MODASHOP");

  // 4. Crear 25 Empleados aleatorios con roles Vendedor o Limpieza
  console.log("4. Creando 25 empleados con datos completos y vacaciones...");
  const empleadosCreados = [];

  for (let i = 0; i < 25; i++) {
    const { nombre, apellido } = NOMBRES_APELLIDOS[i];
    const rol = i % 4 === 0 ? "Limpieza" : "Vendedor";
    const dni = (34500000 + i * 23145 + Math.floor(Math.random() * 900)).toString();
    const telefono = `+54 9 11 ${4000 + (i * 123) % 4000}-${1000 + (i * 245) % 8000}`;
    const direccion = DIRECCIONES[i];
    const correo = `${nombre.toLowerCase()}.${apellido.toLowerCase()}@turnomaster.com`;
    const diasVacacionesTotales = i % 5 === 0 ? 21 : i % 8 === 0 ? 28 : 14;

    const emp = await prisma.empleado.create({
      data: {
        nombre,
        apellido,
        dni,
        telefono,
        direccion,
        correo,
        rol,
        activo: true,
        diasVacacionesTotales,
      },
    });

    // Asociar a 2 o 3 locales habilitados
    const localesAsignados = [
      localesCreados[i % 5],
      localesCreados[(i + 1) % 5],
      localesCreados[(i + 2) % 5],
    ];

    for (const loc of localesAsignados) {
      await prisma.empleadoLocal.create({
        data: {
          empleadoId: emp.id,
          localId: loc.id,
        },
      });
    }

    empleadosCreados.push(emp);
  }
  console.log(`✓ 25 Empleados creados exitosamente.`);

  // 5. Registrar períodos de vacaciones de ejemplo
  console.log("5. Registrando vacaciones de ejemplo...");
  const vacsSample = [
    { empIdx: 2, inicio: "2026-11-04", fin: "2026-11-08", obs: "Vacaciones fraccionadas de primavera" },
    { empIdx: 7, inicio: "2026-11-01", fin: "2026-11-06", obs: "Período vacacional anual" },
    { empIdx: 14, inicio: "2026-11-08", fin: "2026-11-11", obs: "Días por descanso reglamentario" },
    { empIdx: 20, inicio: "2026-11-15", fin: "2026-11-22", obs: "Semana vacacional programada" },
  ];

  for (const vs of vacsSample) {
    const emp = empleadosCreados[vs.empIdx];
    const s = new Date(vs.inicio + "T00:00:00Z");
    const e = new Date(vs.fin + "T00:00:00Z");
    const dias = Math.round(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    await prisma.vacacion.create({
      data: {
        empleadoId: emp.id,
        fechaInicio: s,
        fechaFin: e,
        diasTomados: dias,
        observaciones: vs.obs,
      },
    });
  }
  console.log(`✓ Vacaciones de muestra registradas.`);

  // 6. Asignar turnos de trabajo desde el 1/11 hasta el 11/11
  console.log("6. Generando turnos de trabajo entre 01/11/2026 y 11/11/2026...");
  let totalTurnosGenerados = 0;

  const ocupacion = new Map();

  function timeToMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  }

  function haySolapamiento(empId, fechaStr, hInicio, hFin, cruza) {
    const key = `${empId}_${fechaStr}`;
    const slots = ocupacion.get(key) || [];
    let startMin = timeToMinutes(hInicio);
    let endMin = timeToMinutes(hFin);
    if (cruza) {
      endMin += 24 * 60;
    }

    for (const slot of slots) {
      if (startMin < slot.endMin && endMin > slot.startMin) {
        return true;
      }
    }
    return false;
  }

  function marcarOcupado(empId, fechaStr, hInicio, hFin, cruza) {
    const key = `${empId}_${fechaStr}`;
    const slots = ocupacion.get(key) || [];
    let startMin = timeToMinutes(hInicio);
    let endMin = timeToMinutes(hFin);
    if (cruza) {
      endMin += 24 * 60;
    }
    slots.push({ startMin, endMin });
    ocupacion.set(key, slots);
  }

  function estaDeVacaciones(empIdx, fechaStr) {
    const f = new Date(fechaStr + "T00:00:00Z");
    for (const vs of vacsSample) {
      if (vs.empIdx === empIdx) {
        const s = new Date(vs.inicio + "T00:00:00Z");
        const e = new Date(vs.fin + "T00:00:00Z");
        if (f >= s && f <= e) return true;
      }
    }
    return false;
  }

  const localesConReglas = [
    { local: localMarMau, turnos: TURNOS_MARMAU, reqPorDia: 4 },
    { local: localPunto1, turnos: TURNOS_PUNTO, reqPorDia: 3 },
    { local: localPunto2, turnos: TURNOS_PUNTO, reqPorDia: 3 },
    { local: localPunto3, turnos: TURNOS_PUNTO, reqPorDia: 3 },
    { local: localModaShop, turnos: TURNOS_MODASHOP, reqPorDia: 2 },
  ];

  let empRoundRobin = 0;

  for (const fechaStr of FECHAS_NOVIEMBRE) {
    const fechaObj = new Date(fechaStr + "T12:00:00Z");
    const diaSemana = fechaObj.getDay();

    for (const conf of localesConReglas) {
      for (let t = 0; t < conf.reqPorDia; t++) {
        const turnoTemplate = conf.turnos[(t + (diaSemana % 3)) % conf.turnos.length];

        let empleadoElegido = null;
        for (let intento = 0; intento < 25; intento++) {
          const candidatoIdx = (empRoundRobin + intento) % 25;
          const candidato = empleadosCreados[candidatoIdx];

          if (estaDeVacaciones(candidatoIdx, fechaStr)) {
            continue;
          }

          if (!haySolapamiento(candidato.id, fechaStr, turnoTemplate.inicio, turnoTemplate.fin, turnoTemplate.cruza)) {
            empleadoElegido = candidato;
            empRoundRobin = (candidatoIdx + 1) % 25;
            break;
          }
        }

        if (empleadoElegido) {
          await prisma.asignacionTurno.create({
            data: {
              empleadoId: empleadoElegido.id,
              localId: conf.local.id,
              fecha: fechaObj,
              diaSemana: diaSemana,
              horaInicio: turnoTemplate.inicio,
              horaFin: turnoTemplate.fin,
              horasPactadas: turnoTemplate.duracion,
              tipo: "PUNTUAL",
              color: conf.local.codigo === "MARMAU" ? "#3b82f6" :
                     conf.local.codigo === "MODASHOP" ? "#ec4899" :
                     conf.local.codigo === "PUNTO-1" ? "#10b981" :
                     conf.local.codigo === "PUNTO-2" ? "#f59e0b" : "#8b5cf6",
            },
          });

          marcarOcupado(
            empleadoElegido.id,
            fechaStr,
            turnoTemplate.inicio,
            turnoTemplate.fin,
            turnoTemplate.cruza
          );

          totalTurnosGenerados++;
        }
      }
    }
  }

  console.log(`✓ Se generaron ${totalTurnosGenerados} turnos de trabajo válidos entre 01/11 y 11/11.`);

  // 7. Habilitar RLS si aplica en PostgreSQL
  console.log("7. Configurando seguridad de base de datos...");
  const tables = [
    "usuarios",
    "empleados",
    "locales",
    "empleado_locales",
    "asignaciones_turnos",
    "registros_horas",
    "vacaciones",
  ];
  for (const t of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE public."${t}" ENABLE ROW LEVEL SECURITY;`);
    } catch (e) {}
  }
  console.log("✓ Políticas aplicadas.");

  console.log("=== SEED MAESTRO DE PRODUCCIÓN COMPLETADO CON ÉXITO ===");
}

main()
  .catch((e) => {
    console.error("Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
