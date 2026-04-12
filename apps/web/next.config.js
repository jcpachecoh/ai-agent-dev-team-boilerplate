/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@restopsiq/ui"],
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
  },
};

export default nextConfig;
