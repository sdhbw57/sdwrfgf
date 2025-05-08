# Gemini Proxy Panel

这是一个自定义的Gemini Proxy Panel，提供以下功能：

- Gemini API转OpenAI格式的接口代理
- 多API密钥轮换
- API使用情况监控仪表板
- 支持流式响应
- 安全控制

## 使用说明

1. 访问 `/admin` 路径进入管理面板
2. 添加您的Gemini API密钥
3. 使用提供的代理URL作为OpenAI格式的API端点
4. 访问 `/dashboard` 查看API使用情况

## 仪表板功能

- API请求总数和24小时内请求数统计
- Token使用量监控
- 每日API使用趋势图
- 系统状态监控

## 环境变量配置

您可以在Hugging Face Space的设置中配置以下环境变量：

- `GEMINI_API_KEY`: Gemini API密钥（可选，也可以在管理面板中添加）
- `ADMIN_PASSWORD`: 管理面板密码（默认随机生成）
- `PROXY`: 代理服务器地址（如需使用代理）

## 注意事项

- 在首次登录后，请立即更改默认密码
- 定期检查API使用情况以避免超出配额
- 数据存储在持久化的数据目录中

---

© 2023-2024 Gemini Proxy Panel - 自定义版 