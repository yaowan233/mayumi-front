# 境内外站点

同一域名 `mayumi.xyz`、同一份 Next.js 构建：

- 默认源站：腾讯云香港 `43.128.13.242`。
- 中国大陆源站：阿里云 `106.14.112.207`。
- 业务后端、SQLite 数据库暂时继续使用香港现有服务，没有复制第二份数据库。
- 阿里云实际运行页面和静态资源；完成切换后，服务端功能由 EO 直接交给香港，内地 Nginx 不再配置香港上游或内部 API 网关。

## EO 规则

域名目前已 CNAME 到 `mayumi.xyz.eo.dnse1.com`，无需改 DNS。默认源站保留香港 `43.128.13.242`，加速区域包含中国大陆并保持有效备案。

1. 保留大陆页面规则 `eo-mainland-frontend-rule.json`：大陆请求默认回阿里云。
2. 把旧第三条“中国大陆前端 API 回源阿里云”替换为 `eo-server-routes-hk-rule.json`，放在大陆页面规则下方。旧的业务 API 回香港规则可以保留；不再保留任何把服务接口改回阿里云的更下方规则。
3. 新规则覆盖 `/api`、`/api/*`、`/v1`、`/v1/*`、`/oauth`、`/oauth/*`、`/downloads`、`/downloads/*`、`/_next/image` 和旧荐图 API 别名 `/recommend/*`。统一 HTTPS 443 回源香港，Host/SNI 为 `mayumi.xyz`，禁用边缘缓存。普通 `/recommend` 页面仍可在大陆提供。
4. 仅对 `/_next/static/*` 开启静态缓存；其他页面及 `/config/*`、`/_mayumi/*` 保持不缓存。保留 Cookie、Set-Cookie、查询参数、Next.js 请求头和 Vary。

每份 JSON 都只有一条规则，使用控制台已导出的 `in ['/api/*']` 通配符语法；文件提交不会自动发布 EO。EO 下方规则覆盖上方的同类配置，参见 [规则优先级](https://edgeone.ai/zh/document/56723)。

### 源站切换顺序

1. 香港先执行 `sudo bash deploy/regional/install-hk-routes.sh`，补齐 Next.js 服务接口。脚本保留原后端、TLS 及限流配置，先备份，再校验并重载；失败时还原配置。GitHub Actions 会在以后部署时重复安装，脚本支持重复执行。
2. 用户在 EO 替换并发布上述规则，从大陆验证所有服务路径已直接回香港，普通页面仍带 `X-Mayumi-Region: cn`。
3. 确认 EO 切换后才把本目录 `nginx-cn.conf` 安装到内地 `/etc/nginx/conf.d/mayumi-regional.conf`，备份旧文件后 `nginx -t` 并重载。新版移除香港上游和 `18421` 网关，误到内地的服务请求返回不缓存的 503，不执行本地处理器，也不转发香港。同步更新 systemd 单元并 daemon-reload，删除已不用的 `BACKEND_INTERNAL_URL` 配置。

香港路由由 `nginx-hk-frontend-routes.conf` 和 `nginx-hk-frontend-upstream.conf` 管理。荐图根接口和子路径、谱面预览、OAuth、下载和图片优化交给香港 Next.js；其余业务 API 继续由原 Nginx 路由交给本机后端。OAuth 回调关闭访问日志，避免记录授权码；服务接口响应强制不缓存。

2026-11-04 香港源站已安装并验证：匿名荐图根接口及画像接口返回 401，缺少参数的谱面预览和图片优化返回 400，无授权码的 OAuth 返回 307，无效谱面集下载返回 400；原有用户和赛事列表接口仍返回 200。OAuth 测试标记未写入访问日志，安装脚本重复执行通过。内地纯前端 Nginx 和 systemd 配置已在源站做语法校验；启用仍须遵循上述顺序，先确认 EO 发布，再关闭旧入口。

当前代码已将首页列表、登录用户、比赛主题色及全部公开赛事页面的数据改为浏览器通过 EO 请求，页面渲染不再调用业务后端。SWR 在同一身份下共享比赛信息、成员和图池等请求；退出登录或切换身份时重建页面数据缓存。统计预览仍携带浏览器的 HttpOnly Cookie，由香港后端验证权限。切换完成后删除旧 `18421` 内部网关和 `BACKEND_INTERNAL_URL`，页面不依赖它们。

OAuth 换取令牌、荐图和谱面预览等使用服务端密钥的 Route Handler 统一在香港执行；接口鉴权及 OAuth 保存会话仍可能请求业务后端，但执行节点均在香港。密钥继续只在服务器使用。

迁移验收：生产模式前端加装临时 `fetch` 检查器，任何渲染时访问 `/api/*` 或 `/v1/*` 均抛错并记录。首页、登录相关页、七个公开赛事页及赛事管理各页，共 22 个 HTML 路由（携带测试会话 Cookie）均返回 200，未记录服务端业务请求。独立无头 Edge 会话以公开 API 响应验收浏览器加载和导航：比赛主页与主题色只请求一次比赛信息，赛程／成员／统计共享一份成员请求，图池与统计共享一份图池请求，导航期间用户信息仅请求一次；延迟返回管理员身份时，没有提前跳转或读取管理数据。权限交互使用本地模拟身份，未写入生产数据。

导入并发布后，从大陆分别检查页面和只读 API：页面应有 `X-Mayumi-Region: cn`，业务 API 不应再带该响应头；结合 EO 回源日志确认 API 源站为香港 IP。规则字段及表达式参见 [EO 配置语法](https://edgeone.ai/document/74785)、[条件表达式](https://edgeone.ai/document/74786)。

2026-11-04 18:56（北京时间）发布后只读验收：大陆首页返回 200 并带 `X-Mayumi-Region: cn`；大陆访问 `/api/tournament-summaries` 返回 200，源站响应为香港 Nginx，且无大陆标记；谱面预览缺少参数时返回预期的 400，仍带大陆标记。大陆发出的唯一 `/api/__regional_readonly_probe_*` 请求在香港访问日志中出现，阿里云网站和内部 API 网关两份日志均无该路径，确认浏览器业务 API 不经阿里云转发。香港首页及列表 API 均返回 200。未进行登录或写入操作验收。

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

若内地资源不足，先禁用 EO 的大陆页面规则，使页面流量恢复到默认香港源站，再停止内地 `mayumi-front`。服务接口继续回香港。若需回滚到依赖旧内地 API 网关的应用版本，必须先恢复备份的内地 Nginx 和 systemd 单元，再切换旧版本。无需停止原有 Python 服务、修改数据库或注销备案。备案核验仍须由实际接入商确认。

官方说明：[EO 地域修改源站](https://intl.cloud.tencent.com/zh/document/product/1145/72827)、[Next.js 多实例部署](https://nextjs.org/docs/app/guides/self-hosting)。
