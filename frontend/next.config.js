/** @type {import('next').NextConfig} */
const nextConfig = {
  // 添加assetPrefix以确保静态资源正确加载
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  images: {
    domains: ['localhost', '10.1.1.55'], // 添加你的IP地址
  },
  async rewrites() {
    return [
      // 重定向特定页面到动态路由系统
      {
        source: '/about',
        destination: '/pages/about',
      },
      {
        source: '/services',
        destination: '/pages/services',
      },
      {
        source: '/contact',
        destination: '/pages/contact',
      },
      // API代理
      {
        source: '/api/:path*',
        destination: 'http://localhost:3003/api/:path*', // 使用localhost而不是IP地址，端口改为3003
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:3003/uploads/:path*', // 代理上传文件，端口改为3003
      },
      {
        source: '/system-default/:path*',
        destination: 'http://localhost:3003/system-default/:path*', // 代理系统默认素材文件，端口改为3003
      },
    ];
  },
}

module.exports = nextConfig