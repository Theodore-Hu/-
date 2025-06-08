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
    
    // 更新总分（传入完整的result对象）
    updateTotalScore(result);
    
    // 更新详细评分
    updateDetailedScores(result.categoryScores, result.baseScores, result.specializationBonus);
    
    // 更新岗位推荐
    updateJobRecommendations(result.jobRecommendations);
    
    // 更新建议
    updateSuggestions(result.suggestions);
    
    // 显示专精信息（优化版）
    if (result.specializations && result.specializations.length > 0) {
        showSpecializationInfo(result.specializations, result.specializationBonus);
    }
    
    // 启动动画
    setTimeout(() => {
        animateScoreItems();
    }, 500);
}

// 修正：更新总分显示
function updateTotalScore(result) {
    const scoreElement = document.getElementById('totalScore');
    const levelElement = document.getElementById('scoreLevel');
    const summaryElement = document.getElementById('scoreSummary');
    const circleElement = document.getElementById('scoreCircle');
    
    const baseScore = result.baseScore;
    const bonus = result.specializationBonus || 0;
    const totalScore = result.totalScore;
    
    // 创建分数显示元素
    const scoreDisplay = document.createElement('div');
    scoreDisplay.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1;
    `;
    
    if (bonus > 0) {
        scoreDisplay.innerHTML = `
            <div style="font-size: 3em; font-weight: bold; color: #333; margin-bottom: 5px;">
                ${totalScore}
            </div>
            <div style="font-size: 0.8em; color: #667eea; display: flex; align-items: center; gap: 4px;">
                <span style="background: #e2e8f0; padding: 2px 8px; border-radius: 10px; color: #4a5568;">
                    基础${baseScore}
                </span>
                <span style="color: #a0aec0;">+</span>
                <span style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 2px 8px; border-radius: 10px;">
                    专精${bonus}
                </span>
            </div>
        `;
    } else {
        scoreDisplay.innerHTML = `
            <div style="font-size: 3em; font-weight: bold; color: #333;">
                ${totalScore}
            </div>
        `;
    }
    
    // 清空并添加新的分数显示
    scoreElement.innerHTML = '';
    scoreElement.appendChild(scoreDisplay);
    
    // 设置圆环进度
    const basePercentage = Math.min((baseScore / 100) * 360, 360);
    
    if (bonus > 0) {
        // 双层圆环：内层基础分，外层专精加成
        circleElement.style.cssText = `
            background: conic-gradient(
                #48bb78 0deg, 
                #48bb78 ${basePercentage}deg,
                #f0f0f0 ${basePercentage}deg
            );
            position: relative;
        `;
        
        // 添加专精加成指示器
        const bonusRing = document.createElement('div');
        bonusRing.style.cssText = `
            position: absolute;
            top: -5px;
            left: -5px;
            width: 160px;
            height: 160px;
            border-radius: 50%;
            border: 3px solid transparent;
            border-top: 3px solid #667eea;
            animation: spin 3s linear infinite;
            opacity: 0.7;
        `;
        circleElement.appendChild(bonusRing);
        
        circleElement.classList.add('excellent-plus');
    } else {
        const color = getScoreColor(baseScore);
        circleElement.style.background = `conic-gradient(${color} 0deg, ${color} ${basePercentage}deg, #f0f0f0 ${basePercentage}deg)`;
        circleElement.classList.remove('excellent-plus');
    }
    
    // 设置等级和颜色
    const level = getScoreLevel(totalScore);
    levelElement.textContent = level.text;
    levelElement.style.color = level.color;
    
    // 更新总结文字
    summaryElement.textContent = level.summary;
    if (bonus > 0) {
        summaryElement.innerHTML += `<br><small style="color: #667eea;">专精加成让您脱颖而出！</small>`;
    }
}

