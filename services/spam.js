"use strict";

const spamRepository = require("../repositories/spam");

const extractUrls = (content) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return content.match(urlRegex) || [];
};

async function isSpam(params) {
  const { content, spamLinkDomains, redirectionDepth } = params;
  const urls = extractUrls(content);

  try {
    const urlChecks = await Promise.all(
      urls.map(async (url) => {
        try {
          const finalUrl = await spamRepository.traceRedirects(
            url,
            redirectionDepth
          );
          const domain = new URL(finalUrl).hostname;
          return spamLinkDomains.includes(domain);
        } catch (error) {
          throw error;
        }
      })
    );

    return urlChecks.some((isSpam) => isSpam);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  isSpam,
};
