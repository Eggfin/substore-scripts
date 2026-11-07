# substore-scripts

个人使用的 Sub-Store 脚本，把节点订阅转换成带分流规则的 Mihomo 配置，配合 Clash Verge 使用。

> 这是公开仓库。**不要提交节点地址、密码、UUID、令牌或订阅链接。** 节点信息由脚本运行时从 Sub-Store 读取，不写在这里。

## 文件

| 文件 | 说明 |
|---|---|
| `substore.js` | Sub-Store 脚本：生成代理组、规则集和分流规则 |
| [CHANGELOG.md](CHANGELOG.md) | 更新记录 |

## 在 Sub-Store 中使用

1. 打开目标文件，进入「操作」→「脚本操作」。
2. 类型选「远程链接」，填入：

   ```text
   https://raw.githubusercontent.com/Eggfin/substore-scripts/main/substore.js
   ```

3. 打开「关闭缓存」，然后保存文件。
4. 预览输出，确认分组和规则符合预期。
5. 在 Clash Verge 中更新订阅。

运行 Sub-Store 的服务器需要能访问 `raw.githubusercontent.com`。

## 代理组

| 分组 | 用途 | 默认选项 |
|---|---|---|
| 🚀 节点选择 | 通用代理流量 | ⚡ 自动选择 |
| ⚡ 自动选择 | 按延迟自动选节点 | 延迟最低的节点 |
| 💱 交易所 | 加密货币交易所 | DIRECT |
| 🤖 AI服务 | Gemini、Copilot、Muse / Meta AI 等 | `Host-V-美国` |
| 🟢 OpenAI | ChatGPT / OpenAI | `Host-V-美国` |
| ST | Claude / Anthropic 及相关分流 | `Host-V-美国` |
| ✈️ Telegram | Telegram | 🚀 节点选择 |
| 📺 YouTube | YouTube | 🚀 节点选择 |
| 🍎 苹果服务 | Apple 服务 | DIRECT |
| 🛑 广告拦截 | 广告域名 | REJECT |
| 🐟 漏网之鱼 | 未匹配的流量 | 🚀 节点选择 |

AI服务、OpenAI、ST 已显式设置 `default-selected: Host-V-美国`，并将美国节点排在各自候选列表首位。默认选项只在没有保存过选择时生效；`profile.store-selected: true` 仍会保留 Clash Verge 以前的手动选择，已有缓存时请在这三个分组中手动切换一次。

ST 只显示订阅中存在的以下节点，按顺序排列：`Host-V-美国`、`Host-V-家宽`、`Host-H`、`Digital-V-洛杉矶`、`Digital-H`。五个节点全部缺失时，脚本会报错；若 `Host-V-美国` 缺失，`default-selected` 会回退到第一个可用节点。

## Cloudflare 检测与 ST 同出口

- 将常用 Cloudflare 官方 trace / 出口检测目标 `1.1.1.1/32`、`one.one.one.one`、`cloudflare.com` 和 `www.cloudflare.com` 精确指向 `ST`，使这些请求使用 ST 当前选中的节点。
- 只匹配列出的 IP 和主机，不覆盖整个 Cloudflare CDN、IP 段、ASN 或接入 Cloudflare 的第三方站点。Mihomo 不能仅凭域名分流规则区分同一主机下的 `/cdn-cgi/trace` 路径，因此列出的主机名的其他请求也会走 ST。
- `ip.net.coffee/claude` 使用 Cloudflare trace 检测，但公开页面未确认其实际请求主机。更新订阅后在 Clash Verge「连接」里查看检测请求的目标和命中规则；如使用其他目标，需按日志精确补充。尚未做客户端出口实测。

## 分流顺序

规则从上到下匹配，命中即停止：

1. 本地和局域网地址直连
2. 汽水音乐直连
3. Claude / Anthropic 走 ST，包括遥测、客服组件、NTP 域名和 IP / ASN 兜底
4. OpenAI / ChatGPT（独立走 🟢 OpenAI，包含 OpenAI 远程规则集）
5. 其他 AI 服务，以及 Muse / Meta AI
6. 加密货币交易所
7. Apple
8. 广告拦截
9. GitHub、YouTube、Telegram
10. 中国大陆域名和 IP 直连
11. 其他国外域名走 🚀 节点选择
12. 其余流量走 🐟 漏网之鱼

ST 的 Datadog、Sentry、Sift 关键词和 NTP 分类也会匹配其他应用的相关流量。NTP 流量走代理需要所选节点支持 UDP。

新增规则时，要放在 `RULE-SET,Foreign` 和 `MATCH` 之前，否则不会生效。

## 常见修改

- **加 AI 域名：** 在 `config.rules` 的 D 段域名列表里添加。
- **换 AI / OpenAI / ST 默认节点：** 修改 `AI_NODE`。它同时作为三个分组的 `default-selected`；节点不存在时会回退到组内首个可用项（AI / OpenAI 通常是 🚀 节点选择）。
- **新增分组：** 在 `G` 中加分组名，在 `config["proxy-groups"]` 中加分组，再把规则指向它。

## 更新流程

1. 修改 `substore.js`，同步补充 [更新记录](CHANGELOG.md)，再推送到 `main`。
2. 等几分钟，让 GitHub Raw 链接更新。
3. 在 Clash Verge 中更新订阅。
4. 新增分组后，在「代理」页为它选择节点。

## 交易所分流排查

`bitget.com` 及其子域名（如 `api.bitget.com`、`ws.bitget.com`）由显式规则指向「💱 交易所」，优先于 `Foreign` 和 `MATCH`。另外，`krbitget.com`、`bitgetapps.com`、`bitgetapp.com` 及其子域名也走「💱 交易所」。根据客户端连接记录，还为 `appapi.gdrichem.com`、`appapi.abcdstable.com`、`www.abcdstable.com`、`stream.abcdstable.com` 添加了精确域名规则，避免扩大到同域名下的其他业务。当前远程 Crypto 规则集未包含 Bitget，其他服务域名需根据实际连接记录核对。

遇到交易所请求显示「🚀 节点选择」时：

1. 在 Clash Verge「连接」中查看目标域名、命中规则和完整代理链。
2. 如果命中交易所规则，但代理链含「💱 交易所 → 🚀 节点选择」，请检查交易所分组的当前选项。`store-selected` 会保留手动选择；脚本中的默认 `DIRECT` 不会覆盖它。
3. 如果 `bitget.com` 或其子域名命中 `Foreign` / `MATCH`，检查当前生效配置是否包含 `DOMAIN-SUFFIX,bitget.com,💱 交易所`，并确认 Sub-Store 文件已重新生成、Clash Verge 已更新并启用该配置。
4. 如果是其他域名或仅显示 IP，先记录目标及命中规则，再确认是否属于交易所；共享 CDN 不应整段加入交易所规则。
5. 配置更新后重新建立连接再检查，已有长连接不能作为新规则生效的依据。

## 注意

- `main` 上的脚本会直接被 Sub-Store 使用，推送前先确认语法无误。
- 脚本运行时能读取全部节点信息，请保护好 GitHub 账号，并只引用自己的仓库。
- `facebook.com` 和 `meta.com` 也走 🤖 AI服务，因为 Muse 依赖这些域名。
