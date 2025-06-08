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

// 简历评分器 - 优化版
class ResumeScorer {
    constructor() {
        this.maxScores = {
            basicInfo: 10,
            education: 25,
            skills: 25,
            experience: 25,
            achievements: 15
        };
        
        // 学校分级体系 - 基于高考分数线重新分类
        this.schoolRanks = {
            // TOP顶尖（15分）- 仅清华北大
            topTier: [
                '清华大学', '北京大学', '清华', '北大'
            ],
            
            // 顶尖985（13分）- 稳定前10
            tier1A: [
                '复旦大学', '上海交通大学', '浙江大学', '中国科学技术大学', '南京大学',
                '中国人民大学', '北京航空航天大学', '北京理工大学',
                '中国科学院大学', '南方科技大学',
                '复旦', '交大', '浙大', '中科大', '南大', '人大', '北航', '北理工', '国科大', '南科大'
            ],
            
            // 优秀985（11分）- 前15-20名
            tier1B: [
                '西安交通大学', '哈尔滨工业大学', '华中科技大学', '同济大学',
                '东南大学', '天津大学', '北京师范大学', '南开大学',
                '中山大学', '西北工业大学', '华东师范大学',
                '西交', '哈工大', '华科', '同济', '东南', '天大', '北师大', '南开',
                '中大', '西工大', '华师大'
            ],
            
            // 普通985+顶尖211（9分）
            tier2A: [
                '中南大学', '电子科技大学', '重庆大学', '大连理工大学', '吉林大学',
                '厦门大学', '山东大学', '华南理工大学', '湖南大学', '东北大学',
                '兰州大学', '中国农业大学', '中国海洋大学', '西北农林科技大学',
                '北京邮电大学', '华东理工大学', '西安电子科技大学', '北京科技大学',
                '上海财经大学', '对外经济贸易大学', '中央财经大学',
                '中南', '电子科大', '重大', '大工', '吉大', '厦大', '山大', '华工',
                '湖大', '东北大学', '兰大', '中农', '中海洋', '西农', '北邮', '华理',
                '西电', '北科', '上财', '对外经贸', '央财'
            ],
            
            // 普通211（7分）
            tier2B: [
                '北京交通大学', '北京工业大学', '北京化工大学', '中国石油大学', '中国地质大学',
                '中国矿业大学', '河海大学', '江南大学', '南京理工大学', '南京航空航天大学',
                '安徽大学', '合肥工业大学', '福州大学', '南昌大学', '郑州大学',
                '湖南师范大学', '暨南大学', '广西大学', '海南大学', '四川大学',
                '西南交通大学', '贵州大学', '云南大学', '西北大学', '长安大学',
                '华中农业大学', '南京农业大学', '中国药科大学', '北京中医药大学',
                '中国传媒大学', '北京外国语大学', '上海外国语大学'
            ],
            
            // 省属重点+双一流学科（5分）
            tier3: [
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
            engineering: [
                'CAD', 'AutoCAD', 'SolidWorks', 'Pro/E', 'UG', 'CATIA', 'Inventor',
                'ANSYS', 'ABAQUS', 'COMSOL', '有限元', '仿真', '建模', '测试', '实验设计',
                'LabVIEW', 'Altium Designer', 'Keil', 'Quartus', 'Vivado', 'FPGA'
            ]
        };
    }
    
    // 检测专精类型
    detectSpecialization(analysis) {
        const specializations = [];
        const skills = analysis.skills;
        
        // 技能专精检测
        if (skills.programming && skills.programming.length >= 6) {
            specializations.push({
                type: 'programming',
                category: 'skill',
                level: skills.programming.length,
                bonus: Math.min(skills.programming.length - 5, 8),
                description: `编程开发专精 (掌握${skills.programming.length}项技术)`
            });
        }
        
        if (skills.data && skills.data.length >= 4) {
            specializations.push({
                type: 'data',
                category: 'skill',
                level: skills.data.length,
                bonus: Math.min(skills.data.length - 3, 6),
                description: `数据分析专精 (掌握${skills.data.length}项技术)`
            });
        }
        
        if (skills.design && skills.design.length >= 4) {
            specializations.push({
                type: 'design',
                category: 'skill',
                level: skills.design.length,
                bonus: Math.min(skills.design.length - 3, 6),
                description: `设计创作专精 (掌握${skills.design.length}项技术)`
            });
        }
        
        if (skills.engineering && skills.engineering.length >= 4) {
            specializations.push({
                type: 'engineering',
                category: 'skill',
                level: skills.engineering.length,
                bonus: Math.min(skills.engineering.length - 3, 6),
                description: `工程技术专精 (掌握${skills.engineering.length}项技术)`
            });
        }
        
        // 教育专精检测
        const educationSpec = this.detectEducationSpecialization(analysis.education);
        if (educationSpec.bonus > 0) {
            specializations.push(educationSpec);
        }
        
        // 学术成果专精检测
        const academicSpec = this.detectAcademicSpecialization(analysis);
        if (academicSpec.bonus > 0) {
            specializations.push(academicSpec);
        }
        
        // 实践专精检测
        if (analysis.experience.internshipCount >= 4) {
            specializations.push({
                type: 'internship',
                category: 'experience',
                level: analysis.experience.internshipCount,
                bonus: Math.min(analysis.experience.internshipCount - 3, 5),
                description: `实习专精 (${analysis.experience.internshipCount}次实习经历)`
            });
        }
        
        if (analysis.experience.projectCount >= 5) {
            specializations.push({
                type: 'project',
                category: 'experience',
                level: analysis.experience.projectCount,
                bonus: Math.min(analysis.experience.projectCount - 4, 5),
                description: `项目专精 (${analysis.experience.projectCount}个项目经验)`
            });
        }
        
        // 竞赛专精检测
        const competitionSpec = this.detectCompetitionSpecialization(analysis.achievements);
        if (competitionSpec.bonus > 0) {
            specializations.push(competitionSpec);
        }
        
        return specializations;
    }
    
    // 检测教育专精
    detectEducationSpecialization(education) {
        let bonus = 0;
        let descriptions = [];
        
        if (education.degrees && education.degrees.length > 0) {
            education.degrees.forEach(degree => {
                if (degree.degree === 'phd') {
                    bonus += 5;
                    descriptions.push('博士学位');
                } else if (degree.degree === 'master') {
                    bonus += 3;
                    descriptions.push('硕士学位');
                } else if (degree.degree === 'bachelor') {
                    bonus += 1;
                    descriptions.push('本科学位');
                }
            });
            
            // 多学位加分
            if (education.degrees.length > 1) {
                const extraDegrees = education.degrees.length - 1;
                bonus += extraDegrees * 2;
                descriptions.push(`多学位(+${extraDegrees}个)`);
            }
        }
        
        return {
            type: 'education',
            category: 'education',
            level: education.degrees ? education.degrees.length : 0,
            bonus: bonus,
            description: `教育专精 (${descriptions.join('、')})`
        };
    }
    
    // 检测学术成果专精
    detectAcademicSpecialization(analysis) {
        let bonus = 0;
        let papers = [];
        const text = analysis.originalText || '';
        
        // 期刊论文检测
        const paperPatterns = {
            nature: { pattern: /(nature|science)/i, score: 5, name: 'Nature/Science' },
            jcr1: { pattern: /(JCR.*?[一1]区|影响因子.*?[5-9]\d*|IF.*?[5-9])/i, score: 4, name: 'JCR一区' },
            sci: { pattern: /(SCI|sci)/i, score: 3, name: 'SCI期刊' },
            ei: { pattern: /(EI|ei)/i, score: 2, name: 'EI期刊' },
            chinese: { pattern: /(核心期刊|中文期刊)/i, score: 1, name: '中文期刊' }
        };
        
        Object.values(paperPatterns).forEach(pattern => {
            const matches = text.match(new RegExp(pattern.pattern.source, 'gi'));
            if (matches) {
                const count = matches.length;
                bonus += pattern.score * count;
                papers.push(`${pattern.name}(${count}篇)`);
            }
        });
        
        return {
            type: 'academic',
            category: 'academic',
            level: papers.length,
            bonus: bonus,
            description: papers.length > 0 ? `学术成果专精 (${papers.join('、')})` : ''
        };
    }
    
    // 检测竞赛专精
    detectCompetitionSpecialization(achievements) {
        let bonus = 0;
        let descriptions = [];
        
        // 国际竞赛
        if (achievements.internationalCompetitions > 0) {
            bonus += achievements.internationalCompetitions * 3;
            descriptions.push(`国际竞赛${achievements.internationalCompetitions}项`);
        }
        
        // 国家级A类竞赛
        if (achievements.nationalCompetitions > 0) {
            bonus += achievements.nationalCompetitions * 2;
            descriptions.push(`国家级竞赛${achievements.nationalCompetitions}项`);
        }
        
        // 连续获奖加分
        if (achievements.competitionCount >= 3) {
            bonus += 2;
            descriptions.push('连续获奖');
        }
        
        return {
            type: 'competition',
            category: 'achievement',
            level: achievements.competitionCount,
            bonus: bonus,
            description: descriptions.length > 0 ? `竞赛专精 (${descriptions.join('、')})` : ''
        };
    }
    
    // 简历分析
    analyzeResume(text) {
        const basicInfo = this.analyzeBasicInfo(text);
        const education = this.analyzeEducation(text);
        const skills = this.analyzeSkills(text);
        const experience = this.analyzeExperience(text);
        const achievements = this.analyzeAchievements(text);
        
        return {
            originalText: text,
            basicInfo: basicInfo,
            education: education,
            skills: skills,
            experience: experience,
            achievements: achievements,
            wordCount: text.length,
            hasStructure: this.hasGoodStructure(text)
        };
    }
    
    // 基本信息分析
    analyzeBasicInfo(text) {
        const info = {};
        let count = 0;
        
        // 姓名
        if (this.hasName(text)) {
            info.name = true;
            count++;
        }
        
        // 电话
        if (/1[3-9]\d{9}/.test(text)) {
            info.phone = true;
            count++;
        }
        
        // 邮箱
        if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) {
            info.email = true;
            count++;
        }
        
        // 地址
        if (/(市|省|区|县|路|街|号|意向|求职)/.test(text)) {
            info.address = true;
            count++;
        }
        
        // 求职意向
        if (/(求职|应聘|岗位|职位|意向)/.test(text)) {
            info.intention = true;
            count++;
        }
        
        // GitHub/网站
        if (/(github|gitlab|个人网站|博客|portfolio)/i.test(text)) {
            info.website = true;
            count++;
        }
        
        // 社交账号
        if (/(linkedin|微博|知乎)/i.test(text)) {
            info.social = true;
            count++;
        }
        
        // 出生日期
        if (/(出生|生日|\d{4}年\d{1,2}月)/.test(text)) {
            info.birthday = true;
            count++;
        }
        
        // 政治面貌
        if (/(党员|团员|群众|政治面貌)/.test(text)) {
            info.political = true;
            count++;
        }
        
        return { ...info, count: count };
    }
    
