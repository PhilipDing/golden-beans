# CLAUDE.md - 金豆豆存钱罐项目指南

## 项目概述

金豆豆存钱罐是一个纯前端的个人理财存钱应用，使用原生 HTML/CSS/JavaScript 构建，无需构建工具或框架。数据通过 Gitee API 存储在云端仓库中。

## 技术栈

- HTML5 + CSS3（Flexbox、CSS 动画、渐变）
- JavaScript ES6+（面向对象，无模块打包）
- Gitee REST API v5（云端数据存储）
- 无构建工具、无包管理器、无框架依赖

## 项目结构

```
golden-beans/
├── index.html          # 主页面，包含所有弹窗 HTML 结构
├── styles.css          # 全局样式
├── app.js              # GoldenBeans 类 - 核心业务逻辑
├── api.js              # GiteeAPI 类 - Gitee 仓库文件 API 封装
├── ui.js               # UI 交互逻辑（弹窗、密码验证、Toast、初始化）
├── calculator.js       # 利息计算器功能
└── README.md           # 项目文档
```

## 脚本加载顺序

在 `index.html` 中，脚本按以下顺序加载（存在依赖关系）：

1. `api.js` - 定义 `GiteeAPI` 类和全局 `giteeAPI` 实例
2. `app.js` - 定义 `GoldenBeans` 类（依赖 `giteeAPI` 全局变量）
3. `ui.js` - 定义 UI 函数和全局 `app` 变量，调用 `initApp()`（依赖 `GoldenBeans` 类）
4. `calculator.js` - 利息计算器（独立功能）

## 核心类与模块

### GoldenBeans 类（app.js）

核心业务逻辑类，职责包括：

- **余额管理**：`calculateBalance()` 从历史记录计算当前余额
- **利息结算**：`checkAndApplyInterest()` 检查并补算未结算月份的利息
- **存取操作**：`deposit(amount)`、`withdraw(amount)`、`deleteRecord(index)`
- **显示更新**：`updateDisplay()`、`updateHistory()`

利息计算关键方法：
- `getBalanceAtDate(targetDate)` - 计算某日期的余额
- `getMinBalanceInCurrentMonth()` - 获取当月最小余额
- `calculateInterest(principal)` - 计算月利息 = principal × 0.5%
- `applyInterestByMonths(startDate, monthsCount)` - 批量补算多月利息

### GiteeAPI 类（api.js）

封装 Gitee 仓库文件 Contents API：

- `getFileContent()` - GET 读取文件内容和 SHA
- `updateFileContent(data, sha)` - PUT/POST 更新或创建文件
- `getAllData()` - 获取解析后的 JSON 数据
- `saveData(records, lastInterestDate)` - 保存完整数据

构造函数参数：`token`、`owner`、`repo`、`path`

### UI 层（ui.js）

全局函数式设计，处理用户交互：

- 弹窗管理：`openDepositModal()`、`closeDepositModal()` 等
- 密码验证：`confirmPassword()` - 根据操作类型使用不同密码
- Toast 提示：`showToast(message)`
- 应用初始化：`initApp()` - 创建 GoldenBeans 实例并隐藏加载遮罩

### 计算器（calculator.js）

独立的利息计算功能，使用复利公式：`本息合计 = 本金 × (1 + 0.005)^月数`

## 关键业务规则

### 利息计算

- 年利率 6%，月利率 0.5%
- 每月1日自动结算
- 计息本金 = min(月初余额, 月末余额)
- 鼓励保持余额稳定，取较小值计息
- 下月预计利息基于当月数据实时显示

### 密码验证

- 存入/支出操作密码：`0816`（硬编码在 ui.js `confirmPassword()` 中）
- 删除记录密码：`0000`（同上）
- 密码验证通过后才执行实际操作

### 数据结构

Gitee 仓库中存储的 JSON 结构：
```json
{
  "records": [
    {
      "type": "deposit|withdraw|interest",
      "amount": number,
      "date": "ISO 8601 date string",
      "icon": "emoji",
      "label": "显示名称"
    }
  ],
  "lastInterestDate": "ISO 8601 date string"
}
```

记录类型：
- `deposit` - 存入（🪙）
- `withdraw` - 支出（💸）
- `interest` - 利息收入（📈）

## 开发注意事项

- 所有全局变量和函数直接挂在 window 上，无模块系统
- 修改 `api.js` 中的 `giteeAPI` 实例配置来切换存储后端
- 金额使用 `roundToTwoDecimals()` 保持两位小数精度
- 历史记录按日期降序排列（最新在前）
- 利息结算采用"补算"机制：每次操作前检查是否有未结算月份
- Gitee API 更新文件需要提供上次的 SHA 值
- 弹窗使用 CSS class `active` 控制显示/隐藏
- 删除按钮默认隐藏，hover 时显示（移动端需长按）

## 常见修改场景

- **修改利率**：修改 `app.js` 中 `calculateInterest()` 的 `0.06/12` 和 `calculator.js` 中的 `0.005`
- **修改密码**：修改 `ui.js` 中 `confirmPassword()` 函数的 `requiredPassword` 逻辑
- **更换存储后端**：替换 `api.js` 中的 `GiteeAPI` 类，保持 `getAllData()` 和 `saveData()` 接口不变
- **添加快捷金额**：修改 `index.html` 中对应弹窗的 `quick-amounts` 区域
- **添加记录类型**：在 `app.js` 的 `calculateBalance()` 和 `updateHistory()` 中添加新类型处理
