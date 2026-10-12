# mayumi前端

## Technologies Used

- [Next.js 16](https://nextjs.org/docs/app)
- [HeroUI v3](https://www.heroui.com/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript 7](https://www.typescriptlang.org/)
- [next-themes](https://github.com/pacocoursey/next-themes)

## How to Use

### Install dependencies

使用 Node.js 24，与 GitHub Actions 和 Docker 保持一致。

```bash
npm ci
```

### Run the development server

```bash
npm run dev
```

### Build and check

```bash
npm run build
npm run lint
npm run typecheck
```

`typecheck` 使用 TypeScript 7。由于 TypeScript 7 尚未提供编译器 API，
`typescript` 通过 npm alias 指向 `@typescript/typescript6`，供 ESLint 和 Next.js 插件使用；
`@typescript/native` 则提供 TypeScript 7 的 `tsc`，采用 [TypeScript 官方的双版本方案](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6-0)。
`build` 在 Next.js 构建和兼容编译器检查完成后，再运行 TypeScript 7 检查。
ESLint 暂保留在 9，因为 `eslint-config-next` 使用的 React、Import、JSX 无障碍插件尚未声明支持 ESLint 10。

## 群模型安全配置页

页面路由为 `/config/[ticketId]#token=<one-time-submit-token>`，配合 backend 的 `/v1/config-*` 中转接口使用。

- `NEXT_PUBLIC_BACKEND_URL` 指向中转后端的公开 Origin，例如 `https://api.example.com`。
- 页面会从 URL hash 读取一次性提交凭据并立即清除地址栏中的 hash，凭据不会随 HTTP 请求、Referer 或服务端日志发送。
- API Key 仅在浏览器内存中短暂存在。浏览器使用 AES-256-GCM 加密配置，再以目标机器人实例的 RSA-OAEP-3072 公钥封装 AES 密钥；服务器只接收密文。
- `/config/*` 会在 Sentry 初始化前清除 fragment，并禁用错误上报、Tracing、Feedback 和 Replay，避免配置凭据或表单内容进入遥测。
- 配置页响应包含 `no-store`、`no-referrer`、禁止 iframe、CSP 等安全头。生产部署必须使用 HTTPS。

本地联调时，后端 `.env` 中可配置：

```dotenv
GROUP_API_CONFIG_WEB_URL=http://localhost:3000
```

## License

Licensed under the [MIT license](https://github.com/nextui-org/next-app-template/blob/main/LICENSE).