    hasName(text) {
        const namePatterns = [
            /姓名[：:]\s*([^\s\n]{2,4})/,
            /^([^\s\n]{2,4})$/m,
            /(个人简历|简历)/
        ];
        return namePatterns.some(pattern => pattern.test(text)) || text.length > 50;
    }
    
    // 教育背景分析
    analyzeEducation(text) {
        const education = {
            schoolLevel: 0,
            hasGPA: /GPA|绩点|平均分|成绩/.test(text),
            gpa: this.extractGPA(text),
            hasMajor: /(专业|学院|系|计算机|软件|电子|机械|经济|金融|管理|文学|理学|工学|医学|法学|教育学|艺术学|农学)/.test(text),
            degrees: this.extractDegrees(text),
            majorMatch: this.analyzeMajorMatch(text)
        };
        
        education.schoolLevel = this.calculateSchoolScore(text, education.degrees);
        
        return education;
    }
    
    // 专业匹配分析
    analyzeMajorMatch(text) {
        const majors = this.extractMajors(text);
        
        if (majors.length === 0) {
            return { score: 1, type: 'no_major' };
        } else if (majors.length === 1) {
            return { score: 5, type: 'consistent' };
        } else {
            // 检查是否跨专业
            const isCrossMajor = this.detectCrossMajor(majors);
            return { 
                score: isCrossMajor ? 3 : 5, 
                type: isCrossMajor ? 'cross_major' : 'consistent',
                majors: majors
            };
        }
    }
    
