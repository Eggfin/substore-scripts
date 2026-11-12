# 更新记录

## 2026-11-12

### ST 新增家宽节点

- ST 增加订阅中的 `Host-V-家宽` 为手动候选；`Host-V-美国` 保持首位。两者按精确名称匹配，不存在的节点不显示。
- 美国节点缺失而家宽存在时，生成配置默认选择家宽；两者都缺失时明确输出 `REJECT`，不产生空组、DIRECT 或主组候选。`select` 不会在节点故障时自动切换。
- 此调整不再维持唯一节点/唯一出口约束；客户端保存的选择可能覆盖默认项，更新订阅后须检查并重连。原有规则和其他分组不变。
- 已通过 JavaScript 语法和 JSON 桥接模拟生成测试，覆盖两个节点存在、分别缺失、全部缺失及其他组与规则回归；未在 Sub-Store 原生 YAML、Mihomo/Stash 或真实出口环境验证。

## 2026-11-09

### ST 第一阶段 Fail-Closed：固定唯一节点，缺失时拒绝连接

- ST `select` 组只允许 `Host-V-美国`，删除 `Host-V-家宽`、`Host-H` 两个直接候选；不包含自动选择、`DIRECT`、主策略组或其他备用节点。
- 目标节点缺失时，输出 `proxies: [REJECT]` 且 `default-selected: REJECT`；永不生成空 ST 组，规避 Stash 对空策略组视为 `DIRECT` 的行为。为 Mihomo 设置 `empty-fallback: REJECT` 作为附加保护（不依赖该字段兼容 Stash）。
- ST 原有 Claude / Anthropic、Cloudflare 检测等规则不变；AI服务、OpenAI、Telegram、YouTube、交易所和其他分组均不修改；保留 `store-selected`。
- 使用 JavaScript + JSON 模拟 YAML 接口，105 组输入、1,051 项断言通过，包括节点存在/缺失、重名/保留名冲突、空订阅报错、规则集与其他分组不变等。未执行 Sub-Store 原生 YAML、Mihomo/Stash 内核、VPN 中断后流量或出口 IP 实测。
- **尚未实现**同名节点内容防篡改、同节点出口 IP 锁定、VPN 系统级 Kill Switch 和所有 Claude 流量完整覆盖，列入第二阶段 Notion 设计。

### 删除自动选择代理组

- 删除 `⚡ 自动选择` 的 `url-test` 代理组、对应常量和测速配置。
- 从 `🚀 节点选择`、`✈️ Telegram`、`📺 YouTube` 的候选中移除自动选择入口；节点选择仅保留全部现有节点和 `DIRECT`。
- 保持 AI服务、OpenAI 的日本节点直接选项排除、ST 白名单、其他分组及全部分流规则不变。
- 使用 Node.js v20.20.1 完成独立语法检查和模拟配置生成；109 组输入（含 100 组固定种子的随机输入）、326 项检查全部通过。验证删除后的输出与旧版仅相差自动组及其引用，代理引用有效；正常输出为 10 个代理组、17 个规则集、97 条规则。
- 测试使用 JSON 桥接模拟 Sub-Store 的 YAML 接口，另以 PyYAML 验证 YAML 序列化往返；未运行 Sub-Store 原生 YAML 库、Mihomo 内核、远程规则下载或客户端实际出口测试。
- 按此前决定不修改默认节点字段回退及重名 Host 节点的媒体组排除边界；通过检查仅表示本次删除改动的回归结果，不代表这些边界已修复。

### AI服务与 OpenAI 移除日本节点直接选项

- 从两个分组共用的 `aiWhitelist` 中移除 `NBcloud-V-日本`、`NBcloud-H-日本`。
- 两组仅保留现有的 `Host-V-美国`、`Host-H`、`Host-V-家宽`、`Digital-V-洛杉矶`、`Digital-H` 五个白名单节点及 `🚀 节点选择`，默认节点仍为 `Host-V-美国`。
- 仅移除直接选项；保留的 `🚀 节点选择` 仍可能间接选择日本节点，不从订阅或其他分组删除日本节点。
- ST、Telegram、YouTube、交易所及全部分流规则保持不变。
- 本次未进行脚本运行或客户端实际出口验证。

## 2026-11-08

### 收紧 AI、视频服务、交易所的候选节点

- `🤖 AI服务` 与 `🟢 OpenAI` 只保留指定的七个节点及 `🚀 节点选择`，优先 `Host-V-美国`。
- `✈️ Telegram`、`📺 YouTube` 移除 `Host-V-美国`、`Host-H`、`Host-V-家宽` 的直接选项，新增 `⚡ 自动选择` 并保留 `🚀 节点选择` 和其他节点。
- `💱 交易所` 只列出 `DIRECT`、`🚀 节点选择` 和名称识别为香港的节点（包括“香港”、Hong Kong、HongKong、HK/HKG 标记）；节点仍从 `all-vps` 动态获取。
- ST、Cloudflare、各服务域名匹配规则和其他分组未改变。保留 `store-selected`；旧选择仍可能覆盖默认选择。
- 通过 JavaScript 语法、模拟 Sub-Store 生成、节点缺失、ST、OpenAI、Bitget 及 Cloudflare 回归检查；客户端出站需更新订阅后检查。

### ST 白名单移除 Digital 节点

