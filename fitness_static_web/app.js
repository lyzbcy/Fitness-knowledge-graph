// Initialize ECharts instance
var chart = echarts.init(document.getElementById('main'));

// Data management
var fullNodes = [];
var fullLinks = [];
var currentNodes = [];
var currentLinks = [];
var isFullGraphMode = false;

// Category Mappings
const categoryMap = {
    "Start": "开始",
    "Exercise": "动作",
    "Muscle": "肌肉",
    "Equipment": "器材",
    "Level": "难度",
    "Category": "类别"
};

const categoryColors = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#10b981'];
const categoryClasses = ['exercise', 'muscle', 'equipment', 'level', 'category'];

// 中英文翻译映射 (支持中文搜索)
const translationMap = {
    // 肌肉 (Muscles)
    "胸": "chest", "胸肌": "chest", "胸部": "chest",
    "背": "lats", "背部": "middle back", "上背": "middle back", "下背": "lower back",
    "腿": "quadriceps", "大腿": "quadriceps", "腿部": "quadriceps",
    "腹": "abdominals", "腹肌": "abdominals", "腹部": "abdominals",
    "二头肌": "biceps", "二头": "biceps",
    "三头肌": "triceps", "三头": "triceps",
    "肩": "shoulders", "肩部": "shoulders", "三角肌": "shoulders",
    "臀": "glutes", "臀部": "glutes",
    "小腿": "calves", "腓肠肌": "calves",
    "前臂": "forearms",
    "斜方肌": "traps",
    // 器材 (Equipment)
    "杠铃": "barbell", "哑铃": "dumbbell", "壶铃": "kettlebells",
    "龙门架": "cable", "绳索": "cable",
    "弹力带": "bands", "瑜伽垫": "body only", "徒手": "body only",
    // 难度 (Level)
    "初级": "beginner", "入门": "beginner",
    "中级": "intermediate",
    "高级": "expert", "进阶": "expert",
    // 类别 (Category)
    "力量": "strength", "拉伸": "stretching", "爆发力": "plyometrics"
};

// 英→中反向翻译映射 (用于显示中文名称)
const reverseTranslationMap = {
    // 肌肉 (Muscles)
    "chest": "胸肌", "pectoralis": "胸肌",
    "lats": "背阔肌", "middle back": "中背部", "lower back": "下背部",
    "quadriceps": "股四头肌", "hamstrings": "腘绳肌",
    "abdominals": "腹肌", "abs": "腹肌",
    "biceps": "二头肌", "triceps": "三头肌",
    "shoulders": "肩部", "deltoids": "三角肌",
    "glutes": "臀肌", "calves": "小腿",
    "forearms": "前臂", "traps": "斜方肌",
    "adductors": "内收肌", "abductors": "外展肌",
    "neck": "颈部",
    // 器材 (Equipment)
    "barbell": "杠铃", "dumbbell": "哑铃", "kettlebells": "壶铃",
    "cable": "龙门架", "machine": "器械",
    "bands": "弹力带", "body only": "徒手",
    "foam roll": "泡沫轴", "medicine ball": "药球",
    "e-z curl bar": "曲杆", "other": "其他",
    // 难度 (Level)
    "beginner": "初级", "intermediate": "中级", "expert": "高级",
    // 类别 (Category)
    "strength": "力量训练", "stretching": "拉伸",
    "plyometrics": "爆发力", "strongman": "力量举",
    "cardio": "有氧", "olympic weightlifting": "奥林匹克举重",
    "powerlifting": "力量举"
};

// 获取中文名称 (如果有翻译则返回中文，否则返回原英文)
function getChineseName(englishName) {
    const lowerName = englishName.toLowerCase();
    return reverseTranslationMap[lowerName] || englishName;
}

// --- Graph Initialization ---

function translateCategory(name) {
    return categoryMap[name] || name;
}

