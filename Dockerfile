FROM node:18-slim

# 设置Hugging Face环境
ENV HUGGING_FACE=1
ENV PORT=7860

# 创建工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制项目文件
COPY . .

# 创建持久化数据目录
USER root
RUN mkdir -p /home/user/data && \
    chmod 777 /home/user/data

# 暴露端口
EXPOSE 7860

# 启动应用
CMD ["npm", "start"]
