const nextConfig: { rewrites(): Promise<[{ source: string; destination: string }]> } = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://backend:4000/:path*',
            },
        ];
    },
};

export default nextConfig;