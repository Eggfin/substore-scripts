// Sub-Store → Mihomo 高级分流 v2
// 节点来自 all-vps；适用于 Clash Verge

const config = ProxyUtils.yaml.safeLoad(
  $content ?? $files[0]
) || {};

const nodes = Array.isArray(config.proxies)
  ? config.proxies : [];

if (!nodes.length) {
  throw new Error("all-vps 没有可用节点");
}

// ========== 1. 代理组 ==========

const G = {
  main: "🚀 节点选择",
  auto: "⚡ 自动选择",
  crypto: "💱 交易所",
  ai: "🤖 AI服务",
  openai: "🟢 OpenAI",
  claude: "ST",
  telegram: "✈️ Telegram",
  youtube: "📺 YouTube",
  apple: "🍎 苹果服务",
  ads: "🛑 广告拦截",
  final: "🐟 漏网之鱼"
};

// 节点名称去重
const used = new Set([
  "DIRECT", "REJECT", ...Object.values(G)
]);

for (const node of nodes) {
  const original = String(node.name || "未命名节点");
  let name = original;
  let n = 2;

  while (used.has(name)) {
    name = `${original} #${n++}`;
  }

  node.name = name;
  used.add(name);
}

const names = nodes.map(n => n.name);

// AI / OpenAI 仅显示指定白名单内现有节点，移除日本节点，另保留「节点选择」
const AI_NODE = "Host-V-美国";
const aiWhitelist = [
  AI_NODE,
  "Host-H",
  "Host-V-家宽",
  "Digital-V-洛杉矶",
  "Digital-H"
];
const aiNodes = [
  ...aiWhitelist.filter(name => names.includes(name)),
  G.main
];

// Telegram / YouTube 排除三个 Host 节点；保留节点选择和自动选择
const mediaExcluded = new Set([AI_NODE, "Host-H", "Host-V-家宽"]);
const mediaNodes = [
  G.main,
  G.auto,
  ...names.filter(name => !mediaExcluded.has(name))
];

// 香港节点按名称动态识别：香港、Hong Kong、HongKong、HK / HKG（含数字后缀）
const hkPattern = /香港|hong[ _-]*kong|(?:^|[ _-])hkg?(?=[0-9]|$|[ _-])/i;
const hkNodes = names.filter(name => hkPattern.test(name));

const stNodes = [
  AI_NODE,
  "Host-V-家宽",
  "Host-H"
].filter(name => names.includes(name));

if (!stNodes.length) {
  throw new Error("ST 白名单中的节点均未出现在 all-vps 订阅中");
}

config.mode = "rule";
config["allow-lan"] = false;
config["log-level"] = "info";
config["unified-delay"] = true;
config.profile = {
  ...(config.profile || {}),
  "store-selected": true
};

// 保留客户端现有 DNS、TUN 和监听端口设置
config["proxy-groups"] = [
  {
    name: G.main,
    type: "select",
    proxies: [G.auto, ...names, "DIRECT"]
  },
  {
    name: G.auto,
    type: "url-test",
    proxies: names,
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
    tolerance: 50
  },
  {
    name: G.crypto,
    type: "select",
    proxies: ["DIRECT", G.main, ...hkNodes]
  },
  {
    name: G.ai,
    type: "select",
    "default-selected": AI_NODE,
    proxies: aiNodes
  },
  {
    name: G.openai,
    type: "select",
    "default-selected": AI_NODE,
    proxies: aiNodes
  },
  {
    name: G.claude,
    type: "select",
    "default-selected": AI_NODE,
    proxies: stNodes
  },
  {
    name: G.telegram,
    type: "select",
    proxies: mediaNodes
  },
  {
    name: G.youtube,
    type: "select",
    proxies: mediaNodes
  },
  {
    name: G.apple,
    type: "select",
    proxies: ["DIRECT", G.main, ...names]
  },
  {
    name: G.ads,
    type: "select",
    proxies: ["REJECT", "DIRECT"]
  },
  {
    name: G.final,
    type: "select",
    proxies: [G.main, "DIRECT", ...names]
  }
];

