/** @type {import('next').NextConfig} */
const nextConfig = {
  // CHANGED: was `ignoreBuildErrors: true` (a v0 default). Letting type errors
  // fail the build means regressions are caught in CI instead of shipping silently.
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
