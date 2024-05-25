"use strict";

const router = require("express").Router();
const controller = require("../controllers/spam");

router.post("/detector", controller.detectSpam);

module.exports = router;
