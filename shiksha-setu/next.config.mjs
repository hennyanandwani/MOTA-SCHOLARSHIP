/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // next-intl locale is managed client-side via session store
  // no [locale] segment in routes
};

export default nextConfig;
