/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://fitzo.one",
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ["/icon.png*", "/og-image.png*", "/*.png"],
  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/" }],
  },
};
