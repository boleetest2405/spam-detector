"use strict";

const router = require("express").Router();

const healthcheckRouter = require("./healthcheck");
const spamRouter = require("./spam");

router.use("/healthcheck", healthcheckRouter);
router.use("/spam", spamRouter);

module.exports = router;
