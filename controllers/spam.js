"use strict";

const Param = require("../utils/param");
const spamService = require("../services/spam");

async function detectSpam(req, res) {
  try {
    const params = Param.request(req, [
      "content:string",
      "spamLinkDomains:any:[]",
      "redirectionDepth:int:0",
    ]);

    const result = await spamService.isSpam(params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  detectSpam,
};
