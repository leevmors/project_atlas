/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack(config) {
    config.module.rules.forEach((rule) => {
      if (!rule.oneOf) return;
      rule.oneOf.forEach((oneOf) => {
        if (!Array.isArray(oneOf.use)) return;
        oneOf.use.forEach((loader) => {
          if (
            typeof loader === 'object' &&
            loader.loader &&
            loader.loader.includes('css-loader')
          ) {
            if (loader.options) {
              loader.options.url = false;
              loader.options.import = false;
            }
          }
        });
      });
    });
    return config;
  },
}

export default nextConfig
