---
title: My Simple Flask Web App
emoji: 🚀
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 5000
# 对于这个项目，不需要配置 secrets 或持久化存储
# 如果需要环境变量，可以在 Hugging Face Space 的 Settings -> Variables and Secrets 中添加
# 例如，如果你的 Dockerfile 或 app.py 使用了环境变量:
# env:
#   MY_VARIABLE: "some_value"
---

# Simple Flask Web App

This is a basic Flask application deployed on Hugging Face Spaces using Docker.
It serves a "Hello, World!" (or "Hello, [NAME]!") page.
The `NAME` can be set as an environment variable in the Space settings.