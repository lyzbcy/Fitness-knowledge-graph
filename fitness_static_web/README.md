# Static Fitness Knowledge Graph

本项目是一个基于**静态 Web 技术 (HTML + JSON)** 构建的健身知识图谱。
相比原有的 Neo4j 版本，本方案**无需服务器**，可直接免费托管在 **GitHub Pages** 上。

## 📂 项目结构
```
fitness_static_web/
├── build_graph.py      # [关键] 数据处理脚本：将 exercises.json 转为图谱数据
├── exercises.json      # [源数据] 从开源社区下载的 800+ 健身动作库
├── graph_data.json     # [生成物] 供前端直接读取的图谱数据 (Nodes + Links)
├── index.html          # [入口] 可视化网页 (基于 ECharts)
└── README.md           # 说明文档
```

## 🚀 快速开始

### 1. 本地预览
直接在浏览器中打开 `index.html` 即可看到图谱。
*(注意：由于 Chrome 的跨域安全策略，直接双击打开可能无法读取 `json` 文件。建议使用 VS Code 的 "Live Server" 插件，或者用 python 启动一个临时服务)*：
```bash
# 在 fitness_static_web 目录下运行
python -m http.server
# 然后访问 http://localhost:8000
```

### 2. 数据更新
如果需要更新数据（比如想自己加动作）：
1. 修改 `exercises.json` (或替换为新下载的版本)。
2. 运行脚本重新生成图谱：
   ```bash
   python build_graph.py
   ```
3. 刷新网页。

## 🌐 部署到 GitHub Pages (保姆级教程)

1. **新建仓库**: 在 GitHub 新建一个仓库，例如叫 `my-fitness-kg`。
2. **上传代码**: 将 `fitness_static_web` 文件夹里的**所有文件**上传到仓库根目录。
3. **开启 Pages**:
   - 进入仓库 **Settings** -> **Pages**。
   - 在 **Build and deployment** 下，Branch 选择 `main` (或 master)，文件夹选 `/ (root)`。
   - 点击 **Save**。
4. **访问**: 等待 1-2 分钟，访问 `https://你的用户名.github.io/my-fitness-kg` 即可！

## 🛠 技术原理
- **核心逻辑**: Python 预处理 -> 静态 JSON -> ECharts 前端渲染。
- **优点**: 0成本，永久免费，速度快。
- **缺点**: 数据量特别巨大(>5万节点)时前端可能会卡顿（当前数据量 ~6000 节点，运行流畅）。
