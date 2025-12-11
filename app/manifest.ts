import { MetadataRoute } from 'next'
import { siteConfig } from "@/config/site"; // 导入配置

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,              // "Mayumi"
    short_name: siteConfig.name,        // "Mayumi"
    description: siteConfig.description,// "一站式OSU比赛管理网站"
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',        // 深色背景
    theme_color: '#006FEE',             // 你的 Primary Blue
    icons: [
      {
        // 这里的路径指向 public 文件夹
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}