const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'hotel_db',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

let dbAvailable = false;

async function init() {
  const createRooms = `
    CREATE TABLE IF NOT EXISTS rooms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      roomNumber VARCHAR(50) NOT NULL,
      roomName VARCHAR(255) NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      discount DECIMAL(5,2) DEFAULT 0,
      amenities TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createGuests = `
    CREATE TABLE IF NOT EXISTS guests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fullname VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      mobile VARCHAR(50) NOT NULL UNIQUE,
      gender VARCHAR(50),
      address TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createReservations = `
    CREATE TABLE IF NOT EXISTS reservations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guestId INT NOT NULL,
      roomId INT NOT NULL,
      bookingType VARCHAR(50) NOT NULL,
      checkinDate DATE NOT NULL,
      checkinTime TIME,
      checkoutDate DATE NOT NULL,
      checkoutTime TIME,
      paymentMethod VARCHAR(50),
      totalAmount DECIMAL(12,2) NOT NULL DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guestId) REFERENCES guests(id) ON DELETE CASCADE,
      FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await pool.query(createRooms);
  await pool.query(createGuests);
  await pool.query(createReservations);

  dbAvailable = true;
}

function isDbAvailable() {
  return dbAvailable;
}

async function getRooms() {
  const [rows] = await pool.query('SELECT * FROM rooms ORDER BY id DESC');
  return rows;
}

async function getRoomById(id) {
  const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createRoom(room) {
  const { roomNumber, roomName, price, discount, amenities } = room;
  const [result] = await pool.query(
    'INSERT INTO rooms (roomNumber, roomName, price, discount, amenities) VALUES (?, ?, ?, ?, ?)',
    [roomNumber, roomName, price, discount, amenities]
  );
  return result.insertId;
}

async function updateRoom(id, room) {
  const { roomNumber, roomName, price, discount, amenities } = room;
  await pool.query(
    'UPDATE rooms SET roomNumber = ?, roomName = ?, price = ?, discount = ?, amenities = ? WHERE id = ?',
    [roomNumber, roomName, price, discount, amenities, id]
  );
}

async function deleteRoom(id) {
  await pool.query('DELETE FROM rooms WHERE id = ?', [id]);
}

async function getGuests() {
  const [rows] = await pool.query('SELECT * FROM guests ORDER BY fullname');
  return rows;
}

async function getGuestById(id) {
  const [rows] = await pool.query('SELECT * FROM guests WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createGuest(guest) {
  const { fullname, email, mobile, gender, address } = guest;
  const [result] = await pool.query(
    'INSERT INTO guests (fullname, email, mobile, gender, address) VALUES (?, ?, ?, ?, ?)',
    [fullname, email, mobile, gender, address]
  );
  return result.insertId;
}

async function updateGuest(id, guest) {
  const { fullname, email, mobile, gender, address } = guest;
  await pool.query(
    'UPDATE guests SET fullname = ?, email = ?, mobile = ?, gender = ?, address = ? WHERE id = ?',
    [fullname, email, mobile, gender, address, id]
  );
}

async function deleteGuest(id) {
  await pool.query('DELETE FROM guests WHERE id = ?', [id]);
}

async function emailExists(email, excludeId = 0) {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM guests WHERE email = ? AND id != ?', [email, excludeId]);
  return rows[0].count > 0;
}

async function mobileExists(mobile, excludeId = 0) {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM guests WHERE mobile = ? AND id != ?', [mobile, excludeId]);
  return rows[0].count > 0;
}

async function getReservations() {
  const [rows] = await pool.query(`
    SELECT
      r.id,
      r.bookingType,
      r.checkinDate,
      r.checkinTime,
      r.checkoutDate,
      r.checkoutTime,
      r.paymentMethod,
      r.totalAmount AS total,
      r.status,
      rm.roomNumber,
      rm.roomName,
      g.fullname AS guestName,
      g.email
    FROM reservations r
    JOIN rooms rm ON r.roomId = rm.id
    JOIN guests g ON r.guestId = g.id
    ORDER BY r.createdAt DESC
  `);
  return rows;
}

async function getReservationById(id) {
  const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [id]);
  return rows[0] || null;
}

async function getReservationByGuestId(guestId) {
  const [rows] = await pool.query(
    'SELECT * FROM reservations WHERE guestId = ? ORDER BY createdAt DESC LIMIT 1',
    [guestId]
  );
  return rows[0] || null;
}

async function createReservation(reservation) {
  const {
    guestId,
    roomId,
    bookingType,
    checkinDate,
    checkinTime,
    checkoutDate,
    checkoutTime,
    paymentMethod,
    totalAmount,
    status = 'pending'
  } = reservation;

  const [result] = await pool.query(
    `INSERT INTO reservations (guestId, roomId, bookingType, checkinDate, checkinTime, checkoutDate, checkoutTime, paymentMethod, totalAmount, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [guestId, roomId, bookingType, checkinDate, checkinTime, checkoutDate, checkoutTime, paymentMethod, totalAmount, status]
  );
  return result.insertId;
}

async function updateReservation(id, reservation) {
  const {
    roomId,
    bookingType,
    checkinDate,
    checkinTime,
    checkoutDate,
    checkoutTime,
    paymentMethod,
    totalAmount,
    status = 'pending'
  } = reservation;

  await pool.query(
    `UPDATE reservations
     SET roomId = ?, bookingType = ?, checkinDate = ?, checkinTime = ?, checkoutDate = ?, checkoutTime = ?, paymentMethod = ?, totalAmount = ?, status = ?
     WHERE id = ?`,
    [roomId, bookingType, checkinDate, checkinTime, checkoutDate, checkoutTime, paymentMethod, totalAmount, status, id]
  );
}

async function deleteReservation(id) {
  await pool.query('DELETE FROM reservations WHERE id = ?', [id]);
}

module.exports = {
  pool,
  init,
  isDbAvailable,
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest,
  emailExists,
  mobileExists,
  getReservations,
  getReservationById,
  getReservationByGuestId,
  createReservation,
  updateReservation,
  deleteReservation
};
