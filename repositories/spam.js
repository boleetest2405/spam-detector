"use strict";

const axios = require("axios");
const cheerio = require("cheerio");

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    axios
      .get(url, { maxRedirects: 0 })
      .then((response) => {
        resolve(response);
      })
      .catch((error) => {
        if (
          error.response &&
          (error.response.status === 301 || error.response.status === 302)
        ) {
          resolve(error.response);
        } else {
          reject(error);
        }
      });
  });
}

function traceRedirects(url, redirectionDepth) {
  return new Promise(async (resolve, reject) => {
    let currentUrl = url;
    let depth = 0;

    try {
      while (depth < redirectionDepth) {
        const response = await fetchUrl(currentUrl);
        if (response.status === 200) {
          const $ = cheerio.load(response.data);
          const redirectLink = $("a[href]").attr("href");
          if (redirectLink) {
            currentUrl = redirectLink;
            depth++;
          } else {
            break;
          }
        } else if (response.status === 301 || response.status === 302) {
          currentUrl = response.headers.location;
          depth++;
        } else {
          break;
        }
      }

      resolve(currentUrl);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  traceRedirects,
};
