# 网页谱面推荐（历史第一版）

此页记录旧的官方搜索／Top-50 筛选方案，当前 `/recommend` 已改接真正的定制算法。当前使用方式见 [定制算法本机预览](custom-recommendation-preview.md)。

入口 `/recommend`，导航新增「谱面推荐」。复用现有 Navbar、HeroUI v3 Card / Button、主题色、深浅色与游戏模式图标。

## 两条路径

- 条件发现：无需登录，通过 osu! 官方搜索获取已上架谱面，按模式、关键词、NM 星级、最长总时长、BPM、mania 4K/7K 严格筛选。排除转换谱面，优先最近上架，每次最多检索 3 页，显示 24 张；不是能力预测或全库穷举。
- BP 个性化：输入 UID，已登录用户切换时自动带入自己的 UID。服务端请求现有推荐引擎，再对最多 50 个返回候选按关键词、星级、时长和 Mod 筛选，保留引擎顺序。支持 balanced / farm / peak，不代表硬条件已前推到引擎召回阶段。
- 条件路径没有个人 ACC / PP。个人路径中的 ACC / PP 是引擎估计，不是游玩保证；现有引擎不返回 BPM/键数，因此该路径不开放这些筛选，API 也会拒绝它们。
- 空结果明确说明本轮候选内无匹配，不静默放宽条件。切换条件会取消旧请求并清除旧结果；提供错误、加载和取消状态。

## 运行配置

仅 Next.js 服务端读取：

```dotenv
RECOMMENDER_API_URL=http://192.168.6.136:8000
```

可选 `RECOMMENDER_API_TOKEN` 用于开启鉴权的推荐引擎。条件搜索复用项目已有的 `NEXT_PUBLIC_CLIENT_ID` / `CLIENT_SECRET`；密钥不发送到浏览器。

本机新增被 Git 忽略的 `.env.local`，只设置推荐引擎地址，不修改原 `.env`。线上前端服务器必须能访问推荐引擎；公网云主机不能直接访问家庭 LAN 地址，应使用私网隧道或受控反向代理，不能只复制这个地址就认为已完成部署。

同源代理 `/api/recommendations` 校验参数、不接受客户端指定上游 URL；150 秒上游超时，每个 Node 进程最多 2 个并发请求。此限制不是分布式限流；公开部署前应在网关增加用户/IP 配额与访问监控，并配置足够的代理超时。

## 验证

```powershell
npx tsc --noEmit
npx eslint lib/recommendation.ts app/api/recommendations/route.ts components/recommendation_explorer.tsx 'app/(home)/recommend/page.tsx' tests/recommendation.test.ts
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --experimental-strip-types tests/recommendation.test.ts
```

本机 TypeScript 检查、改动文件 ESLint、全部 12 项测试通过。验证了官方条件搜索返回真实谱面、mania 4K/BPM/星级/时长联合筛选，以及 UID 3162675 的 fruits 推荐代理返回引擎结果；非法范围返回 400。官方搜索曾有一次上游失败，页面代理返回可重试错误，重试后成功，未伪造结果。浏览器检查了桌面和 390px 窄屏布局、真实条件结果和表单切换。未运行生产构建、未部署前端、未修改 NAS 模型或推荐算法。

## 后续

下一步把硬条件前推到推荐引擎的候选召回阶段，解决筛选后候选不足；再接入参考谱面和训练目标。当前条件搜索是可用的发现入口，不是新的学习式推荐算法。

官方接口参考：[osu! API 文档](https://osu.ppy.sh/docs/)、[谱面搜索语法](https://osu.ppy.sh/wiki/en/Beatmap_search)。
