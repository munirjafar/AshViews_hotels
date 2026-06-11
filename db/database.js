// ========== Guest helpers ==========
function getAllGuests() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM guests ORDER BY fullname', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getGuestById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM guests WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function updateGuest(id, guest) {
  return new Promise((resolve, reject) => {
    const { fullname, email, mobile, gender, address } = guest;
    db.run(
      `UPDATE guests SET fullname = ?, email = ?, mobile = ?, gender = ?, address = ? WHERE id = ?`,
      [fullname, email, mobile, gender, address, id],
      function(err) { if (err) reject(err); else resolve(); }
    );
  });
}

function deleteGuest(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM guests WHERE id = ?', [id], function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ========== Reservation helpers (list with joins) ==========
function getAllReservations() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT r.*, rm.roomNumber, rm.roomName, g.fullname as guestName, g.email
      FROM reservations r
      JOIN rooms rm ON r.roomId = rm.id
      JOIN guests g ON r.guestId = g.id
      ORDER BY r.createdAt DESC
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// ========== Card log helpers ==========
function addCardLog(log) {
  return new Promise((resolve, reject) => {
    const { roomId, reservationId, cardType, cardId, startDate, endDate, success, errorMessage } = log;
    db.run(
      `INSERT INTO card_logs (roomId, reservationId, cardType, cardId, startDate, endDate, writtenAt, success, errorMessage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [roomId, reservationId, cardType, cardId, startDate, endDate, new Date().toISOString(), success ? 1 : 0, errorMessage || null],
      function(err) { if (err) reject(err); else resolve(this.lastID); }
    );
  });
}

function getAllCardLogs() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT l.*, rm.roomNumber
      FROM card_logs l
      LEFT JOIN rooms rm ON l.roomId = rm.id
      ORDER BY l.writtenAt DESC
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// ========== Room lock helpers ==========
function getAllRoomLocks() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT l.*, r.roomNumber, r.roomName
      FROM room_locks l
      JOIN rooms r ON l.roomId = r.id
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getRoomLock(roomId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM room_locks WHERE roomId = ?', [roomId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function upsertRoomLock(lock) {
  return new Promise((resolve, reject) => {
    const { roomId, lockSerial, lastSync, batteryLevel, firmwareVersion } = lock;
    db.run(
      `INSERT INTO room_locks (roomId, lockSerial, lastSync, batteryLevel, firmwareVersion)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(roomId) DO UPDATE SET
         lockSerial = excluded.lockSerial,
         lastSync = excluded.lastSync,
         batteryLevel = excluded.batteryLevel,
         firmwareVersion = excluded.firmwareVersion`,
      [roomId, lockSerial, lastSync, batteryLevel, firmwareVersion],
      function(err) { if (err) reject(err); else resolve(); }
    );
  });
}

function deleteRoomLock(roomId) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM room_locks WHERE roomId = ?', [roomId], function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ========== Settings helpers ==========
function getSetting(key) {
  return new Promise((resolve, reject) => {
    db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.value : null);
    });
  });
}

function getAllSettings() {
  return new Promise((resolve, reject) => {
    db.all('SELECT key, value, description FROM settings ORDER BY key', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function updateSetting(key, value) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE settings SET value = ? WHERE key = ?', [value, key], function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = {
  ...module.exports,
  getAllGuests, getGuestById, updateGuest, deleteGuest,
  getAllReservations,
  addCardLog, getAllCardLogs,
  getAllRoomLocks, getRoomLock, upsertRoomLock, deleteRoomLock,
  getSetting, getAllSettings, updateSetting
};