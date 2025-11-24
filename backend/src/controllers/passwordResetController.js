
/**
 * @file This file contains the controller for handling password reset requests.
 */

const passwordResetService = require('../services/passwordResetService');

const sendVerificationCode = async (req, res) => {
  const { email, phone } = req.body;
  const identifier = email || phone;
  if (!identifier) {
    return res.status(400).json({ success: false, error: 'Email or phone is required.' });
  }
  const result = await passwordResetService.sendVerificationCode(identifier);
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
};

const resetPassword = async (req, res) => {
  console.log(req.body);
  const { email, phone, code, password: newPassword } = req.body;
  const identifier = email || phone;
  if (!identifier) {
    return res.status(400).json({ success: false, error: 'Email or phone is required.' });
  }
  const result = await passwordResetService.resetPassword(identifier, code, newPassword);
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
};

module.exports = {
  sendVerificationCode,
  resetPassword,
};
