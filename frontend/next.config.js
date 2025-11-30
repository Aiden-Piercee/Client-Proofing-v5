/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Custom build ID
  generateBuildId: async () => {
    return "proofing-build";
  },

  // Disable image optimization (required for self-hosted / Koken images)
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
