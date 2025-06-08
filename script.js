// 全局变量
let currentAnalysis = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeUpload();
    initializeTextAnalysis();
});

// 初始化文件上传
function initializeUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    // 文件选择
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

// 初始化文本分析
function initializeTextAnalysis() {
    const textarea = document.getElementById('resumeText');
    textarea.addEventListener('input', debounce(checkTextInput, 500));
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 检查文本输入
function checkTextInput() {
    const text = document.getElementById('resumeText').value.trim();
    const analyzeBtn = document.querySelector('.analyze-btn');
    
    if (text.length > 100) {
        analyzeBtn.style.background = '#48bb78';
        analyzeBtn.disabled = false;
    } else {
        analyzeBtn.style.background = '#ccc';
        analyzeBtn.disabled = true;
    }
}

// 处理文件上传
async function handleFileUpload(file) {
    // 文件大小检查
    if (file.size > 10 * 1024 * 1024) {
        showError('文件大小超过10MB限制');
        return;
    }
    
    // 文件类型检查
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const fileName = file.name.toLowerCase();
    const isValidType = allowedTypes.includes(file.type) || 
                       fileName.endsWith('.pdf') || 
                       fileName.endsWith('.doc') || 
                       fileName.endsWith('.docx');
    
    if (!isValidType) {
        showError('请上传PDF或Word格式的文件');
        return;
    }
    
    showLoading('正在解析文件...');
    
    try {
        const text = await ResumeParser.parseFile(file);
        if (text.trim().length < 50) {
            throw new Error('文件内容过少，请检查文件是否正确');
        }
        
        document.getElementById('resumeText').value = text;
        hideLoading();
        analyzeResume();
        
    } catch (error) {
        hideLoading();
        showError('文件解析失败: ' + error.message);
    }
}

// 分析简历
async function analyzeResume() {
    const text = document.getElementById('resumeText').value.trim();
    
    if (text.length < 50) {
        showError('简历内容过少，请输入完整的简历信息');
        return;
    }
    
    showLoading('正在分析简历...');
    
    try {
        // 模拟分析延迟，让用户感觉更真实
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const scorer = new ResumeScorer();
        const result = scorer.scoreResume(text);
        
        hideLoading();
        displayResults(result);
        
    } catch (error) {
        hideLoading();
        showError('分析失败: ' + error.message);
    }
}

// 显示结果
function displayResults(result) {
    currentAnalysis = result;
    
    // 显示结果区域
    const resultSection = document.getElementById('resultSection');
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth' });
    
    // 更新总分
    updateTotalScore(result.totalScore);
    
    // 更新详细评分
    updateDetailedScores(result.categoryScores);
    
    // 更新岗位推荐
    updateJobRecommendations(result.jobRecommendations);
    
    // 更新建议
    updateSuggestions(result.suggestions);
}

// 更新总分显示
function updateTotalScore(score) {
    const scoreElement = document.getElementById('totalScore');
    const levelElement = document.getElementById('scoreLevel');
    const summaryElement = document.getElementById('scoreSummary');
    const circleElement = document.getElementById('scoreCircle');
    
    // 动画计数效果
    animateScore(scoreElement, 0, score, 1000);
    
    // 设置圆环进度
    const percentage = (score / 100) * 360;
    circleElement.style.setProperty('--percentage', percentage + 'deg');
    
    // 设置等级和颜色
    const level = getScoreLevel(score);
    levelElement.textContent = level.text;
    levelElement.style.color = level.color;
    
    summaryElement.textContent = level.summary;
    
    // 设置圆环颜色
    const color = getScoreColor(score);
    circleElement.style.background = `conic-gradient(${color} 0deg, ${color} ${percentage}deg, #f0f0f0 ${percentage}deg)`;
}

// 动画计数
function animateScore(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.round(start + (end - start) * easeOutQuart(progress));
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// 缓动函数
function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

// 获取分数等级
function getScoreLevel(score) {
    if (score >= 90) {
        return {
            text: '优秀',
            color: '#48bb78',
            summary: '简历质量很高，可以冲击知名企业！'
        };
    } else if (score >= 80) {
        return {
            text: '良好',
            color: '#38a169',
            summary: '简历整体不错，稍作完善就很棒了'
        };
    } else if (score >= 70) {
        return {
            text: '中等',
            color: '#ed8936',
            summary: '简历有一定亮点，还有提升空间'
        };
    } else if (score >= 60) {
        return {
            text: '及格',
            color: '#dd6b20',
            summary: '简历基本完整，建议重点优化'
        };
    } else {
        return {
            text: '待改进',
            color: '#e53e3e',
            summary: '简历需要大幅提升，建议重新梳理'
        };
    }
}

// 获取分数颜色
function getScoreColor(score) {
    if (score >= 80) return '#48bb78';
    if (score >= 60) return '#ed8936';
    return '#e53e3e';
}

// 更新详细评分
function updateDetailedScores(categoryScores) {
    const container = document.getElementById('scoreCategories');
    const categoryInfo = {
        basicInfo: {
            name: '📋 基本信息',
            subcategories: {
                name: '姓名',
                phone: '手机号',
                email: '邮箱',
                location: '地址/意向'
            }
        },
        education: {
            name: '🎓 教育背景',
            subcategories: {
                school: '学校层次',
                academic: '学术表现',
                major: '专业相关性'
            }
        },
        skills: {
            name: '💻 专业技能',
            subcategories: {
                programming: '编程开发',
                design: '设计创作',
                data: '数据分析',
                business: '商务技能',
                language: '语言能力'
            }
        },
        experience: {
            name: '💼 实践经验',
            subcategories: {
                internship: '实习经历',
                project: '项目经验',
                quality: '经验质量'
            }
        },
        achievements: {
            name: '🏆 奖励荣誉',
            subcategories: {
                scholarship: '奖学金',
                competition: '竞赛获奖',
                certificate: '证书认证',
                leadership: '领导力'
            }
        }
    };
    
    container.innerHTML = '';
    
    Object.entries(categoryScores).forEach(([category, scoreData]) => {
        const categoryName = categoryInfo[category].name;
        const subcategories = categoryInfo[category].subcategories;
        
        const item = document.createElement('div');
        item.className = 'score-item';
        
        // 主要得分显示
        const mainScore = scoreData.total || scoreData;
        const maxScore = typeof scoreData === 'object' ? 
            Object.values(scoreData.maxScores || {}).reduce((a, b) => a + b, 0) : 
            getMaxScore(category);
        const percentage = (mainScore / maxScore) * 100;
        
        item.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <div class="category-name">${categoryName}</div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="category-score">${mainScore}/${maxScore}分</div>
                    <button class="toggle-detail collapsed" onclick="toggleCategoryDetail('${category}')">
                        详情
                    </button>
                </div>
            </div>
            <div class="category-detail" id="detail-${category}" style="display: none;">
                <h4>详细评分</h4>
                <div class="subcategory-list">
                    ${generateSubcategoryHTML(scoreData, subcategories)}
                </div>
            </div>
        `;
        
        container.appendChild(item);
    });
}

// 生成子项HTML
function generateSubcategoryHTML(scoreData, subcategories) {
    if (!scoreData.details) {
        return '<p style="color: #999; font-style: italic;">暂无详细数据</p>';
    }
    
    let html = '';
    Object.entries(subcategories).forEach(([key, name]) => {
        const score = scoreData.details[key] || 0;
        const maxScore = scoreData.maxScores[key] || 1;
        const percentage = (score / maxScore) * 100;
        
        html += `
            <div class="subcategory-item">
                <span class="subcategory-name">${name}</span>
                <div class="subcategory-progress">
                    <div class="subcategory-progress-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="subcategory-score">${score}/${maxScore}</span>
            </div>
        `;
    });
    
    return html;
}

// 切换详情显示
function toggleCategoryDetail(category) {
    const detailDiv = document.getElementById(`detail-${category}`);
    const button = document.querySelector(`button[onclick="toggleCategoryDetail('${category}')"]`);
    
    if (detailDiv.style.display === 'none') {
        detailDiv.style.display = 'block';
        button.classList.remove('collapsed');
        button.classList.add('expanded');
    } else {
        detailDiv.style.display = 'none';
        button.classList.remove('expanded');
        button.classList.add('collapsed');
    }
}

// 获取最大分数（兼容旧版本）
function getMaxScore(category) {
    const maxScores = {
        basicInfo: 10,
        education: 30,
        skills: 25,
        experience: 25,
        achievements: 10
    };
    return maxScores[category] || 10;
}

// 更新岗位推荐
function updateJobRecommendations(jobs) {
    const container = document.getElementById('jobList');
    container.innerHTML = '';
    
    jobs.forEach((job, index) => {
        const item = document.createElement('div');
        item.className = 'job-item';
        item.style.animationDelay = (index * 0.1) + 's';
        
        item.innerHTML = `
            <div class="job-title">${job.category}</div>
            <div class="job-match">匹配度: ${job.match}%</div>
            <div class="job-reason">${job.reason}</div>
        `;
        
        container.appendChild(item);
    });
}

// 更新建议
function updateSuggestions(suggestions) {
    const container = document.getElementById('suggestionList');
    container.innerHTML = '';
    
    suggestions.forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.className = suggestion.includes('质量很好') ? 'suggestion-item positive' : 'suggestion-item';
        item.style.animationDelay = (index * 0.1) + 's';
        
        item.innerHTML = `
            <div>${suggestion}</div>
        `;
        
        container.appendChild(item);
    });
}

// 显示加载状态
function showLoading(message) {
    const resultSection = document.getElementById('resultSection');
    resultSection.style.display = 'block';
    resultSection.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// 隐藏加载状态
function hideLoading() {
    const resultSection = document.getElementById('resultSection');
    resultSection.innerHTML = `
        <div class="result-card">
            <div class="score-overview">
                <div class="total-score">
                    <div class="score-circle" id="scoreCircle">
                        <span class="score-number" id="totalScore">0</span>
                        <span class="score-suffix">分</span>
                    </div>
                    <div class="score-info">
                        <h2 id="scoreLevel">评估中...</h2>
                        <p id="scoreSummary">正在分析您的简历...</p>
                    </div>
                </div>
            </div>
            <div class="detailed-scores">
                <h3>📊 详细评分</h3>
                <div class="score-categories" id="scoreCategories"></div>
            </div>
            <div class="job-recommendations">
                <h3>🎯 岗位推荐</h3>
                <div class="job-list" id="jobList"></div>
            </div>
            <div class="suggestions">
                <h3>💡 改进建议</h3>
                <div class="suggestion-list" id="suggestionList"></div>
            </div>
        </div>
    `;
}

// 显示错误信息
function showError(message) {
    alert('❌ ' + message);
}

// 导出功能（可选）
function exportResults() {
    if (!currentAnalysis) {
        showError('没有可导出的分析结果');
        return;
    }
    
    const reportContent = generateReport(currentAnalysis);
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = '简历分析报告.txt';
    a.click();
    
    URL.revokeObjectURL(url);
}

// 生成报告内容
function generateReport(analysis) {
    let report = `简历分析报告
==================

总分: ${analysis.totalScore}/100分
等级: ${getScoreLevel(analysis.totalScore).text}

详细评分:
`;
    
    const categoryNames = {
        basicInfo: '基本信息',
        education: '教育背景',
        skills: '专业技能',
        experience: '实践经验',
        achievements: '奖励荣誉'
    };
    
    Object.entries(analysis.categoryScores).forEach(([category, score]) => {
        report += `- ${categoryNames[category]}: ${score}分\n`;
    });
    
    report += `\n岗位推荐:\n`;
    analysis.jobRecommendations.forEach((job, index) => {
        report += `${index + 1}. ${job.category} (匹配度: ${job.match}%)\n   ${job.reason}\n`;
    });
    
    report += `\n改进建议:\n`;
    analysis.suggestions.forEach((suggestion, index) => {
        report += `${index + 1}. ${suggestion}\n`;
    });
    
    report += `\n生成时间: ${new Date().toLocaleString()}`;
    
    return report;
}
