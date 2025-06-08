// 简历解析器 - 优化版
class ResumeParser {
    static async parsePDF(file) {
        try {
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js库未加载，请刷新页面重试');
            }
            
            // 添加进度回调
            const progressCallback = (progress) => {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                console.log(`PDF解析进度: ${percent}%`);
            };
            
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
                verbosity: 0, // 减少控制台输出
                maxImageSize: 1024 * 1024, // 限制图片大小以节省内存
                disableFontFace: true, // 禁用字体渲染以提高性能
                useSystemFonts: false
            });
            
            const pdf = await loadingTask.promise;
            let fullText = '';
            const maxPages = Math.min(pdf.numPages, 10); // 限制最大页数
            
            // 并行处理页面（但限制并发数量）
            const concurrentLimit = 3;
            const chunks = [];
            
            for (let i = 0; i < maxPages; i += concurrentLimit) {
                const pagePromises = [];
                for (let j = i; j < Math.min(i + concurrentLimit, maxPages); j++) {
                    pagePromises.push(this.extractPageText(pdf, j + 1));
                }
                const chunkResults = await Promise.all(pagePromises);
                chunks.push(...chunkResults);
            }
            
            fullText = chunks.join('\n');
            
            // 清理内存
            await pdf.destroy();
            
            return this.cleanText(fullText);
        } catch (error) {
            console.error('PDF解析错误:', error);
            throw new Error('PDF解析失败: ' + error.message);
        }
    }
    
    static async extractPageText(pdf, pageNum) {
        try {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // 改进文本提取，保持格式
            const textItems = textContent.items.map(item => {
                // 处理特殊字符和换行
                let text = item.str;
                if (item.hasEOL) {
                    text += '\n';
                }
                return text;
            });
            
            const pageText = textItems.join(' ');
            
            // 清理页面内存
            page.cleanup();
            
            return pageText;
        } catch (error) {
            console.warn(`页面 ${pageNum} 解析失败:`, error);
            return '';
        }
    }
    
    static async parseWord(file) {
        try {
            if (typeof mammoth === 'undefined') {
                throw new Error('Word解析库未加载，请刷新页面重试');
            }
            
            const arrayBuffer = await file.arrayBuffer();
            
            // 使用更好的提取选项
            const result = await mammoth.extractRawText({ 
                arrayBuffer,
                includeEmbeddedStyleMap: false,
                includeDefaultStyleMap: false
            });
            
            if (result.messages && result.messages.length > 0) {
                console.warn('Word解析警告:', result.messages);
            }
            
            return this.cleanText(result.value);
        } catch (error) {
            console.error('Word解析错误:', error);
            throw new Error('Word文档解析失败: ' + error.message);
        }
    }
    
    // 文本清理和标准化
    static cleanText(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        return text
            // 统一换行符
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            // 移除多余空白
            .replace(/\t/g, ' ')
            .replace(/ +/g, ' ')
            // 清理多余换行
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            // 移除行首行尾空格
            .split('\n')
            .map(line => line.trim())
            .join('\n')
            // 移除文档开头和结尾的空白
            .trim();
    }
    
    static async parseFile(file) {
        // 添加文件验证
        if (!file || !file.type || !file.name) {
            throw new Error('无效的文件');
        }
        
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();
        
        // 检查文件是否损坏
        if (file.size === 0) {
            throw new Error('文件为空或损坏');
        }
        
        try {
            let text = '';
            
            if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
                text = await this.parsePDF(file);
            } else if (fileType.includes('word') || 
                      fileType.includes('document') ||
                      fileName.endsWith('.docx') || 
                      fileName.endsWith('.doc')) {
                text = await this.parseWord(file);
            } else {
                throw new Error('不支持的文件格式。仅支持 PDF (.pdf) 和 Word (.doc, .docx) 格式');
            }
            
            // 验证提取的文本
            if (!text || text.trim().length < 10) {
                throw new Error('无法从文件中提取有效内容，请检查文件是否正确或尝试其他格式');
            }
            
            // 检查是否包含有意义的简历内容
            if (!this.isValidResumeContent(text)) {
                throw new Error('文件内容不像是简历，请上传正确的简历文件');
            }
            
            return text;
            
        } catch (error) {
            // 更好的错误处理
            if (error.message.includes('password') || error.message.includes('encrypted')) {
                throw new Error('文件已加密，请上传未加密的文件');
            }
            
            if (error.message.includes('corrupted') || error.message.includes('invalid')) {
                throw new Error('文件已损坏，请尝试重新保存后上传');
            }
            
            throw error;
        }
    }
    
    // 验证是否是有效的简历内容
    static isValidResumeContent(text) {
        const resumeKeywords = [
            // 中文关键词
            '姓名', '电话', '邮箱', '教育', '经历', '技能', '工作', '实习', 
            '项目', '学校', '专业', '大学', '学院', '毕业', '求职', '应聘',
            // 英文关键词
            'name', 'phone', 'email', 'education', 'experience', 'skills',
            'work', 'university', 'college', 'graduate', 'internship', 'project'
        ];
        
        const lowerText = text.toLowerCase();
        const matchCount = resumeKeywords.filter(keyword => 
            lowerText.includes(keyword.toLowerCase())
        ).length;
        
        // 至少包含3个简历相关关键词
        return matchCount >= 3;
    }
    
    // 获取文件信息
    static getFileInfo(file) {
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified),
            sizeFormatted: this.formatFileSize(file.size)
        };
    }
    
    // 格式化文件大小
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 简历评分器 - 最终版
class ResumeScorer {
    constructor() {
        // 最终版基础分数配置
        this.maxScores = {
            basicInfo: 10,
            education: 25,
            skills: 25,
            experience: 25,
            achievements: 15
        };
        
        // 学校分级体系（按高考分数线分类）
        this.schoolRanks = {
            // TOP2（15分）- 仅清华北大
            topTier: [
                '清华大学', '北京大学', '清华', '北大'
            ],
            
            // 顶尖985（13分）- 稳定前十
            tier1A: [
                '复旦大学', '上海交通大学', '浙江大学', '中国科学技术大学', '南京大学',
                '中国人民大学', '北京师范大学', '华中科技大学', '中山大学', '西安交通大学',
                '复旦', '上交', '交大', '浙大', '中科大', '南大', '人大', '北师大', '华科', '中大', '西交'
            ],
            
            // 优质985+南科大等（11分）
            tier1B: [
                '哈尔滨工业大学', '北京航空航天大学', '北京理工大学', '东南大学', 
                '天津大学', '同济大学', '南开大学', '西北工业大学', '华东师范大学',
                '中南大学', '电子科技大学', '重庆大学', '大连理工大学', '吉林大学',
                '厦门大学', '山东大学', '华南理工大学', '兰州大学', '东北大学',
                '南方科技大学', '中国科学院大学', '国科大', '中科院大学', '南科大',
                '哈工大', '北航', '北理工', '东大', '天大', '同济', '南开', '西工大', '华师大'
            ],
            
            // 普通985+顶尖211（9分）
            tier2: [
                '中国农业大学', '国防科技大学', '中央民族大学', '湖南大学', '中国海洋大学', '西北农林科技大学',
                '北京邮电大学', '华东理工大学', '西安电子科技大学', '北京科技大学',
                '中南财经政法大学', '上海财经大学', '对外经济贸易大学', '西南财经大学',
                '中央财经大学', '华中师范大学', '华南师范大学', '陕西师范大学',
                '北邮', '华东理工', '西电', '北科大', '中南财', '上财', '对外经贸', '西南财', '央财'
            ],
            
            // 普通211（7分）
            tier3: [
                '北京交通大学', '北京工业大学', '北京化工大学', '中国石油大学', '中国地质大学',
                '中国矿业大学', '河海大学', '江南大学', '南京理工大学', '南京航空航天大学',
                '安徽大学', '合肥工业大学', '福州大学', '南昌大学', '郑州大学',
                '湖南师范大学', '暨南大学', '广西大学', '海南大学', '四川大学',
                '西南交通大学', '贵州大学', '云南大学', '西北大学', '长安大学',
                '华中农业大学', '南京农业大学', '中国药科大学', '北京中医药大学',
                '中国传媒大学', '北京外国语大学', '上海外国语大学'
            ],
            
            // 双一流学科建设（5分）
            tier4: [
                '西湖大学', '上海科技大学', '深圳大学', '苏州大学',
                '杭州电子科技大学', '宁波大学', '江苏科技大学', '南京信息工程大学',
                '浙江理工大学', '温州医科大学', '广东工业大学', '汕头大学',
                '华东政法大学', '上海理工大学', '首都医科大学', '重庆邮电大学',
                '西安建筑科技大学', '长沙理工大学', '湘潭大学', '扬州大学',
                '江西理工大学', '河北工业大学', '天津师范大学', '山西大学'
            ]
        };
        
        // 技能关键词库
        this.skillKeywords = {
            programming: [
                'Java', 'Python', 'JavaScript', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin',
                'React', 'Vue', 'Angular', 'Node.js', 'Spring', 'Django', 'Flask', 'Express',
                '前端', '后端', '全栈', '编程', '开发', '程序设计', 'HTML', 'CSS', 'PHP',
                'TypeScript', 'jQuery', 'Bootstrap', 'Webpack', 'Git', 'Linux', 'Docker',
                'Kubernetes', 'Redis', 'Nginx', 'Apache', 'MVC', 'API', 'RESTful', 'GraphQL'
            ],
            design: [
                'Photoshop', 'Illustrator', 'Sketch', 'Figma', 'XD', 'Axure', 'Principle',
                'UI', 'UX', '平面设计', '交互设计', '视觉设计', '用户体验', '用户界面',
                '界面设计', '原型设计', '设计思维', 'Premiere', 'After Effects', 'Cinema 4D',
                '美工', '创意设计', '品牌设计', '包装设计', '网页设计', '移动端设计'
            ],
            data: [
                'SQL', 'MySQL', 'MongoDB', 'PostgreSQL', 'Oracle', 'Excel', 'Tableau',
                'SPSS', 'R语言', 'MATLAB', 'Power BI', 'Spark', 'Hadoop', 'Hive',
                '数据分析', '数据挖掘', '数据可视化', '机器学习', '深度学习', '人工智能',
                'TensorFlow', 'PyTorch', '统计分析', '数据库', '大数据', 'ETL',
                'Pandas', 'NumPy', 'scikit-learn', 'Jupyter', 'Apache Kafka'
            ],
            business: [
                '市场营销', '项目管理', '商业分析', '财务分析', '运营', '策划', '咨询',
                'PPT', '团队管理', '客户服务', '销售', '商务谈判', '品牌推广', '市场调研',
                '内容运营', '用户运营', '活动策划', '文案写作', '新媒体', '短视频',
                '电商运营', '社群运营', '产品运营', 'CRM', 'ERP', 'SaaS', '增长黑客'
            ],
            language: [
                '英语', '日语', '韩语', '德语', '法语', '西班牙语', '俄语', '阿拉伯语',
                '四级', '六级', '雅思', '托福', 'GRE', 'GMAT', 'CET', 'BEC',
                'IELTS', 'TOEFL', '口语', '翻译', '同声传译', '商务英语'
            ],
            engineering: [
                'CAD', 'AutoCAD', 'SolidWorks', 'Pro/E', 'UG', 'CATIA', 'Inventor',
                'ANSYS', 'ABAQUS', 'COMSOL', '有限元', '仿真', '建模', '测试', '实验设计',
                'LabVIEW', 'Altium Designer', 'Keil', 'Quartus', 'Vivado', 'FPGA'
            ]
        };

        // 个人信息关键词库
        this.personalInfoKeywords = [
            '姓名', '性别', '年龄', '出生日期', '生日', '民族', '政治面貌', '籍贯', '户籍',
            '身高', '体重', '婚姻状况', '健康状况', '身份证', 'ID', '护照', '签证',
            '联系电话', '手机', '电话', '座机', '传真', 'phone', 'tel', 'mobile',
            '邮箱', 'email', 'mail', '电子邮件', 'gmail', 'qq.com', '163.com', '126.com',
            '地址', '住址', '通讯地址', '家庭地址', '联系地址', '现居', '常住',
            '求职意向', '意向岗位', '目标职位', '期望', '应聘', '求职',
            'GitHub', 'LinkedIn', 'Portfolio', '个人网站', '博客', 'Blog',
            '微信', 'WeChat', 'QQ', '微博', 'Weibo', 'Twitter', 'Facebook',
            '党员', '团员', '群众', '民主党派', '无党派', '汉族', '满族', '回族', '藏族',
            '未婚', '已婚', '离异', '丧偶', '单身', '恋爱', '订婚'
        ];
    }
    