function initGraph() {
    chart.showLoading({
        text: '',
        color: '#0ea5e9',
        textColor: '#0f172a',
        maskColor: 'rgba(255, 255, 255, 0.95)',
        zlevel: 0
    });

    // Cache busting to ensure fresh data usage
    fetch('graph_data.json?t=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            chart.hideLoading();
            document.getElementById('loading').style.display = 'none';

            fullNodes = data.nodes.map((node, idx) => ({
                ...node,
                category: parseInt(node.category), // Ensure integer type
                itemStyle: { color: categoryColors[node.category] },
                // Hide label by default for performance
                label: { show: false }
            }));
            fullLinks = data.links;

            // Initial Load: Skeleton only (Hide Exercise nodes, category 0)
            renderSkeletonGraph();

            const translatedCategories = data.categories.map((c, idx) => ({
                name: translateCategory(c.name),
                itemStyle: { color: categoryColors[idx] }
            }));

            var option = {
                backgroundColor: 'transparent',
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderColor: '#e2e8f0',
                    textStyle: { color: '#0f172a' },
                    extraCssText: 'box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border-radius: 8px;'
                },
                legend: [{
                    show: false,
                    data: translatedCategories.map(c => c.name)
                }],
                series: [{
                    type: 'graph',
                    layout: 'force',
                    data: currentNodes, // Dynamic data
                    links: currentLinks,// Dynamic links
                    categories: translatedCategories,
                    roam: true,
                    label: {
                        show: false, // Default hidden
                        position: 'right',
                        formatter: '{b}',
                        color: '#334155',
                        fontSize: 12,
                        fontWeight: 500
                    },
                    labelLayout: { hideOverlap: true },
                    scaleLimit: { min: 0.4, max: 5 },
                    lineStyle: {
                        color: '#cbd5e1',
                        curveness: 0.1,
                        opacity: 0.6,
                        width: 1
                    },
                    force: {
                        repulsion: 250,
                        gravity: 0.08,
                        edgeLength: [60, 180],
                        layoutAnimation: true
                    },
                    emphasis: {
                        focus: 'adjacency',
                        label: { show: true, color: '#0f172a' },
                        lineStyle: { width: 3, opacity: 1, color: '#0ea5e9' },
                        itemStyle: { borderWidth: 3, borderColor: '#fff', shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.1)' }
                    },
                    autoCurveness: false
                }]
            };

            chart.setOption(option);

            chart.on('click', function (params) {
                if (params.dataType === 'node') {
                    showNodeDetails(params.data);
                }
            });

            updateStats();
        })
        .catch(err => {
            document.getElementById('loading').innerText = "加载数据出错: " + err;
            console.error(err);
        });
}

function renderSkeletonGraph() {
    isFullGraphMode = false;
    currentNodes = fullNodes.filter(n => n.category !== 0);

    // Links: Only links between current nodes
    const currentNodeIds = new Set(currentNodes.map(n => n.id));
    currentLinks = fullLinks.filter(l => currentNodeIds.has(l.source) && currentNodeIds.has(l.target));

    if (chart.getOption()) {
        chart.setOption({
            series: [{
                data: currentNodes,
                links: currentLinks
            }]
        });
    }
    updateStats();
}

function renderFullGraph() {
    isFullGraphMode = true;
    currentNodes = fullNodes;
    currentLinks = fullLinks;

    chart.setOption({
        series: [{
            data: currentNodes,
            links: currentLinks
        }]
    });
    updateStats();
}

function toggleFullGraph() {
    if (isFullGraphMode) {
        renderSkeletonGraph();
    } else {
        renderFullGraph();
    }
    updateToggleText();
    return isFullGraphMode;
}

function updateToggleText() {
    const btn = document.getElementById('toggleGraphBtn');
    if (btn) {
        btn.innerText = isFullGraphMode ? "⚡ 切换回精简模式" : "🐌 加载全部数据 (可能卡顿)";
        btn.style.background = isFullGraphMode ? "rgba(239, 68, 68, 0.2)" : "rgba(20, 184, 166, 0.2)";
    }
}

function updateStats() {
    const statsEl = document.getElementById('stats-value');
    if (statsEl) {
        statsEl.innerText = `${currentNodes.length} 节点 / ${fullNodes.length} 总数`;
    }
}

window.onresize = function () { chart.resize(); };


// --- UI Interaction ---

