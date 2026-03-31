/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['*.replit.dev', '*.spock.replit.dev'],
  webpack(config) {
    const fileExtensions = /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|otf|mp4|webm|ogg|mp3|wav|flac|aac|pdf)(\?.*)?$/i;

    config.module.rules.forEach((rule) => {
      if (!Array.isArray(rule.oneOf)) return;
      rule.oneOf.forEach((oneOf) => {
        const loaders = Array.isArray(oneOf.use) ? oneOf.use : [];
        loaders.forEach((loader) => {
          if (
            typeof loader !== 'object' ||
            typeof loader.loader !== 'string' ||
            !loader.loader.includes('css-loader')
          ) return;
          if (!loader.options || typeof loader.options !== 'object') return;

          loader.options.url = (url) => {
            if (!url) return false;
            if (url.startsWith('/')) return false;
            if (!fileExtensions.test(url)) return false;
            return true;
          };
        });
      });
    });

    return config;
  },
}

export default nextConfig