    // 检测专精类型（按新逻辑）
    detectSpecialization(analysis) {
        const specializations = [];
        let totalSpecBonus = 0;
        
        // 1. 教育背景专精（学历专精）
        const eduSpecBonus = this.calculateEducationSpecialization(analysis.education);
        if (eduSpecBonus > 0) {
            specializations.push({
                type: 'education',
                level: analysis.education.degrees.length,
                bonus: eduSpecBonus
            });
            totalSpecBonus += eduSpecBonus;
        }
        
        // 2. 技能专精（超出25分基础分的部分）
        const skillsSpecBonus = this.calculateSkillsSpecialization(analysis.skills);
        if (skillsSpecBonus > 0) {
            specializations.push({
                type: 'skills',
                level: analysis.skills.total,
                bonus: skillsSpecBonus
            });
            totalSpecBonus += skillsSpecBonus;
        }
        
        // 3. 经验专精（超出25分基础分的部分）
        const expSpecBonus = this.calculateExperienceSpecialization(analysis.experience);
        if (expSpecBonus > 0) {
            specializations.push({
                type: 'experience',
                level: analysis.experience.internshipCount + analysis.experience.projectCount,
                bonus: expSpecBonus
            });
            totalSpecBonus += expSpecBonus;
        }
        
        // 4. 荣誉专精（超出15分基础分的部分）
        const achSpecBonus = this.calculateAchievementsSpecialization(analysis.achievements);
        if (achSpecBonus > 0) {
            specializations.push({
                type: 'achievements',
                level: this.countTotalAchievements(analysis.achievements),
                bonus: achSpecBonus
            });
            totalSpecBonus += achSpecBonus;
        }
        
        return { specializations, totalSpecBonus };
    }
    
