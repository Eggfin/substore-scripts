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

当前脚本生成 10 个代理组，已删除自动选择组及其测速配置。节点需要手动选择。

| 分组 | 用途 | 默认或首选项（无已保存选择时） |
|---|---|---|
| 🚀 节点选择 | 通用代理流量；候选为全部现有节点及 DIRECT | 订阅中的第一个节点 |
| 💱 交易所 | 加密货币交易所 | DIRECT |
| 🤖 AI服务 | Gemini、Copilot、Muse / Meta AI 等 | `Host-V-美国`（存在时） |
| 🟢 OpenAI | ChatGPT / OpenAI | `Host-V-美国`（存在时） |
| ST | Claude / Anthropic 及相关分流 | 仅 `Host-V-美国`，缺失时 `REJECT` |
| ✈️ Telegram | Telegram | 🚀 节点选择 |
| 📺 YouTube | YouTube | 🚀 节点选择 |
| 🍎 苹果服务 | Apple 服务 | DIRECT |
| 🛑 广告拦截 | 广告域名 | REJECT |
| 🐟 漏网之鱼 | 未匹配的流量 | 🚀 节点选择 |

AI服务、OpenAI 仍显式设置 `default-selected: Host-V-美国`，美国节点存在时也位于各自候选列表首位。`profile.store-selected: true` 保留客户端以前的选择；更新订阅不表示一定覆盖已有选择，需要在「代理」页确认。

### ST 第一阶段 Fail-Closed（2026-11-09）

- ST 策略组固定为 `select`，只包含 `Host-V-美国` 一个代理，不再显示 `Host-V-家宽`、`Host-H` 或其他节点，不使用自动切换、直连或主策略组作为备用。
- 当 `Host-V-美国` 在订阅中缺失时，ST 组自动变为 `proxies: [REJECT]`，`default-selected` 同步设为 `REJECT`。**绝不输出空 ST 组**：Stash 官方说明空组会视为 DIRECT。
- 额外设置 `empty-fallback: REJECT`（Mihomo 支持此字段）；由于 ST 始终非空，不依赖它保护 Stash。此阶段只保证匹配 ST 的请求没有脚本层面的换节点/直连候选，不能锁定同一节点的实际出口公网 IP。
- 原有 ST 分流域名、IP/ASN、Cloudflare 检测规则及其他策略组保持不变。`profile.store-selected` 仍为 `true`，客户端原来的 ST 手动选择可能残留：更新订阅后务必确认 ST 实际选中唯一节点或 `REJECT`，重新建立连接进行验证。
- 如实际服务器地址、端口、上游代理发生变化，即使订阅仍称其为 `Host-V-美国`，本阶段也不会检测出来；真正的出口 IP 锁定和监控留待第二阶段。
- 其他未覆盖的 Claude 请求可能命中通用组或客户端绕过代理，不属于此 ST 策略组的阻断范围。

其他分组的候选节点限制（均保留 `🚀 节点选择`）：

- `🤖 AI服务`、`🟢 OpenAI`：按顺序只列出 `Host-V-美国`、`Host-H`、`Host-V-家宽`、`Digital-V-洛杉矶`、`Digital-H`，最后保留 `🚀 节点选择`；订阅里不存在的节点自动略过。`NBcloud-V-日本`、`NBcloud-H-日本` 已从两组直接选项中移除，但不从订阅或其他分组删除。
- `✈️ Telegram`、`📺 YouTube`：保留 `🚀 节点选择`，并显示其他节点，但不直接列出名称精确匹配 `Host-V-美国`、`Host-H`、`Host-V-家宽` 的节点；不再提供自动选择入口。
- `💱 交易所`：保留 `DIRECT`（首选）、`🚀 节点选择` 和订阅中名称含“香港”、Hong Kong、HongKong 或 HK/HKG 地区标记的节点；其他节点不直接出现在该组。若当前订阅无香港节点，则仅保留前两个选项。
- 注意：`🚀 节点选择` 仍是间接入口，包含全部现有节点，可能选到不在某组直接列表中的日本或 Host 节点。以上限制不是对实际出口的完全隔离。

### 已知边界

- AI服务 / OpenAI 在美国节点缺失时，脚本会从候选中略过它，但 `default-selected` 仍写 `Host-V-美国`；Mihomo 文档说明，默认节点不存在时选择组内首个候选，客户端已有选择也需确认。AI / OpenAI 按白名单顺序保留现有节点，只有五个白名单节点全部缺失时才仅剩 `🚀 节点选择`。**ST 不使用这一回退逻辑，目标节点缺失时只选 `REJECT`**。
- 节点去重发生在媒体组排除之前。同名 Host 节点被改名为 `Host-H #2` 等名称后，不再精确匹配排除名单，可能出现在 Telegram / YouTube 的直接选项中。此边界暂未修改。

## Cloudflare 检测与 ST 同出口

- 将常用 Cloudflare 官方 trace / 出口检测目标 `1.1.1.1/32`、`one.one.one.one`、`cloudflare.com` 和 `www.cloudflare.com` 精确指向 `ST`，使这些请求使用 ST 当前选中的节点。
- 只匹配列出的 IP 和主机，不覆盖整个 Cloudflare CDN、IP 段、ASN 或接入 Cloudflare 的第三方站点。Mihomo 不能仅凭域名分流规则区分同一主机下的 `/cdn-cgi/trace` 路径，因此列出的主机名的其他请求也会走 ST。
- `ip.net.coffee/claude` 使用 Cloudflare trace 检测，但公开页面未确认其实际请求主机。更新订阅后在 Clash Verge「连接」里查看检测请求的目标和命中规则；如使用其他目标，需按日志精确补充。尚未做客户端出口实测。

## 分流顺序

规则从上到下匹配，命中即停止：

