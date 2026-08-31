# HeroUI 3.1.0 → 3.2.4 升级审计

审计日期：2026-08-31

## 结论

这次升级范围内，HeroUI 官方明确标记的组件级破坏性变更只有一组：`Checkbox`、`Radio`、`Switch` 在 3.2.0 改用 `*Field` + `*Button`，因此 `*.Control`、标签和说明文字的组合层级都变了。仓库当前所有这三类组件的结构已经符合 3.2 写法。

另外有几项虽未统一标成 “Breaking Changes”，但可能改变现有行为或部署方式：

1. React Aria 1.20 改变了 `Checkbox` / `Radio` / `Switch` 的 Enter 键行为：Enter 不再切换状态，并会恢复原生表单隐式提交。这是本仓库最值得做交互回归的一项。
2. Tooltip 默认显示/隐藏延迟由 React Aria 的 `700ms / 0ms` 变成 HeroUI 的 `1500ms / 500ms`；本仓库多处 Tooltip 会直接感知这个变化。
3. `Tabs.ListContainer` 在溢出时自动加入滚动箭头和边缘渐隐；本仓库所有 Tabs 都使用该容器，需检查自定义 `overflow-x-auto`、sticky、宽度类是否与新结构冲突。
4. React Aria 依赖处理经历了三步，而不是一次改成 peer：3.2.1 外部化 `react-aria/*` 子路径，3.2.2 仍以普通 dependencies 声明、但把 `react-aria` / `react-aria-components` 的精确版本放宽为 caret 范围，3.2.3 才把五个共享运行时包移到 peerDependencies。当前安装树已经正确去重成单实例，但根 `package.json` 没有显式声明这些 peers，换包管理器或重建 lockfile 时应重新验证。
5. HeroUI 3.2.3 发布说明中的 Node.js `>=22.x` 对应官方 monorepo 根 `package.json` 的开发/构建基线；发布的 `@heroui/react` 包没有 `engines` 字段，React Aria 包也没有在本次升级中声明该要求。因此不能把它当成已确认的消费端运行时破坏。本仓库 CI 和服务器恰好都使用 Node 24。
6. 对 3.1.0 与 3.2.4 官方包/API 源码的比较还发现一个未写入 Breaking Changes 的高级 API 删除：`CalendarYearPicker` 不再导出 `YearPickerStateContext`、`useYearPickerState`、`YearPickerStateContextValue`。仓库没有使用 Calendar，因此当前无影响。

成员 UID 输入框的问题本身不是 3.1.0 → 3.2.4 新引入的破坏：HeroUI v3 从一开始就把 `Autocomplete` 定义为“按钮触发、弹层内搜索”的 searchable select；需要直接输入和自由值时应使用 `ComboBox`。官方 v2→v3 迁移指南明确区分了这两个组件。

## 审计范围与版本证据