function showNodeDetails(node) {
    const container = document.getElementById('node-details-content');
    const detailPanel = document.getElementById('node-details');

    const catNames = ["动作", "肌肉", "器材", "难度", "类别"];
    const catLabel = catNames[node.category] || "未知";
    const catClass = categoryClasses[node.category] || "";

    // 获取中文名称（动作类节点保留英文，其他类型翻译为中文）
    const displayName = node.category === 0 ? node.name : getChineseName(node.name);
    const showBothNames = node.category !== 0 && displayName !== node.name;

    let html = `
        <div class="detail-item">
            <div class="detail-name">${displayName}</div>
            ${showBothNames ? `<div style="font-size: 0.85rem; color: #94a3b8; margin-top: 4px;">${node.name}</div>` : ''}
        </div>
        <div class="detail-item">
            <div class="detail-label">类型</div>
            <div class="detail-value"><span class="tag ${catClass}">${catLabel}</span></div>
        </div>
    `;

    if (node.instructions && node.instructions.length > 0) {
        html += `
        <div class="detail-item">
            <div class="detail-label">说明 (英文)</div>
            <div class="detail-value" style="font-size: 0.85rem; line-height: 1.6;">
                ${node.instructions.slice(0, 3).join('<br>')}...
            </div>
        </div>`;
    }

    if (node.images && node.images.length > 0) {
        html += `
        <div class="detail-item">
            <div class="detail-label">演示图</div>
            <div class="detail-value">
                <img src="https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${node.images[0]}" 
                     style="max-width:100%; border-radius:8px; margin-top:8px;"
                     onerror="this.style.display='none'">
            </div>
        </div>`;
    }

    container.innerHTML = html;
    detailPanel.classList.add('visible');
}

function closeNodeDetails() {
    document.getElementById('node-details').classList.remove('visible');
}

function searchNode() {
    var text = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!text) return;

    // 中英文翻译：如果输入是中文，尝试翻译为英文
    let searchTerm = translationMap[text] || text;

    // 模糊匹配：支持部分关键词
    if (searchTerm === text) {
        for (let cn in translationMap) {
            if (text.includes(cn)) {
                searchTerm = translationMap[cn];
                break;
            }
        }
    }

    var match = fullNodes.find(n => n.name.toLowerCase().includes(searchTerm));
    if (match) {
        if (!currentNodes.find(n => n.id === match.id)) {
            addNodeToGraph(match);
        }
        focusOnNode(match);
    } else {
        alert('未找到该节点！请尝试输入英文名称或其他关键词。');
    }
}

function focusOnNode(node) {
    chart.setOption({
        series: [{
            data: currentNodes,
            links: currentLinks
        }]
    });

    chart.dispatchAction({
        type: 'focusNodeAdjacency',
        dataIndex: currentNodes.indexOf(currentNodes.find(n => n.id === node.id))
    });
    showNodeDetails(node);
}

function addNodeToGraph(node) {
    if (currentNodes.find(n => n.id === node.id)) return;

    currentNodes.push(node);

    fullLinks.forEach(l => {
        if (l.source === node.id || l.target === node.id) {
            const otherId = (l.source === node.id) ? l.target : l.source;
            if (currentNodes.find(n => n.id === otherId)) {
                if (!currentLinks.includes(l)) {
                    currentLinks.push(l);
                }
            }
        }
    });

    updateStats();
}


// --- Chat Functionality ---

function initChat() {
    addChatMessage("ai", "你好！我是你的健身 AI 助手。你可以问我关于动作、肌肉或器材的问题。\n\n试着问我：'推荐胸部训练' 或 '怎么做深蹲'。");
}

function addChatMessage(sender, text) {
    const history = document.getElementById('chat-history');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.innerHTML = text.replace(/\n/g, '<br>');
    history.appendChild(msgDiv);
    history.scrollTop = history.scrollHeight;
}

function handleChatKeyPress(e) {
    if (e.key === 'Enter') sendChatMessage();
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    addChatMessage("user", text);
    input.value = '';

    setTimeout(() => {
        const response = generateAIResponse(text);
        addChatMessage("ai", response);
    }, 500);
}

function askQuestion(question) {
    document.getElementById('chat-input').value = question;
    sendChatMessage();
}

// 只填充输入框，不自动发送（让用户可以编辑）
function fillQuestion(question) {
    const input = document.getElementById('chat-input');
    input.value = question;
    input.focus();
    // 显示提示
    addChatMessage("ai", `💡 已填充关键词 "${question}"，您可以直接按回车发送，或编辑后再发送。`);
}

