const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Ride', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  driver_id: { type: DataTypes.INTEGER, allowNull: false },
  vehicle_id: { type: DataTypes.INTEGER, allowNull: false },
  origin: { type: DataTypes.STRING, allowNull: false },
  destination: { type: DataTypes.STRING, allowNull: false },
  departure_time: { type: DataTypes.DATE, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false },
  available_seats: { type: DataTypes.INTEGER, allowNull: false },
  total_seats: { type: DataTypes.INTEGER, allowNull: false },
  notes: { type: DataTypes.TEXT, defaultValue: '' },
  status: { type: DataTypes.STRING, defaultValue: 'active' },
}, {
  tableName: 'rides',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});