// ========== 2. 远程规则集 ==========

const meta =
  "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/";

const bm =
  "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/";

function mrs(name, category, file, behavior = "domain") {
  return {
    type: "http",
    behavior,
    format: "mrs",
    url: meta + category + "/" + file + ".mrs",
    path: "./ruleset/v2-" + name + ".mrs",
    interval: 86400,
    proxy: G.main
  };
}

function classical(name, category) {
  return {
    type: "http",
    behavior: "classical",
    format: "yaml",
    url: bm + category + "/" + category + ".yaml",
    path: "./ruleset/v2-" + name + ".yaml",
    interval: 86400,
    proxy: G.main
  };
}

config["rule-providers"] = {
  // AI 服务
  Claude: classical("claude", "Claude"),
  Anthropic: classical("anthropic", "Anthropic"),
  AnthropicDomains: mrs("anthropic-domains", "geosite", "anthropic"),
  NTP: mrs("ntp", "geosite", "category-ntp"),
  OpenAI: classical("openai", "OpenAI"),
  Gemini: classical("gemini", "Gemini"),
  Copilot: classical("copilot", "Copilot"),

  // 专项服务
  Crypto: classical("crypto", "Crypto"),
  Apple: classical("apple", "Apple"),

  // 通用分流
  Ads: mrs("ads", "geosite", "category-ads-all"),
  CN: mrs("cn", "geosite", "cn"),
  CNIP: mrs("cnip", "geoip", "cn", "ipcidr"),
  Foreign: mrs("foreign", "geosite", "geolocation-!cn"),

  // 常用国外服务
  GitHub: mrs("github", "geosite", "github"),
  YouTube: mrs("youtube", "geosite", "youtube"),
  Telegram: mrs("telegram", "geosite", "telegram"),
  TelegramIP: mrs(
    "telegramip", "geoip", "telegram", "ipcidr"
  )
};

// ========== 3. 分流规则 ==========

const suffix = (domains, target) =>
  domains.map(d => `DOMAIN-SUFFIX,${d},${target}`);

