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

### 可选：浏览器业务 API 由 EO 直接回源香港

`eo-mainland-rule.json` 是大陆所有请求先回阿里云的原方案。若要减少浏览器 API 的转发层级，按以下顺序从上到下配置三条独立规则：

1. 编辑原地域规则，粘贴 `eo-mainland-frontend-rule.json`：大陆请求回阿里云。
2. 新建规则，粘贴 `eo-api-direct-hk-rule.json`：业务 API 回香港并禁用缓存。
3. 再新建规则，粘贴 `eo-mainland-frontend-api-rule.json`：大陆访问 Next.js 自身 API 时回阿里云。

单条规则编辑器的 `Rules` 数组最多只能有一个元素，因此三份文件必须分别保存。条件使用用户从控制台导出的 `in ['/api/*']` 通配符形式；不再使用此前编辑器拒绝的 `matches` 和嵌套逻辑组合。保留其他缓存、安全及域名配置，且不要在这三条下方再放宽泛的回源规则。文件仅供手动导入，提交文件不会自动更新 EO；仍需控制台校验并发布后验收。

- 大陆页面：浏览器 → EO → 阿里云 Next.js。
- 浏览器业务 `/api/*`、`/v1/*`：浏览器 → EO → 香港 Nginx → 香港后端，禁用边缘缓存。
- Next.js 的 `/api/recommendations`（含子路径）和 `/api/beatmap-preview`（含子路径）仍跟随前端地域路由；这些路径不是业务后端接口。源站 Nginx 也须正确转给本地 Next.js，目前模板仅显式配置了两个根接口；`/api/recommendations/profile` 另需补充源站规则后才能使用。
- 境外请求继续回香港，默认源站仍为 `43.128.13.242`。

三条规则依赖 EO 的“下方规则优先级更高”机制：第二条覆盖第一条的业务 API 源站，第三条再恢复前端 API 的大陆源站，第二条设置的 API 禁用缓存仍保留。浏览器仍访问 `https://mayumi.xyz`，无需新增跨域或 Cookie 配置。规则优先级参见 [EO 请求处理顺序](https://edgeone.ai/zh/document/56723)。

当前代码已将首页列表、登录用户、比赛主题色及全部公开赛事页面的数据改为浏览器通过 EO 请求，页面渲染不再调用业务后端。SWR 在同一身份下共享比赛信息、成员和图池等请求；退出登录或切换身份时重建页面数据缓存。统计预览仍携带浏览器的 HttpOnly Cookie，由香港后端验证权限。旧 `18421` 内部网关保留供旧版本回滚使用，新页面不再依赖它；`BACKEND_INTERNAL_URL` 也不再用于页面取数。

OAuth 换取令牌、荐图和谱面预览等使用服务端密钥的 Route Handler 仍在服务器执行；它们是在用户调用对应功能时处理的接口，不是页面渲染取数。不要把这些私钥或后端验证逻辑移到浏览器。

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

若内地资源不足，先禁用 EO 的大陆修改源站规则，使流量恢复到默认香港源站，再停止内地 `mayumi-front`。无需停止原有 Python 服务、修改数据库或注销备案。备案核验仍须由实际接入商确认。

官方说明：[EO 地域修改源站](https://intl.cloud.tencent.com/zh/document/product/1145/72827)、[Next.js 多实例部署](https://nextjs.org/docs/app/guides/self-hosting)。
