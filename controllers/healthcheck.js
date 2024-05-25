"use strict";

async function healthcheck(req, res) {
  try {
    const healthcheck = {
      uptime: process.uptime(),
      message: "OK",
      timestamp: Date.now(),
    };

    res.send(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).send();
  }
}

module.exports = {
  healthcheck,
};
