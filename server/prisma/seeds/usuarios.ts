import { Role } from "../../generated/prisma";

export const usuarios = [
  //Usuario 1 
  {
    nombre: "usuarioAdmin1",
    email: "usuario-admin1@prueba.com",
    password: "$2b$10$1BaQqXuZYNLDAC42PY5fN.ufSOKjApmjkaZrQUYf7ms71PaS1mASO",
    role: Role.ADMIN,
  },
  //Usuario 2
  {
    nombre: "usuarioAdmin2",
    email: "usuario-admin2@prueba.com",
    password: "$2b$10$1BaQqXuZYNLDAC42PY5fN.ufSOKjApmjkaZrQUYf7ms71PaS1mASO",
    role: Role.ADMIN,
  },

  //Usuario 3
  {
    nombre: "usuarioCliente1",
    email: "usuario-cliente1@prueba.com",
    password: "$2b$10$1BaQqXuZYNLDAC42PY5fN.ufSOKjApmjkaZrQUYf7ms71PaS1mASO",
  },

  //Usuario 4
  {
    nombre: "usuarioCliente2",
    email: "usuario-cliente2@prueba.com",
    password: "$2b$10$1BaQqXuZYNLDAC42PY5fN.ufSOKjApmjkaZrQUYf7ms71PaS1mASO",
  },
];
