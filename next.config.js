/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://ifosxcolqtgtyprwnruv.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlmb3N4Y29scXRndHlwcnducnV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMDA0MTEsImV4cCI6MjA1NjU3NjQxMX0.zU_yYGrj4X2dtbC2KIwBp8FjbaZV6Ps7Qd6vbmF2JZY",
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com', 'ifosxcolqtgtyprwnruv.supabase.co'],
    unoptimized: true,
  },
  swcMinify: true,
  experimental: {
    esmExternals: true,
},
webpack: (config, { isServer }) => {
  config.resolve.alias['@'] = require('path').resolve(__dirname, 'src');
  config.resolve.alias['a'] = require('path').resolve(__dirname); // Add a/ for root
  return config;
},
};

module.exports = nextConfig;