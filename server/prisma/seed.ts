import prisma from '../source/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Iniciando seed de la base de datos...');

  // ============================================================
  // 1. CREAR ROLES
  // ============================================================
  console.log('Creando roles...');

  const roleCliente = await prisma.role.upsert({
    where: { name: 'cliente' },
    update: {},
    create: { name: 'cliente' },
  });

  const roleTecnico = await prisma.role.upsert({
    where: { name: 'tecnico' },
    update: {},
    create: { name: 'tecnico' },
  });

  const roleAdmin = await prisma.role.upsert({
    where: { name: 'administrador' },
    update: {},
    create: { name: 'administrador' },
  });

  console.log('Roles creados:', { roleCliente, roleTecnico, roleAdmin });

  // ============================================================
  // 2. CREAR USUARIO SUPER ADMIN
  // ============================================================
  console.log('Creando usuario super administrador...');

  const passwordHash = await bcrypt.hash('Admin123!', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@savantsolver.com' },
    update: {},
    create: {
      roleId: roleAdmin.id,
      email: 'admin@savantsolver.com',
      passwordHash: passwordHash,
      firstName: 'Super',
      lastName: 'Administrador',
      phone: '1234567890',
    },
  });

  console.log('Super admin creado:', {
    id: superAdmin.id,
    email: superAdmin.email,
    nombre: `${superAdmin.firstName} ${superAdmin.lastName}`,
  });

  // ============================================================
  // 3. CREAR ESPECIALIDADES SEGÚN EL PRIMER AVANCE
  // ============================================================
  console.log('Creando especialidades...');

  const especialidades = await Promise.all([
    // Hardware
    prisma.specialty.upsert({
      where: { name: 'Técnico Hardware' },
      update: {},
      create: {
        name: 'Técnico Hardware',
        description: 'Técnico especializado en componentes de hardware',
      },
    }),
    prisma.specialty.upsert({
      where: { name: 'Especialista Periféricos' },
      update: {},
      create: {
        name: 'Especialista Periféricos',
        description: 'Especialista en periféricos y dispositivos',
      },
    }),
    // Software
    prisma.specialty.upsert({
      where: { name: 'Analista Software' },
      update: {},
      create: {
        name: 'Analista Software',
        description: 'Analista de software y aplicaciones',
      },
    }),
    prisma.specialty.upsert({
      where: { name: 'Administrador Sistemas' },
      update: {},
      create: {
        name: 'Administrador Sistemas',
        description: 'Administrador de sistemas operativos',
      },
    }),
    // Red
    prisma.specialty.upsert({
      where: { name: 'Ingeniero Redes' },
      update: {},
      create: {
        name: 'Ingeniero Redes',
        description: 'Ingeniero especializado en redes',
      },
    }),
    prisma.specialty.upsert({
      where: { name: 'Administrador Red' },
      update: {},
      create: {
        name: 'Administrador Red',
        description: 'Administrador de infraestructura de red',
      },
    }),
    // Seguridad
    prisma.specialty.upsert({
      where: { name: 'Especialista Seguridad' },
      update: {},
      create: {
        name: 'Especialista Seguridad',
        description: 'Especialista en seguridad informática',
      },
    }),
    prisma.specialty.upsert({
      where: { name: 'Auditor TI' },
      update: {},
      create: {
        name: 'Auditor TI',
        description: 'Auditor de tecnologías de la información',
      },
    }),
  ]);

  console.log('Especialidades creadas:', especialidades.length);

  // ============================================================
  // 4. CREAR TÉCNICOS DE EJEMPLO
  // ============================================================
  console.log('Creando tecnicos...');

  const passwordTecnico = await bcrypt.hash('Tecnico123!', 10);

  // Técnico 1: Técnico Hardware y Especialista Periféricos
  const tecnico1 = await prisma.user.upsert({
    where: { email: 'juan.perez@savantsolver.com' },
    update: {},
    create: {
      roleId: roleTecnico.id,
      email: 'juan.perez@savantsolver.com',
      passwordHash: passwordTecnico,
      firstName: 'Juan',
      lastName: 'Perez Garcia',
      phone: '+34 612 345 678',
      workload: 0,
      status: 'Disponible',
      specialties: {
        create: [
          { specialtyId: especialidades[0].id }, // Técnico Hardware
          { specialtyId: especialidades[1].id }, // Especialista Periféricos
        ],
      },
    },
  });

  // Técnico 2: Analista Software
  const tecnico2 = await prisma.user.upsert({
    where: { email: 'maria.lopez@savantsolver.com' },
    update: {},
    create: {
      roleId: roleTecnico.id,
      email: 'maria.lopez@savantsolver.com',
      passwordHash: passwordTecnico,
      firstName: 'Maria',
      lastName: 'Lopez Martinez',
      phone: '+34 623 456 789',
      workload: 0,
      status: 'Disponible',
      specialties: {
        create: [
          { specialtyId: especialidades[2].id }, // Analista Software
          { specialtyId: especialidades[3].id }, // Administrador Sistemas
        ],
      },
    },
  });

  // Técnico 3: Ingeniero Redes
  const tecnico3 = await prisma.user.upsert({
    where: { email: 'carlos.rodriguez@savantsolver.com' },
    update: {},
    create: {
      roleId: roleTecnico.id,
      email: 'carlos.rodriguez@savantsolver.com',
      passwordHash: passwordTecnico,
      firstName: 'Carlos',
      lastName: 'Rodriguez Sanchez',
      phone: '+34 634 567 890',
      workload: 0,
      status: 'Disponible',
      specialties: {
        create: [
          { specialtyId: especialidades[4].id }, // Ingeniero Redes
          { specialtyId: especialidades[5].id }, // Administrador Red
        ],
      },
    },
  });

  // Técnico 4: Especialista Seguridad
  const tecnico4 = await prisma.user.upsert({
    where: { email: 'sofia.martinez@savantsolver.com' },
    update: {},
    create: {
      roleId: roleTecnico.id,
      email: 'sofia.martinez@savantsolver.com',
      passwordHash: passwordTecnico,
      firstName: 'Sofia',
      lastName: 'Martinez Ruiz',
      phone: '+34 645 678 901',
      workload: 0,
      status: 'Disponible',
      specialties: {
        create: [
          { specialtyId: especialidades[6].id }, // Especialista Seguridad
          { specialtyId: especialidades[7].id }, // Auditor TI
        ],
      },
    },
  });

  console.log('Tecnicos creados:');
  console.log(`   - ${tecnico1.firstName} ${tecnico1.lastName} (${tecnico1.email})`);
  console.log(`   - ${tecnico2.firstName} ${tecnico2.lastName} (${tecnico2.email})`);
  console.log(`   - ${tecnico3.firstName} ${tecnico3.lastName} (${tecnico3.email})`);
  console.log(`   - ${tecnico4.firstName} ${tecnico4.lastName} (${tecnico4.email})`);

  // ============================================================
  // 5. CREAR SLAs SEGÚN EL PRIMER AVANCE
  // ============================================================
  console.log('Creando SLAs...');

  const slaHardware = await prisma.sla.upsert({
    where: { name: 'SLA Hardware' },
    update: {},
    create: {
      name: 'SLA Hardware',
      responseTimeMinutes: 120,     // 2 horas
      resolutionTimeMinutes: 1440,  // 24 horas
    },
  });

  const slaSoftware = await prisma.sla.upsert({
    where: { name: 'SLA Software' },
    update: {},
    create: {
      name: 'SLA Software',
      responseTimeMinutes: 60,      // 1 hora
      resolutionTimeMinutes: 480,   // 8 horas
    },
  });

  const slaRed = await prisma.sla.upsert({
    where: { name: 'SLA Red' },
    update: {},
    create: {
      name: 'SLA Red',
      responseTimeMinutes: 30,      // 30 minutos
      resolutionTimeMinutes: 240,   // 4 horas
    },
  });

  const slaSeguridad = await prisma.sla.upsert({
    where: { name: 'SLA Seguridad' },
    update: {},
    create: {
      name: 'SLA Seguridad',
      responseTimeMinutes: 15,      // 15 minutos
      resolutionTimeMinutes: 120,   // 2 horas
    },
  });

  console.log('SLAs creados: 4');

  // ============================================================
  // 6. CREAR TAGS/ETIQUETAS SEGÚN EL PRIMER AVANCE
  // ============================================================
  console.log('Creando tags...');

  // Hardware
  const tagImpresora = await prisma.tag.upsert({
    where: { name: 'Impresora' },
    update: {},
    create: { name: 'Impresora', description: 'Problemas con impresoras' },
  });

  const tagMonitor = await prisma.tag.upsert({
    where: { name: 'Monitor' },
    update: {},
    create: { name: 'Monitor', description: 'Problemas con monitores' },
  });

  const tagTeclado = await prisma.tag.upsert({
    where: { name: 'Teclado' },
    update: {},
    create: { name: 'Teclado', description: 'Problemas con teclados' },
  });

  const tagMouse = await prisma.tag.upsert({
    where: { name: 'Mouse' },
    update: {},
    create: { name: 'Mouse', description: 'Problemas con mouse' },
  });

  // Software
  const tagOffice = await prisma.tag.upsert({
    where: { name: 'Office' },
    update: {},
    create: { name: 'Office', description: 'Problemas con Office' },
  });

  const tagSO = await prisma.tag.upsert({
    where: { name: 'Sistema Operativo' },
    update: {},
    create: { name: 'Sistema Operativo', description: 'Problemas con el sistema operativo' },
  });

  const tagAntivirus = await prisma.tag.upsert({
    where: { name: 'Antivirus' },
    update: {},
    create: { name: 'Antivirus', description: 'Problemas con antivirus' },
  });

  const tagNavegador = await prisma.tag.upsert({
    where: { name: 'Navegador' },
    update: {},
    create: { name: 'Navegador', description: 'Problemas con navegadores' },
  });

  // Red
  const tagInternet = await prisma.tag.upsert({
    where: { name: 'Internet' },
    update: {},
    create: { name: 'Internet', description: 'Problemas de conexión a Internet' },
  });

  const tagWiFi = await prisma.tag.upsert({
    where: { name: 'WiFi' },
    update: {},
    create: { name: 'WiFi', description: 'Problemas con WiFi' },
  });

  const tagVPN = await prisma.tag.upsert({
    where: { name: 'VPN' },
    update: {},
    create: { name: 'VPN', description: 'Problemas con VPN' },
  });

  const tagCorreo = await prisma.tag.upsert({
    where: { name: 'Correo' },
    update: {},
    create: { name: 'Correo', description: 'Problemas con correo electrónico' },
  });

  // Seguridad
  const tagAccesos = await prisma.tag.upsert({
    where: { name: 'Accesos' },
    update: {},
    create: { name: 'Accesos', description: 'Problemas de accesos y permisos' },
  });

  const tagContraseñas = await prisma.tag.upsert({
    where: { name: 'Contraseñas' },
    update: {},
    create: { name: 'Contraseñas', description: 'Problemas con contraseñas' },
  });

  const tagVirus = await prisma.tag.upsert({
    where: { name: 'Virus' },
    update: {},
    create: { name: 'Virus', description: 'Problemas con virus' },
  });

  const tagBackup = await prisma.tag.upsert({
    where: { name: 'Backup' },
    update: {},
    create: { name: 'Backup', description: 'Problemas con respaldos' },
  });

  console.log('Tags creados: 16');

  // ============================================================
  // 7. CREAR CATEGORÍAS CON RELACIONES SEGÚN EL PRIMER AVANCE
  // ============================================================
  console.log('Creando categorias con relaciones...');

  // Categoría Hardware
  const catHardware = await prisma.category.upsert({
    where: { name: 'Hardware' },
    update: {},
    create: {
      name: 'Hardware',
      description: 'Problemas de hardware y periféricos',
      slaId: slaHardware.id,
    },
  });

  // Relacionar tags con Hardware
  await prisma.categoryTag.upsert({
    where: { categoryId_tagId: { categoryId: catHardware.id, tagId: tagImpresora.id } },
    update: {},
    create: { categoryId: catHardware.id, tagId: tagImpresora.id },
  });
  await prisma.categoryTag.upsert({
    where: { categoryId_tagId: { categoryId: catHardware.id, tagId: tagMonitor.id } },
    update: {},
    create: { categoryId: catHardware.id, tagId: tagMonitor.id },
  });
  await prisma.categoryTag.upsert({
    where: { categoryId_tagId: { categoryId: catHardware.id, tagId: tagTeclado.id } },
    update: {},
    create: { categoryId: catHardware.id, tagId: tagTeclado.id },
  });
  await prisma.categoryTag.upsert({
    where: { categoryId_tagId: { categoryId: catHardware.id, tagId: tagMouse.id } },
    update: {},
    create: { categoryId: catHardware.id, tagId: tagMouse.id },
  });

  // Relacionar especialidades con Hardware
  await prisma.categorySpecialty.upsert({
    where: { categoryId_specialtyId: { categoryId: catHardware.id, specialtyId: especialidades[0].id } },
    update: {},
    create: { categoryId: catHardware.id, specialtyId: especialidades[0].id }, // Técnico Hardware
  });
  await prisma.categorySpecialty.upsert({
    where: { categoryId_specialtyId: { categoryId: catHardware.id, specialtyId: especialidades[1].id } },
    update: {},
    create: { categoryId: catHardware.id, specialtyId: especialidades[1].id }, // Especialista Periféricos
  });

  // Categoría Software
  const catSoftware = await prisma.category.upsert({
    where: { name: 'Software' },
    update: {},
    create: {
      name: 'Software',
      description: 'Problemas de software y aplicaciones',
      slaId: slaSoftware.id,
    },
  });

  // Relacionar tags con Software
  await prisma.categoryTag.upsert({
    where: { categoryId_tagId: { categoryId: catSoftware.id, tagId: tagOffice.id } },
    update: {},
    create: { categoryId: catSoftware.id, tagId: tagOffice.id },
  });
  await prisma.categoryTag.upsert({
    where: { categoryId_tagId: { categoryId: catSoftware.id, tagId: tagSO.id } },
    update: {},
    create: { categoryId: catSoftware.id, tagId: tagSO.id },
  });
  await prisma.categoryTag.upsert({
    where: { categoryId_tagId: { categoryId: catSoftware.id, tagId: tagAntivirus.id } },
    update: {},
    create: { categoryId: catSoftware.id, tagId: tagAntivirus.id },
  });
  await prisma.categoryTag.upsert({
    where: { categoryId_tagId: { categoryId: catSoftware.id, tagId: tagNavegador.id } },
    update: {},
    create: { categoryId: catSoftware.id, tagId: tagNavegador.id },
  });

  // Relacionar especialidades con Software
  await prisma.categorySpecialty.upsert({
    where: { categoryId_specialtyId: { categoryId: catSoftware.id, specialtyId: especialidades[2].id } },
    update: {},
    create: { categoryId: catSoftware.id, specialtyId: especialidades[2].id }, // Analista Software
  });
  await prisma.categorySpecialty.upsert({
    where: { categoryId_specialtyId: { categoryId: catSoftware.id, specialtyId: especialidades[3].id } },
    update: {},
    create: { categoryId: catSoftware.id, specialtyId: especialidades[3].id }, // Administrador Sistemas
  });

  // Categoría Red
  const catRed = await prisma.category.upsert({
    where: { name: 'Red' },
    update: {},
    create: {
      name: 'Red',
      description: 'Problemas de red y conectividad',
      slaId: slaRed.id,
    },
  });

  // Relacionar tags con Red
  await prisma.categoryTag.upsert({
    where: { categoryId_tagId: { categoryId: catRed.id, tagId: tagInternet.id } },
    update: {},
    create: { categoryId: catRed.id, tagId: tagInternet.id },
  });
  await prisma.categoryTag.upsert({
    where: { categoryId_tagId: { categoryId: catRed.id, tagId: tagWiFi.id } },
    update: {},
    create: { categoryId: catRed.id, tagId: tagWiFi.id },
  });
  await prisma.categoryTag.upsert({
    where: { categoryId_tagId: { categoryId: catRed.id, tagId: tagVPN.id } },
    update: {},
    create: { categoryId: catRed.id, tagId: tagVPN.id },
  });
  await prisma.categoryTag.upsert({
    where: { categoryId_tagId: { categoryId: catRed.id, tagId: tagCorreo.id } },
    update: {},
    create: { categoryId: catRed.id, tagId: tagCorreo.id },
  });

  // Relacionar especialidades con Red
  await prisma.categorySpecialty.upsert({
    where: { categoryId_specialtyId: { categoryId: catRed.id, specialtyId: especialidades[4].id } },
    update: {},
    create: { categoryId: catRed.id, specialtyId: especialidades[4].id }, // Ingeniero Redes
  });
  await prisma.categorySpecialty.upsert({
    where: { categoryId_specialtyId: { categoryId: catRed.id, specialtyId: especialidades[5].id } },
    update: {},
    create: { categoryId: catRed.id, specialtyId: especialidades[5].id }, // Administrador Red
  });

  // Categoría Seguridad
  const catSeguridad = await prisma.category.upsert({
    where: { name: 'Seguridad' },
    update: {},
    create: {
      name: 'Seguridad',
      description: 'Problemas de seguridad informática',
      slaId: slaSeguridad.id,
    },
  });

  // Relacionar tags con Seguridad
  await prisma.categoryTag.upsert({
    where: { categoryId_tagId: { categoryId: catSeguridad.id, tagId: tagAccesos.id } },
    update: {},
    create: { categoryId: catSeguridad.id, tagId: tagAccesos.id },
  });
  await prisma.categoryTag.upsert({
    where: { categoryId_tagId: { categoryId: catSeguridad.id, tagId: tagContraseñas.id } },
    update: {},
    create: { categoryId: catSeguridad.id, tagId: tagContraseñas.id },
  });
  await prisma.categoryTag.upsert({
    where: { categoryId_tagId: { categoryId: catSeguridad.id, tagId: tagVirus.id } },
    update: {},
    create: { categoryId: catSeguridad.id, tagId: tagVirus.id },
  });
  await prisma.categoryTag.upsert({
    where: { categoryId_tagId: { categoryId: catSeguridad.id, tagId: tagBackup.id } },
    update: {},
    create: { categoryId: catSeguridad.id, tagId: tagBackup.id },
  });

  // Relacionar especialidades con Seguridad
  await prisma.categorySpecialty.upsert({
    where: { categoryId_specialtyId: { categoryId: catSeguridad.id, specialtyId: especialidades[6].id } },
    update: {},
    create: { categoryId: catSeguridad.id, specialtyId: especialidades[6].id }, // Especialista Seguridad
  });
  await prisma.categorySpecialty.upsert({
    where: { categoryId_specialtyId: { categoryId: catSeguridad.id, specialtyId: especialidades[7].id } },
    update: {},
    create: { categoryId: catSeguridad.id, specialtyId: especialidades[7].id }, // Auditor TI
  });

  console.log('Categorias creadas: 4 (con tags y especialidades asociadas)');

  // ============================================================
  // 8. CREAR USUARIOS CLIENTES DE EJEMPLO
  // ============================================================
  console.log('Creando usuarios clientes...');

  const passwordCliente = await bcrypt.hash('Cliente123!', 10);

  const cliente1 = await prisma.user.upsert({
    where: { email: 'laura.gomez@empresa.com' },
    update: {},
    create: {
      roleId: roleCliente.id,
      email: 'laura.gomez@empresa.com',
      passwordHash: passwordCliente,
      firstName: 'Laura',
      lastName: 'Gomez Fernandez',
      phone: '+34 645 123 456',
    },
  });

  const cliente2 = await prisma.user.upsert({
    where: { email: 'pedro.sanchez@empresa.com' },
    update: {},
    create: {
      roleId: roleCliente.id,
      email: 'pedro.sanchez@empresa.com',
      passwordHash: passwordCliente,
      firstName: 'Pedro',
      lastName: 'Sanchez Torres',
      phone: '+34 656 234 567',
    },
  });

  const cliente3 = await prisma.user.upsert({
    where: { email: 'ana.martin@empresa.com' },
    update: {},
    create: {
      roleId: roleCliente.id,
      email: 'ana.martin@empresa.com',
      passwordHash: passwordCliente,
      firstName: 'Ana',
      lastName: 'Martin Diaz',
      phone: '+34 667 345 678',
    },
  });

  console.log('Clientes creados: 3');

  // ============================================================
  // 9. CREAR TICKETS DE EJEMPLO
  // ============================================================
  console.log('Creando tickets...');

  const now = new Date();

  // Ticket 1: PENDIENTE - Sin asignar (Categoría Red)
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'No puedo acceder a mi correo electrónico',
      description: 'Desde esta mañana no puedo iniciar sesión en mi correo corporativo. Me aparece un error de autenticación.',
      status: 'Pendiente',
      priority: 'Alta',
      userId: cliente1.id,
      categoryId: catRed.id, // Red (correo)
      responseDeadline: new Date(now.getTime() + slaRed.responseTimeMinutes * 60000),
      resolutionDeadline: new Date(now.getTime() + slaRed.resolutionTimeMinutes * 60000),
      createdAt: new Date(now.getTime() - 30 * 60000), // Hace 30 minutos
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket1.id,
      previousStatus: null,
      newStatus: 'Pendiente',
      userId: cliente1.id,
      comment: 'Ticket creado por el usuario',
      changedAt: new Date(now.getTime() - 30 * 60000),
    },
  });

  // Ticket 2: ASIGNADO - Asignado a técnico pero no iniciado (Categoría Hardware)
  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Impresora no responde en la red',
      description: 'La impresora del departamento no aparece en la lista de dispositivos de red. Ya intenté reiniciarla.',
      status: 'Asignado',
      priority: 'Media',
      userId: cliente2.id,
      categoryId: catHardware.id, // Hardware (impresora)
      assignedTechnicianId: tecnico1.id,
      responseDeadline: new Date(now.getTime() + slaHardware.responseTimeMinutes * 60000),
      resolutionDeadline: new Date(now.getTime() + slaHardware.resolutionTimeMinutes * 60000),
      createdAt: new Date(now.getTime() - 2 * 60 * 60000), // Hace 2 horas
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket2.id,
      previousStatus: null,
      newStatus: 'Pendiente',
      userId: cliente2.id,
      comment: 'Ticket creado',
      changedAt: new Date(now.getTime() - 2 * 60 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket2.id,
      previousStatus: 'Pendiente',
      newStatus: 'Asignado',
      userId: superAdmin.id,
      comment: 'Ticket asignado a Juan Perez',
      justification: 'Especialista en redes y hardware',
      changedAt: new Date(now.getTime() - 1.5 * 60 * 60000),
    },
  });

  // Ticket 3: EN_PROCESO - Técnico trabajando en él (Categoría Hardware)
  const ticket3 = await prisma.ticket.create({
    data: {
      title: 'Ordenador no enciende después de actualización',
      description: 'Realicé una actualización de Windows y ahora el equipo se queda en pantalla negra al iniciar.',
      status: 'En_Proceso',
      priority: 'Alta',
      userId: cliente3.id,
      categoryId: catHardware.id, // Hardware (ordenador)
      assignedTechnicianId: tecnico1.id,
      firstResponseAt: new Date(now.getTime() - 3 * 60 * 60000),
      responseCompliance: true,
      responseDeadline: new Date(now.getTime() + slaHardware.responseTimeMinutes * 60000),
      resolutionDeadline: new Date(now.getTime() + slaHardware.resolutionTimeMinutes * 60000),
      createdAt: new Date(now.getTime() - 4 * 60 * 60000), // Hace 4 horas
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket3.id,
      previousStatus: null,
      newStatus: 'Pendiente',
      userId: cliente3.id,
      comment: 'Ticket creado - Urgente',
      changedAt: new Date(now.getTime() - 4 * 60 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket3.id,
      previousStatus: 'Pendiente',
      newStatus: 'Asignado',
      userId: superAdmin.id,
      comment: 'Asignado a técnico especialista en hardware',
      changedAt: new Date(now.getTime() - 3.5 * 60 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket3.id,
      previousStatus: 'Asignado',
      newStatus: 'En_Proceso',
      userId: tecnico1.id,
      comment: 'Iniciando diagnóstico del equipo',
      justification: 'Revisando configuración de BIOS y sistema operativo',
      changedAt: new Date(now.getTime() - 3 * 60 * 60000),
    },
  });

  // Ticket 4: RESUELTO - Completado pero pendiente de cierre (Categoría Software)
  const ticket4 = await prisma.ticket.create({
    data: {
      title: 'Solicitud de instalación de software contable',
      description: 'Necesito que me instalen el software de contabilidad QuickBooks en mi estación de trabajo.',
      status: 'Resuelto',
      priority: 'Baja',
      userId: cliente1.id,
      categoryId: catSoftware.id, // Software
      assignedTechnicianId: tecnico2.id,
      firstResponseAt: new Date(now.getTime() - 23 * 60 * 60000),
      responseCompliance: true,
      responseDeadline: new Date(now.getTime() + slaSoftware.responseTimeMinutes * 60000),
      resolutionDeadline: new Date(now.getTime() + slaSoftware.resolutionTimeMinutes * 60000),
      createdAt: new Date(now.getTime() - 24 * 60 * 60000), // Hace 1 día
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket4.id,
      previousStatus: null,
      newStatus: 'Pendiente',
      userId: cliente1.id,
      comment: 'Solicitud de instalación',
      changedAt: new Date(now.getTime() - 24 * 60 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket4.id,
      previousStatus: 'Pendiente',
      newStatus: 'Asignado',
      userId: superAdmin.id,
      comment: 'Asignado a especialista en software',
      changedAt: new Date(now.getTime() - 23 * 60 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket4.id,
      previousStatus: 'Asignado',
      newStatus: 'En_Proceso',
      userId: tecnico2.id,
      comment: 'Iniciando instalación del software',
      changedAt: new Date(now.getTime() - 22 * 60 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket4.id,
      previousStatus: 'En_Proceso',
      newStatus: 'Resuelto',
      userId: tecnico2.id,
      comment: 'Software instalado y configurado correctamente',
      justification: 'Instalación completada. Usuario notificado para verificación.',
      changedAt: new Date(now.getTime() - 2 * 60 * 60000),
    },
  });

  // Ticket 5: CERRADO - Completado con valoración (Categoría Red)
  const ticket5 = await prisma.ticket.create({
    data: {
      title: 'Problema de conexión VPN',
      description: 'No puedo conectarme a la VPN corporativa desde casa. Me sale error de timeout.',
      status: 'Cerrado',
      priority: 'Alta',
      userId: cliente2.id,
      categoryId: catRed.id, // Red (VPN)
      assignedTechnicianId: tecnico3.id,
      firstResponseAt: new Date(now.getTime() - 47 * 60 * 60000),
      closedAt: new Date(now.getTime() - 24 * 60 * 60000),
      responseCompliance: true,
      resolutionCompliance: true,
      responseDeadline: new Date(now.getTime() + slaRed.responseTimeMinutes * 60000),
      resolutionDeadline: new Date(now.getTime() + slaRed.resolutionTimeMinutes * 60000),
      createdAt: new Date(now.getTime() - 48 * 60 * 60000), // Hace 2 días
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket5.id,
      previousStatus: null,
      newStatus: 'Pendiente',
      userId: cliente2.id,
      comment: 'No puedo trabajar desde casa sin VPN',
      changedAt: new Date(now.getTime() - 48 * 60 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket5.id,
      previousStatus: 'Pendiente',
      newStatus: 'Asignado',
      userId: superAdmin.id,
      comment: 'Asignado a especialista en redes',
      changedAt: new Date(now.getTime() - 47 * 60 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket5.id,
      previousStatus: 'Asignado',
      newStatus: 'En_Proceso',
      userId: tecnico3.id,
      comment: 'Iniciando diagnóstico de conexión VPN',
      justification: 'Revisando configuración de red y certificados',
      changedAt: new Date(now.getTime() - 46 * 60 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket5.id,
      previousStatus: 'En_Proceso',
      newStatus: 'Resuelto',
      userId: tecnico3.id,
      comment: 'Problema resuelto. Se actualizaron los certificados de seguridad.',
      justification: 'Certificados VPN actualizados. Usuario puede conectarse correctamente.',
      changedAt: new Date(now.getTime() - 25 * 60 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket5.id,
      previousStatus: 'Resuelto',
      newStatus: 'Cerrado',
      userId: cliente2.id,
      comment: 'Confirmado que funciona perfectamente. Gracias!',
      changedAt: new Date(now.getTime() - 24 * 60 * 60000),
    },
  });

  // Valoración para el ticket cerrado
  await prisma.valuation.create({
    data: {
      ticketId: ticket5.id,
      userId: cliente2.id,
      rating: 5,
      comment: 'Excelente servicio. El técnico fue muy profesional y resolvió el problema rápidamente.',
      createdAt: new Date(now.getTime() - 24 * 60 * 60000),
    },
  });

  // Ticket 6: CERRADO - Con valoración media (Categoría Software)
  const ticket6 = await prisma.ticket.create({
    data: {
      title: 'Consulta sobre actualización de sistema',
      description: '¿Es recomendable actualizar a la última versión de Windows 11?',
      status: 'Cerrado',
      priority: 'Baja',
      userId: cliente3.id,
      categoryId: catSoftware.id, // Software (Sistema Operativo)
      assignedTechnicianId: tecnico2.id,
      firstResponseAt: new Date(now.getTime() - 71 * 60 * 60000),
      closedAt: new Date(now.getTime() - 70 * 60 * 60000),
      responseCompliance: true,
      resolutionCompliance: true,
      responseDeadline: new Date(now.getTime() + slaSoftware.responseTimeMinutes * 60000),
      resolutionDeadline: new Date(now.getTime() + slaSoftware.resolutionTimeMinutes * 60000),
      createdAt: new Date(now.getTime() - 72 * 60 * 60000), // Hace 3 días
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket6.id,
      previousStatus: null,
      newStatus: 'Pendiente',
      userId: cliente3.id,
      comment: 'Consulta sobre actualización',
      changedAt: new Date(now.getTime() - 72 * 60 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket6.id,
      previousStatus: 'Pendiente',
      newStatus: 'Asignado',
      userId: superAdmin.id,
      comment: 'Asignado para consulta',
      changedAt: new Date(now.getTime() - 71.5 * 60 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket6.id,
      previousStatus: 'Asignado',
      newStatus: 'En_Proceso',
      userId: tecnico2.id,
      comment: 'Respondiendo consulta',
      changedAt: new Date(now.getTime() - 71 * 60 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket6.id,
      previousStatus: 'En_Proceso',
      newStatus: 'Resuelto',
      userId: tecnico2.id,
      comment: 'Recomendaciones enviadas por correo',
      justification: 'Se enviaron recomendaciones detalladas sobre la actualización',
      changedAt: new Date(now.getTime() - 70.5 * 60 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket6.id,
      previousStatus: 'Resuelto',
      newStatus: 'Cerrado',
      userId: cliente3.id,
      comment: 'Gracias por la información',
      changedAt: new Date(now.getTime() - 70 * 60 * 60000),
    },
  });

  await prisma.valuation.create({
    data: {
      ticketId: ticket6.id,
      userId: cliente3.id,
      rating: 4,
      comment: 'Buena atención, aunque esperaba respuesta más rápida.',
      createdAt: new Date(now.getTime() - 70 * 60 * 60000),
    },
  });

  console.log('Tickets creados: 6');
  console.log('  - 1 Pendiente');
  console.log('  - 1 Asignado');
  console.log('  - 1 En Proceso');
  console.log('  - 1 Resuelto');
  console.log('  - 2 Cerrados (con valoraciones)');

  // ============================================================
  // 9B. CREAR TICKETS PENDIENTES ADICIONALES PARA AUTOTRIAGE
  // ============================================================
  console.log('Creando tickets pendientes adicionales para AutoTriage...');

  // Ticket 7: PENDIENTE - Hardware - Prioridad Media (teclado no funciona)
  const ticket7 = await prisma.ticket.create({
    data: {
      title: 'Teclado inalámbrico no responde',
      description: 'El teclado inalámbrico de mi estación de trabajo dejó de funcionar. Ya cambié las pilas pero sigue sin conectarse.',
      status: 'Pendiente',
      priority: 'Media',
      userId: cliente1.id,
      categoryId: catHardware.id, // Hardware (periféricos)
      responseDeadline: new Date(now.getTime() + slaHardware.responseTimeMinutes * 60000),
      resolutionDeadline: new Date(now.getTime() + slaHardware.resolutionTimeMinutes * 60000),
      createdAt: new Date(now.getTime() - 45 * 60000), // Hace 45 minutos
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket7.id,
      previousStatus: null,
      newStatus: 'Pendiente',
      userId: cliente1.id,
      comment: 'Ticket creado - Teclado inalámbrico no conecta',
      changedAt: new Date(now.getTime() - 45 * 60000),
    },
  });

  // Ticket 8: PENDIENTE - Software - Prioridad Baja (instalación de navegador)
  const ticket8 = await prisma.ticket.create({
    data: {
      title: 'Solicitud de instalación de Google Chrome',
      description: 'Necesito que me instalen Google Chrome como navegador alternativo para usar algunas aplicaciones web que no funcionan correctamente en Edge.',
      status: 'Pendiente',
      priority: 'Baja',
      userId: cliente3.id,
      categoryId: catSoftware.id, // Software (navegador)
      responseDeadline: new Date(now.getTime() + slaSoftware.responseTimeMinutes * 60000),
      resolutionDeadline: new Date(now.getTime() + slaSoftware.resolutionTimeMinutes * 60000),
      createdAt: new Date(now.getTime() - 90 * 60000), // Hace 1.5 horas
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket8.id,
      previousStatus: null,
      newStatus: 'Pendiente',
      userId: cliente3.id,
      comment: 'Solicitud de instalación de navegador alternativo',
      changedAt: new Date(now.getTime() - 90 * 60000),
    },
  });

  // Ticket 9: PENDIENTE - Seguridad - Prioridad Alta (cuenta bloqueada - URGENTE)
  const ticket9 = await prisma.ticket.create({
    data: {
      title: 'Cuenta de usuario bloqueada - No puedo trabajar',
      description: 'Mi cuenta de dominio está bloqueada después de intentar iniciar sesión varias veces. No puedo acceder a mi computadora ni a ningún sistema corporativo. Es urgente porque tengo una presentación en 20 minutos.',
      status: 'Pendiente',
      priority: 'Alta',
      userId: cliente2.id,
      categoryId: catSeguridad.id, // Seguridad (accesos)
      responseDeadline: new Date(now.getTime() + slaSeguridad.responseTimeMinutes * 60000),
      resolutionDeadline: new Date(now.getTime() + slaSeguridad.resolutionTimeMinutes * 60000),
      createdAt: new Date(now.getTime() - 5 * 60000), // Hace 5 minutos (muy reciente y urgente)
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket9.id,
      previousStatus: null,
      newStatus: 'Pendiente',
      userId: cliente2.id,
      comment: 'URGENTE - Cuenta bloqueada, no puedo trabajar. Presentación en 20 minutos.',
      changedAt: new Date(now.getTime() - 5 * 60000),
    },
  });

  console.log('Tickets pendientes adicionales creados: 3');
  console.log('  - Ticket 7: Hardware - Teclado inalámbrico (Prioridad Media, hace 45 min)');
  console.log('  - Ticket 8: Software - Instalación Chrome (Prioridad Baja, hace 90 min)');
  console.log('  - Ticket 9: Seguridad - Cuenta bloqueada (Prioridad Alta, hace 5 min) ⚡ URGENTE');
  console.log('');
  console.log('Total de tickets pendientes para AutoTriage: 4');

  // ============================================================
  // 10. CREAR REGLAS DE AUTOTRIAGE
  // ============================================================
  console.log('Creando reglas de AutoTriage...');

  // Regla 1: Asignación Urgente de Hardware
  const reglaHardwareUrgente = await prisma.autoTriageRule.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Asignación Urgente Hardware',
      description: 'Asigna automáticamente tickets de hardware cuando queda poco tiempo de SLA',
      active: true,
      remainingTimeMinutes: 120, // 2 horas
      workloadLimit: 5,
      specialtyId: especialidades[0].id, // Técnico Hardware
      priorityRule: 'Media',
    },
  });

  // Regla 2: Asignación Crítica de Seguridad
  const reglaSeguridadCritica = await prisma.autoTriageRule.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Asignación Crítica Seguridad',
      description: 'Asignación inmediata para problemas de seguridad críticos',
      active: true,
      remainingTimeMinutes: 15, // 15 minutos
      workloadLimit: 3,
      specialtyId: especialidades[6].id, // Especialista Seguridad
      priorityRule: 'Alta',
    },
  });

  // Regla 3: Asignación Rápida de Redes
  const reglaRedesRapida = await prisma.autoTriageRule.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Asignación Rápida Redes',
      description: 'Para problemas de conectividad y red con SLA ajustado',
      active: true,
      remainingTimeMinutes: 30, // 30 minutos
      workloadLimit: 4,
      specialtyId: especialidades[4].id, // Ingeniero Redes
      priorityRule: 'Alta',
    },
  });

  // Regla 4: Asignación Software General
  const reglaSoftwareGeneral = await prisma.autoTriageRule.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: 'Asignación Software General',
      description: 'Regla para tickets de software con tiempo moderado',
      active: true,
      remainingTimeMinutes: 60, // 1 hora
      workloadLimit: 6,
      specialtyId: especialidades[2].id, // Analista Software
      priorityRule: 'Media',
    },
  });

  console.log('Reglas de AutoTriage creadas: 4');
  console.log('  - Asignación Urgente Hardware (120 min, carga máx: 5)');
  console.log('  - Asignación Crítica Seguridad (15 min, carga máx: 3)');
  console.log('  - Asignación Rápida Redes (30 min, carga máx: 4)');
  console.log('  - Asignación Software General (60 min, carga máx: 6)');

  // ============================================================
  // 11. TICKETS PARA VISTA DE ASIGNACIONES (SEMANA DE PRESENTACIÓN)
  // ============================================================
  console.log('Creando tickets para vista de asignaciones...');

  // Calcular fechas para la semana (27 Oct - 2 Nov 2025)
  const fechaLunes = new Date('2025-10-27T09:00:00');
  const fechaMartes = new Date('2025-10-28T10:00:00');
  const fechaMiercoles = new Date('2025-10-29T11:00:00');
  const fechaJueves = new Date('2025-10-30T14:00:00');

  // Ticket 1: Pendiente - Lunes (SLA: 2 horas)
  const ticketVista1 = await prisma.ticket.create({
    data: {
      title: 'Impresora no imprime en color',
      description: 'La impresora del departamento de contabilidad solo imprime en blanco y negro.',
      status: 'Pendiente',
      priority: 'Alta',
      userId: cliente1.id,
      categoryId: catHardware.id,
      responseDeadline: new Date(fechaLunes.getTime() + 120 * 60000), // 2 horas
      resolutionDeadline: new Date(fechaLunes.getTime() + 240 * 60000), // 4 horas
      createdAt: fechaLunes,
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticketVista1.id,
      previousStatus: null,
      newStatus: 'Pendiente',
      userId: cliente1.id,
      comment: 'Ticket creado - Impresora solo imprime en blanco y negro',
      changedAt: fechaLunes,
    },
  });

  // Ticket 2: Asignado - Lunes (SLA: 1 hora)
  const ticketVista2 = await prisma.ticket.create({
    data: {
      title: 'Error al abrir Microsoft Excel',
      description: 'Excel se cierra inesperadamente al abrir archivos grandes.',
      status: 'Asignado',
      priority: 'Media',
      userId: cliente2.id,
      categoryId: catSoftware.id,
      assignedTechnicianId: tecnico2.id,
      responseDeadline: new Date(fechaLunes.getTime() + 60 * 60000), // 1 hora
      resolutionDeadline: new Date(fechaLunes.getTime() + 180 * 60000), // 3 horas
      createdAt: fechaLunes,
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticketVista2.id,
      previousStatus: null,
      newStatus: 'Pendiente',
      userId: cliente2.id,
      comment: 'Excel se cierra al abrir archivos grandes',
      changedAt: fechaLunes,
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticketVista2.id,
      previousStatus: 'Pendiente',
      newStatus: 'Asignado',
      userId: superAdmin.id,
      comment: 'Asignado a María López',
      justification: 'Especialista en software y sistemas',
      changedAt: new Date(fechaLunes.getTime() + 10 * 60000),
    },
  });

  // Ticket 3: En_Proceso - Martes (SLA: 30 min)
  const ticketVista3 = await prisma.ticket.create({
    data: {
      title: 'No puedo conectarme a la VPN',
      description: 'La VPN corporativa no permite conexión desde casa.',
      status: 'En_Proceso',
      priority: 'Alta',
      userId: cliente3.id,
      categoryId: catRed.id,
      assignedTechnicianId: tecnico3.id,
      firstResponseAt: new Date(fechaMartes.getTime() + 5 * 60000),
      responseCompliance: true,
      responseDeadline: new Date(fechaMartes.getTime() + 30 * 60000), // 30 min
      resolutionDeadline: new Date(fechaMartes.getTime() + 120 * 60000), // 2 horas
      createdAt: fechaMartes,
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticketVista3.id,
      previousStatus: null,
      newStatus: 'Pendiente',
      userId: cliente3.id,
      comment: 'No puedo trabajar desde casa - VPN no conecta',
      changedAt: fechaMartes,
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticketVista3.id,
      previousStatus: 'Pendiente',
      newStatus: 'Asignado',
      userId: superAdmin.id,
      comment: 'Asignado a Carlos Rodríguez',
      justification: 'Ingeniero especializado en redes y VPN',
      changedAt: new Date(fechaMartes.getTime() + 2 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticketVista3.id,
      previousStatus: 'Asignado',
      newStatus: 'En_Proceso',
      userId: tecnico3.id,
      comment: 'Iniciando diagnóstico de VPN',
      justification: 'Revisando configuración de red y certificados de seguridad',
      changedAt: new Date(fechaMartes.getTime() + 5 * 60000),
    },
  });

  // Ticket 4: Resuelto - Miércoles (SLA: 3 horas)
  const ticketVista4 = await prisma.ticket.create({
    data: {
      title: 'Solicitud de permisos para carpeta compartida',
      description: 'Necesito acceso de escritura en la carpeta de proyectos.',
      status: 'Resuelto',
      priority: 'Baja',
      userId: cliente1.id,
      categoryId: catSeguridad.id,
      assignedTechnicianId: tecnico4.id,
      firstResponseAt: new Date(fechaMiercoles.getTime() + 10 * 60000),
      responseCompliance: true,
      responseDeadline: new Date(fechaMiercoles.getTime() + 180 * 60000), // 3 horas
      resolutionDeadline: new Date(fechaMiercoles.getTime() + 360 * 60000), // 6 horas
      createdAt: fechaMiercoles,
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticketVista4.id,
      previousStatus: null,
      newStatus: 'Pendiente',
      userId: cliente1.id,
      comment: 'Solicitud de permisos de escritura',
      changedAt: fechaMiercoles,
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticketVista4.id,
      previousStatus: 'Pendiente',
      newStatus: 'Asignado',
      userId: superAdmin.id,
      comment: 'Asignado a Sofía Martínez',
      justification: 'Especialista en seguridad y gestión de permisos',
      changedAt: new Date(fechaMiercoles.getTime() + 5 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticketVista4.id,
      previousStatus: 'Asignado',
      newStatus: 'En_Proceso',
      userId: tecnico4.id,
      comment: 'Verificando permisos actuales y configuración de seguridad',
      changedAt: new Date(fechaMiercoles.getTime() + 10 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticketVista4.id,
      previousStatus: 'En_Proceso',
      newStatus: 'Resuelto',
      userId: tecnico4.id,
      comment: 'Permisos otorgados correctamente',
      justification: 'Se configuraron los permisos de escritura en la carpeta compartida. Usuario notificado.',
      changedAt: new Date(fechaMiercoles.getTime() + 25 * 60000),
    },
  });

  // Ticket 5: Cerrado - Jueves
  const ticketVista5 = await prisma.ticket.create({
    data: {
      title: 'Instalación de antivirus corporativo',
      description: 'Solicitud de instalación de software de seguridad en equipo nuevo.',
      status: 'Cerrado',
      priority: 'Media',
      userId: cliente2.id,
      categoryId: catSeguridad.id,
      assignedTechnicianId: tecnico4.id,
      firstResponseAt: new Date(fechaJueves.getTime() + 5 * 60000),
      closedAt: new Date(fechaJueves.getTime() + 45 * 60000),
      responseCompliance: true,
      resolutionCompliance: true,
      responseDeadline: new Date(fechaJueves.getTime() + 15 * 60000),
      resolutionDeadline: new Date(fechaJueves.getTime() + 120 * 60000),
      createdAt: fechaJueves,
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticketVista5.id,
      previousStatus: null,
      newStatus: 'Pendiente',
      userId: cliente2.id,
      comment: 'Solicitud de instalación de antivirus en equipo nuevo',
      changedAt: fechaJueves,
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticketVista5.id,
      previousStatus: 'Pendiente',
      newStatus: 'Asignado',
      userId: superAdmin.id,
      comment: 'Asignado a Sofía Martínez',
      justification: 'Especialista en seguridad informática',
      changedAt: new Date(fechaJueves.getTime() + 2 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticketVista5.id,
      previousStatus: 'Asignado',
      newStatus: 'En_Proceso',
      userId: tecnico4.id,
      comment: 'Descargando e instalando antivirus corporativo',
      changedAt: new Date(fechaJueves.getTime() + 5 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticketVista5.id,
      previousStatus: 'En_Proceso',
      newStatus: 'Resuelto',
      userId: tecnico4.id,
      comment: 'Antivirus instalado y configurado correctamente',
      justification: 'Software de seguridad instalado con políticas corporativas. Definiciones actualizadas.',
      changedAt: new Date(fechaJueves.getTime() + 40 * 60000),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticketVista5.id,
      previousStatus: 'Resuelto',
      newStatus: 'Cerrado',
      userId: cliente2.id,
      comment: 'Verificado y funcionando perfectamente. Muchas gracias!',
      changedAt: new Date(fechaJueves.getTime() + 45 * 60000),
    },
  });

  // Valoración para el ticket cerrado
  await prisma.valuation.create({
    data: {
      ticketId: ticketVista5.id,
      userId: cliente2.id,
      rating: 5,
      comment: 'Excelente servicio. Instalación rápida y profesional.',
      createdAt: new Date(fechaJueves.getTime() + 45 * 60000),
    },
  });

  console.log('Tickets de vista de asignaciones creados: 5 (todos con historial completo)');
  console.log('  - Lunes 27/10: 2 tickets (Pendiente con 1 registro, Asignado con 2 registros)');
  console.log('  - Martes 28/10: 1 ticket (En_Proceso con 3 registros)');
  console.log('  - Miércoles 29/10: 1 ticket (Resuelto con 4 registros)');
  console.log('  - Jueves 30/10: 1 ticket (Cerrado con 5 registros + valoración)');
  console.log('');
  console.log('RESUMEN TOTAL DE TICKETS:');
  console.log('  Total: 14 tickets');
  console.log('  - 5 Pendientes (listos para AutoTriage) ⚡');
  console.log('  - 3 Asignados');
  console.log('  - 2 En Proceso');
  console.log('  - 1 Resuelto');
  console.log('  - 3 Cerrados (con valoraciones)');

  // ============================================================
  // 12. ACTUALIZAR WORKLOAD Y DISPONIBILIDAD DE TÉCNICOS
  // ============================================================
  console.log('Actualizando workload y disponibilidad de técnicos...');

  // Función auxiliar para actualizar un técnico
  async function actualizarDisponibilidadTecnico(tecnicoId: number, tecnicoNombre: string) {
    const ticketsActivos = await prisma.ticket.count({
      where: {
        assignedTechnicianId: tecnicoId,
        status: { not: 'Cerrado' },
      },
    });

    const nuevoStatus = ticketsActivos > 5 ? 'No_Disponible' : 'Disponible';

    await prisma.user.update({
      where: { id: tecnicoId },
      data: {
        workload: ticketsActivos,
        status: nuevoStatus,
      },
    });

    console.log(`  - ${tecnicoNombre}: ${ticketsActivos} tickets activos → ${nuevoStatus}`);
  }

  await actualizarDisponibilidadTecnico(tecnico1.id, 'Juan Perez');
  await actualizarDisponibilidadTecnico(tecnico2.id, 'Maria Lopez');
  await actualizarDisponibilidadTecnico(tecnico3.id, 'Carlos Rodriguez');
  await actualizarDisponibilidadTecnico(tecnico4.id, 'Sofia Martinez');

  // ============================================================
  // 13. CREAR NOTIFICACIONES DE PRUEBA
  // ============================================================
  console.log('Creando notificaciones de prueba...');

  // Notificación 1: Inicio de sesión para Admin
  await prisma.notification.create({
    data: {
      recipientUserId: superAdmin.id,
      senderUserId: null,
      ticketId: null,
      type: 'InicioSesion',
      message: 'Has iniciado sesión en el sistema el 08/12/2025, 10:30',
      systemGenerated: true,
      isRead: false,
      createdAt: new Date(now.getTime() - 60 * 60000), // Hace 1 hora
    },
  });

  // Notificación 2: Cambio de estado de ticket para cliente1
  await prisma.notification.create({
    data: {
      recipientUserId: cliente1.id,
      senderUserId: tecnico1.id,
      ticketId: ticket1.id,
      type: 'CambioEstado',
      message: `El ticket "No puedo acceder a mi correo electrónico" cambió de estado de Pendiente a Asignado`,
      systemGenerated: false,
      isRead: false,
      createdAt: new Date(now.getTime() - 45 * 60000), // Hace 45 minutos
    },
  });

  // Notificación 3: Asignación de ticket para tecnico1
  await prisma.notification.create({
    data: {
      recipientUserId: tecnico1.id,
      senderUserId: superAdmin.id,
      ticketId: ticket1.id,
      type: 'Asignacion',
      message: `Se te ha asignado el ticket "No puedo acceder a mi correo electrónico"`,
      systemGenerated: false,
      isRead: true,
      readAt: new Date(now.getTime() - 40 * 60000),
      createdAt: new Date(now.getTime() - 45 * 60000), // Hace 45 minutos
    },
  });

  // Notificación 4: Cambio de estado para cliente2
  await prisma.notification.create({
    data: {
      recipientUserId: cliente2.id,
      senderUserId: tecnico2.id,
      ticketId: null,
      type: 'CambioEstado',
      message: `El ticket "La impresora no responde" cambió de estado de Asignado a En Proceso`,
      systemGenerated: false,
      isRead: false,
      createdAt: new Date(now.getTime() - 30 * 60000), // Hace 30 minutos
    },
  });

  // Notificación 5: Nueva observación para cliente3
  await prisma.notification.create({
    data: {
      recipientUserId: cliente3.id,
      senderUserId: tecnico3.id,
      ticketId: null,
      type: 'NuevaObservacion',
      message: `Se ha agregado una nueva observación a tu ticket "El sistema operativo no inicia"`,
      systemGenerated: false,
      isRead: false,
      createdAt: new Date(now.getTime() - 15 * 60000), // Hace 15 minutos
    },
  });

  // Notificación 6: Inicio de sesión para tecnico1 (leída)
  await prisma.notification.create({
    data: {
      recipientUserId: tecnico1.id,
      senderUserId: null,
      ticketId: null,
      type: 'InicioSesion',
      message: 'Has iniciado sesión en el sistema el 08/12/2025, 09:15',
      systemGenerated: true,
      isRead: true,
      readAt: new Date(now.getTime() - 90 * 60000),
      createdAt: new Date(now.getTime() - 120 * 60000), // Hace 2 horas
    },
  });

  // Notificación 7: Asignación para tecnico2
  await prisma.notification.create({
    data: {
      recipientUserId: tecnico2.id,
      senderUserId: null,
      ticketId: null,
      type: 'Asignacion',
      message: `Se te ha asignado el ticket "La impresora no responde" automáticamente`,
      systemGenerated: true,
      isRead: false,
      createdAt: new Date(now.getTime() - 25 * 60000), // Hace 25 minutos
    },
  });

  console.log('Notificaciones de prueba creadas: 7');

  console.log('');
  console.log('Seed completado exitosamente!');
  console.log('');
  console.log('Credenciales:');
  console.log('===========================================');
  console.log('Super Admin:');
  console.log('   Email: admin@savantsolver.com');
  console.log('   Password: Admin123!');
  console.log('');
  console.log('Tecnicos (todos con password: Tecnico123!):');
  console.log('   1. juan.perez@savantsolver.com');
  console.log('   2. maria.lopez@savantsolver.com');
  console.log('   3. carlos.rodriguez@savantsolver.com');
  console.log('   4. sofia.martinez@savantsolver.com');
  console.log('');
  console.log('Clientes (todos con password: Cliente123!):');
  console.log('   1. laura.gomez@empresa.com');
  console.log('   2. pedro.sanchez@empresa.com');
  console.log('   3. ana.martin@empresa.com');
  console.log('===========================================');
  console.log('');
}

main()
  .then(async () => {
    console.log('✅ Seed completado con éxito');
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  });
