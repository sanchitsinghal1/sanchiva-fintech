// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: false,
//   // The frontend talks to the Express backend through the gateway via
//   // ?XTransformPort=5000 — no env-based rewrites needed.
//   eslint: { ignoreDuringBuilds: true },
// };

// module.exports = nextConfig;



/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*', // Yeh line frontend ko backend se jodegi
      },
    ]
  },
}

module.exports = nextConfig