function generateAIResponse(query) {
    query = query.toLowerCase();

    // 1. Specific Node Search
    const potentialNode = fullNodes.find(n =>
        n.name.length > 2 && query.includes(n.name.toLowerCase())
    );

    if (potentialNode) {
        let addedMsg = "";
        if (!currentNodes.find(n => n.id === potentialNode.id)) {
            addNodeToGraph(potentialNode);
            addedMsg = "\n(已为您将该节点加载到图谱中)";
        }

        focusOnNode(potentialNode);

        let answer = `我找到了关于 **"${potentialNode.name}"** 的信息。${addedMsg}`;

        if (potentialNode.category === 0) { // Exercise
            if (potentialNode.instructions) {
                answer += `\n\n📝 **说明**: ${potentialNode.instructions[0]}`;
            }
        } else if (potentialNode.category === 1) { // Muscle
            answer += `\n这是一块肌肉。正在查找相关训练...`;
            const result = findAndAddExercisesForMuscle(potentialNode.id);
            if (result.exercises.length > 0) {
                answer += `\n\n💪 **推荐动作**: ${result.exercises.slice(0, 5).join(', ')}`;
                if (result.addedCount > 0) {
                    answer += `\n(已为您加载了 ${result.addedCount} 个相关动作节点)`;
                }
            }
        }

        answer += `\n(已在图谱中为您高亮显示)`;
        return answer;
    }

    // 2. Intent Detection
    const muscleMap = {
        "胸": ["pectoralis", "chest"],
        "背": ["latissimus", "trapezius", "back", "middle back", "lower back"],
        "腿": ["quadriceps", "hamstrings", "calves", "leg", "glutes"],
        "腹": ["abdominals", "abs"],
        "二头": ["biceps"],
        "三头": ["triceps", "triceps brachii"],
        "肩": ["shoulders", "deltoids"]
    };

    for (let key in muscleMap) {
        if (query.includes(key) || muscleMap[key].some(eng => query.includes(eng))) {
            let muscleNode = null;
            // Iterate through ALL terms to find a match
            for (let term of muscleMap[key]) {
                // Safe strict comparison for category, assuming parseInt worked
                muscleNode = fullNodes.find(n => n.category === 1 && n.name.toLowerCase().includes(term));
                if (muscleNode) break;
            }

            if (muscleNode) {
                const result = findAndAddExercisesForMuscle(muscleNode.id);

                if (!currentNodes.find(n => n.id === muscleNode.id)) addNodeToGraph(muscleNode);
                focusOnNode(muscleNode);

                return `关于 **${key} (${muscleNode.name})** 训练，我推荐：\n\n${result.exercises.slice(0, 5).map(e => `• ${e}`).join('\n')}\n\n(点击搜索框输入动作名称可查看详情)`;
            }
        }
    }

    if (query.includes("你好") || query.includes("hello") || query.includes("hi")) {
        return "你好！想了解什么健身知识？";
    }

    return "抱歉，我还在学习中。🔍 您可以尝试输入具体的动作名称（如 'Squat'）或者肌肉部位（如 '胸部'）来获取信息。";
}

function findAndAddExercisesForMuscle(muscleId) {
    if (!fullLinks || fullLinks.length === 0) return { exercises: [], addedCount: 0 };

    const connectedNodeIds = new Set();

    fullLinks.forEach(link => {
        if (link.target === muscleId) {
            connectedNodeIds.add(link.source);
        } else if (link.source === muscleId) {
            connectedNodeIds.add(link.target);
        }
    });

    const exercises = [];
    let addedCount = 0;

    const candidates = [];
    connectedNodeIds.forEach(id => {
        const node = fullNodes.find(n => n.id === id);
        if (node && node.category === 0) {
            candidates.push(node);
            exercises.push(node.name);
        }
    });

    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    candidates.slice(0, 15).forEach(node => {
        if (!currentNodes.find(n => n.id === node.id)) {
            addNodeToGraph(node);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        chart.setOption({
            series: [{
                data: currentNodes,
                links: currentLinks
            }]
        });
        updateStats();
    }

    return { exercises: exercises, addedCount: addedCount };
}

// Start Application
initGraph();
initChat();
