"use strict";

const router = require("express").Router();
const controller = require("../controllers/healthcheck");

router.get("/", controller.healthcheck);

module.exports = router;
