/**
 * =============================================================
 * MODELO DE DADOS — Carona Universitária
 * =============================================================
 *
 * Entidades:
 *   User        — usuário do sistema (motorista ou passageiro)
 *   Vehicle     — veículo cadastrado por um usuário motorista
 *   Ride        — oferta de carona criada por um motorista
 *   Reservation — reserva de uma vaga em uma carona
 *
 * Relacionamentos:
 *   User      1──N  Vehicle     (um usuário pode ter vários veículos)
 *   User      1──N  Ride        (um usuário pode oferecer várias caronas)
 *   Vehicle   1──N  Ride        (um veículo pode ser usado em várias caronas)
 *   Ride      1──N  Reservation (uma carona pode ter várias reservas)
 *   User      1──N  Reservation (um usuário pode reservar várias caronas)
 *
 * =============================================================
 * SCHEMA / TIPO DE CADA CAMPO
 * =============================================================
 *
 * User {
 *   id            : number        — identificador único (auto-increment)
 *   name          : string        — nome completo
 *   email         : string        — e-mail único (login)
 *   phone         : string        — telefone com DDD
 *   password      : string        — senha hash (bcrypt)
 *   profilePhoto  : string|null   — caminho da foto de perfil
 *   createdAt     : ISO8601 string
 * }
 *
 * Vehicle {
 *   id        : number   — identificador único
 *   userId    : number   — FK → User.id (dono do veículo)
 *   plate     : string   — placa no formato AAA-0000
 *   model     : string   — modelo do carro
 *   color     : string   — cor do veículo
 *   seats     : number   — total de assentos disponíveis
 *   createdAt : ISO8601 string
 * }
 *
 * Ride {
 *   id             : number          — identificador único
 *   driverId       : number          — FK → User.id (motorista)
 *   vehicleId      : number          — FK → Vehicle.id
 *   origin         : string          — endereço/bairro de saída
 *   destination    : string          — endereço/bairro de destino
 *   departureTime  : ISO8601 string  — data e hora de partida
 *   price          : number          — valor da carona (R$)
 *   availableSeats : number          — vagas ainda disponíveis
 *   totalSeats     : number          — total de vagas ofertadas
 *   notes          : string|null     — observações do motorista
 *   status         : 'active'|'cancelled'
 *   createdAt      : ISO8601 string
 * }
 *
 * Reservation {
 *   id          : number  — identificador único
 *   rideId      : number  — FK → Ride.id
 *   passengerId : number  — FK → User.id (passageiro)
 *   status      : 'confirmed'|'cancelled'
 *   createdAt   : ISO8601 string
 * }
 * =============================================================
 */

const bcrypt = require('bcryptjs');

// ─── Contadores para auto-increment ──────────────────────────
const counters = { users: 5, vehicles: 6, rides: 5, reservations: 5 };

function nextId(entity) {
  return ++counters[entity];
}

// ─── Dados mock — Users ───────────────────────────────────────
const users = [
  {
    id: 1,
    name: 'Ana Paula Santos',
    email: 'ana.santos@universidade.edu.br',
    phone: '(11) 98765-4321',
    password: bcrypt.hashSync('senha123', 10),
    profilePhoto: null,
    createdAt: '2025-01-10T08:00:00.000Z',
  },
  {
    id: 2,
    name: 'Carlos Eduardo Lima',
    email: 'carlos.lima@universidade.edu.br',
    phone: '(11) 97654-3210',
    password: bcrypt.hashSync('senha123', 10),
    profilePhoto: null,
    createdAt: '2025-01-12T09:30:00.000Z',
  },
  {
    id: 3,
    name: 'Beatriz Oliveira',
    email: 'beatriz.oliveira@universidade.edu.br',
    phone: '(11) 96543-2109',
    password: bcrypt.hashSync('senha123', 10),
    profilePhoto: null,
    createdAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 4,
    name: 'Rafael Mendes',
    email: 'rafael.mendes@universidade.edu.br',
    phone: '(11) 95432-1098',
    password: bcrypt.hashSync('senha123', 10),
    profilePhoto: null,
    createdAt: '2025-01-18T11:15:00.000Z',
  },
  {
    id: 5,
    name: 'Juliana Costa',
    email: 'juliana.costa@universidade.edu.br',
    phone: '(11) 94321-0987',
    password: bcrypt.hashSync('senha123', 10),
    profilePhoto: null,
    createdAt: '2025-01-20T14:00:00.000Z',
  },
];

