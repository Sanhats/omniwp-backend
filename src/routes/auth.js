const express = require('express');
const { register, login } = require('../controllers/authController');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// POST /auth/register
router.post('/register', validate(schemas.register), register);

// POST /auth/login
router.post('/login', validate(schemas.login), login);

module.exports = router;