    // 计算教育专精加成
    calculateEducationSpecialization(education) {
        let bonus = 0;
        const degrees = education.degrees || [];
        
        // 学历专精加成
        degrees.forEach(degree => {
            switch(degree.degree) {
                case 'phd':
                    bonus += 5;
                    break;
                case 'master':
                    bonus += 3;
                    break;
                case 'bachelor':
                    bonus += 1;
                    break;
            }
        });
        
        // 多学位加成
        if (degrees.length > 1) {
            bonus += (degrees.length - 1) * 2;
        }
        
        return bonus;
    }
    
    // 计算技能专精加成
    calculateSkillsSpecialization(skills) {
        const totalSkills = skills.total;
        if (totalSkills > 25) {
            return totalSkills - 25; // 超出25分的部分算专精
        }
        return 0;
    }
    
    // 计算经验专精加成
    calculateExperienceSpecialization(experience) {
        // 计算实际经验分数
        let totalExpScore = 0;
        
        // 实习分数
        for (let i = 0; i < experience.internshipCount; i++) {
            let itemScore = 3; // 基础分
            if (experience.hasCompanyName) itemScore += 1;
            if (experience.hasAchievement) itemScore += 1;
            totalExpScore += Math.min(itemScore, 5);
        }
        
        // 项目分数
        for (let i = 0; i < experience.projectCount; i++) {
            let itemScore = 3; // 基础分
            if (experience.hasDuration) itemScore += 1;
            if (experience.hasAchievement) itemScore += 1;
            totalExpScore += Math.min(itemScore, 5);
        }
        
        if (totalExpScore > 25) {
            return totalExpScore - 25; // 超出25分的部分算专精
        }
        return 0;
    }
    
    // 计算荣誉专精加成
    calculateAchievementsSpecialization(achievements) {
        const totalAchievements = this.countTotalAchievements(achievements);
        
        let baseScore = totalAchievements; // 每项1分
        
        // 学术成果质量加成
        let qualityBonus = 0;
        if (achievements.paperCount) {
            // 这里简化处理，实际可以区分论文质量
            qualityBonus += achievements.paperCount * 2; // 每篇论文额外2分质量加成
        }
        if (achievements.patentCount) {
            qualityBonus += achievements.patentCount * 1; // 每项专利额外1分
        }
        
        const totalScore = baseScore + qualityBonus;
        
        if (totalScore > 15) {
            return totalScore - 15; // 超出15分的部分算专精
        }
        return qualityBonus; // 质量加成部分算专精
    }
    
    // 统计总荣誉数量
    countTotalAchievements(achievements) {
        return achievements.scholarshipCount + 
               achievements.competitionCount + 
               achievements.certificateCount + 
               (achievements.hasLeadership ? 1 : 0) +
               achievements.paperCount +
               achievements.patentCount +
               achievements.softwareCount;
    }
    
    // 评分主函数
    scoreResume(text) {
        const analysis = this.analyzeResume(text);
        const baseScores = this.calculateScores(analysis);
        
        // 检测专精（新逻辑）
        const { specializations, totalSpecBonus } = this.detectSpecialization(analysis);
        
        // 计算基础总分（限制在100分内）
        const baseTotalScore = Math.min(
            Object.values(baseScores).reduce((sum, scoreObj) => {
                return sum + (typeof scoreObj === 'object' ? scoreObj.total : scoreObj);
            }, 0),
            100
        );
        
        // 最终总分 = 基础分 + 专精加成
        const finalTotalScore = baseTotalScore + totalSpecBonus;
        
        // 应用专精加成到各项分数显示
        const enhancedScores = this.applySpecializationDisplay(baseScores, specializations);
        
        const suggestions = this.generateSuggestions(enhancedScores, analysis);
        const jobRecommendations = this.recommendJobs(analysis, specializations);
        
        return {
            baseScore: Math.round(baseTotalScore),
            specializationBonus: totalSpecBonus,
            totalScore: Math.round(finalTotalScore),
            categoryScores: enhancedScores,
            baseScores: baseScores,
            analysis: analysis,
            specializations: specializations,
            suggestions: suggestions,
            jobRecommendations: jobRecommendations
        };
    }
    
