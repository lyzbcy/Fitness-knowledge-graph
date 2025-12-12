# 医药问答系统 (QAMedicalKG) 技术文档

## 1. 项目概览

本项目是一个基于知识图谱的医药领域智能问答系统。它利用 **Neo4j** 图数据库存储大规模医药知识，通过 **AC 自动机 (Aho-Corasick automation)** 进行高效的实体识别，并结合规则匹配技术实现自然语言问题的自动解析与精准回答。

系统不仅支持命令行交互，还配备了 PyQt5 图形界面和 FastAPI Web 接口，能够回答关于疾病症状、治疗方法、药品信息、饮食禁忌等多种类型的医疗问题。

## 2. 技术架构

### 2.1 核心技术栈

本项目综合运用了图数据库、算法和现代软件开发框架，主要技术包括：

#### 1. 知识图谱存储：Neo4j
**Neo4j** 是目前业界最流行的原生图数据库。本项目利用 Neo4j 存储构建好的医药知识图谱。
- **应用**：以"节点-关系-节点"的图结构，直观存储疾病、药品、症状、科室等实体及其复杂的关联（如 `感冒` -[推荐药物]-> `感冒灵`）。
- **优势**：在处理复杂的关系查询（如"查询某药品的副作用及其适用人群"）时，比传统关系型数据库快数倍。

#### 2. 核心算法：AC 自动机 (Aho-Corasick)
**AC 自动机** 是一种经典的高效多模式匹配算法。
- **应用**：用于问答系统中的**实体识别 (NER)** 阶段。它能一次性在用户输入的长句中快速扫描出词库中包含的所有医疗实体（如疾病名、药名）。
- **优势**：扫描速度极快，时间复杂度仅与输入文本长度有关，不受词典规模（几十万词条）影响。

#### 3. Web 服务框架：FastAPI
**FastAPI** 是一个现代、高性能的 Python Web 框架。
- **应用**：将问答系统封装为 RESTful API 服务，对外提供 `/chat` 接口。
- **优势**：基于 Python 类型提示，自动生成 Swagger 在线文档，支持异步请求，适合高并发场景。

#### 4. 桌面 GUI 框架：PyQt5
**PyQt5** 是著名的跨平台 GUI 框架 Qt 的 Python 绑定。
- **应用**：开发了独立的桌面客户端，提供像微信一样的聊天窗口体验，方便用户交互。

#### 5. 图数据库驱动：py2neo
- **应用**：作为 Python 与 Neo4j 之间的桥梁，用于执行 Cypher 查询语句（Graph SQL）并将结果转化为 Python 对象。

### 2.2 系统工作流程

1.  **知识存储 (Build Graph)**:
    - 系统读取结构化的 JSON 数据源。
    - 使用 `py2neo` 将数据导入 Neo4j，构建以疾病为中心的知识图谱。

2.  **问题理解 (NLU)**:
    - **实体识别**: 使用 `ahocorasick` 库构建 AC 自动机，从用户输入中提取医疗实体（如“感冒”、“阿司匹林”）。
    - **意图分类**: 基于关键词（如“症状”、“怎么治”）和提取的实体类型，将问题分类（例如 `disease_symptom`, `disease_drug`）。

3.  **查询构建 (Query Generation)**:
    - 系统根据分类结果和实体信息，动态生成 Cypher 查询语句 (Graph SQL)。

4.  **答案检索与生成 (Answer Construction)**:
    - 在 Neo4j 中执行 Cypher 查询。
    - 将图数据库返回的结构化结果转换为自然语言，反馈给用户。

## 3. 核心模块说明

### 3.1 知识图谱构建 (`build_medicalgraph.py`)

脚本负责初始化数据库模式并导入数据。

-   **数据源**: `data/medical.json` (及补充资料)
-   **节点 (Nodes)**:
    -   `Disease` (疾病): 核心节点，包含病因、预防、治愈率等属性。
    -   `Drug` (药品), `Symptom` (症状), `Food` (食物), `Check` (检查), `Department` (科室), `Producer` (厂商)。
-   **关系 (Relationships)**:
    -   `has_symptom` (症状表现)
    -   `need_check` (所需检查)
    -   `recommand_eat` / `no_eat` / `do_eat` (饮食建议)
    -   `common_drug` / `recommand_drug` (用药建议)
    -   `acompany_with` (并发症)

### 3.2 问答流水线 (`chatbot_graph.py`)

这是问答系统的核心控制器，协调以下子模块：

-   **`question_classifier.py`**:
    -   加载 `dict/` 目录下的特征词库。
    -   利用 AC 自动机进行实体链接。
    -   区分 18+ 种问题类型（如 `disease_cause` (病因), `disease_prevent` (预防)）。
-   **`question_parser.py`**:
    -   将分类后的问题转化为结构化的 SQL (Cypher) 查询字典。
-   **`answer_search.py`**:
    -   执行查询并格式化输出。例如，将查询到的多个药品名称拼接成通顺的句子。

### 3.3 服务与接口

-   **CLI (`chatbot_graph.py`)**: 简洁的命令行问答。
-   **GUI (`gui_chatbot.py`)**: 基于 `PyQt5`，提供聊天窗口风格的界面，方便非技术人员测试。
-   **Web API (`server.py`)**: 基于 `FastAPI`，提供 `/chat` 接口，支持 JSON 数据交互，易于集成到前端网页或小程序。

## 4. 部署与使用

### 4.1 环境依赖
- Python 3.8+
- JDK 11+ (用于 Neo4j)
- Neo4j Desktop 或 Neo4j Community Server

### 4.2 安装步骤
1.  **安装 Python 库**:
    ```bash
    pip install -r requirements.txt
    ```
2.  **配置 Neo4j**:
    确保 Neo4j 正在运行，且端口为 `7687` (Bolt) 和 `7474` (HTTP)。
    *默认配置*: `uri="bolt://localhost:7687"`, `auth=("neo4j", "tangyudiadid0")`
    *(如需修改，请编辑 `build_medicalgraph.py` 和 `answer_search.py`)*

### 4.3 数据导入
首次运行前，必须执行以下命令构建图谱：
```bash
python build_medicalgraph.py
```
*(可选) 导入扩展数据以支持更多问题类型:*
```bash
python import_enhanced_data.py
```

### 4.4 启动应用
- **启动命令行版**:
  ```bash
  python chatbot_graph.py
  ```
- **启动 GUI 版**:
  ```bash
  python gui_chatbot.py
  ```
- **启动 API 服务**:
  ```bash
  python server.py
  ```
  Swagger 文档: `http://localhost:8000/docs`

## 5. 项目文件结构

```
QAMedicalKG/
├── chatbot_graph.py          # [入口] 命令行主程序
├── gui_chatbot.py            # [入口] GUI 主程序
├── server.py                 # [入口] Web API 主程序
├── build_medicalgraph.py     # [工具] 图谱构建脚本
├── question_classifier.py    # [核心] 问题分类器 (AC自动机)
├── question_parser.py        # [核心] 语句解析器
├── answer_search.py          # [核心] 答案检索器
├── requirements.txt          # 依赖列表
├── data/                     # 数据源目录
└── dict/                     # 实体特征词典 (自动生成)
```
