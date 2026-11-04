# 境内外站点

同一域名 `mayumi.xyz`、同一份 Next.js 构建：

- 默认源站：腾讯云香港 `43.128.13.242`。
- 中国大陆源站：阿里云 `106.14.112.207`。
- 业务后端、SQLite 数据库暂时继续使用香港现有服务，没有复制第二份数据库。
- 阿里云实际运行前端，Nginx 仅将固定的业务 API 回源到香港 IP，使用 `mayumi.xyz` 验证 TLS 证书；不依赖域名分流后的解析结果，因此不会形成回源循环。

## EO 规则

域名目前已 CNAME 到 `mayumi.xyz.eo.dnse1.com`，无需再按地域改 DNS。

1. 站点加速区域须包含中国大陆，并保持有效备案。
2. 默认源站保留 `43.128.13.242`。
3. 添加地域规则：客户端地域为中国大陆时，修改源站为 `106.14.112.207`，HTTPS，端口 443，回源 Host 和 SNI 均为 `mayumi.xyz`，启用证书校验。
4. 先仅缓存 `/_next/static/*` 并遵循源站 `Cache-Control`；页面、其他静态路径、`/api/*`、`/oauth/*`、`/v1/*`、`/config/*`、`/_mayumi/*` 禁用边缘缓存。后续按需逐项扩大静态缓存，不设置全站“强制缓存”。
5. 保留 Cookie、Set-Cookie、查询参数、Next.js 请求头和 Vary，不将 RSC 响应当作 HTML 缓存。

配置后分别从境内外检查：境内响应应有 `X-Mayumi-Region: cn`；境外继续使用香港源站。先用只读页面验收，再检查登录和管理页面的缓存旁路。

## 阿里云资源限制

2026-11-04 实测：2 核，物理内存约 1.6 GiB。已有两个 Python 服务共占用约 700 MiB RSS，启用 Mayumi 前可用内存约 490 MiB。

前端服务 `mayumi-front.service`：单实例、直接运行 Node（不额外使用 npm/PM2 常驻进程），JavaScript 堆上限 160 MiB，cgroup MemoryHigh 256 MiB、MemoryMax 320 MiB、MemorySwapMax 64 MiB，CPU 上限一个核。

初次只读验证下，服务约占 100–185 MiB；18 次、并发 3 的赛程请求均返回 200，没有 OOM 或自动重启。整机仍有约 440 MiB available，但内存压力上升。这是轻载可用性验证，不代表生产峰值容量；暂不在该机追加后端、数据库或构建任务。

## 持续部署

GitHub Actions 在香港部署成功后，使用同一份 `.next`，在 CI 准备生产依赖后上传内地节点，不在内地机器运行 `npm install` 或 `next build`。两端使用相同构建 ID、Server Action 加密材料及 `.env` 中的 `DEPLOYMENT_VERSION`。

启用仓库变量 `REGIONAL_CN_ENABLED=true`，并配置 Secrets `CN_HOST`、`CN_USERNAME`、`CN_KEY`。已有的 `HOST`、`USERNAME`、`KEY`、`ENV_FILE` 继续用于香港。

内地目录 `/opt/mayumi/web` 指向 `/opt/mayumi/releases/<commit>`。新版本只读首页健康检查失败时恢复上一版本，成功时保留当前及上一 SHA 版本。初始化版本 `bootstrap-20261104` 保留供人工恢复。

证书仍由香港现有 Certbot 续期。每次部署及每周定时任务通过 SSH 同步到内地，检查有效期及公私钥匹配后执行 `nginx -t`，成功才重载。证书私钥不存入仓库、GitHub artifacts 或日志。

## 检查与回滚

```bash
# 任意能直连源站的终端；不改变公共 DNS
curl --resolve mayumi.xyz:443:106.14.112.207 -I https://mayumi.xyz/
curl --resolve mayumi.xyz:443:106.14.112.207 https://mayumi.xyz/_mayumi/health

# 内地机
systemctl status mayumi-front
systemctl show mayumi-front -p MemoryCurrent -p NRestarts
cat /sys/fs/cgroup/system.slice/mayumi-front.service/memory.events
free -m
nginx -t
```

若内地资源不足，先禁用 EO 的大陆修改源站规则，使流量恢复到默认香港源站，再停止内地 `mayumi-front`。无需停止原有 Python 服务、修改数据库或注销备案。备案核验仍须由实际接入商确认。

官方说明：[EO 地域修改源站](https://intl.cloud.tencent.com/zh/document/product/1145/72827)、[Next.js 多实例部署](https://nextjs.org/docs/app/guides/self-hosting)。
