"use strict";

const router = require("express").Router();

const healthcheckRouter = require("./healthcheck");
router.use("/healthcheck", healthcheckRouter);

module.exports = router;
