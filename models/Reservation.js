const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Reservation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ride_id: { type: DataTypes.INTEGER, allowNull: false },
  passenger_id: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'confirmed' },
  presence_confirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
  presence_confirmed_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'reservations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [{ unique: true, fields: ['ride_id', 'passenger_id'] }],
});
