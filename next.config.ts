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
  webpack(config, { isServer }) {
    // Corrige problemas com Firebase/gRPC no build
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        'json-loader': false,
      };
    }

    // Ignora módulos problemáticos no cliente
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'json-loader': 'commonjs json-loader',
        '@grpc/grpc-js': 'commonjs @grpc/grpc-js',
        '@grpc/proto-loader': 'commonjs @grpc/proto-loader',
      });
    }

    return config;
  },
};

export default nextConfig;
