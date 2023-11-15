/** @type {import('next').NextConfig} */
const nextConfig = {  images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 't.mwm.moe',
                port: '',
                pathname: '/moe',
            },
        ],
    },}

module.exports = nextConfig