- 按要求从 ST 分组删除 `Digital-V-洛杉矶` 和 `Digital-H`，现在仅允许 `Host-V-美国`、`Host-V-家宽`、`Host-H`（需存在于 `all-vps` 中）。
- 保持美国节点首选、原有 Claude / Cloudflare 精确分流及其他策略组不变；不影响 `all-vps` 订阅中的 Digital 节点。
- 通过 JavaScript 语法、模拟 Sub-Store 生成结果、缺失节点降级及 AI/交易所规则回归检查；客户端实际加载需更新订阅确认。

### Cloudflare 官方检测入口跟随 ST 策略组

- 将 `1.1.1.1/32`、`one.one.one.one`、`cloudflare.com`、`www.cloudflare.com` 加入 ST 精确分流，规则位于通用国外流量和 Claude / OpenAI 分流之前。
- 只覆盖上述目标，保留其余 Cloudflare CDN 与业务分流不变。单个目标主机的其他 URL 路径也会命中。
- JavaScript 语法、模拟生成规则、ST 默认节点、规则顺序及 Bitget 分流回归检查通过；`ip.net.coffee` 的具体检测主机及客户端实际出口尚待连接日志确认。

### AI、OpenAI、ST 默认节点切换为 Host-V-美国

- 三个分组显式指定 `default-selected: Host-V-美国`，AI / OpenAI 首选节点由家宽切换到美国，ST 白名单调整为美国节点优先。
- 保留全部原有候选节点和分流规则，不改变其他策略组及全局 `store-selected` 设置。
- 注意旧选择缓存可能覆盖新默认值；更新订阅后如未切换，请在 Clash Verge 的对应分组手动选择一次 `Host-V-美国`。

## 2026-11-07

### Claude 分流组改名为 ST

- 补充 Claude Code 的域名、CDN、认证、遥测和客服组件规则。
- 加入 Anthropic 和 NTP 域名规则集，以及 Anthropic 的 IPv4、IPv6 和 ASN 兜底。
- ST 只保留 `Host-V-家宽`、`Host-V-美国`、`Host-H`、`Digital-V-洛杉矶`、`Digital-H`，并按该顺序显示。
- 更新订阅后，在 Clash Verge 的 ST 组确认所选节点。

## 2026-11-06

### 根据实时日志补齐 Bitget 分流

- 新日志发现 `appapi.bitgetapp.com`（与 `bitgetapps.com` 不同）和 `stream.abcdstable.com` 走「🐟 漏网之鱼」。
- 新增 `bitgetapp.com` 后缀规则及 `stream.abcdstable.com` 精确规则，指向「💱 交易所」。
- 语法检查、两次截图中的九个 Bitget 主机匹配、规则顺序、域名边界及 AI 分流回归检查通过。
- 日志中的 `appapi.bitgetapps.com` 在上一版已覆盖；若更新后新建连接仍走兜底，需确认 Sub-Store 重新生成及客户端实际加载的配置。
- 未将共享推送、统计服务批量归入交易所；日志中的广告拒绝、QUIC 阻断与域名漏匹配分别排查。尚未验证客户端更新后的实际出口。

### 修复 Bitget 客户端备用域名漏分流

- 根据用户提供的连接截图，确认 `appapi.bitget.com` 命中原有规则，而多个备用主机落到 `MATCH`；此前仅验证主域名及其子域名，未覆盖这些备用域名。
- 将 `krbitget.com`、`bitgetapps.com` 及其子域名加入「💱 交易所」。
- 为截图中的 `appapi.gdrichem.com`、`appapi.abcdstable.com`、`www.abcdstable.com` 添加精确域名规则，不扩大到其他子域名。
- 已通过脚本语法、截图中七个完整可见主机、现有交易所主域名、匹配顺序、域名边界及 OpenAI / Claude 分流回归检查；客户端实际出口需更新配置后重连确认。
- 使用时重新生成 Sub-Store 文件、更新客户端配置并重启 Bitget；已建立的连接需断开重连。

### 交易所分流检查

- 核验 `bitget.com`、`www.bitget.com`、`api.bitget.com`、`ws.bitget.com` 及现有 Binance、Bybit、OKX、Coinbase、Kraken 主域名的生成规则，均指向「💱 交易所」，且早于 `Foreign`。
- 确认当前上游 Crypto 规则集未包含 Bitget；主域名及其子域名由脚本显式规则覆盖。
- README 新增命中规则、代理链、分组保存选项、配置更新和长连接的排查步骤。
- 本次未修改分流脚本；尚无客户端连接记录，不能确认用户反馈的具体请求域名、命中规则或实际出口。

### 新增

- 新增「🟢 OpenAI」独立代理分组，支持为 ChatGPT / OpenAI 单独选择节点。
- 将 `openai.com`、`chatgpt.com`、`oaistatic.com`、`oaiusercontent.com` 和已有 OpenAI 远程规则集指向新分组。

### 调整

- OpenAI 流量从「🤖 AI服务」分组独立出来，规则位于其他 AI 和通用兜底规则之前。
- 新分组沿用 `AI_NODE` 默认节点（当前为 `Host-V-家宽`）；节点不存在时默认跟随「🚀 节点选择」。
- README 同步更新代理组说明和分流顺序。

### 验证与使用

- 已通过 JavaScript 语法检查，以及 OpenAI 规则指向、优先级、默认节点回退和节点重名处理检查。
- 等待 GitHub Raw 缓存更新后，在 Clash Verge 更新订阅，并在「代理」页为「🟢 OpenAI」选择节点。
