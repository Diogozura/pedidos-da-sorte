import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["firebasestorage.googleapis.com"],

    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.json$/,
      type: 'javascript/auto',
      use: 'json-loader', // pode ser necessário instalar: npm install --save-dev json-loader
    });
    return config;
  },
};

export default nextConfig;