    // 应用专精显示
    applySpecializationDisplay(baseScores, specializations) {
        const displayScores = JSON.parse(JSON.stringify(baseScores));
        
        specializations.forEach(spec => {
            switch(spec.type) {
                case 'education':
                    displayScores.education.specializationBonus = 
                        (displayScores.education.specializationBonus || 0) + spec.bonus;
                    break;
                case 'skills':
                    displayScores.skills.specializationBonus = 
                        (displayScores.skills.specializationBonus || 0) + spec.bonus;
                    break;
                case 'experience':
                    displayScores.experience.specializationBonus = 
                        (displayScores.experience.specializationBonus || 0) + spec.bonus;
                    break;
                case 'achievements':
                    displayScores.achievements.specializationBonus = 
                        (displayScores.achievements.specializationBonus || 0) + spec.bonus;
                    break;
            }
        });
        
        return displayScores;
    }
    
    // 简历分析
    analyzeResume(text) {
        return {
            personalInfo: this.analyzePersonalInfo(text),
            education: this.analyzeEducation(text),
            skills: this.analyzeSkills(text),
            experience: this.analyzeExperience(text),
            achievements: this.analyzeAchievements(text),
            wordCount: text.length,
            hasStructure: this.hasGoodStructure(text)
        };
    }
    
