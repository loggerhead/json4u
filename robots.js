const fs = require("fs");

const genRobotsFile = (isVercel = false) => {
  const sitemap = "https://json4u.com/sitemap.xml";
  let data = `User-agent: *
Disallow:
Sitemap: ${sitemap}`;

  if (isVercel) {
    data = `Disallow: *
Sitemap: ${sitemap}`;
  }

  fs.writeFileSync('./public/robots.txt', data, {flag: 'w'});
};

module.exports = genRobotsFile;