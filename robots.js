const fs = require("fs");

const genRobotsFile = (isVercel = false) => {
  const sitemap = `${process.env.NEXT_PUBLIC_HOST}/sitemap.xml`;
  let data = `User-agent: *
Disallow: /share/*
Disallow: www.json4u.com
Sitemap: ${sitemap}`;

  if (isVercel) {
    data = `Disallow: *
Sitemap: ${sitemap}`;
  }

  fs.writeFileSync('./public/robots.txt', data, {flag: 'w'});
};

module.exports = genRobotsFile;