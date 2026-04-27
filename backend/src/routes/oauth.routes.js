const express = require('express');
const ghlController = require('../controllers/ghl.controller');

const router = express.Router();

router.get('/callback', ghlController.oauthCallback);

module.exports = router;