    // 个人信息分析 - 新增
    analyzePersonalInfo(text) {
        let infoCount = 0;
        const detectedInfo = [];
        
        // 检测各种个人信息
        this.personalInfoKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                if (!detectedInfo.includes(keyword)) {
                    detectedInfo.push(keyword);
                    infoCount++;
                }
            }
        });
        
        // 特殊模式检测
        if (/1[3-9]\d{9}/.test(text)) {
            if (!detectedInfo.includes('手机号')) {
                detectedInfo.push('手机号');
                infoCount++;
            }
        }
        
        if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) {
            if (!detectedInfo.includes('邮箱')) {
                detectedInfo.push('邮箱');
                infoCount++;
            }
        }
        
        return {
            count: Math.min(infoCount, 10), // 最多计算10项
            items: detectedInfo.slice(0, 10)
        };
    }
    
    // 教育背景分析
    analyzeEducation(text) {
        const education = {
            schoolLevel: 0,
            hasGPA: /GPA|绩点|平均分|成绩/.test(text),
            gpa: this.extractGPA(text),
            hasMajor: /(专业|学院|系|计算机|软件|电子|机械|经济|金融|管理|文学|理学|工学|医学|法学|教育学|艺术学|农学)/.test(text),
            isRelevant: false,
            degrees: this.extractDegrees(text),
            isCrossMajor: false
        };
        
        education.schoolLevel = this.calculateSchoolScore(text, education.degrees);
        education.isCrossMajor = this.detectCrossMajor(education.degrees);
        
        return education;
    }
    
    // 检测跨专业
    detectCrossMajor(degrees) {
        if (degrees.length < 2) return false;
        
        const majorCategories = {
            'engineering': ['计算机', '软件', '电子', '机械', '自动化', '通信', '材料', '化工', '土木', '建筑'],
            'business': ['经济', '管理', '金融', '会计', '市场', '商务', '工商', '财务'],
            'liberal_arts': ['文学', '外语', '新闻', '传播', '哲学', '历史', '法学'],
            'science': ['数学', '物理', '化学', '生物', '统计', '地理'],
            'medicine': ['医学', '护理', '药学', '临床'],
            'education': ['教育', '师范', '心理']
        };
        
        // 简化检测：如果本科和研究生专业属于不同大类，则认为是跨专业
        // 这里简化处理，实际可以更复杂
        return degrees.length >= 2;
    }
    
    // 提取学历信息
    extractDegrees(text) {
        const degrees = [];
        
        const patterns = [
            /([^。\n]*?大学|[^。\n]*?学院|[^。\n]*?科技|[^。\n]*?理工)[^。\n]*?(本科|学士|bachelor)/gi,
            /([^。\n]*?大学|[^。\n]*?学院|[^。\n]*?科技|[^。\n]*?理工)[^。\n]*?(研究生|硕士|博士|master|phd|doctor)/gi,
            /(20\d{2}[年\-\.]*20\d{2}|20\d{2}[年\-\.]*).*?([^。\n]*?大学|[^。\n]*?学院)[^。\n]*?(本科|研究生|硕士|博士)/gi
        ];
        
        patterns.forEach(pattern => {
            let match;
            const regex = new RegExp(pattern.source, pattern.flags);
            while ((match = regex.exec(text)) !== null) {
                degrees.push({
                    school: this.cleanSchoolName(match[1] || match[2]),
                    degree: this.getDegreeLevel(match[2] || match[3]),
                    text: match[0]
                });
            }
        });
        
        if (degrees.length === 0) {
            const schoolMatch = this.findSchoolInText(text);
            if (schoolMatch) {
                degrees.push({
                    school: schoolMatch,
                    degree: this.inferDegreeLevel(text),
                    text: schoolMatch
                });
            }
        }
        
        return degrees;
    }
    
    cleanSchoolName(schoolText) {
        if (!schoolText) return '';
        return schoolText
            .replace(/(大学|学院|科技|理工).*/, '$1')
            .replace(/^\s*/, '')
            .trim();
    }
    
    getDegreeLevel(degreeText) {
        if (/(博士|phd|doctor)/i.test(degreeText)) return 'phd';
        if (/(硕士|研究生|master)/i.test(degreeText)) return 'master';
        if (/(本科|学士|bachelor)/i.test(degreeText)) return 'bachelor';
        return 'unknown';
    }
    
    findSchoolInText(text) {
        const allSchools = [
            ...this.schoolRanks.topTier,
            ...this.schoolRanks.tier1A,
            ...this.schoolRanks.tier1B,
            ...this.schoolRanks.tier2,
            ...this.schoolRanks.tier3,
            ...this.schoolRanks.tier4
        ];
        
        for (let school of allSchools) {
            if (text.includes(school) || 
                text.includes(school.replace('大学', '')) || 
                text.includes(school.replace('学院', '')) ||
                text.includes(school.replace('科技大学', '')) ||
                text.includes(school.replace('理工大学', ''))) {
                return school;
            }
        }
        
        const universityMatch = text.match(/([^。\n]*?大学|[^。\n]*?学院)/);
        return universityMatch ? universityMatch[1] : null;
    }
    
    inferDegreeLevel(text) {
        if (/(博士|phd|doctor)/i.test(text)) return 'phd';
        if (/(硕士|研究生|master|graduate)/i.test(text)) return 'master';
        if (/(专科|大专|高职)/i.test(text)) return 'associate';
        return 'bachelor';
    }
    
    // 学校评分系统 - 按高考分数分类
    calculateSchoolScore(text, degrees) {
        if (degrees.length === 0) {
            return this.getBasicSchoolScore(text);
        }
        
        // 按学历层次排序，本科在前（第一学历）
        const sortedDegrees = degrees.sort((a, b) => {
            const order = { 'associate': 1, 'bachelor': 2, 'master': 3, 'phd': 4 };
            return (order[a.degree] || 0) - (order[b.degree] || 0);
        });
        
        let finalScore = 0;
        
        if (sortedDegrees.length === 1) {
            // 只有一个学历
            const degree = sortedDegrees[0];
            finalScore = this.getSchoolRankScore(degree.school);
        } else {
            // 多个学历：第一学历50% + 最高学历50%
            const firstDegree = sortedDegrees[0]; // 第一学历（通常是本科）
            const highestDegree = sortedDegrees[sortedDegrees.length - 1]; // 最高学历
            
            const firstScore = this.getSchoolRankScore(firstDegree.school);
            const highestScore = this.getSchoolRankScore(highestDegree.school);
            
            finalScore = Math.round(firstScore * 0.5 + highestScore * 0.5);
        }
        
        return Math.min(finalScore, 15); // 确保不超过15分
    }
    
    // 学校排名评分 - 根据高考分数线分类
    getSchoolRankScore(schoolName) {
        if (!schoolName) return 2;
        
        const normalizedName = schoolName
            .replace(/大学$/, '')
            .replace(/学院$/, '')
            .replace(/科技$/, '')
            .replace(/理工$/, '');
        
        // TOP2 (15分) - 仅清华北大
        if (this.schoolRanks.topTier.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 15;
        }
        
        // 顶尖985 (13分) - 稳定前十
        if (this.schoolRanks.tier1A.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 13;
        }
        
        // 优质985+南科大等 (11分)
        if (this.schoolRanks.tier1B.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 11;
        }
        
        // 普通985+顶尖211 (9分)
        if (this.schoolRanks.tier2.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 9;
        }
        
        // 普通211 (7分)
        if (this.schoolRanks.tier3.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 7;
        }
        
        // 双一流学科建设 (5分)
        if (this.schoolRanks.tier4.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 5;
        }
        
        // 其他大学
        if (/(大学|学院)/i.test(schoolName)) {
            if (/(985|211|双一流|重点)/i.test(schoolName)) return 6;
            return 3; // 普通本科
        }
        
        if (/(专科|高职)/i.test(schoolName)) return 1;
        
        return 2;
    }
    
    // 学校名称匹配辅助函数
    matchSchoolName(name1, name2) {
        if (!name1 || !name2) return false;
        
        // 直接匹配
        if (name1.includes(name2) || name2.includes(name1)) return true;
        
        // 简化匹配
        const simple1 = name1.replace(/[大学院科技理工]/g, '');
        const simple2 = name2.replace(/[大学院科技理工]/g, '');
        
        return simple1.length >= 2 && simple2.length >= 2 && 
               (simple1.includes(simple2) || simple2.includes(simple1));
    }
    
    getBasicSchoolScore(text) {
        // 清华北大特殊处理
        if (/(清华|北大)/i.test(text)) return 15;
        
        // 其他模糊匹配
        if (/(复旦|交大|浙大|中科大|南大)/i.test(text)) return 13;
        if (/(985)/i.test(text)) return 11;
        if (/(211|双一流)/i.test(text)) return 9;
        if (/(重点大学)/i.test(text)) return 7;
        if (/(大学|学院)/i.test(text)) return 3;
        if (/(专科|高职)/i.test(text)) return 1;
        
        return 2;
    }
    
    // GPA提取和转换为4分制
    extractGPA(text) {
        const gpaMatch = text.match(/GPA[：:\s]*([0-9.]+)/i) || 
                        text.match(/绩点[：:\s]*([0-9.]+)/) ||
                        text.match(/平均分[：:\s]*([0-9.]+)/);
        if (gpaMatch) {
            let gpa = parseFloat(gpaMatch[1]);
            
            // 转换为4分制
            if (gpa > 5) {
                // 百分制转4分制
                gpa = gpa / 25;
            } else if (gpa > 4 && gpa <= 5) {
                // 5分制转4分制
                gpa = gpa * 0.8;
            }
            // 否则认为已经是4分制
            
            return Math.min(gpa, 4.0); // 限制最高4.0
        }
        return 0;
    }
    
    // 技能识别 - 每项1分
    analyzeSkills(text) {
        const skills = {
            programming: [],
            design: [],
            data: [],
            business: [],
            language: [],
            engineering: [],
            total: 0
        };
        
        const textLower = text.toLowerCase();
        
        Object.keys(this.skillKeywords).forEach(category => {
            this.skillKeywords[category].forEach(skill => {
                const skillLower = skill.toLowerCase();
                if (textLower.includes(skillLower) || 
                    textLower.includes(skillLower.replace(/[.\s]/g, '')) ||
                    this.fuzzyMatch(textLower, skillLower)) {
                    if (!skills[category].includes(skill)) {
                        skills[category].push(skill);
                    }
                }
            });
        });
        
        skills.total = Object.values(skills).reduce((sum, arr) => 
            sum + (Array.isArray(arr) ? arr.length : 0), 0
        );
        
        return skills;
    }
    
    fuzzyMatch(text, keyword) {
        const cleanText = text.replace(/[\s\-_.]/g, '');
        const cleanKeyword = keyword.replace(/[\s\-_.]/g, '');
        return cleanText.includes(cleanKeyword) || cleanKeyword.includes(cleanText);
    }
    
    // 实践经验分析 - 按条目计分
    analyzeExperience(text) {
        // 更精确的实习和项目计数
        const internshipMatches = text.match(/(实习|intern)/gi) || [];
        const projectMatches = text.match(/(项目|project)/gi) || [];
        
        // 通过更复杂的模式识别
        const detailedInternships = text.match(/(公司|企业|集团|科技|有限).*?(实习|intern)/gi) || [];
        const detailedProjects = text.match(/(开发|设计|完成|负责).*?(项目|系统|网站|APP)/gi) || [];
        
        return {
            internshipCount: Math.max(internshipMatches.length, detailedInternships.length),
            projectCount: Math.max(projectMatches.length, detailedProjects.length),
            hasCompanyName: /(有限公司|股份|集团|科技|互联网|腾讯|阿里|百度|字节|美团|京东|华为|小米|网易|滴滴|快手)/i.test(text),
            hasDuration: /(年|月|周|day|week|\d+个月|\d+年)/i.test(text),
            hasAchievement: /(完成|实现|提升|优化|负责|开发|设计|获得|达到)/i.test(text)
        };
    }
    
    // 成就分析 - 每条1分
    analyzeAchievements(text) {
        return {
            scholarshipCount: (text.match(/(奖学金|scholarship|学业奖励)/gi) || []).length,
            competitionCount: (text.match(/(竞赛|比赛|competition|contest|获奖|奖项)/gi) || []).length,
            certificateCount: (text.match(/(证书|证明|认证|certificate|资格证)/gi) || []).length,
            hasLeadership: /(主席|部长|队长|负责人|leader|班长|会长|社长|组长)/i.test(text),
            // 学术成果
            paperCount: this.countPapers(text),
            patentCount: this.countPatents(text),
            softwareCount: this.countSoftware(text)
        };
    }
    
    // 统计论文数量
    countPapers(text) {
        let count = 0;
        
        // 顶级期刊
        count += (text.match(/(Nature|Science|Cell)/gi) || []).length;
        
        // SCI论文
        count += (text.match(/(SCI|JCR|一区|二区|三区|四区)/gi) || []).length;
        
        // EI论文
        count += (text.match(/(EI|conference)/gi) || []).length;
        
        // 一般论文
        count += (text.match(/(论文|发表|期刊|journal|publication)/gi) || []).length;
        
        return Math.min(count, 10); // 限制最大论文数
    }
    
    // 统计专利数量
    countPatents(text) {
        const patents = text.match(/(发明专利|实用新型|外观设计|专利|patent)/gi) || [];
        return Math.min(patents.length, 8); // 限制最大专利数
    }
    
    // 统计软著数量
    countSoftware(text) {
        const software = text.match(/(软件著作权|软著|计算机软件著作权)/gi) || [];
        return Math.min(software.length, 5); // 限制最大软著数
    }
    
    hasGoodStructure(text) {
        const sections = ['教育', '经历', '技能', '项目', '实习', '工作', '学习', '经验'];
        return sections.filter(section => text.includes(section)).length >= 3;
    }
    
    // 计算各项评分 - 新的分数配置
    calculateScores(analysis) {
        return {
            basicInfo: this.scoreBasicInfoDetailed(analysis),
            education: this.scoreEducationDetailed(analysis),
            skills: this.scoreSkillsDetailed(analysis),
            experience: this.scoreExperienceDetailed(analysis),
            achievements: this.scoreAchievementsDetailed(analysis)
        };
    }
    
    // 基本信息评分 (10分) - 新逻辑
    scoreBasicInfoDetailed(analysis) {
        const infoCount = analysis.personalInfo.count;
        const score = Math.min(infoCount * 2, 10); // 每条2分，最高10分
        
        return {
            total: score,
            details: {
                count: infoCount,
                items: analysis.personalInfo.items
            },
            maxScores: { total: 10 }
        };
    }
    
    // 教育背景评分 (25分)
    scoreEducationDetailed(analysis) {
        const details = {};
        let total = 0;
        
        // 学校层次分数（最高15分）
        details.school = Math.min(analysis.education.schoolLevel, 15);
        total += details.school;
        
        // 学业成绩（最高5分）- 按4分制GPA评分
        if (analysis.education.gpa >= 3.7) details.academic = 5;
        else if (analysis.education.gpa >= 3.3) details.academic = 4;
        else if (analysis.education.gpa >= 3.0) details.academic = 3;
        else if (analysis.education.gpa >= 2.7) details.academic = 2;
        else if (analysis.education.hasGPA) details.academic = 1;
        else details.academic = 0;
        total += details.academic;
        
        // 专业匹配度（最高5分）
        if (analysis.education.hasMajor && !analysis.education.isCrossMajor) {
            details.major = 5; // 专业对口
        } else if (analysis.education.hasMajor && analysis.education.isCrossMajor) {
            details.major = 3; // 跨专业
        } else {
            details.major = 1; // 无专业信息
        }
        total += details.major;
        
        return {
            total: Math.min(total, this.maxScores.education),
            details: details,
            maxScores: { school: 15, academic: 5, major: 5 }
        };
    }
    
    // 专业技能评分 (25分) - 每项1分
    scoreSkillsDetailed(analysis) {
        const details = {};
        let total = 0;
        const skills = analysis.skills;
        
        // 每个技能类别按实际数量计分
        details.programming = skills.programming.length;
        total += details.programming;
        
        details.design = skills.design.length;
        total += details.design;
        
        details.data = skills.data.length;
        total += details.data;
        
        details.engineering = skills.engineering.length;
        total += details.engineering;
        
        details.business = skills.business.length;
        total += details.business;
        
        details.language = skills.language.length;
        total += details.language;
        
        return {
            total: Math.min(total, this.maxScores.skills), // 基础分限制25分
            details: details,
            maxScores: { programming: 99, design: 99, data: 99, engineering: 99, business: 99, language: 99 }
        };
    }
    
    // 实践经验评分 (25分) - 按条目计分，不设细项限制
    scoreExperienceDetailed(analysis) {
        const details = {};
        let total = 0;
        const exp = analysis.experience;
        
        // 每个实习/项目基础3分，质量加成最多2分，单条最高5分
        let internshipScore = 0;
        let projectScore = 0;
        
        // 实习评分
        for (let i = 0; i < exp.internshipCount; i++) {
            let itemScore = 3; // 基础分
            if (exp.hasCompanyName) itemScore += 1; // 知名公司加成
            if (exp.hasAchievement) itemScore += 1; // 成果描述加成
            internshipScore += Math.min(itemScore, 5); // 单条最高5分
        }
        
        // 项目评分
        for (let i = 0; i < exp.projectCount; i++) {
            let itemScore = 3; // 基础分
            if (exp.hasDuration) itemScore += 1; // 时间描述加成
            if (exp.hasAchievement) itemScore += 1; // 成果描述加成
            projectScore += Math.min(itemScore, 5); // 单条最高5分
        }
        
        details.internship = internshipScore;
        details.project = projectScore;
        details.quality = 0; // 质量分已经分配到各项中
        
        total = internshipScore + projectScore;
        
        return {
            total: Math.min(total, this.maxScores.experience), // 基础分限制25分
            details: details,
            maxScores: { internship: 99, project: 99, quality: 0 }
        };
    }
    
    // 奖励荣誉评分 (15分) - 每条1分
    scoreAchievementsDetailed(analysis) {
        const details = {};
        let total = 0;
        const ach = analysis.achievements;
        
        // 每项荣誉1分
        details.scholarship = ach.scholarshipCount;
        total += details.scholarship;
        
        details.competition = ach.competitionCount;
        total += details.competition;
        
        details.certificate = ach.certificateCount;
        total += details.certificate;
        
        details.leadership = ach.hasLeadership ? 1 : 0;
        total += details.leadership;
        
        details.paper = ach.paperCount;
        total += details.paper;
        
        details.patent = ach.patentCount;
        total += details.patent;
        
        details.software = ach.softwareCount;
        total += details.software;
        
        return {
            total: Math.min(total, this.maxScores.achievements), // 基础分限制15分
            details: details,
            maxScores: { scholarship: 99, competition: 99, certificate: 99, leadership: 1, paper: 99, patent: 99, software: 99 }
        };
    }
    
    // 岗位推荐 - 考虑专业匹配
    recommendJobs(analysis, specializations = []) {
        const jobs = [];
        const skills = analysis.skills;
        const education = analysis.education;
        
        // 1. 技术开发类
        if (skills.programming && skills.programming.length > 0) {
            let match = Math.min(75 + skills.programming.length * 3, 95);
            // 专业匹配加成
            if (this.isComputerMajor(education)) match += 10;
            
            jobs.push({
                category: '软件开发工程师',
                match: Math.min(match, 100),
                reason: `掌握${skills.programming.slice(0, 3).join('、')}等编程技能${this.isComputerMajor(education) ? '，专业对口' : ''}`
            });
        }
        
        // 2. 数据分析类
        if (skills.data && skills.data.length > 0) {
            let match = Math.min(70 + skills.data.length * 4, 90);
            if (this.isDataMajor(education)) match += 10;
            
            jobs.push({
                category: '数据分析师',
                match: Math.min(match, 100),
                reason: `具备${skills.data.slice(0, 3).join('、')}等数据处理能力${this.isDataMajor(education) ? '，专业对口' : ''}`
            });
        }
        
        // 3. 产品设计类
        if (skills.design && skills.design.length > 0) {
            let match = Math.min(65 + skills.design.length * 5, 88);
            if (this.isDesignMajor(education)) match += 10;
            
            jobs.push({
                category: '产品设计师',
                match: Math.min(match, 100),
                reason: `熟练使用${skills.design.slice(0, 3).join('、')}等设计工具${this.isDesignMajor(education) ? '，专业对口' : ''}`
            });
        }
        
        // 4. 工程技术类
        if (skills.engineering && skills.engineering.length > 0) {
            let match = Math.min(60 + skills.engineering.length * 6, 85);
            if (this.isEngineeringMajor(education)) match += 15;
            
            jobs.push({
                category: '工程技术岗位',
                match: Math.min(match, 100),
                reason: `掌握${skills.engineering.slice(0, 3).join('、')}等工程技术${this.isEngineeringMajor(education) ? '，专业对口' : ''}`
            });
        }
        
        // 5. 金融商务类
        if (skills.business && skills.business.length > 0) {
            let match = Math.min(60 + skills.business.length * 4, 85);
            if (this.isBusinessMajor(education)) match += 15;
            
            jobs.push({
                category: '商务金融',
                match: Math.min(match, 100),
                reason: `具备商业思维和相关技能${this.isBusinessMajor(education) ? '，专业对口' : ''}`
            });
        }
        
        // 6. 学术研究类
        const academicSignals = this.detectAcademicOrientation(analysis);
        if (academicSignals.score > 0) {
            jobs.push({
                category: '学术研究/高校教师',
                match: Math.min(60 + academicSignals.score, 95),
                reason: academicSignals.reason
            });
        }
        
        // 7. 专精加成推荐
        specializations.forEach(spec => {
            if (spec.type === 'skills' && spec.level >= 30) {
                jobs.push({
                    category: '技术专家',
                    match: 95,
                    reason: `技能专精（掌握${spec.level}项技术）`
                });
            }
            if (spec.type === 'achievements' && spec.level >= 10) {
                jobs.push({
                    category: '博士研究生/科研助理',
                    match: 92,
                    reason: `学术能力突出（${spec.level}项学术成果）`
                });
            }
        });
        
        // 8. 跨专业推荐
        if (education.isCrossMajor) {
            jobs.push({
                category: '复合型岗位',
                match: 70,
                reason: '跨专业背景，适合需要复合能力的岗位'
            });
        }
        
        // 9. 兜底推荐
        if (jobs.length === 0) {
            if (education.schoolLevel >= 11) {
                jobs.push({
                    category: '知名企业管培生',
                    match: 75,
                    reason: '名校背景，适合大企业培养计划'
                });
            } else {
                jobs.push({
                    category: '管理培训生',
                    match: 60,
                    reason: '适合全面发展的应届毕业生'
                });
            }
        }
        
        // 去重并排序
        const uniqueJobs = jobs.filter((job, index, self) => 
            index === self.findIndex(j => j.category === job.category)
        );
        
        return uniqueJobs.sort((a, b) => b.match - a.match).slice(0, 4);
    }
    
    // 专业匹配检测函数
    isComputerMajor(education) {
        const computerKeywords = ['计算机', '软件', '信息', '网络', '数据', '人工智能', 'AI'];
        return education.degrees.some(degree => 
            computerKeywords.some(keyword => degree.text.includes(keyword))
        );
    }
    
    isDataMajor(education) {
        const dataKeywords = ['数据', '统计', '数学', '信息', '分析'];
        return education.degrees.some(degree => 
            dataKeywords.some(keyword => degree.text.includes(keyword))
        );
    }
    
    isDesignMajor(education) {
        const designKeywords = ['设计', '美术', '艺术', '视觉', '交互'];
        return education.degrees.some(degree => 
            designKeywords.some(keyword => degree.text.includes(keyword))
        );
    }
    
    isEngineeringMajor(education) {
        const engineeringKeywords = ['工程', '机械', '电子', '自动化', '材料', '化工', '土木', '建筑'];
        return education.degrees.some(degree => 
            engineeringKeywords.some(keyword => degree.text.includes(keyword))
        );
    }
    
    isBusinessMajor(education) {
        const businessKeywords = ['经济', '管理', '金融', '会计', '市场', '商务', '工商', '财务'];
        return education.degrees.some(degree => 
            businessKeywords.some(keyword => degree.text.includes(keyword))
        );
    }
    // 检测学术导向
    detectAcademicOrientation(analysis) {
        let score = 0;
        let reasons = [];
        
        // 学历指标
        if (analysis.education.degrees && analysis.education.degrees.some(d => d.degree === 'master')) {
            score += 15;
            reasons.push('研究生学历');
        }
        if (analysis.education.degrees && analysis.education.degrees.some(d => d.degree === 'phd')) {
            score += 25;
            reasons.push('博士学历');
        }
        
        // 学校层次加成
        if (analysis.education.schoolLevel >= 13) {
            score += 10;
            reasons.push('顶尖大学背景');
        } else if (analysis.education.schoolLevel >= 11) {
            score += 8;
            reasons.push('一流大学背景');
        }
        
        // GPA指标
        if (analysis.education.gpa >= 3.7) {
            score += 10;
            reasons.push('优秀学术成绩');
        }
        
        // 学术成果指标
        if (analysis.achievements.competitionCount >= 2) {
            score += 8;
            reasons.push('多项学术竞赛获奖');
        }
        if (analysis.achievements.scholarshipCount >= 2) {
            score += 8;
            reasons.push('多次获得奖学金');
        }
        if (analysis.achievements.paperCount >= 1) {
            score += 15;
            reasons.push('有论文发表经历');
        }
        if (analysis.achievements.patentCount >= 1) {
            score += 10;
            reasons.push('有专利申请经历');
        }
        
        return {
            score: score,
            reason: reasons.length > 0 ? reasons.join('，') + '，适合学术研究发展' : ''
        };
    }
    
    // 生成建议 - 关注全面性和丰富度
    generateSuggestions(scores, analysis) {
        const suggestions = [];
        
        const basicScore = typeof scores.basicInfo === 'object' ? scores.basicInfo.total : scores.basicInfo;
        const eduScore = typeof scores.education === 'object' ? scores.education.total : scores.education;
        const skillScore = typeof scores.skills === 'object' ? scores.skills.total : scores.skills;
        const expScore = typeof scores.experience === 'object' ? scores.experience.total : scores.experience;
        const achScore = typeof scores.achievements === 'object' ? scores.achievements.total : scores.achievements;
        
        // 基于基础分的全面性建议
        if (basicScore < 8) {
            suggestions.push('完善个人信息，确保联系方式、个人背景等信息完整准确');
        }
        
        if (eduScore < 20) {
            if (!analysis.education.hasGPA) {
                suggestions.push('建议添加GPA或专业排名信息，展示学术表现');
            }
            if (!analysis.education.hasMajor) {
                suggestions.push('明确专业信息，突出专业相关性');
            }
            suggestions.push('突出学校优势或专业特色');
        }
        
        if (skillScore < 15) {
            suggestions.push('充实技能描述，增加与目标岗位相关的技能');
            suggestions.push('考虑获得相关技能认证或证书');
        }
        
        if (expScore < 15) {
            suggestions.push('积累更多实习或项目经验');
            suggestions.push('详细描述项目成果和个人贡献');
        }
        
        if (achScore < 8) {
            suggestions.push('积极参加学术竞赛或获得奖学金');
            suggestions.push('争取担任学生干部或参与社团活动');
        }
        
        // 专业化建议
        if (analysis.education.isCrossMajor) {
            suggestions.push('突出跨专业背景的优势，展示复合能力和学习适应性');
        }
        
        // 特殊建议
        if (analysis.education.schoolLevel >= 13) {
            suggestions.push('充分利用名校背景，可考虑申请知名企业或继续深造');
        }
        
        // 学术导向建议
        if (analysis.achievements.paperCount > 0 || analysis.achievements.competitionCount >= 3) {
            suggestions.push('考虑学术研究方向发展，申请研究生或科研岗位');
        }
        
        // 技能专精建议
        const topSkills = Object.entries(analysis.skills)
            .filter(([key, value]) => Array.isArray(value) && value.length >= 3)
            .sort(([,a], [,b]) => b.length - a.length);
            
        if (topSkills.length > 0) {
            const [skillType] = topSkills[0];
            const skillNames = {
                'programming': '编程开发',
                'data': '数据分析',
                'design': '设计创作',
                'engineering': '工程技术',
                'business': '商务管理'
            };
            suggestions.push(`继续深化${skillNames[skillType] || skillType}技能，争取成为该领域专精人才`);
        }
        
        // 经验丰富度建议
        if (analysis.experience.internshipCount >= 3 || analysis.experience.projectCount >= 5) {
            suggestions.push('实践经验丰富，建议突出核心项目和关键成果，提升经验质量');
        }
        
        if (suggestions.length === 0) {
            suggestions.push('简历内容丰富全面！建议针对不同岗位进行定制化调整，突出相关性');
        }
        
        return suggestions;
    }
}

// 导出为全局变量（兼容性）
window.ResumeParser = ResumeParser;
window.ResumeScorer = ResumeScorer;

// 如果是模块环境，也导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ResumeParser, ResumeScorer };
}
