# 上游数据修复报告 (2024-09)

## 校验发现的问题

我们 fork 自 `202704948-design/astrbot_plugin_cet6` 的上游数据存在 4 类问题：

| 问题 | 影响范围 | 严重度 |
|:---|:---|:---:|
| 📖 阅读 Section C 命名不一致 (`Section C - Passage 1/2` vs `Section C1/C2`) | 48 篇（50% 阅读） | 🔴 P0 |
| 📖 阅读 meta.month="未知" | 15 篇 | 🟡 P1 |
| 🎧 听力 30 个错答案字母 (E/F/G/H/I/J/K/L/M/N/O) | 30 题（3 套） | 🔴 P0 |
| 🎧 听力 meta=null (mp3 链接丢失) | 2 套 (2023_03_1, 2022_06_1) | 🟡 P1 |

## 修复方法

修复全部在 `src/host.js` 内进行，无需修改上游数据。详见代码注释。

### 1️⃣ Section C 命名规范化

`normReading()` 内新增 `normalizeReadingType()`：
- `Section C - Passage 1` → `Section C1`
- `Section C - Passage 2` → `Section C2`

### 2️⃣ 月份自动回填

`patchMetaFromFilename()` 从 `meta.filename` 提取：
- `2020年07月六级真题（全1套）.docx` → month="07", set_index="1"
- `2020年09月六级真题（第1套）.docx` → month="09", set_index="1"

### 3️⃣ 听力答案清洗 + 权威覆盖

**两层处理**：
1. `sanitizeListeningAnswers()` 过滤非 A-D 字母（防止误用 E/F/G 等垃圾数据）
2. `LISTENING_ANSWER_OVERRIDES` 表应用 Drhm1224 答案覆盖

### 4️⃣ 缺失 MP3 自动恢复

`KNOWN_MP3S` 集合（27 个）记录上游 `CET-6听力/` 目录下实际存在的 MP3 文件名。
`normListening()` 内：若 meta.mp3_file 缺失但 key 在 KNOWN_MP3S 中，自动补 `cet6_<key>.mp3`。

## 外部数据源

- **Drhm1224/cet6-all-in-one** (https://github.com/Drhm1224/cet6-all-in-one)
  - 18 套听力答案（2023_06 ~ 2025_12）
  - 完整 2023-2025 阅读答案
  - 解析脚本：`parse_drhm.py`
  - 解析结果：`drhm_listening_db.json`

- **上游 AstrBot 仓库** (https://github.com/202704948-design/astrbot_plugin_cet6)
  - 27 套真题 + 96 篇阅读 + 5651 词汇原始数据
  - 27 个 MP3 文件（用于 KNOWN_MP3S 校对）

## 修复效果

| 指标 | 修复前 | 修复后 |
|:---|:---:|:---:|
| 📖 阅读可批改率 | 50%（48 篇无答案） | **95.8%** (92/96) |
| 🎧 听力可用套数 | 25/27（2 套无音频） | **27/27** (100%) |
| 🎧 听力答案完整度 | 64% (645/675) | **100%** (675/675) |
| 🎴 词汇数据完整度 | 100% (5651→3991 唯一) | **100%** |

> 残留 4 篇 2023_03 阅读无答案：上游+Drhm1224+公开网络均无 2023_03 答案数据源。graceful degrade：UI 标注 "暂无答案"。

## 验证脚本

```bash
# 重新校验当前数据
cd /home/ljl/dsh/english/verify
python3 ../docs/data-fixes/parse_drhm.py
node /tmp/test-final.js
```