// ─── Dados mock — Vehicles ────────────────────────────────────
const vehicles = [
  {
    id: 1,
    userId: 1,
    plate: 'ABC-1234',
    model: 'Honda Civic',
    color: 'Prata',
    seats: 4,
    createdAt: '2025-01-10T08:30:00.000Z',
  },
  {
    id: 2,
    userId: 2,
    plate: 'DEF-5678',
    model: 'Toyota Corolla',
    color: 'Branco',
    seats: 4,
    createdAt: '2025-01-12T10:00:00.000Z',
  },
  {
    id: 3,
    userId: 3,
    plate: 'GHI-9012',
    model: 'Volkswagen Gol',
    color: 'Vermelho',
    seats: 4,
    createdAt: '2025-01-15T10:30:00.000Z',
  },
  {
    id: 4,
    userId: 4,
    plate: 'JKL-3456',
    model: 'Fiat Argo',
    color: 'Azul',
    seats: 4,
    createdAt: '2025-01-18T11:45:00.000Z',
  },
  {
    id: 5,
    userId: 1,
    plate: 'MNO-7890',
    model: 'Chevrolet Onix',
    color: 'Preto',
    seats: 4,
    createdAt: '2025-02-01T09:00:00.000Z',
  },
  {
    id: 6,
    userId: 2,
    plate: 'PQR-1234',
    model: 'Hyundai HB20',
    color: 'Cinza',
    seats: 4,
    createdAt: '2025-02-05T14:00:00.000Z',
  },
];

// ─── Dados mock — Rides ───────────────────────────────────────
const rides = [
  {
    id: 1,
    driverId: 1,
    vehicleId: 1,
    origin: 'Bairro Jardins, São Paulo',
    destination: 'Universidade USP — Campus Butantã',
    departureTime: '2026-03-15T07:30:00.000Z',
    price: 8.5,
    availableSeats: 2,
    totalSeats: 4,
    notes: 'Passo na Av. Paulista se precisar',
    status: 'active',
    createdAt: '2026-03-13T10:00:00.000Z',
  },
  {
    id: 2,
    driverId: 2,
    vehicleId: 2,
    origin: 'Vila Mariana, São Paulo',
    destination: 'Universidade USP — Campus Butantã',
    departureTime: '2026-03-15T08:00:00.000Z',
    price: 10.0,
    availableSeats: 3,
    totalSeats: 4,
    notes: 'Saída pontual, não posso esperar',
    status: 'active',
    createdAt: '2026-03-13T11:00:00.000Z',
  },
  {
    id: 3,
    driverId: 3,
    vehicleId: 3,
    origin: 'Santo André, SP',
    destination: 'Universidade Federal do ABC — Campus São Bernardo',
    departureTime: '2026-03-16T07:00:00.000Z',
    price: 12.0,
    availableSeats: 1,
    totalSeats: 4,
    notes: null,
    status: 'active',
    createdAt: '2026-03-13T12:00:00.000Z',
  },
  {
    id: 4,
    driverId: 1,
    vehicleId: 5,
    origin: 'Universidade USP — Campus Butantã',
    destination: 'Bairro Jardins, São Paulo',
    departureTime: '2026-03-15T18:00:00.000Z',
    price: 8.5,
    availableSeats: 4,
    totalSeats: 4,
    notes: 'Carona de volta ao final das aulas',
    status: 'active',
    createdAt: '2026-03-13T10:05:00.000Z',
  },
  {
    id: 5,
    driverId: 4,
    vehicleId: 4,
    origin: 'Tatuapé, São Paulo',
    destination: 'Universidade Mackenzie — Campus Higienópolis',
    departureTime: '2026-03-14T08:30:00.000Z',
    price: 7.0,
    availableSeats: 0,
    totalSeats: 4,
    notes: 'Vagas esgotadas',
    status: 'active',
    createdAt: '2026-03-12T09:00:00.000Z',
  },
];

// ─── Dados mock — Reservations ────────────────────────────────
const reservations = [
  {
    id: 1,
    rideId: 1,
    passengerId: 3,
    status: 'confirmed',
    createdAt: '2026-03-13T13:00:00.000Z',
  },
  {
    id: 2,
    rideId: 1,
    passengerId: 4,
    status: 'confirmed',
    createdAt: '2026-03-13T13:30:00.000Z',
  },
  {
    id: 3,
    rideId: 2,
    passengerId: 5,
    status: 'confirmed',
    createdAt: '2026-03-13T14:00:00.000Z',
  },
  {
    id: 4,
    rideId: 3,
    passengerId: 2,
    status: 'confirmed',
    createdAt: '2026-03-13T14:30:00.000Z',
  },
  {
    id: 5,
    rideId: 5,
    passengerId: 1,
    status: 'confirmed',
    createdAt: '2026-03-12T10:00:00.000Z',
  },
];

module.exports = { users, vehicles, rides, reservations, nextId };