    extractMajors(text) {
        const majorPatterns = [
            /专业[：:]\s*([^\s\n]+)/g,
            /(计算机|软件|电子|机械|经济|金融|管理|文学|理学|工学|医学|法学|教育学|艺术学|农学)[^\s\n]*专业/g
        ];
        
        const majors = [];
        majorPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                majors.push(match[1] || match[0]);
            }
        });
        
        return [...new Set(majors)]; // 去重
    }
    
    detectCrossMajor(majors) {
        // 简单的跨专业检测逻辑
        const categories = {
            tech: ['计算机', '软件', '电子', '信息', '通信'],
            business: ['经济', '金融', '管理', '商务'],
            engineering: ['机械', '土木', '化工', '材料'],
            science: ['数学', '物理', '化学', '生物']
        };
        
        const majorCategories = majors.map(major => {
            for (let [category, keywords] of Object.entries(categories)) {
                if (keywords.some(keyword => major.includes(keyword))) {
                    return category;
                }
            }
            return 'other';
        });
        
        return new Set(majorCategories).size > 1;
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
            ...this.schoolRanks.tier2A,
            ...this.schoolRanks.tier2B,
            ...this.schoolRanks.tier3
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
    
    // 计算学校评分
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
            finalScore = this.getSchoolRankScore(sortedDegrees[0].school);
        } else {
            const firstDegree = sortedDegrees[0];
            const highestDegree = sortedDegrees[sortedDegrees.length - 1];
            
            const firstScore = this.getSchoolRankScore(firstDegree.school);
            const highestScore = this.getSchoolRankScore(highestDegree.school);
            
            finalScore = Math.round(firstScore * 0.5 + highestScore * 0.5);
        }
        
        return Math.min(finalScore, 15);
    }
    
    getSchoolRankScore(schoolName) {
        if (!schoolName) return 2;
        
        const normalizedName = schoolName
            .replace(/大学$/, '')
            .replace(/学院$/, '')
            .replace(/科技$/, '')
            .replace(/理工$/, '');
        
        if (this.schoolRanks.topTier.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 15;
        }
        
        if (this.schoolRanks.tier1A.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 13;
        }
        
        if (this.schoolRanks.tier1B.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 11;
        }
        
        if (this.schoolRanks.tier2A.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 9;
        }
        
        if (this.schoolRanks.tier2B.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 7;
        }
        
        if (this.schoolRanks.tier3.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 5;
        }
        
        if (/(大学|学院)/i.test(schoolName)) {
            if (/(985|211|双一流|重点)/i.test(schoolName)) return 6;
            return 3;
        }
        
        if (/(专科|高职)/i.test(schoolName)) return 1;
        
        return 2;
    }
    
    matchSchoolName(name1, name2) {
        if (!name1 || !name2) return false;
        
        if (name1.includes(name2) || name2.includes(name1)) return true;
        
        const simple1 = name1.replace(/[大学院科技理工]/g, '');
        const simple2 = name2.replace(/[大学院科技理工]/g, '');
        
        return simple1.length >= 2 && simple2.length >= 2 && 
               (simple1.includes(simple2) || simple2.includes(simple1));
    }
    
    getBasicSchoolScore(text) {
        if (/(清华|北大)/i.test(text)) return 15;
        if (/(复旦|交大|浙大|中科大|南大)/i.test(text)) return 13;
        if (/(985)/i.test(text)) return 11;
        if (/(211|双一流)/i.test(text)) return 9;
        if (/(重点大学)/i.test(text)) return 7;
        if (/(大学|学院)/i.test(text)) return 3;
        if (/(专科|高职)/i.test(text)) return 1;
        
        return 2;
    }
    
    extractGPA(text) {
        const gpaMatch = text.match(/GPA[：:\s]*([0-9.]+)/i) || 
                        text.match(/绩点[：:\s]*([0-9.]+)/) ||
                        text.match(/平均分[：:\s]*([0-9.]+)/);
        if (gpaMatch) {
            const gpa = parseFloat(gpaMatch[1]);
            if (gpa > 5) return gpa / 25; // 百分制转4分制
            if (gpa > 4) return gpa * 0.8; // 5分制转4分制
            return gpa; // 已是4分制
        }
        return 0;
    }
    
    // 技能识别
    analyzeSkills(text) {
        const skills = {
            programming: [],
            design: [],
            data: [],
            business: [],
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
    
    analyzeExperience(text) {
        return {
            internshipCount: Math.max((text.match(/实习|intern/gi) || []).length, 
                                    (text.match(/(公司|企业|集团|科技|有限).*?(实习|intern)/gi) || []).length),
            projectCount: Math.max((text.match(/项目|project/gi) || []).length,
                                 (text.match(/(开发|设计|完成|负责).*?(项目|系统|网站|APP)/gi) || []).length),
            hasCompanyName: /(有限公司|股份|集团|科技|互联网|腾讯|阿里|百度|字节|美团|京东|华为|小米|网易|滴滴|快手)/i.test(text),
            hasDuration: /(年|月|周|day|week|\d+个月|\d+年)/i.test(text),
            hasAchievement: /(完成|实现|提升|优化|负责|开发|设计|获得|达到)/i.test(text)
        };
    }
    
    analyzeAchievements(text) {
        const scholarshipCount = (text.match(/(奖学金|scholarship|学业奖励)/gi) || []).length;
        const honorCount = (text.match(/(荣誉|表彰|优秀|先进|模范)/gi) || []).length;
        const competitionCount = (text.match(/(竞赛|比赛|competition|contest|获奖|奖项)/gi) || []).length;
        const certificateCount = (text.match(/(证书|证明|认证|certificate|资格证)/gi) || []).length;
        const hasLeadership = /(主席|部长|队长|负责人|leader|班长|会长|社长|组长)/i.test(text);
        
        // 检测国际和国家级竞赛
        const internationalCompetitions = (text.match(/(国际|international|world|global).*?(竞赛|比赛|competition)/gi) || []).length;
        const nationalCompetitions = (text.match(/(国家级|national|全国).*?(竞赛|比赛|competition)/gi) || []).length;
        
        return {
            scholarshipCount: scholarshipCount,
            honorCount: honorCount,
            competitionCount: competitionCount,
            certificateCount: certificateCount,
            hasLeadership: hasLeadership,
            internationalCompetitions: internationalCompetitions,
            nationalCompetitions: nationalCompetitions
        };
    }
    
    hasGoodStructure(text) {
        const sections = ['教育', '经历', '技能', '项目', '实习', '工作', '学习', '经验'];
        return sections.filter(section => text.includes(section)).length >= 3;
    }
    
    // 主要评分函数
    scoreResume(text) {
        const analysis = this.analyzeResume(text);
        const baseScores = this.calculateScores(analysis);
        
        const specializations = this.detectSpecialization(analysis);
        
        const baseTotalScore = Math.min(
            Object.values(baseScores).reduce((sum, scoreObj) => {
                return sum + (typeof scoreObj === 'object' ? scoreObj.total : scoreObj);
            }, 0),
            100
        );
        
        const specializationBonus = specializations.reduce((sum, spec) => sum + spec.bonus, 0);
        const finalTotalScore = baseTotalScore + specializationBonus;
        
        const suggestions = this.generateSuggestions(baseScores, analysis);
        const jobRecommendations = this.recommendJobs(analysis, specializations);
        
        return {
            baseScore: Math.round(baseTotalScore),
            specializationBonus: specializationBonus,
            totalScore: Math.round(finalTotalScore),
            categoryScores: baseScores,
            analysis: analysis,
            specializations: specializations,
            suggestions: suggestions,
            jobRecommendations: jobRecommendations
        };
    }
    
    // 计算各项评分
    calculateScores(analysis) {
        return {
            basicInfo: this.scoreBasicInfoDetailed(analysis),
            education: this.scoreEducationDetailed(analysis),
            skills: this.scoreSkillsDetailed(analysis),
            experience: this.scoreExperienceDetailed(analysis),
            achievements: this.scoreAchievementsDetailed(analysis)
        };
    }
    
    // 基本信息评分 - 每有一条得2分，满5条得满分
    scoreBasicInfoDetailed(analysis) {
        const count = analysis.basicInfo.count;
        const total = Math.min(count * 2, this.maxScores.basicInfo);
        
        return {
            total: total,
            details: analysis.basicInfo,
            maxScore: this.maxScores.basicInfo
        };
    }
    
    // 教育背景评分
    scoreEducationDetailed(analysis) {
        const details = {};
        let total = 0;
        
        // 学校层次分数（最高15分）
        details.school = Math.min(analysis.education.schoolLevel, 15);
        total += details.school;
        
        // 学业成绩（最高5分）- 标准化为4分制
        const gpa4 = analysis.education.gpa;
        if (gpa4 >= 3.7) details.academic = 5;
        else if (gpa4 >= 3.3) details.academic = 4;
        else if (gpa4 >= 2.7) details.academic = 3;
        else if (gpa4 >= 2.0) details.academic = 2;
        else if (analysis.education.hasGPA) details.academic = 1;
        else details.academic = 0;
        total += details.academic;
        
        // 专业匹配（最高5分）
        details.major = analysis.education.majorMatch.score;
        total += details.major;
        
        return {
            total: Math.min(total, this.maxScores.education),
            details: details,
            maxScores: { school: 15, academic: 5, major: 5 }
        };
    }
    
    // 技能评分 - 每个类别最高5分
    scoreSkillsDetailed(analysis) {
        const details = {};
        let total = 0;
        const skills = analysis.skills;
        
        // 编程技能（最高5分）
        details.programming = Math.min(skills.programming.length, 5);
        total += details.programming;
        
        // 设计技能（最高5分）
        details.design = Math.min(skills.design.length, 5);
        total += details.design;
        
        // 数据分析（最高5分）
        details.data = Math.min(skills.data.length, 5);
        total += details.data;
        
        // 工程技能（最高5分）
        details.engineering = Math.min(skills.engineering.length, 5);
        total += details.engineering;
        
        // 商务技能（最高5分）
        details.business = Math.min(skills.business.length, 5);
        total += details.business;
        
        return {
            total: Math.min(total, this.maxScores.skills),
            details: details,
            maxScores: { programming: 5, design: 5, data: 5, engineering: 5, business: 5 }
        };
    }
    
    // 经验评分 - 灵活计分制度
    scoreExperienceDetailed(analysis) {
        const exp = analysis.experience;
        let total = 0;
        
        // 实习经历：每次3分基础分 + 成果描述1分 + 知名公司1分
        const internshipScore = exp.internshipCount * 3;
        const internshipBonus = exp.hasAchievement ? exp.internshipCount : 0;
        const internshipCompanyBonus = exp.hasCompanyName ? exp.internshipCount : 0;
        
        // 项目经验：每个3分基础分 + 成果描述1分 + 高水平项目1分
        const projectScore = exp.projectCount * 3;
        const projectBonus = exp.hasAchievement ? exp.projectCount : 0;
        const projectQualityBonus = exp.hasDuration ? exp.projectCount : 0;
        
        total = internshipScore + internshipBonus + internshipCompanyBonus + 
                projectScore + projectBonus + projectQualityBonus;
        
        return {
            total: Math.min(total, this.maxScores.experience),
            details: {
                internship: internshipScore + internshipBonus + internshipCompanyBonus,
                project: projectScore + projectBonus + projectQualityBonus,
                quality: (exp.hasAchievement ? 1 : 0) + (exp.hasCompanyName ? 1 : 0) + (exp.hasDuration ? 1 : 0)
            },
            maxScore: this.maxScores.experience
        };
    }
    
    // 奖励荣誉评分
    scoreAchievementsDetailed(analysis) {
        const details = {};
        let total = 0;
        const ach = analysis.achievements;
        
        // 奖学金和荣誉（最高6分）
        const scholarshipHonorScore = Math.min((ach.scholarshipCount + ach.honorCount) * 1.5, 6);
        details.scholarshipHonor = scholarshipHonorScore;
        total += scholarshipHonorScore;
        
        // 竞赛获奖（最高6分）
        details.competition = Math.min(ach.competitionCount * 2, 6);
        total += details.competition;
        
        // 证书认证（最高2分）
        details.certificate = Math.min(ach.certificateCount * 0.5, 2);
        total += details.certificate;
        
        // 领导经历（最高1分）
        details.leadership = ach.hasLeadership ? 1 : 0;
        total += details.leadership;
        
        return {
            total: Math.min(total, this.maxScores.achievements),
            details: details,
            maxScores: { scholarshipHonor: 6, competition: 6, certificate: 2, leadership: 1 }
        };
    }
    
    // 岗位推荐
    recommendJobs(analysis, specializations = []) {
        const jobs = [];
        const skills = analysis.skills;
        const education = analysis.education;
        
        // 根据专业背景调整推荐
        const majorJobMatch = this.calculateMajorJobMatch(analysis.education, skills);
        
        // 1. 技术开发类
        if (skills.programming && skills.programming.length > 0) {
            jobs.push({
                category: '软件开发工程师',
                match: Math.min(75 + skills.programming.length * 3, 95) * majorJobMatch.tech,
                reason: `掌握${skills.programming.slice(0, 3).join('、')}等编程技能`
            });
        }
        
        // 2. 数据分析类
        if (skills.data && skills.data.length > 0) {
            jobs.push({
                category: '数据分析师',
                match: Math.min(70 + skills.data.length * 4, 90) * majorJobMatch.data,
                reason: `具备${skills.data.slice(0, 3).join('、')}等数据处理能力`
            });
        }
        
        // 3. 产品设计类
        if (skills.design && skills.design.length > 0) {
            jobs.push({
                category: '产品设计师',
                match: Math.min(65 + skills.design.length * 5, 88) * majorJobMatch.design,
                reason: `熟练使用${skills.design.slice(0, 3).join('、')}等设计工具`
            });
        }
        
        // 4. 工程技术类
        if (skills.engineering && skills.engineering.length > 0) {
            jobs.push({
                category: '工程技术岗位',
                match: Math.min(60 + skills.engineering.length * 6, 85) * majorJobMatch.engineering,
                reason: `掌握${skills.engineering.slice(0, 3).join('、')}等工程技术`
            });
        }
        
        // 5. 商务运营类
        if (skills.business && skills.business.length > 0 || analysis.experience.internshipCount > 0) {
            jobs.push({
                category: '商务运营',
                match: Math.min(60 + analysis.experience.internshipCount * 5, 85) * majorJobMatch.business,
                reason: '具备商业思维和实习经验'
            });
        }
        
        // 6. 专精加成推荐
        specializations.forEach(spec => {
            if (spec.type === 'programming' && spec.level >= 6) {
                jobs.push({
                    category: '高级软件工程师',
                    match: 90,
                    reason: `编程技能专精（掌握${spec.level}项技术）`
                });
            }
            if (spec.type === 'academic' && spec.level >= 3) {
                jobs.push({
                    category: '研发工程师/科研助理',
                    match: 88,
                    reason: `学术能力突出（${spec.description}）`
                });
            }
        });
        
        // 7. 兜底推荐
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
    
    // 计算专业-岗位匹配度
    calculateMajorJobMatch(education, skills) {
        const majorText = education.majorMatch.majors ? 
            education.majorMatch.majors.join(' ').toLowerCase() : '';
        
        const matchFactors = {
            tech: 1.0,     // 默认匹配度
            data: 1.0,
            design: 1.0,
            engineering: 1.0,
            business: 1.0
        };
        
        // 根据专业调整匹配度
        if (/(计算机|软件|信息|电子|通信)/.test(majorText)) {
            matchFactors.tech = 1.0;
            matchFactors.data = 0.9;
            matchFactors.engineering = 0.8;
            matchFactors.design = 0.7;
            matchFactors.business = 0.6;
        } else if (/(经济|金融|管理|商务)/.test(majorText)) {
            matchFactors.business = 1.0;
            matchFactors.data = 0.8;
            matchFactors.tech = 0.6;
            matchFactors.design = 0.6;
            matchFactors.engineering = 0.4;
        } else if (/(设计|艺术|美术)/.test(majorText)) {
            matchFactors.design = 1.0;
            matchFactors.business = 0.7;
            matchFactors.tech = 0.6;
            matchFactors.data = 0.5;
            matchFactors.engineering = 0.4;
        } else if (/(机械|土木|化工|材料)/.test(majorText)) {
            matchFactors.engineering = 1.0;
            matchFactors.tech = 0.7;
            matchFactors.data = 0.6;
            matchFactors.design = 0.5;
            matchFactors.business = 0.5;
        }
        
        return matchFactors;
    }
    
    // 生成建议
    generateSuggestions(scores, analysis) {
        const suggestions = [];
        
        const basicScore = scores.basicInfo.total;
        const eduScore = scores.education.total;
        const skillScore = scores.skills.total;
        const expScore = scores.experience.total;
        const achScore = scores.achievements.total;
        
        if (basicScore < 8) {
            suggestions.push('完善个人信息，建议至少填写5项基本信息');
        }
        
        if (eduScore < 20) {
            if (!analysis.education.hasGPA) {
                suggestions.push('建议添加GPA或学业成绩信息');
            }
            suggestions.push('突出学校优势或专业特色');
        }
        
        if (skillScore < 15) {
            suggestions.push('增加与目标岗位相关的技能描述');
            suggestions.push('考虑获得相关技能认证或证书');
        }
        
        if (expScore < 15) {
            suggestions.push('寻找更多实习或项目经验机会');
            suggestions.push('详细描述项目成果和个人贡献');
        }
        
        if (achScore < 8) {
            suggestions.push('积极参加学术竞赛或申请奖学金');
            suggestions.push('争取担任学生干部或参与社团活动');
        }
        
        // 专业相关建议
        if (analysis.education.majorMatch.type === 'cross_major') {
            suggestions.push('跨专业发展很好，建议突出跨界能力优势');
        }
        
        // 特殊建议
        if (analysis.education.schoolLevel >= 13) {
            suggestions.push('充分利用名校背景，可考虑申请知名企业或继续深造');
        }
        
        if (suggestions.length === 0) {
            suggestions.push('简历质量很好！建议针对不同岗位定制化调整');
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
