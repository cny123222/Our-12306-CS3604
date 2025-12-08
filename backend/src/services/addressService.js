const crypto = require('crypto');
const db = require('../database');

/**
 * Address Service
 */

/**
 * Get all addresses for a user
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
async function getUserAddresses(userId) {
  try {
    const addresses = await db.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    
    // Convert DB columns to frontend format
    return addresses.map(addr => ({
      id: addr.id,
      recipient: addr.recipient,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      street: addr.street,
      surrounding: addr.surrounding,
      detailAddress: addr.detail_address,
      isDefault: !!addr.is_default
    }));
  } catch (err) {
    console.error('Failed to get addresses:', err);
    throw err;
  }
}

/**
 * Add a new address
 * @param {string} userId 
 * @param {Object} addressData 
 * @returns {Promise<Object>}
 */
async function addAddress(userId, addressData) {
  const { recipient, phone, province, city, district, street, surrounding, detailAddress, isDefault } = addressData;
  const id = crypto.randomUUID();
  
  try {
    // If setting as default, unset other defaults for this user
    if (isDefault) {
      await db.run(
        'UPDATE addresses SET is_default = 0 WHERE user_id = ?',
        [userId]
      );
    }
    
    await db.run(
      `INSERT INTO addresses (
        id, user_id, recipient, phone, province, city, district, street, surrounding, detail_address, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, recipient, phone, province, city, district, street, surrounding, detailAddress, isDefault ? 1 : 0]
    );
    
    return {
      id,
      userId,
      recipient,
      phone,
      province,
      city,
      district,
      street,
      surrounding,
      detailAddress,
      isDefault
    };
  } catch (err) {
    console.error('Failed to add address:', err);
    throw err;
  }
}

/**
 * Delete an address
 * @param {string} userId 
 * @param {string} addressId 
 * @returns {Promise<boolean>}
 */
async function deleteAddress(userId, addressId) {
  try {
    const result = await db.run(
      'DELETE FROM addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );
    return result.changes > 0;
  } catch (err) {
    console.error('Failed to delete address:', err);
    throw err;
  }
}

module.exports = {
  getUserAddresses,
  addAddress,
  deleteAddress
};