// 修正：支持超过100分的等级系统
function getScoreLevel(score) {
    if (score >= 110) {
        return {
            text: '卓越',
            color: '#9f7aea', // 紫色表示超越
            summary: '专精突出，简历质量超群！'
        };
    } else if (score >= 100) {
        return {
            text: '专精',
            color: '#667eea', // 蓝色表示专精
            summary: '技能专精，简历质量优异！'
        };
    } else if (score >= 90) {
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

// 获取分数颜色
function getScoreColor(score) {
    if (score >= 80) return '#48bb78';
    if (score >= 60) return '#ed8936';
    return '#e53e3e';
}

// 优化专精信息显示
function showSpecializationInfo(specializations, totalBonus) {
    const container = document.querySelector('.score-overview');
    
    // 移除之前的专精信息
    const existing = container.querySelector('.specialization-info');
    if (existing) existing.remove();
    
    const specDiv = document.createElement('div');
    specDiv.className = 'specialization-info';
    specDiv.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        margin-top: 20px;
        animation: fadeInUp 0.6s ease;
    `;
    
    const specTypes = {
        'programming': '💻 编程开发',
        'data': '📊 数据分析', 
        'design': '🎨 设计创作',
        'engineering': '⚙️ 工程技术',
        'academic': '🎓 学术研究',
        'practical': '💼 实践应用'
    };
    
    let specDetails = specializations.map(spec => 
        `${specTypes[spec.type]} Lv.${spec.level} (+${spec.bonus}分)`
    ).join(' • ');
    
    specDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="font-weight: 600; margin-bottom: 10px; font-size: 1.1em;">
                ⭐ 专精领域识别
            </div>
            <div style="font-size: 0.95em; margin-bottom: 10px; line-height: 1.5;">
                ${specDetails}
            </div>
            <div style="font-size: 0.9em; background: rgba(255,255,255,0.2); 
                       padding: 8px 16px; border-radius: 20px; display: inline-block;">
                总专精加成: <strong>+${totalBonus}分</strong>
            </div>
        </div>
    `;
    
    container.appendChild(specDiv);
}

// 更新详细评分显示
function updateDetailedScores(categoryScores, baseScores, specializationBonus) {
    console.log('开始更新详细评分', categoryScores); // 调试信息
    
    const container = document.getElementById('scoreCategories');
    const categoryInfo = {
        basicInfo: {
            name: '📋 基本信息',
            subcategories: {
                name: '姓名信息',
                phone: '联系电话',
                email: '电子邮箱',
                location: '地址意向'
            }
        },
        education: {
            name: '🎓 教育背景',
            subcategories: {
                school: '学校层次',
                academic: '学术表现',
                major: '专业匹配'
            }
        },
        skills: {
            name: '💻 专业技能',
            subcategories: {
                programming: '编程开发',
                design: '设计创作',
                data: '数据分析',
                engineering: '工程技术',
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
                leadership: '领导经历'
            }
        }
    };
    
    container.innerHTML = '';
    
    Object.entries(categoryScores).forEach(([category, scoreData], index) => {
        const categoryName = categoryInfo[category].name;
        const subcategories = categoryInfo[category].subcategories;
        
        const item = document.createElement('div');
        item.className = 'score-item';
        item.style.animationDelay = `${index * 0.1}s`;
        
        // 获取基础分数和专精加成
        const baseScore = baseScores[category].total || baseScores[category];
        const specializationBonus = scoreData.specializationBonus || 0;
        const displayScore = baseScore + specializationBonus;
        const maxScore = typeof scoreData === 'object' ? 
            Object.values(scoreData.maxScores || {}).reduce((a, b) => a + b, 0) : 
            getMaxScore(category);
        
        // 基础进度百分比
        const basePercentage = (baseScore / maxScore) * 100;
        // 专精加成百分比（相对于maxScore）
        const bonusPercentage = (specializationBonus / maxScore) * 100;
        
        const scoreLevel = getScoreGrade(displayScore, maxScore);
        
        item.innerHTML = `
            <div class="main-score-row">
                <div class="category-name">
                    ${categoryName}
                    <span class="score-badge ${scoreLevel.class}" data-tooltip="${scoreLevel.tooltip}">
                        ${scoreLevel.text}
                    </span>
                    ${specializationBonus > 0 ? '<span class="specialization-badge">⭐专精</span>' : ''}
                </div>
                <div class="score-right-section">
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%" data-target="${Math.min(basePercentage, 100)}"></div>
                            ${specializationBonus > 0 ? 
                                `<div class="progress-bonus" style="width: 0%; left: ${Math.min(basePercentage, 100)}%" data-target="${bonusPercentage}"></div>` 
                                : ''}
                        </div>
                        <div class="progress-labels">
                            <span class="max-score-label">${maxScore}</span>
                        </div>
                    </div>
                    <div class="category-score ${scoreLevel.scoreClass}">
                        ${specializationBonus > 0 ? 
                            `<div>${displayScore}
                             <div class="score-breakdown">
                                 <span class="base-score">${baseScore}</span>
                                 <span class="bonus-score">+${specializationBonus}</span>
                             </div></div>` : 
                            displayScore}
                    </div>
                    <button class="toggle-detail collapsed" onclick="toggleCategoryDetail('${category}')">
                        详情
                    </button>
                </div>
            </div>
            <div class="category-detail" id="detail-${category}" style="display: none;">
                <h4>详细评分breakdown</h4>
                <div class="subcategory-list">
                    ${generateSubcategoryHTML(scoreData, subcategories)}
                </div>
                ${specializationBonus > 0 ? 
                    `<div class="specialization-explanation">
                        <div class="spec-header">⭐ 专精加成说明</div>
                        <div class="spec-content">该项目获得 <strong>+${specializationBonus}分</strong> 专精加成，体现了您在相关领域的突出能力</div>
                     </div>` : ''}
            </div>
        `;
        
        container.appendChild(item);
        
        // 启动动画...
    });
}

// 生成子项HTML
function generateSubcategoryHTML(scoreData, subcategories) {
    if (!scoreData.details) {
        return `
            <div class="empty-subcategory">
                暂无详细评分数据
            </div>
        `;
    }
    
    let html = '';
    Object.entries(subcategories).forEach(([key, name]) => {
        const score = scoreData.details[key] || 0;
        const maxScore = scoreData.maxScores[key] || 1;
        const percentage = (score / maxScore) * 100;
        const subGrade = getScoreGrade(score, maxScore);
        
        html += `
            <div class="subcategory-item">
                <span class="subcategory-name tooltip" data-tooltip="满分${maxScore}分">
                    ${name}
                </span>
                <div class="subcategory-progress">
                    <div class="subcategory-progress-fill" style="width: 0%" data-target="${percentage}"></div>
                </div>
                <span class="subcategory-score ${subGrade.scoreClass}">
                    ${score}/${maxScore}
                </span>
            </div>
        `;
    });
    
    return html;
}

// 获取分数等级
function getScoreGrade(score, maxScore) {
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 85) {
        return {
            class: 'excellent',
            text: '优秀',
            scoreClass: 'score-excellent',
            tooltip: '表现优异，继续保持！'
        };
    } else if (percentage >= 70) {
        return {
            class: 'good',
            text: '良好',
            scoreClass: 'score-good',
            tooltip: '表现不错，还有提升空间'
        };
    } else if (percentage >= 50) {
        return {
            class: 'average',
            text: '一般',
            scoreClass: 'score-average',
            tooltip: '需要重点改进'
        };
    } else {
        return {
            class: 'average',
            text: '待提升',
            scoreClass: 'score-poor',
            tooltip: '建议优先完善此项'
        };
    }
}

// 切换详情显示
function toggleCategoryDetail(category) {
    const detailDiv = document.getElementById(`detail-${category}`);
    const button = document.querySelector(`button[onclick="toggleCategoryDetail('${category}')"]`);
    
    if (detailDiv.style.display === 'none') {
        detailDiv.style.display = 'block';
        button.classList.remove('collapsed');
        button.classList.add('expanded');
        button.textContent = '收起';
        
        // 启动子项进度条动画
        setTimeout(() => {
            const subProgressBars = detailDiv.querySelectorAll('.subcategory-progress-fill');
            subProgressBars.forEach((bar, index) => {
                setTimeout(() => {
                    const targetWidth = bar.getAttribute('data-target');
                    bar.style.width = targetWidth + '%';
                }, index * 100);
            });
        }, 100);
        
    } else {
        detailDiv.style.display = 'none';
        button.classList.remove('expanded');
        button.classList.add('collapsed');
        button.textContent = '详情';
    }
}

// 添加进入动画
function animateScoreItems() {
    const scoreItems = document.querySelectorAll('.score-item');
    scoreItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            item.style.transition = 'all 0.5s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 150);
    });
}