1. 本地和局域网地址直连
2. 汽水音乐直连
3. 指定 Cloudflare 检测 IP / 主机走 ST
4. Claude / Anthropic 走 ST，包括遥测、客服组件、NTP 域名和 IP / ASN 兜底
5. OpenAI / ChatGPT（独立走 🟢 OpenAI，包含 OpenAI 远程规则集）
6. 其他 AI 服务，以及 Muse / Meta AI
7. 加密货币交易所
8. Apple
9. 广告拦截
10. GitHub、YouTube、Telegram
11. 中国大陆域名和 IP 直连
12. 其他国外域名走 🚀 节点选择
13. 其余流量走 🐟 漏网之鱼

ST 的 Datadog、Sentry、Sift 关键词和 NTP 分类也会匹配其他应用的相关流量。NTP 流量走代理需要所选节点支持 UDP。

新增规则时，要放在 `RULE-SET,Foreign` 和 `MATCH` 之前，否则可能先被通用规则命中。

## 常见修改

- **加 AI 域名：** OpenAI 域名加在 `config.rules` 的 D 段 OpenAI 列表，其他 AI 域名加在后面的「Gemini / 其他 AI」列表。
- **换 AI / OpenAI 默认节点：** 修改 `AI_NODE`。它只控制 AI服务 / OpenAI 的默认值与白名单首项。
- **调整 ST 唯一节点：** 修改 `ST_NODE`，并确认订阅中存在此名称。缺失时 ST 使用 `REJECT`，不会从其他组自动挑选。
- **新增分组：** 在 `G` 中加分组名，在 `config["proxy-groups"]` 中加分组，再把规则指向它。

## 更新流程

1. 修改 `substore.js`，同步更新 README 和 [更新记录](CHANGELOG.md)，测试后再推送到 `main`。
2. 等几分钟，让 GitHub Raw 链接更新。
3. 在 Sub-Store 重新生成或预览文件，再在 Clash Verge 中更新订阅并确认当前启用的配置。
4. 在「代理」页检查分组及当前节点；确认 ST 只包含 `Host-V-美国`（或缺失时 `REJECT`），没有其他候选与 `DIRECT`；必要时重新手动选择正确选项。
5. 断开并重新建立需要验证的连接，再查看命中规则和实际代理链。

## 最近验证范围

2026-11-09 ST 第一阶段 Fail-Closed 修改：105 组模拟节点输入（含目标缺失、重名、无节点及混合随机用例），共 1,051 项断言通过；验证 ST 的唯一候选、缺失时 `REJECT`、`default-selected`、`empty-fallback`、其余分组与规则集/规则完全一致。使用 JavaScript + JSON 桥接模拟 Sub-Store YAML 接口，**尚未在 Stash/Mihomo 客户端、实际节点断连或真实出口 IP 环境验证**。

2026-11-09 删除自动选择的脚本改动已完成以下本地检查：

- Node.js v20.20.1 独立语法检查和模拟配置生成。
- 109 组输入（含 100 组固定种子的随机输入），共 326 项检查全部通过；覆盖正常输入、缺失节点、空节点、重名、保留名称冲突和 `$files[0]` 回退。
- 对测试输入比较新旧输出，确认只删除自动选择组及其候选引用；代理引用有效，分流规则和规则集内容不变。正常输出为 10 个代理组、17 个规则集、97 条规则。
- 使用 JSON 桥接模拟 `ProxyUtils.yaml` 接口，另用 PyYAML 验证输出对象的 YAML 序列化往返。

以上检查不代表 Sub-Store 原生 YAML 库或 Mihomo 内核实测，也未验证远程规则下载和客户端实际出口；已知边界保持原样，不属于本次已修复内容。详细变更见 [更新记录](CHANGELOG.md)。

## 交易所分流排查

`bitget.com` 及其子域名（如 `api.bitget.com`、`ws.bitget.com`）由显式规则指向「💱 交易所」，优先于 `Foreign` 和 `MATCH`。另外，`krbitget.com`、`bitgetapps.com`、`bitgetapp.com` 及其子域名也走「💱 交易所」。根据客户端连接记录，还为 `appapi.gdrichem.com`、`appapi.abcdstable.com`、`www.abcdstable.com`、`stream.abcdstable.com` 添加了精确域名规则，避免扩大到同域名下的其他业务。此前核验时远程 Crypto 规则集未包含 Bitget；远程内容可能更新，实际使用需核对当前规则集和连接记录。

遇到交易所请求显示「🚀 节点选择」时：

1. 在 Clash Verge「连接」中查看目标域名、命中规则和完整代理链。
2. 如果命中交易所规则，但代理链含「💱 交易所 → 🚀 节点选择」，请检查交易所分组的当前选项。`store-selected` 会保留手动选择；脚本中的默认 `DIRECT` 不会覆盖它。
3. 如果 `bitget.com` 或其子域名命中 `Foreign` / `MATCH`，检查当前生效配置是否包含 `DOMAIN-SUFFIX,bitget.com,💱 交易所`，并确认 Sub-Store 文件已重新生成、Clash Verge 已更新并启用该配置。
4. 如果是其他域名或仅显示 IP，先记录目标及命中规则，再确认是否属于交易所；共享 CDN 不应整段加入交易所规则。
5. 配置更新后重新建立连接再检查，已有长连接不能作为新规则生效的依据。

## 注意

- `main` 上的脚本会直接被 Sub-Store 使用，推送前先确认语法无误。
- 脚本运行时能读取全部节点信息，请保护好 GitHub 账号，并只引用自己的仓库。
- 当前脚本还将 `facebook.com`、`fbcdn.net`、`meta.com` 的域名后缀指向 🤖 AI服务，匹配范围不只限于 Meta AI 页面。
