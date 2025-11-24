
/**
 * @file This file contains the routes for the password reset functionality.
 */

const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');

router.post('/forgot-password/send-code', passwordResetController.sendVerificationCode);
router.post('/forgot-password/reset', passwordResetController.resetPassword);

module.exports = router;