// 更新岗位推荐
function updateJobRecommendations(jobs) {
    const container = document.getElementById('jobList');
    container.innerHTML = '';
    
    jobs.forEach((job, index) => {
        const item = document.createElement('div');
        item.className = 'job-item';
        item.style.animationDelay = (index * 0.1) + 's';
        
        // 根据匹配度设置不同的边框颜色
        let borderColor = '#667eea';
        if (job.match >= 85) borderColor = '#48bb78';
        else if (job.match >= 70) borderColor = '#ed8936';
        else if (job.match < 60) borderColor = '#f56565';
        
        item.style.borderLeftColor = borderColor;
        
        item.innerHTML = `
            <div class="job-title">${job.category}</div>
            <div class="job-match" style="color: ${borderColor};">匹配度: ${job.match}%</div>
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
        item.className = suggestion.includes('质量很好') || suggestion.includes('名校背景') || suggestion.includes('充分利用') ? 
                          'suggestion-item positive' : 'suggestion-item';
        item.style.animationDelay = (index * 0.1) + 's';
        
        // 添加图标
        let icon = '💡';
        if (suggestion.includes('完善') || suggestion.includes('添加')) icon = '📝';
        if (suggestion.includes('技能') || suggestion.includes('证书')) icon = '🔧';
        if (suggestion.includes('实习') || suggestion.includes('项目')) icon = '💼';
        if (suggestion.includes('竞赛') || suggestion.includes('奖学金')) icon = '🏆';
        if (suggestion.includes('质量很好') || suggestion.includes('名校')) icon = '⭐';
        
        item.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <span style="font-size: 1.2em; margin-top: 2px;">${icon}</span>
                <span>${suggestion}</span>
            </div>
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
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fed7d7;
        color: #9b2c2c;
        padding: 16px 20px;
        border-radius: 8px;
        border-left: 4px solid #f56565;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    
    errorDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.2em;">❌</span>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="margin-left: auto; background: none; border: none; font-size: 1.2em; cursor: pointer; color: #9b2c2c;">×</button>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 3000);
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

// 导出功能（增强版）
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
    a.download = `简历分析报告_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
}

// 生成报告内容（增强版）
function generateReport(analysis) {
    let report = `简历分析报告
==================
生成时间: ${new Date().toLocaleString()}

📊 总体评分
基础分: ${analysis.baseScore}/100分
专精加成: +${analysis.specializationBonus}分
总分: ${analysis.totalScore}分
等级: ${getScoreLevel(analysis.totalScore).text}
评语: ${getScoreLevel(analysis.totalScore).summary}

`;
    
    // 专精信息
    if (analysis.specializations && analysis.specializations.length > 0) {
        report += `⭐ 专精领域识别
`;
        const specTypes = {
            'programming': '编程开发专精',
            'data': '数据分析专精', 
            'design': '设计创作专精',
            'engineering': '工程技术专精',
            'academic': '学术研究专精',
            'practical': '实践应用专精'
        };
        
        analysis.specializations.forEach(spec => {
            report += `- ${specTypes[spec.type] || spec.type}: 等级${spec.level} (+${spec.bonus}分加成)
`;
        });
        report += '\n';
    }
    
    // 详细评分
    report += `📋 详细评分
`;
    const categoryNames = {
        basicInfo: '基本信息',
        education: '教育背景',
        skills: '专业技能',
        experience: '实践经验',
        achievements: '奖励荣誉'
    };
    
    Object.entries(analysis.categoryScores).forEach(([category, scoreData]) => {
        const score = typeof scoreData === 'object' ? scoreData.total : scoreData;
        const baseScore = analysis.baseScores[category].total || analysis.baseScores[category];
        const maxScore = typeof scoreData === 'object' ? 
            Object.values(scoreData.maxScores || {}).reduce((a, b) => a + b, 0) : 
            getMaxScore(category);
        
        const bonusText = score > baseScore ? ` (含${score - baseScore}分专精加成)` : '';
        report += `- ${categoryNames[category]}: ${score}/${maxScore}分${bonusText}
`;
    });
    
    report += `
🎯 岗位推荐
`;
    analysis.jobRecommendations.forEach((job, index) => {
        report += `${index + 1}. ${job.category} (匹配度: ${job.match}%)
   推荐理由: ${job.reason}
`;
    });
    
    report += `
💡 改进建议
`;
    analysis.suggestions.forEach((suggestion, index) => {
        report += `${index + 1}. ${suggestion}
`;
    });
    
    report += `
---
本报告由简历评分工具自动生成
建议结合个人实际情况和目标岗位要求进行参考`;
    
    return report;
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;
document.head.appendChild(style);
