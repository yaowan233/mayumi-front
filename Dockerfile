# 使用基础的 Node.js 镜像
FROM node:22.9

# 在容器中创建一个工作目录
WORKDIR /app

# 将前端代码复制到容器中
COPY . /app

# 安装依赖项
RUN npm install --force

# 构建前端应用
RUN npm run build

# 暴露前端应用的端口
EXPOSE 3000

# 设置容器启动命令
CMD ["npm", "run", "start"]
