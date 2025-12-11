import { generos } from "./seeds/generos";
import { usuarios } from "./seeds/usuarios";
import { plataformas } from "./seeds/plataformas";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();
const main = async () => {
  try {
    //Generos - no tiene relaciones
    await prisma.genero.createMany({
      data: generos,
    });
    //Usuarios - no tiene relaciones
    await prisma.usuario.createMany({
      data: usuarios,
    });
    //Plataforma - no tiene relaciones
    await prisma.plataforma.createMany({
      data: plataformas,
    });
    //Videojuegos - con relaciones incluidas
    //Videojuegos
    await prisma.videojuego.create({
      //Instancia de videojuego 1
      data: {
        nombre: "Super Mario Odyssey",
        descripcion:
          "Únete a Mario en una épica aventura en 3D al mejor estilo trotamundos, usa sus nuevas e increíbles habilidades para obtener lunas con las que cargarás la nave Odyssey para así rescatar a la princesa Peach de los malévolos planes de boda de Bowser",
        precio: "44.99",
        imagen: "super-mario-odyssey-nintendo-switch.webp",
        generos: {
          //idVideojuego, idGenero
          connect: [{ id: 1 }, { id: 5 }],
        },
        plataformas: {
          create: [
            { anno_lanzamiento: 2017, plataforma: { connect: { id: 2 } } },
          ],
        },
      },
    });

    //Instancia de videojuego 2
    await prisma.videojuego.create({
      data: {
        nombre: "Pikmin™ 4 Deluxe",
        descripcion:
          "Descubre a los Pikmin, ¡unas pequeñas criaturas de aspecto vegetal con habilidades distintivas que podrás plantar, arrancar, dirigir y utilizar para abrumar a los enemigos! Utiliza el poder diminuto de tus Pikmin (y un poco de estrategia) para explorar este misterioso planeta en busca de tu tripulación… y tesoros.",
        precio: "59.99",
        imagen: "pikmin4.webp",
        generos: {
          connect: [{ id: 1 }, { id: 2 }, { id: 4 }],
        },
        plataformas: {
          create: [
            { anno_lanzamiento: 2023, plataforma: { connect: { id: 2 } } },
          ],
        },
      },
    });

    //Instancia de videojuego 3
    await prisma.videojuego.create({
      data: {
        nombre: "The Legend of Zelda: Breath of the Wild",
        descripcion:
          "Olvida todo lo que sabes acerca de los juegos de la serie The Legend of Zelda. Explora y descubre en un mundo lleno de aventuras en The Legend of Zelda: Breath of the Wild, un juego nuevo que rompe los esquemas de la serie aclamada.",
        precio: "62.89",
        imagen: "the-legend-of-zelda-breath-of-the-wild.jpg",
        generos: {
          connect: [{ id: 1 }, { id: 2 }, { id: 3 }],
        },
        plataformas: {
          create: [
            { anno_lanzamiento: 2017, plataforma: { connect: { id: 2 } } },
          ],
        },
      },
    });

    //Instancia de videojuego 4
    await prisma.videojuego.create({
      data: {
        nombre: "God of War",
        descripcion:
          "Esta impactante reinvención de God of War toma todos los aspectos clásicos de la emblemática serie: un combate brutal, épicas luchas de jefes y una escala espectacular, y los combina con una increíble y emotiva trama que redefine el mundo de Kratos",
        precio: "19.99",
        imagen: "God_of_War.jpg",
        generos: {
          connect: [{ id: 1 }, { id: 2 }],
        },
        plataformas: {
          create: [
            { anno_lanzamiento: 2018, plataforma: { connect: { id: 3 } } },
            { anno_lanzamiento: 2022, plataforma: { connect: { id: 1 } } },
          ],
        },
      },
    });
    //Instancia de videojuego 5
    await prisma.videojuego.create({
      data: {
        nombre: "The Legend of Zelda: Tears of the Kingdom",
        descripcion:
          "Una épica aventura a través de la superficie y los cielos de Hyrule. En esta secuela del juego The Legend of Zelda: Breath of the Wild, decidirás tu propio camino a través de los extensos paisajes de Hyrule y las islas que flotan en los vastos cielos. ¿Podrás aprovechar el poder de las nuevas habilidades de Link para luchar contra las malévolas fuerzas que amenazan al reino?",
        precio: "69.99",
        imagen: "The-Legend-Zelda-Tears-Kingdom.webp",
        generos: {
          connect: [{ id: 1 }, { id: 2 }, { id: 3 }],
        },
        plataformas: {
          create: [
            { anno_lanzamiento: 2023, plataforma: { connect: { id: 2 } } },
          ],
        },
      },
    });
    //Instancia de videojuego 6
    await prisma.videojuego.create({
      data: {
        nombre: "Horizon Forbidden West",
        descripcion:
          "Una épica historia de ciencia ficción postapocalíptica en la que la humanidad intenta sobrevivir tras la aparición de una serie de máquinas y robots que han sustituido a los seres vivos como especie dominante en la Tierra",
        precio: "49.99",
        imagen: "Horizon_Forbidden_West.jpeg",
        generos: {
          connect: [{ id: 1 }, { id: 2 }, { id: 3 }],
        },
        plataformas: {
          create: [
            { anno_lanzamiento: 2022, plataforma: { connect: { id: 1 } } },
            { anno_lanzamiento: 2022, plataforma: { connect: { id: 3 } } },
            { anno_lanzamiento: 2022, plataforma: { connect: { id: 4 } } },
          ],
        },
      },
    });
    //Ordenes - con relaciones incluidas
    //Ordenes
    await prisma.orden.create({
      data: {
        fechaOrden: new Date("2025-09-27"),
        usuarioId: 4,
        videojuegos: {
          createMany: {
            data: [
              { cantidad: 1, videojuegoId: 1 },
              { cantidad: 2, videojuegoId: 4 },
            ],
          },
        },
      },
    });
    await prisma.orden.create({
      data: {
        fechaOrden: new Date("2025-9-30"),
        usuarioId: 3,
        videojuegos: {
          createMany: {
            data: [{ cantidad: 1, videojuegoId: 2 }],
          },
        },
      },
    });
    await prisma.orden.create({
      data: {
        fechaOrden: new Date("2025-10-20"),
        usuarioId: 2,
        videojuegos: {
          createMany: {
            data: [
              { cantidad: 1, videojuegoId: 1 },
              { cantidad: 1, videojuegoId: 3 },
            ],
          },
        },
      },
    });
    await prisma.orden.create({
      data: {
        fechaOrden: new Date("2025-10-27"),
        usuarioId: 2,
        videojuegos: {
          createMany: {
            data: [
              { cantidad: 1, videojuegoId: 4 },
              { cantidad: 1, videojuegoId: 3 },
            ],
          },
        },
      },
    });
    await prisma.orden.create({
      data: {
        fechaOrden: new Date("2025-11-02"),
        usuarioId: 1,
        videojuegos: {
          createMany: {
            data: [{ cantidad: 1, videojuegoId: 4 }],
          },
        },
      },
    });
    await prisma.orden.create({
      data: {
        fechaOrden: new Date("2025-11-05"),
        usuarioId: 4,
        videojuegos: {
          createMany: {
            data: [{ cantidad: 1, videojuegoId: 3 }],
          },
        },
      },
    });
    await prisma.orden.create({
      data: {
        fechaOrden: new Date("2025-11-15"),
        usuarioId: 3,
        videojuegos: {
          createMany: {
            data: [
              { cantidad: 1, videojuegoId: 2 },
              { cantidad: 1, videojuegoId: 1 },
            ],
          },
        },
      },
    });
    await prisma.orden.create({
      data: {
        fechaOrden: new Date("2025-11-02"),
        usuarioId: 4,
        videojuegos: {
          createMany: {
            data: [
              { cantidad: 1, videojuegoId: 3 },
              { cantidad: 1, videojuegoId: 4 },
            ],
          },
        },
      },
    });
  } catch (error) {
    throw error;
  }
};
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  })
