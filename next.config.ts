import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // Configuração específica para desenvolvimento
  ...(isDev && {
    // Desabilita otimizações desnecessárias em dev
    swcMinify: false,
  }),
  
  images: {
    domains: ["firebasestorage.googleapis.com"],

    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
  },
  
  // Evita problemas de prerender com Firebase em desenvolvimento
  typescript: {
    ignoreBuildErrors: isDev, // Ignora erros de TS apenas em dev
  },
  
  eslint: {
    ignoreDuringBuilds: isDev, // Ignora warnings de ESLint apenas em dev
  },
  
  webpack(config, { isServer, dev }) {
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

    // Configurações específicas para desenvolvimento
    if (dev) {
      // Melhora performance em dev
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules/**', '**/.git/**'],
      };
    }

    return config;
  },
};

export default nextConfig;
