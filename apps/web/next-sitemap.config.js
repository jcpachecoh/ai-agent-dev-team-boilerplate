/** @type {import('next-sitemap').IConfig} */
export default {
  siteUrl: 'https://opssynk.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [{ userAgent: '*', allow: '/' }],
  },
  exclude: ['/api/*'],
};
