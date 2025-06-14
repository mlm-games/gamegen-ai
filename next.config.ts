// next.config.ts
import type { NextConfig } from 'next'
import type { Configuration } from 'webpack'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: 'pbxt.replicate.delivery',
      },
    ],
    dangerouslyAllowSVG: true,
  },
  webpack: (config: Configuration) => {
    config.module?.rules?.push({
      test: /\.(mp3|wav|ogg)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/audio/[hash][ext]',
      },
    });
    return config;
  },
}

export default nextConfig