- 基线锁文件（升级提交的父版本）：`@heroui/react@3.1.0`、`react-aria-components@1.17.0`、`react-aria@3.48.0`。
- 当前锁文件：`@heroui/react@3.2.4`、`react-aria-components@1.20.0`、`react-aria@3.51.0`，见 [`package-lock.json`](../../package-lock.json)。
- 审计资料只使用 HeroUI 与 Adobe React Aria 的官方发布说明、迁移指南、GitHub PR 和 tag 源码。
- 比较过 HeroUI [3.2.0](https://heroui.com/en/docs/react/releases/v3-2-0)、[3.2.1](https://heroui.com/en/docs/react/releases/v3-2-1)、[3.2.2](https://heroui.com/en/docs/react/releases/v3-2-2)、[3.2.3](https://heroui.com/en/docs/react/releases/v3-2-3)、[3.2.4](https://heroui.com/en/docs/react/releases/v3-2-4)，以及 React Aria [1.18.0](https://react-aria.adobe.com/releases/v1-18-0)、[1.19.0](https://react-aria.adobe.com/releases/v1-19-0)、[1.20.0](https://react-aria.adobe.com/releases/v1-20-0)。

## 风险清单

| 风险 | 版本 | 组件/范围 | 变化及可能后果 | 本仓库状态 | 迁移或回归建议 |
| --- | --- | --- | --- | --- | --- |
| 高 | HeroUI 3.2.0 | Checkbox / Radio / Switch | 明确 breaking：`X.Content` 从普通布局容器变成可点击 `<label>`；`X.Control` 必须放进 `X.Content`；标签改为普通文本，不能在其中嵌套 `<Label>`；`Description` / `FieldError` 要成为 `X.Content` 的兄弟节点。[官方说明与迁移代码](https://heroui.com/en/docs/react/releases/v3-2-0#breaking-changes) | 已扫描所有用例，当前均为 `X.Content > X.Control`；没有在 `X.Content` 内嵌套 HeroUI `Label`。 | 保留当前结构；以后新建无文字的 control-only toggle 也必须保留 `X.Content`，并在根上提供 `aria-label`。 |
| 高 | React Aria 1.20.0 | Checkbox / Radio / Switch 键盘事件 | 未标 breaking 的交互变化：官方 PR 明确说明 `usePress` 过去会阻止 Enter 的默认行为；修复后 Enter 不再切换这些控件，并可触发表单隐式提交，Space 仍是原生切换键。[发布说明](https://react-aria.adobe.com/releases/v1-20-0#checkbox)、[官方 PR #9972](https://github.com/adobe/react-spectrum/pull/9972) | `components/group_model_config_form.tsx` 的两个 Switch 位于 `<form>` 内，Enter 现在可能提交；其他 Radio/Checkbox/Switch 也会从“Enter 可切换”变为“仅 Space 切换”。 | 用键盘回归所有 toggle：Space 切换、Enter 的提交/不操作是否符合产品预期；确保 submit handler 可安全处理 Enter。不要无意恢复非原生 Enter-to-toggle。 |
| 中 | HeroUI 3.2.0 | Tooltip | 默认 `delay/closeDelay` 从 `700ms/0ms` 改为 `1500ms/500ms`；显式 props 仍覆盖主题值。[官方行为变更](https://heroui.com/en/docs/react/releases/v3-2-0#tooltip-delay-theme-variables) | 管理页、首页、赛程和统计入口有多处 Tooltip，均未显式设置延迟。 | 体验回归；若旧响应速度是产品要求，在主题设置 `--tooltip-delay: 700ms`、`--tooltip-close-delay: 0ms`，或逐个传 props。 |
| 中 | HeroUI 3.2.2 / 3.2.4 | Tabs.ListContainer | 溢出时容器会自动渲染滚动箭头和渐隐边缘；3.2.4 又修正滚动边界。[3.2.2 功能说明](https://heroui.com/en/docs/react/releases/v3-2-2#tabs)、[3.2.4 边界修复](https://heroui.com/en/docs/react/releases/v3-2-4#bug-fixes) | 参与者、统计、成员、图池和赛程等 Tabs 都使用 `Tabs.ListContainer`；部分 `Tabs.List` 或容器自己设置了 `overflow-x-auto`、`w-fit`、sticky。 | 在窄屏逐页检查箭头、渐隐、双重滚动条、sticky 层级和首尾 tab 可达性；若使用新容器滚动，应避免把真正的滚动交给内层 `Tabs.List`。 |
| 中 | HeroUI 3.2.1–3.2.3 | 依赖解析、共享 React Context | 3.2.1 外部化 `react-aria/*` 子路径，修复 vendored 副本造成 Tooltip 的 `FocusableContext` 分裂；3.2.2 把 `react-aria` / `react-aria-components` 从精确版本改成 caret 范围，但明确仍是普通 dependencies；3.2.3 才把 `react-aria`、`react-aria-components`、`@react-aria/i18n`、`@react-aria/ssr`、`@react-aria/utils` 移到 peerDependencies。官方复现表明多副本可能令 Form / TextField / FieldError 的验证 context 静默失效，且结果依赖包管理器。[3.2.1 PR #6653](https://github.com/heroui-inc/heroui/pull/6653)、[3.2.2 PR #6689](https://github.com/heroui-inc/heroui/pull/6689)、[3.2.3 PR #6744](https://github.com/heroui-inc/heroui/pull/6744)、[3.2.4 包声明](https://github.com/heroui-inc/heroui/blob/v3.2.4/packages/react/package.json) | `npm ls` 当前显示 `react-aria@3.51.0` 与 `react-aria-components@1.20.0` 已在整棵依赖树去重，无 invalid/duplicate；但根 `package.json` 未直接列出五个 peers。 | 若继续依赖 npm 自动安装 peer，至少在 CI 保持 `npm ci` 并检查 `npm ls`；更稳妥做法是把官方 peer 范围显式列为直接依赖并固定 lockfile。尤其回归表单验证错误能否传播到 `FieldError` / `data-invalid`。 |
| 信息 | HeroUI 3.2.3 | HeroUI monorepo 开发/构建环境 | 发布说明提到 Node.js `>=22.x`；源码能确认该 `engines` 只出现在 HeroUI monorepo 根包，发布的 `@heroui/react@3.2.4` manifest 没有 `engines`。所以这不是目前可确认的应用消费端 Node 约束。[发布说明](https://heroui.com/en/docs/react/releases/v3-2-3#dependencies)、[monorepo 根 package.json](https://github.com/heroui-inc/heroui/blob/v3.2.4/package.json)、[`@heroui/react` package.json](https://github.com/heroui-inc/heroui/blob/v3.2.4/packages/react/package.json) | `.github/workflows/deploy.yml` 的构建和服务器均使用 Node 24；无论如何都高于上游仓库基线。 | 不据此要求应用必须升级 Node；只有参与 HeroUI 仓库开发/构建时才把 Node 22+ 当成已证实要求。 |
| 低 | HeroUI 3.2.0 | Link | 去掉硬编码 `text-sm`，链接改为继承父级字体；图标也从固定尺寸改成相对字体的 `0.75em`。[官方样式变更](https://heroui.com/en/docs/react/releases/v3-2-0#style-fixes) | 仓库没有从 `@heroui/react` 导入 `Link`，现有链接使用 Next.js/原生链接，当前无影响。 | 当前无动作；将来采用 HeroUI Link 时不要依赖 3.1 的默认 `text-sm`，需要固定字号则显式添加。 |
| 低 | HeroUI 3.2.2 | Chip | 根宽度改为 `w-fit`，不再默认拉伸填满容器。[官方修复](https://heroui.com/en/docs/react/releases/v3-2-2#bug-fixes) | 仓库大量使用 Chip；多数本来就期望内容宽度，风险较低。 | 检查曾把 Chip 当整行状态条使用的布局；需要拉伸时显式 `w-full`。 |
| 低 | HeroUI 3.2.0–3.2.4 | Autocomplete 弹层 | 弹层增加 Dialog 焦点语义，列表高度封顶并内部滚动，宽度受 trigger 约束；3.2.4 修复 Modal 内末尾选项被裁剪。[3.2.0 修复](https://heroui.com/en/docs/react/releases/v3-2-0#component-fixes)、[3.2.4 修复](https://heroui.com/en/docs/react/releases/v3-2-4#bug-fixes) | team/scheduler 的 Autocomplete 是预定义项选择，语义合适；当前搜索状态已放在 `Autocomplete.Filter`。 | 在 Modal、窄视口及长列表下回归滚动、焦点和末项可达性；不要把 trigger 当文本输入。 |
| 低 | HeroUI 3.2.4 | Tooltip 动画 | HeroUI 为相邻 Tooltip 保留进出场动画；新增 `shouldSkipAnimation` 可恢复 React Aria 的即时替换。[官方说明](https://heroui.com/en/docs/react/releases/v3-2-4#bug-fixes) | 多处连续动作按钮带 Tooltip，可能观察到动画节奏变化。 | 仅在希望相邻 Tooltip 即时切换时设置 `shouldSkipAnimation`。 |
| 低 | HeroUI 3.2.0–3.2.2 | DatePicker / DateRangePicker | 弹层宽度先由 `max-width` 改为至少 trigger 宽，随后改为 `w-fit`，可能改变自定义日历弹层布局。[3.2.0](https://heroui.com/en/docs/react/releases/v3-2-0#style-fixes)、[3.2.2](https://heroui.com/en/docs/react/releases/v3-2-2#bug-fixes) | 仓库没有使用 DatePicker / DateRangePicker。 | 将来采用时以 3.2.4 当前布局为准，不依赖 3.1 的弹层宽度。 |
| 低 | HeroUI 3.2.4 | Modal `scroll="outside"` | 3.2.4 将外部滚动移到 backdrop，恢复 backdrop 点击关闭。[官方修复](https://heroui.com/en/docs/react/releases/v3-2-4#bug-fixes) | 当前 Modal 使用默认或 `scroll="inside"`，没有 `outside`。 | 当前无动作；以后使用 `outside` 时回归点击 backdrop 和滚动锁。 |
| 低 | HeroUI 3.2.0 源码/API | CalendarYearPicker 高级导出 | 3.1.0 曾公开导出 `YearPickerStateContext`、`useYearPickerState`、`YearPickerStateContextValue`；3.2.4 删除这些导出并新增 `useCalendarOrRangeState`。该删除未列入 3.2.0 的 Breaking Changes。[3.1.0 官方源码](https://github.com/heroui-inc/heroui/blob/v3.1.0/packages/react/src/components/calendar-year-picker/index.ts)、[3.2.4 官方源码](https://github.com/heroui-inc/heroui/blob/v3.2.4/packages/react/src/components/calendar-year-picker/index.ts)、[新 hook 源码](https://github.com/heroui-inc/heroui/blob/v3.2.4/packages/react/src/components/calendar-year-picker/use-calendar-state.ts) | 仓库没有 Calendar/RangeCalendar，也没有这些高级导入。 | 若外部代码有深度定制，改用文档化的 Calendar 组合 API；需要读取当前 Calendar/RangeCalendar 状态时评估 `useCalendarOrRangeState`，不要继续依赖已删除 context。 |

## 明确不影响本仓库的官方 Breaking Changes

- HeroUI 3.0.5 把 `Text` 重命名为 `Typography`，BEM 类也从 `text--*` 改为 `typography--*`；这是官方明确标注的 breaking，但发生在本次实际升级基线 3.1.0 之前。仓库没有从 HeroUI 导入 `Text` / `Typography`，也没有使用这两组 BEM 类，因此当前无影响。由于根依赖范围仍写作 `^3.0.4`，以后从旧 lockfile 或无 lockfile 环境安装时仍应知道这一变化。[官方说明](https://heroui.com/en/docs/react/releases/v3-0-5)
- React Aria 1.19.0 唯一单独标出的 breaking 是 `@react-aria/optimize-locales-plugin` 从 v1 升到 v2，并停止支持 webpack 4；本仓库没有安装该插件，Next.js 16 也不是 webpack 4 项目。[官方说明](https://react-aria.adobe.com/releases/v1-19-0#breaking-changes)
- React Aria 1.18.0 的 test utils beta→RC 有多项 breaking 并提供 codemod；本仓库没有安装或使用 React Aria test utils。[官方说明](https://react-aria.adobe.com/releases/v1-18-0#test-utils-rc)
- Calendar 的多选、week/day view、`CalendarHeading` 和 `isDateUnavailable(date, anchorDate)` 属于新增 API；仓库当前没有 Calendar/RangeCalendar。[HeroUI 3.2.0 Calendar 说明](https://heroui.com/en/docs/react/releases/v3-2-0#calendar)
- ComboBox 3.2.3 新增多选及 `ComboBox.Value`，是增量 API，不会改变现有单选；仓库成员 UID 输入使用单选 + `allowsCustomValue`。[官方说明](https://heroui.com/en/docs/react/releases/v3-2-3#combo-box)
- React Aria 1.19 的 `Menu.onAction(key, value)` 是在原有 key 后新增第二个参数，单参数 handler 仍兼容；仓库也没有直接使用 Menu 的 `onAction`。[官方说明](https://react-aria.adobe.com/releases/v1-19-0#menu)

## Autocomplete 与 ComboBox：为什么 UID 输入会失效

HeroUI 官方把 v3 `Autocomplete` 定义为预定义列表选择器：外层是显示已选值的按钮式 trigger，搜索输入位于 popover 内。`ComboBox` 才是在页面上直接显示可输入文本框、边输入边过滤的组件。[官方选择指南](https://heroui.com/en/docs/react/migration/autocomplete#choosing-between-autocomplete-and-combo-box)

因此：

- 只允许从既有选项中选择：使用 `Autocomplete`，并把受控搜索状态传给 `Autocomplete.Filter`。
- 允许用户直接输入列表外 UID：使用 `ComboBox`，在 `ComboBox.InputGroup` 内放 `Input`，并设置 `allowsCustomValue`。
- 这项语义区分是 HeroUI v2→v3 的迁移变化，不是 3.2.4 的 Autocomplete patch fix。3.2.0–3.2.4 对 Autocomplete 的更新集中在虚拟列表、焦点和弹层尺寸/裁剪。

## 建议回归顺序

1. 键盘：在 `group_model_config_form` 内聚焦 Switch，分别验证 Space 与 Enter；再验证首页 Staff Radio/Checkbox 和队伍审核 Checkbox。
2. 窄屏 Tabs：成员、图池、赛程、参与者、统计页面，检查滚动箭头、渐隐、sticky 与首尾 tab。
3. Tooltip：管理列表、首页报名条件、赛程时间等位置，确认 1.5 秒显示延迟是否可接受。
4. 依赖：在干净环境运行 `npm ci` 后执行 `npm ls @heroui/react react-aria react-aria-components @react-aria/i18n @react-aria/ssr @react-aria/utils`，应只有兼容且去重的 React Aria 实例。
5. 视觉：Chip 宽度，以及 Autocomplete 长列表在窄视口和 Modal 中的滚动。

## 版本固定建议

根 `package.json` 当前仍声明 `@heroui/react: ^3.0.4` 和 `@heroui/styles: ^3.0.4`，而 lockfile 实际解析到 3.2.4。由于 HeroUI 3.2.0 在 minor 版本中发布了明确 breaking，后续升级不应只依赖 caret 范围和“TypeScript 能通过”：建议在每次 HeroUI minor 升级时固定目标版本、阅读对应发布说明，并做上述交互回归；生产安装继续使用 lockfile + `npm ci`。
