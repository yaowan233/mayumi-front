/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 't.mwm.moe',
                port: '',
                pathname: '/moe',
            },
            {
                protocol: 'https',
                hostname: 'assets.ppy.sh',
                port: '',
                pathname: '/',
            },
        ],
    },
}

module.exports = nextConfig
