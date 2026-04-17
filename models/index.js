require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'carona_universitaria',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    timezone: '-03:00',
  }
);

const User = require('./User')(sequelize);
const Vehicle = require('./Vehicle')(sequelize);
const Ride = require('./Ride')(sequelize);
const Reservation = require('./Reservation')(sequelize);

// Associações
User.hasMany(Vehicle, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Vehicle.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Ride, { as: 'ridesAsDriver', foreignKey: 'driver_id', onDelete: 'CASCADE' });
Ride.belongsTo(User, { as: 'driver', foreignKey: 'driver_id' });

Vehicle.hasMany(Ride, { foreignKey: 'vehicle_id', onDelete: 'CASCADE' });
Ride.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

Ride.hasMany(Reservation, { foreignKey: 'ride_id', onDelete: 'CASCADE' });
Reservation.belongsTo(Ride, { foreignKey: 'ride_id' });

User.hasMany(Reservation, { as: 'reservations', foreignKey: 'passenger_id', onDelete: 'CASCADE' });
Reservation.belongsTo(User, { as: 'passenger', foreignKey: 'passenger_id' });

module.exports = { sequelize, User, Vehicle, Ride, Reservation };