config.rules = [
  // A. 局域网和本地地址直连
  "DOMAIN-SUFFIX,localhost,DIRECT",
  "DOMAIN-SUFFIX,local,DIRECT",
  "DOMAIN-SUFFIX,lan,DIRECT",
  "IP-CIDR,127.0.0.0/8,DIRECT,no-resolve",
  "IP-CIDR,10.0.0.0/8,DIRECT,no-resolve",
  "IP-CIDR,172.16.0.0/12,DIRECT,no-resolve",
  "IP-CIDR,192.168.0.0/16,DIRECT,no-resolve",
  "IP-CIDR,169.254.0.0/16,DIRECT,no-resolve",
  "IP-CIDR6,fc00::/7,DIRECT,no-resolve",
  "IP-CIDR6,fe80::/10,DIRECT,no-resolve",

  // B. 汽水音乐优先直连
  "DOMAIN-SUFFIX,qishui.com,DIRECT",
  "DOMAIN,qishui.douyin.com,DIRECT",

  // B2. Cloudflare 常用 IP / trace 检测入口 → ST
  // 仅匹配官方检测目标，不转发整个 Cloudflare CDN / ASN
  // 规则只判断目标 IP/主机名，不能单独匹配 URL 路径 /cdn-cgi/trace
  "IP-CIDR,1.1.1.1/32," + G.claude + ",no-resolve",
  "DOMAIN,one.one.one.one," + G.claude,
  "DOMAIN,cloudflare.com," + G.claude,
  "DOMAIN,www.cloudflare.com," + G.claude,

  // C. Claude / Anthropic → ST
  ...suffix([
    "claude.ai",
    "claude.com",
    "anthropic.com",
    "clau.de",
    "claudemcpclient.com",
    "claudemcpcontent.com",
    "claudeusercontent.com",
    "anthropicusercontent.com",
    "sentry.io",
    "statsigapi.net",
    "intercom.io",
    "intercomcdn.com"
  ], G.claude),
  `DOMAIN,servd-anthropic-website.b-cdn.net,${G.claude}`,
  `DOMAIN,anthropic.com.cdn.cloudflare.net,${G.claude}`,
  `DOMAIN,anthropic.auth0.com,${G.claude}`,
  `DOMAIN,anthropic-com.ghost.io,${G.claude}`,
  `DOMAIN,browser-intake-us5-datadoghq.com,${G.claude}`,
  `DOMAIN,cdn.usefathom.com,${G.claude}`,
  `DOMAIN-KEYWORD,datadog,${G.claude}`,
  `DOMAIN-KEYWORD,sentry,${G.claude}`,
  `DOMAIN-KEYWORD,sift,${G.claude}`,
  `RULE-SET,Claude,${G.claude}`,
  `RULE-SET,Anthropic,${G.claude}`,
  `RULE-SET,AnthropicDomains,${G.claude}`,
  `RULE-SET,NTP,${G.claude}`,
  `IP-CIDR,160.79.104.0/21,${G.claude},no-resolve`,
  `IP-CIDR6,2607:6bc0::/32,${G.claude},no-resolve`,
  `IP-ASN,399358,${G.claude},no-resolve`,

  // D. OpenAI：独立分组，优先于通用 AI 和兜底规则
  ...suffix([
    "openai.com",
    "chatgpt.com",
    "oaistatic.com",
    "oaiusercontent.com"
  ], G.openai),
  `RULE-SET,OpenAI,${G.openai},no-resolve`,

  // Gemini / 其他 AI
  ...suffix([
    "grok.com",
    "x.ai",
    "perplexity.ai",
    "poe.com",
    "cursor.com",
    "cursor.sh",
    "codeium.com",
    "windsurf.com",
    "githubcopilot.com",
    // Muse / Meta AI
    "muse.ai",
    "meta.ai",
    "metaaivm.com",
    "meta.com",
    "facebook.com",
    "fbcdn.net"
  ], G.ai),
  "DOMAIN,gemini.google.com," + G.ai,
  "DOMAIN,aistudio.google.com," + G.ai,
  "DOMAIN,generativelanguage.googleapis.com," + G.ai,
  `RULE-SET,Gemini,${G.ai}`,
  `RULE-SET,Copilot,${G.ai},no-resolve`,

  // E. 加密货币交易所
  ...suffix([
    "binance.com",
    "binance.us",
    "bitget.com",
    // Bitget 客户端备用域名（连接记录确认）
    "krbitget.com",
    "bitgetapps.com",
    "bitgetapp.com",
    "bybit.com",
    "okx.com",
    "okex.com",
    "coinbase.com",
    "kraken.com"
  ], G.crypto),
  // 仅匹配连接记录中出现的主机，避免扩大到其他业务
  `DOMAIN,appapi.gdrichem.com,${G.crypto}`,
  `DOMAIN,appapi.abcdstable.com,${G.crypto}`,
  `DOMAIN,www.abcdstable.com,${G.crypto}`,
  `DOMAIN,stream.abcdstable.com,${G.crypto}`,
  `RULE-SET,Crypto,${G.crypto}`,

  // F. Apple
  `RULE-SET,Apple,${G.apple},no-resolve`,
  "DOMAIN-SUFFIX,icloud.com," + G.apple,
  "DOMAIN-SUFFIX,apple.com," + G.apple,

  // G. 广告拦截
  `RULE-SET,Ads,${G.ads}`,

  // H. 常见国外服务
  `RULE-SET,GitHub,${G.main}`,
  `RULE-SET,YouTube,${G.youtube}`,
  `RULE-SET,Telegram,${G.telegram}`,
  `RULE-SET,TelegramIP,${G.telegram},no-resolve`,

  // I. 中国大陆直连
  `RULE-SET,CN,DIRECT`,
  `RULE-SET,CNIP,DIRECT,no-resolve`,

  // J. 国外域名
  `RULE-SET,Foreign,${G.main}`,

  // K. 未匹配的流量
  `MATCH,${G.final}`
];

$content = ProxyUtils.yaml.dump(config);
