# LLLL 检查项完整分类目录 (Check Item Taxonomy)

**用途**：LLLL 实际 flag 哪些东西的完整行主键清单。每行 = 一个独立检查项，可向下映射到：
- 一手法规/标准来源
- CIPT / AIGP 知识点重叠
- 代码层扩展点

**总计**：130+ 个独立检查项，分布于 15 个合规域 + 2 个 Guard 门控 + 1 个自动扫描层

---

## 目录

1. [命令体系（子命令速查）](#1-命令体系子命令速查)
2. [合规域 A–O（主合规框架，51 项）](#2-合规域-ao主合规框架51-项)
3. [LLLL Guard — Push Gate（推送门控，27 项）](#3-llll-guard--push-gate推送门控27-项)
4. [LLLL Guard — Release Gate（发布门控，13 项）](#4-llll-guard--release-gate发布门控13-项)
5. [LLLL Scan — 自动扫描层（40+ 项）](#5-llll-scan--自动扫描层40-项)
6. [严重级别 & 状态标签体系](#6-严重级别--状态标签体系)
7. [领域激活逻辑](#7-领域激活逻辑)

---

## 1. 命令体系（子命令速查）

| 子命令 | 功能描述 | 主要输出 |
|--------|---------|---------|
| `/llll` | 诊断模式——对当前项目做全局合规诊断 | 结构化诊断报告 |
| `/llll checklist` | 结构化信息采集——通过问卷获取项目上下文 | 填写后激活后续命令 |
| `/llll diff` | 功能 vs 策略覆盖差分——找出未被合规覆盖的新功能 | Gap 差分表 |
| `/llll brief` | 专家交接简报——为律师/DPO/审计员生成可读摘要 | Expert Brief |
| `/llll deep` | 严格深度审查——带证据标注的全域精细检查 | 深度审查报告 |
| `/llll scan` | 自动化安全扫描——对代码仓库运行静态分析 | Scan 报告 + 修复提示 |
| `/llll fix` | 生成代码修复——将扫描发现转换为具体代码建议 | 修复代码块 |
| `/llll grc` | GRC 仪表板——治理/风险/合规状态概览 | GRC Dashboard |
| `/llll review` | 人工专家升级——标记需要真人法律/合规审查的项 | 升级清单 |
| `/llll guard push` | 推送前合规门控——拦截含敏感内容的 git push | PASS/HARD_BLOCK/SOFT_BLOCK |
| `/llll guard release` | 发布前合规门控——拦截含泄漏风险的发布包 | PASS/HARD_BLOCK/SOFT_BLOCK |
| `/llll override` | 覆盖 SOFT_BLOCK 发现——记录豁免理由并继续 | 豁免记录 |

---

## 2. 合规域 A–O（主合规框架，51 项）

### 激活层级

```
Layer 0 (始终激活)     → Domain N, O
Layer 1 (所有项目)     → Domain A, B, C, D, E
Layer 2 (商业模型相关) → Domain F, G, H
Layer 3 (含 AI 功能)   → Domain I, J, K
Layer 4 (移动应用)     → Domain L
Layer 5 (敏感行业)     → Domain M（提升所有发现的审查级别）
```

---

### Domain N — 软件工程基础 (Software Engineering Fundamentals)

> Layer 0，始终激活。

| 检查 ID | 检查项名称 | 检查内容 | 严重级别 |
|--------|-----------|---------|---------|
| **N1** | 版本控制纪律 | 分支策略、提交规范、分支保护、生产环境识别 | High |
| **N2** | 回滚与恢复能力 | 回滚流程、迁移原子性、部署可逆、数据备份 | High |
| **N3** | 知识连续性 & 公交系数 | 架构文档、入职流程、凭证管理、CODEOWNERS | High |
| **N4** | 测试存在性 | 单元/集成/E2E 测试、关键路径覆盖、CI 门控、QA 流程 | High |
| **N5** | CI/CD & 发布流程 | 自动化构建、可重复部署、预发环境、版本标签 | Medium |
| **N6** | 仓库卫生 | .gitignore 完整性、秘密历史、CODEOWNERS、CI 秘密、README | **Critical** |
| **N7** | 开发环境安全 | IDE 插件审查、AI 代码辅助配置、隔离、开发/生产分离 | Medium |

---

### Domain O — 开源 & 许可证风险 (Open Source & Licensing Risk)

> Layer 0，始终激活。

| 检查 ID | 检查项名称 | 检查内容 | 严重级别 |
|--------|-----------|---------|---------|
| **O1** | 项目许可证选择 | LICENSE 文件存在、许可证与商业模式对齐 | High |
| **O2** | Copyleft 污染检测 | GPL/AGPL/LGPL 监控、链接边界、网络 copyleft 触发 | **Critical** |
| **O3** | 许可证兼容性矩阵 | 跨依赖许可证交叉兼容性验证 | High |
| **O4** | 贡献者许可证 & IP 所属权 | CLA、外部贡献、雇佣协议、IP 条款 | Medium |

---

### Domain A — 项目治理 & 开发流程 (Project Governance)

> Layer 1，所有项目。

| 检查 ID | 检查项名称 | 检查内容 | 严重级别 |
|--------|-----------|---------|---------|
| **A1** | 安全开发治理 | SSDLC/SDLC、角色职责、安全纳入规划/设计/测试/发布 | High |
| **A2** | 变更 & 发布管理 | 代码审查、发布审批、回滚记录、变更日志 | High |
| **A3** | 事件 & 修复准备度 | 所有权、升级路径、客户沟通、事后复盘 | High |

---

### Domain B — 应用安全 (Application Security)

> Layer 1，所有项目。

| 检查 ID | 检查项名称 | 检查内容 | 严重级别 |
|--------|-----------|---------|---------|
| **B1** | 认证 & 会话控制 | 安全设计、超时/吊销、特权访问、管理员控制 | High |
| **B2** | 授权 & 最小权限 | 角色定义、服务端强制、敏感操作控制、权限升级防护 | High |
| **B3** | 输入/输出 & API 安全 | 输入验证、安全输出编码、API 认证、文件上传、逻辑滥用防护 | High |
| **B4** | 日志 & 监控 | 关键操作记录、日志中不含秘密、监控/告警机制 | Medium-High |
| **B5** | 注入防御 | 参数化查询、禁止 eval/exec、模板自动转义、SSTI 防护 | **Critical** |
| **B6** | XSS & 输出编码 | 输出编码、避免 innerHTML/dangerouslySetInnerHTML、CSP 头 | High |
| **B7** | 敏感数据 & 密码学失效 | 安全哈希、HTTPS 强制、静态加密、错误处理安全 | High |
| **B8** | 安全配置错误 | 调试模式关闭、默认凭证已更改、CORS 限制性配置、安全响应头 | High |
| **B9** | 秘密管理 | 环境变量/秘密管理器使用、.gitignore 覆盖、前端无 API Key、轮换、最小权限 | **Critical** |

---

### Domain C — 软件供应链 & 组件透明度 (Supply Chain & Component Transparency)

> Layer 1，所有项目。分上游/中游/下游三段。

**上游 (Upstream)**

| 检查 ID | 检查项名称 | 检查内容 | 严重级别 |
|--------|-----------|---------|---------|
| **C1** | 依赖清单 & SBOM | SBOM 存在、版本跟踪、漏洞监控 | High |
| **C2** | 开源许可证合规 | 组件许可证类型、copyleft 理解、Attribution、SPDX | Medium-High |
| **C3** | 构建完整性 & 溯源 | 来源跟踪、制品签名、可信源、锁文件使用 | High |
| **C4** | 开发工具链安全 | 已验证注册源、typosquatting 评估、锁文件、AI 工具设置 | Medium |
| **C5** | SDK & API 提供商风险 | 数据收集条款、供应商锁定、稳定性、降级行为 | Medium-High |

**中游 (Midstream)**

| 检查 ID | 检查项名称 | 检查内容 | 严重级别 |
|--------|-----------|---------|---------|
| **C6** | 服务间信任边界 | 内部 API 认证、mTLS、数据分类、东西向控制 | High |
| **C7** | 第三方集成安全 | Webhook 签名验证、OAuth PKCE/state 参数、API 密钥范围、回调验证 | High |

**下游 (Downstream)**

| 检查 ID | 检查项名称 | 检查内容 | 严重级别 |
|--------|-----------|---------|---------|
| **C8** | 分发渠道安全 | 账号双因素认证、制品签名、SRI 哈希、可审计自动发布 | High |
| **C9** | 更新 & 补丁交付 | 代码签名、回滚能力、紧急补丁流程、变更通知 | Medium |

---

### Domain D — 隐私 & 个人数据保护 (Privacy & Personal Data Protection)

> Layer 1，所有项目。

| 检查 ID | 检查项名称 | 检查内容 | 严重级别 |
|--------|-----------|---------|---------|
| **D1** | 数据最小化 & 默认保护 | 必要性收集、隐私默认值、可见范围限制、保留策略 | High |
| **D2** | 通知、同意 & 合法处理 | 用户告知、同意机制、目的明确、政策准确性 | High |
| **D3** | 数据主体权利 & 操作处理 | DSAR 工作流、时限遵守、供应商协调 | High |
| **D4** | 供应商 & 处理者控制 | 第三方处理者已知、职责划分、DPA 签署、分处理者 | High |

---

### Domain E — 无障碍 & 包容性设计 (Accessibility & Inclusive Design)

> Layer 1，所有项目。

| 检查 ID | 检查项名称 | 检查内容 | 严重级别 |
|--------|-----------|---------|---------|
| **E1** | 无障碍基线 | 设计/测试考量、键盘可访问、对比度、标签、辅助技术 | Medium |
| **E2** | 无障碍问题处理 | 问题跟踪、支持路径、修复优先级 | Medium |

---

### Domain F — 支付、计费 & 商务 (Payments, Billing & Commerce)

> Layer 2，含支付功能时激活。

| 检查 ID | 检查项名称 | 检查内容 | 严重级别 |
|--------|-----------|---------|---------|
| **F1** | 订阅 & 计费逻辑 | 定价透明、续订通知、取消机制、账单准确性、退款政策 | High |
| **F2** | 支付安全边界 | 支付数据处理、第三方处理器隔离、PCI 范围界定 | High |

---

### Domain G — 用户内容、审核 & 平台运营 (User Content & Moderation)

> Layer 2，含 UGC 时激活。

| 检查 ID | 检查项名称 | 检查内容 | 严重级别 |
|--------|-----------|---------|---------|
| **G1** | 用户生成内容 | 上传/发帖能力、所有权/许可条款、禁止内容、内容删除 | High |
| **G2** | 内容审核 & 执法 | 审核模型、升级路径、举报滥用处理、实际运营化 | High |

---

### Domain H — 企业 B2B & 采购 (Enterprise, B2B & Procurement)

> Layer 2，面向企业客户时激活。

| 检查 ID | 检查项名称 | 检查内容 | 严重级别 |
|--------|-----------|---------|---------|
| **H1** | 客户信任 & 企业控制 | 安全/隐私声明、事件响应能力、尽职调查材料、治理文件 | Medium-High |

---

### Domain I — AI 透明度 & 用户披露 (AI Transparency & User Disclosure)

> Layer 3，含 AI 功能时激活。

| 检查 ID | 检查项名称 | 检查内容 | 严重级别 |
|--------|-----------|---------|---------|
| **I1** | AI 使用披露 | 用户告知使用了 AI、角色说明、局限性披露 | High |
| **I2** | AI 输出处理 | 不安全输出处理机制、护栏、生成内容 vs 验证内容区分 | High |

---

### Domain J — 自动化决策、排名、评分 & 画像 (Automated Decisions)

> Layer 3，含自动决策时激活。

| 检查 ID | 检查项名称 | 检查内容 | 严重级别 |
|--------|-----------|---------|---------|
| **J1** | 决策重要性 | 有意义结果、排名/评分影响、用户质疑能力 | High |
| **J2** | 人工审查 & 可争议性 | 人工审查存在、申诉/覆盖机制、边缘案例升级 | High |

---

### Domain K — 模型、Prompt & AI 安全运营 (AI Safety Operations)

> Layer 3，含 AI/LLM 功能时激活。

| 检查 ID | 检查项名称 | 检查内容 | 严重级别 |
|--------|-----------|---------|---------|
| **K1** | Prompt & 输出安全 | Prompt 注入风险、输出处理、系统 Prompt 边界 | High |
| **K2** | 模型生命周期 & 提供商依赖 | 提供商依赖了解、数据保留理解、训练使用条款、降级行为 | Medium-High |

---

### Domain L — 移动应用安全 (Mobile Application Security)

> Layer 4，移动应用时激活。

| 检查 ID | 检查项名称 | 检查内容 | 严重级别 |
|--------|-----------|---------|---------|
| **L1** | 本地存储 & 设备暴露 | 本地数据敏感性、应用包秘密、缓存保护 | High |
| **L2** | 移动权限 & 网络处理 | 权限最小化、网络保护、WebView 安全、认证 Token 存储 | High |

---

### Domain M — 敏感行业激活 (Sensitive Sector Activation)

> Layer 5，产品触及以下任一行业时激活。

**触发行业：**

| 行业 | 关键词/场景 |
|------|-----------|
| 医疗健康 | 健康数据、PHI、医疗建议、症状检查 |
| 金融服务 | 投资建议、账户访问、金融产品 |
| 借贷 | 信贷决策、资格审查、利率计算 |
| 保险 | 承保、理赔、保险产品 |
| 教育 | 学生数据、FERPA、未成年人学习 |
| 就业 | 招聘、绩效评估、就业决策 |
| 公共部门 | 政府服务、公民数据 |
| 未成年人 | 儿童用户、COPPA、年龄验证 |
| 生物特征/身份 | 人脸识别、指纹、生物识别认证 |
| 安全关键 | 物理安全、基础设施控制 |

**激活效果：**
- 所有发现上调一个严重级别
- 增加人工审查标记
- 提高证据要求
- 加强治理/可争议性关注

---

## 3. LLLL Guard — Push Gate（推送门控，27 项）

> 触发方式：`/llll guard push` 或 pre-push hook

### HARD_BLOCK 触发（14 项）——不可覆盖，必须修复

| 模式 ID | 检测模式/正则 | 分类 | 说明 |
|--------|------------|------|------|
| **PG-H001** | `AKIA[0-9A-Z]{16}` | secret | AWS Access Key |
| **PG-H002** | `sk-[a-zA-Z0-9]{20,}` | secret | OpenAI/Stripe 密钥 |
| **PG-H003** | `ghp_[a-zA-Z0-9]{36}` | secret | GitHub Personal Access Token |
| **PG-H004** | `gho_[a-zA-Z0-9]{36}` | secret | GitHub OAuth Token |
| **PG-H005** | `-----BEGIN (RSA\|DSA\|EC\|OPENSSH) PRIVATE KEY-----` | secret | 私钥文件内容 |
| **PG-H006** | `(?i)(api[_-]?key\|api[_-]?secret\|access[_-]?key)\s*[=:]\s*['"][A-Za-z0-9+/=]{16,}['"]` | secret | 硬编码 API Key |
| **PG-H007** | `(?i)(password\|passwd\|pwd)\s*[=:]\s*['"][^'"]{8,}['"]` | secret | 硬编码密码 |
| **PG-H008** | `(?i)(database_url\|db_password\|db_pass\|mongo_uri\|redis_url)\s*[=:]\s*['"][^'"]+['"]` | secret | 硬编码数据库凭证 |
| **PG-H009** | `(?i)bearer\s+[A-Za-z0-9\-._~+/]+=*` | secret | 硬编码 Bearer Token |
| **PG-H010** | `.env` 文件有修改 | secret | .env 文件变更检测 |
| **PG-H011** | `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa*`, `id_ed25519*` | secret | 私钥文件被追踪 |
| **PG-H012** | `\d{3}-\d{2}-\d{4}` | data | SSN（社会安全号）格式 |
| **PG-H013** | `\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}` | data | 信用卡号格式 |
| **PG-H014** | `*Competitive_Analysis*`, `*Full_Analysis*`, `AGENT_PROMPT_*`, `MCP_analysis*` | internal | 内部分析文档泄漏 |

### SOFT_BLOCK 触发（10 项）——可覆盖，需记录理由

| 模式 ID | 启发式检测目标 | 功能分类 | 映射合规域 |
|--------|-------------|---------|---------|
| **PG-S001** | 新上传端点、multipart handler、`multer`/`formidable`/`busboy` | 文件上传 | G |
| **PG-S002** | 支付/计费代码、`stripe`/`paypal`/`braintree` | 支付 | F |
| **PG-S003** | 年龄验证、未成年人、`coppa`/`parental_consent` | 未成年人 | M |
| **PG-S004** | AI/LLM 集成、`openai`/`anthropic`/`langchain` | AI 功能 | I, J, K |
| **PG-S005** | 追踪/分析、`mixpanel`/`segment`/`amplitude`/`ga4` | 分析追踪 | D |
| **PG-S006** | 地理位置、`navigator.geolocation`、位置权限 | 位置数据 | D |
| **PG-S007** | 生物特征/人脸识别、`faceapi`/生物识别认证 | 生物特征 | M |
| **PG-S008** | 画像/评分/排名、信用评分、资格判定逻辑 | 自动化决策 | J |
| **PG-S009** | 新增 AGPL/GPL 依赖 | 许可证风险 | O |
| **PG-S010** | 数据保留变更、`TTL`/`expiry`/`purge` | 数据生命周期 | D |

### WARN 触发（3 项）——不阻断，记录警告

| 模式 ID | 检测目标 | 分类 |
|--------|---------|------|
| **PG-W001** | `TODO`, `FIXME`, `HACK`, `XXX`, `TEMP`（新增行） | 代码卫生 |
| **PG-W002** | `console.log`, `console.debug`, `print()`, `debugger;`（生产代码） | 调试泄漏 |
| **PG-W003** | 清单文件中新增依赖 | 依赖追踪 |

---

## 4. LLLL Guard — Release Gate（发布门控，13 项）

> 触发方式：`/llll guard release` 或发布前钩子

### HARD_BLOCK 触发（6 项）——制品中不可包含

| 模式 ID | 检测目标 | 分类 |
|--------|---------|------|
| **RG-H001** | `.env` 文件在发布制品中 | secret |
| **RG-H002** | `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa*` 在制品中 | secret |
| **RG-H003** | 发布内容中嵌入的秘密 | secret |
| **RG-H004** | `*.map` 文件（Source Map）在制品中 | 源码泄漏 |
| **RG-H005** | Source Map `sourcesContent` 字段有内容 | 源码泄漏 |
| **RG-H006** | 私有存储引用（`s3://`, `gs://`, 内部 URL） | 内部信息泄漏 |

### SOFT_BLOCK 触发（7 项）——可覆盖，需记录理由

| 模式 ID | 检测目标 | 分类 |
|--------|---------|------|
| **RG-S001** | `src/` 目录在发布制品中 | 源码泄漏 |
| **RG-S002** | `test/`, `tests/`, `__tests__/`, `*.test.*`, `*.spec.*` | 测试代码泄漏 |
| **RG-S003** | `internal/`, `private/` 目录 | 内部目录泄漏 |
| **RG-S004** | `prompts/`, `*.prompt`, `SKILL.md`, `system-prompt*` | 系统提示泄漏 |
| **RG-S005** | `tools/`, `scripts/`, `Makefile`, `Taskfile*` | 内部工具泄漏 |
| **RG-S006** | 无 `.npmignore` 且 package.json 无 `"files"` 字段 | 发布策略缺失 |
| **RG-S007** | 发布制品 > 10MB | 制品体积异常 |

---

## 5. LLLL Scan — 自动扫描层（40+ 项）

> 触发方式：`/llll scan` | 代码仓库静态分析

### 5.1 秘密检测（8 项）

| 模式 ID | 检测正则 | 说明 | 严重级别 |
|--------|---------|------|---------|
| **SEC-001** | `(?i)(api[_-]?key\|api[_-]?secret\|access[_-]?key)\s*[=:]\s*['"][A-Za-z0-9+/=]{16,}['"]` | 硬编码 API Key | Critical |
| **SEC-002** | `(?i)password\s*[=:]\s*['"][^'"]{4,}['"]` | 硬编码密码 | Critical |
| **SEC-003** | `AKIA[0-9A-Z]{16}` | AWS Access Key | Critical |
| **SEC-004** | `sk-[a-zA-Z0-9]{20,}` | OpenAI/Stripe 密钥 | Critical |
| **SEC-005** | `ghp_[a-zA-Z0-9]{36}` | GitHub PAT | Critical |
| **SEC-006** | `-----BEGIN (RSA\|DSA\|EC\|OPENSSH) PRIVATE KEY-----` | 私钥内容 | Critical |
| **SEC-007** | `(?i)(database_url\|db_password\|db_pass)\s*[=:]\s*['"][^'"]+['"]` | 数据库凭证 | Critical |
| **SEC-008** | `(?i)bearer\s+[a-zA-Z0-9._\-]{20,}` | 硬编码 Bearer Token | High |

### 5.2 OWASP 代码模式扫描（15 项）

| 模式 ID | 检测正则 | 语言 | 漏洞类型 | 严重级别 |
|--------|---------|------|---------|---------|
| **OWA-001** | `\beval\s*\(` | JS/Python | 代码注入 | Critical |
| **OWA-002** | `\bexec\s*\(` | Python | 命令注入 | Critical |
| **OWA-003** | `child_process\.(exec\|execSync)\s*\(` | Node.js | 命令注入 | Critical |
| **OWA-004** | `os\.system\s*\(` | Python | 命令注入 | Critical |
| **OWA-005** | `subprocess\.(call\|run\|Popen)\s*\(.*shell\s*=\s*True` | Python | Shell 注入 | Critical |
| **OWA-006** | `innerHTML\s*=` | JS | DOM XSS | High |
| **OWA-007** | `dangerouslySetInnerHTML` | React | XSS 原始 HTML | High |
| **OWA-008** | `v-html\s*=` | Vue | XSS 原始 HTML | High |
| **OWA-009** | `\$\{.*\}.*(?:SELECT\|INSERT\|UPDATE\|DELETE\|DROP)` | JS/TS | SQL 注入（模板字符串） | Critical |
| **OWA-010** | `f".*(?:SELECT\|INSERT\|UPDATE\|DELETE\|DROP).*\{` | Python | SQL 注入（f-string） | Critical |
| **OWA-011** | `".*(?:SELECT\|INSERT\|UPDATE\|DELETE).*"\s*%` | Python | SQL 注入（% 格式化） | Critical |
| **OWA-012** | `(?i)document\.write\s*\(` | JS | DOM 操作 XSS | High |
| **OWA-013** | `(?i)(md5\|sha1)\s*\(` | Any | 弱哈希算法 | High |
| **OWA-014** | `(?i)DEBUG\s*=\s*(True\|true\|1\|"true")` | Any | 调试模式开启 | High |
| **OWA-015** | `(?i)Access-Control-Allow-Origin.*\*` | Any | 宽松 CORS | Medium |

### 5.3 Git 仓库卫生（7 项）

| 检查 ID | 检测方式 | 检查内容 | 严重级别 |
|--------|---------|---------|---------|
| **GIT-001** | `test -f .gitignore` | .gitignore 文件存在 | High |
| **GIT-002** | `grep -q "\.env" .gitignore` | .env 在 .gitignore 中排除 | Critical |
| **GIT-003** | `git log --all --diff-filter=A -- '*.env'` | .env 从未被提交 | Critical |
| **GIT-004** | `git log --all --diff-filter=A -- '*.pem' '*.key'` | 私钥从未被提交 | Critical |
| **GIT-005** | `gh api repos/{owner}/{repo}/branches/main/protection` | main 分支保护已开启 | High |
| **GIT-006** | `test -f LICENSE` | LICENSE 文件存在 | High |
| **GIT-007** | `test -f CODEOWNERS` | CODEOWNERS 文件存在 | Low |

### 5.4 依赖漏洞审计（9 种技术栈）

| 技术栈 | 审计命令 | 锁文件 |
|-------|---------|-------|
| npm | `npm audit --json` | package-lock.json |
| yarn | `yarn audit --json` | yarn.lock |
| pnpm | `pnpm audit --json` | pnpm-lock.yaml |
| pip | `pip audit --format=json` | requirements.txt |
| pipenv | `pipenv check --json` | Pipfile.lock |
| poetry | `poetry audit` | poetry.lock |
| cargo | `cargo audit --json` | Cargo.lock |
| Go | `govulncheck ./...` | go.sum |
| Ruby | `bundle audit check --format=json` | Gemfile.lock |

### 5.5 许可证风险分级（9 类）

| 许可证类型 | 风险级别 | 商业影响 |
|-----------|---------|---------|
| MIT, BSD-2, BSD-3, ISC, Unlicense | Low | 宽松许可 |
| Apache 2.0 | Low | 宽松 + 专利授予 |
| MPL-2.0 | Medium | 文件级 copyleft |
| LGPL-2.1, LGPL-3.0 | Medium | 动态链接 OK，静态可能触发 |
| GPL-2.0, GPL-3.0 | High | 强 copyleft |
| AGPL-3.0 | **Critical** | 网络 copyleft（SaaS 陷阱） |
| SSPL | **Critical** | 服务级 copyleft |
| 无许可证 / 来源不明 | High | 默认版权保留 |

### 5.6 Dockerfile 安全（5 项）

| 模式 ID | 检测模式 | 问题 | 严重级别 |
|--------|---------|------|---------|
| **DOC-001** | `^FROM .+:latest` | 不可重现（无固定版本） | Medium |
| **DOC-002** | 无 `USER` 指令 | 以 root 运行 | High |
| **DOC-003** | `COPY .env` 或 `ADD .env` | 秘密写入镜像层 | Critical |
| **DOC-004** | `ARG.*PASSWORD\|SECRET\|KEY` | 秘密可见于构建历史 | High |
| **DOC-005** | 无 `.dockerignore` | 潜在秘密泄漏 | Medium |

---

## 6. 严重级别 & 状态标签体系

### 风险严重级别（合规域使用）

| 级别 | 图标 | 说明 | 响应时限 |
|------|-----|------|---------|
| Critical | 🔴🔴 | 紧迫 + 重要，立即产生严重后果 | 立即 |
| High | 🔴 | 重要但不紧迫，长期显著风险 | 本周 |
| Medium | 🟡 | 削弱安全态势，非立即灾难性 | 本月 |
| Low | 🟢 | 提升成熟度，有用但不紧迫 | 本季 |

### Guard 门控结果（Guard 使用）

| 结果 | 含义 | 可否覆盖 |
|------|------|---------|
| HARD_BLOCK | 绝对禁止离开仓库 | 否 |
| SOFT_BLOCK | 未经审查不应离开，须记录理由 | 是，需 `/llll override` |
| WARN | 需注意，不阻断 | 自动通过 |
| PASS | 无问题 | — |

### 证据状态标签

| 标签 | 含义 |
|------|------|
| KNOWN | 已确认存在 |
| OBSERVED | 代码中可见 |
| INFERRED | 功能推断，未直接确认 |
| UNKNOWN | 信息缺失 |
| NEEDS BUSINESS DECISION | 需要产品/业务决策 |
| NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT | 需要法律/合规专家 |
| NEEDS TECHNICAL CONFIRMATION | 需工程确认 |
| MISSING EVIDENCE | 证据缺失 |

### 负责方标签

| 负责方 | 适用场景 |
|-------|---------|
| Product | 商业决策、功能范围、用户体验选择 |
| Engineering | 技术确认、实现方案、代码修复 |
| Compliance expert / Legal professional | 法规适用性、条款解读、合规认证 |

---

## 7. 领域激活逻辑

```
产品特征 → 激活域
─────────────────────────────────────
始终激活              → N, O, A, B, C, D, E
含支付/订阅功能       → F
含用户生成内容        → G
面向企业/B2B          → H
含任何 AI/LLM 功能   → I, J, K
iOS/Android 原生应用  → L
触及敏感行业（任一）  → M（提升全局级别）
```

---

## 附录：检查项数量汇总

| 类别 | 数量 |
|------|------|
| 合规域主检查项（A-O） | 51 |
| Guard Push HARD_BLOCK 模式 | 14 |
| Guard Push SOFT_BLOCK 模式 | 10 |
| Guard Push WARN 模式 | 3 |
| Guard Release HARD_BLOCK 模式 | 6 |
| Guard Release SOFT_BLOCK 模式 | 7 |
| Scan 秘密检测模式 | 8 |
| Scan OWASP 代码模式 | 15 |
| Scan Git 卫生检查 | 7 |
| Scan 依赖审计（技术栈） | 9 |
| Scan 许可证分级 | 9 |
| Scan Dockerfile 检查 | 5 |
| **合计** | **144** |

---

*文件路径：`llll-check-taxonomy.md` · 本文档为行主键清单，供向下映射到一手来源 / CIPT / AIGP / 代码扩展。*
