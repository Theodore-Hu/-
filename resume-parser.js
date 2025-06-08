// 简历解析器
class ResumeParser {
    static async parsePDF(file) {
        try {
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js库未加载，请刷新页面重试');
            }
            
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }
            
            return fullText;
        } catch (error) {
            console.error('PDF解析错误:', error);
            throw new Error('PDF解析失败: ' + error.message);
        }
    }
    
    static async parseWord(file) {
        try {
            if (typeof mammoth === 'undefined') {
                throw new Error('Word解析库未加载，请刷新页面重试');
            }
            
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } catch (error) {
            console.error('Word解析错误:', error);
            throw new Error('Word文档解析失败: ' + error.message);
        }
    }
    
    static async parseFile(file) {
        const fileType = file.type;
        const fileName = file.name.toLowerCase();
        
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            return await this.parsePDF(file);
        } else if (fileType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
            return await this.parseWord(file);
        } else {
            throw new Error('不支持的文件格式，请上传PDF或Word文档');
        }
    }
}

// 简历评分器
class ResumeScorer {
    constructor() {
        this.maxScores = {
            basicInfo: 10,
            education: 30,
            skills: 25,
            experience: 25,
            achievements: 10
        };
        
        // 学校分级体系（保持新版的完整分级）
        this.schoolRanks = {
            // 顶尖大学（15分）
            topTier: [
                '清华大学', '北京大学', '清华', '北大',
            ],
            
            // 一流大学A类（13分）
            tier1A: [
                '复旦大学', '上海交通大学', '浙江大学', '中国科学技术大学', '南京大学',
                '西安交通大学', '哈尔滨工业大学', '中国人民大学', '北京理工大学', '北京航空航天大学',
                '东南大学', '华中科技大学', '中山大学', '天津大学', '同济大学',
                '北京师范大学', '南开大学', '西北工业大学', '华东师范大学',
                '南方科技大学', '西湖大学', '上海科技大学', '深圳大学', '苏州大学',
                '中国科学院大学', '国科大', '中科院大学', '复旦', '交大', '浙大', '中科大', '南大'
            ],
            
            // 一流大学B类（11分）
            tier1B: [
                '中南大学', '电子科技大学', '重庆大学', '大连理工大学', '吉林大学',
                '厦门大学', '山东大学', '华南理工大学', '中国农业大学', '国防科技大学',
                '中央民族大学', '兰州大学', '东北大学', '湖南大学', '中国海洋大学', '西北农林科技大学',
                '北京邮电大学', '华东理工大学', '西安电子科技大学', '北京科技大学',
                '中南财经政法大学', '上海财经大学', '对外经济贸易大学', '西南财经大学',
                '中央财经大学', '华中师范大学', '华南师范大学', '陕西师范大学',
                '华中农业大学', '南京农业大学', '中国药科大学', '北京中医药大学',
                '中国传媒大学', '北京外国语大学', '上海外国语大学'
            ],
            
            // 一流学科大学（9分）
            tier2: [
                '北京交通大学', '北京工业大学', '北京化工大学', '中国石油大学', '中国地质大学',
                '中国矿业大学', '河海大学', '江南大学', '南京理工大学', '南京航空航天大学',
                '安徽大学', '合肥工业大学', '福州大学', '南昌大学', '郑州大学',
                '湖南师范大学', '暨南大学', '广西大学', '海南大学', '四川大学',
                '西南交通大学', '贵州大学', '云南大学', '西北大学', '长安大学',
                '青海大学', '宁夏大学', '新疆大学', '石河子大学', '延边大学',
                '内蒙古大学', '辽宁大学', '大连海事大学', '东北师范大学', '哈尔滨工程大学',
                '东北农业大学', '东北林业大学', '上海大学'
            ],
            
            // 优质本科（6分）
            tier3: [
                '杭州电子科技大学', '宁波大学', '江苏科技大学', '南京信息工程大学',
                '浙江理工大学', '温州医科大学', '广东工业大学', '汕头大学',
                '华东政法大学', '上海理工大学', '首都医科大学', '重庆邮电大学',
                '西安建筑科技大学', '长沙理工大学', '湘潭大学', '扬州大学',
                '江西理工大学', '河北工业大学', '天津师范大学', '山西大学'
            ]
        };
        
        // 技能关键词库（确保包含所有类别）
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
            office: [
                'Office', 'Word', 'Excel', 'PowerPoint', 'Access', 'Outlook', 'OneNote',
                'WPS', '办公软件', '文档处理', '表格制作', '演示文稿', 'VBA', '数据透视表'
            ],
            engineering: [
                'CAD', 'AutoCAD', 'SolidWorks', 'Pro/E', 'UG', 'CATIA', 'Inventor',
                'ANSYS', 'ABAQUS', 'COMSOL', '有限元', '仿真', '建模', '测试', '实验设计',
                'LabVIEW', 'Altium Designer', 'Keil', 'Quartus', 'Vivado', 'FPGA'
            ]
        };
    }
    
    // 检测专精类型（修复 engineering 检测问题）
    detectSpecialization(analysis) {
        const specializations = [];
        const skills = analysis.skills;
        
        if (skills.programming && skills.programming.length >= 5) {
            specializations.push({
                type: 'programming',
                level: skills.programming.length,
                bonus: Math.min(skills.programming.length - 3, 8)
            });
        }
        
        if (skills.data && skills.data.length >= 3) {
            specializations.push({
                type: 'data',
                level: skills.data.length,
                bonus: Math.min(skills.data.length - 2, 6)
            });
        }
        
        if (skills.design && skills.design.length >= 3) {
            specializations.push({
                type: 'design',
                level: skills.design.length,
                bonus: Math.min(skills.design.length - 2, 6)
            });
        }
        
        // 修复：确保 engineering 存在
        if (skills.engineering && skills.engineering.length >= 3) {
            specializations.push({
                type: 'engineering',
                level: skills.engineering.length,
                bonus: Math.min(skills.engineering.length - 2, 6)
            });
        }
        
        // 学术专精检测
        if (analysis.achievements.competitionCount >= 3 || 
            analysis.achievements.scholarshipCount >= 2) {
            specializations.push({
                type: 'academic',
                level: analysis.achievements.competitionCount + analysis.achievements.scholarshipCount,
                bonus: 5
            });
        }
        
        // 实践专精检测
        if (analysis.experience.projectCount >= 4 || 
            analysis.experience.internshipCount >= 3) {
            specializations.push({
                type: 'practical',
                level: analysis.experience.projectCount + analysis.experience.internshipCount,
                bonus: 4
            });
        }
        
        return specializations;
    }
    
    // 主评分函数
    scoreResume(text) {
        const analysis = this.analyzeResume(text);
        const scores = this.calculateScores(analysis);
        
        // 检测专精并应用加成
        const specializations = this.detectSpecialization(analysis);
        const enhancedScores = this.applySpecializationBonus(scores, specializations);
        
        const suggestions = this.generateSuggestions(enhancedScores, analysis);
        const jobRecommendations = this.recommendJobs(analysis, specializations);
        
        const totalScore = Object.values(enhancedScores).reduce((sum, scoreObj) => {
            return sum + (typeof scoreObj === 'object' ? scoreObj.total : scoreObj);
        }, 0);
        
        return {
            totalScore: Math.min(Math.round(totalScore), 100),
            categoryScores: enhancedScores,
            analysis: analysis,
            specializations: specializations,
            suggestions: suggestions,
            jobRecommendations: jobRecommendations
        };
    }
    
    // 应用专精加成
    applySpecializationBonus(scores, specializations) {
        const enhancedScores = JSON.parse(JSON.stringify(scores));
        
        specializations.forEach(spec => {
            switch(spec.type) {
                case 'programming':
                case 'data':
                case 'design':
                case 'engineering':
                    enhancedScores.skills.total = Math.min(
                        enhancedScores.skills.total + spec.bonus, 
                        this.maxScores.skills + 8
                    );
                    break;
                case 'academic':
                    enhancedScores.achievements.total = Math.min(
                        enhancedScores.achievements.total + spec.bonus,
                        this.maxScores.achievements + 5
                    );
                    break;
                case 'practical':
                    enhancedScores.experience.total = Math.min(
                        enhancedScores.experience.total + spec.bonus,
                        this.maxScores.experience + 5
                    );
                    break;
            }
        });
        
        return enhancedScores;
    }
    
    // 简历分析
    analyzeResume(text) {
        return {
            hasName: this.hasName(text),
            hasPhone: /1[3-9]\d{9}/.test(text),
            hasEmail: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text),
            hasAddress: /(市|省|区|县|路|街|号|意向|求职)/.test(text),
            education: this.analyzeEducation(text),
            skills: this.analyzeSkills(text),
            experience: this.analyzeExperience(text),
            achievements: this.analyzeAchievements(text),
            wordCount: text.length,
            hasStructure: this.hasGoodStructure(text)
        };
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
            isRelevant: false,
            degrees: this.extractDegrees(text)
        };
        
        education.schoolLevel = this.calculateSchoolScore(text, education.degrees);
        
        return education;
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
    
    // 修复：新的学校评分系统
    calculateSchoolScore(text, degrees) {
        if (degrees.length === 0) {
            return this.getBasicSchoolScore(text);
        }
        
        const sortedDegrees = degrees.sort((a, b) => {
            const order = { 'associate': 1, 'bachelor': 2, 'master': 3, 'phd': 4 };
            return (order[a.degree] || 0) - (order[b.degree] || 0);
        });
        
        let finalScore = 0;
        
        if (sortedDegrees.length === 1) {
            const degree = sortedDegrees[0];
            finalScore = this.getSchoolRankScore(degree.school);
            
            if (degree.degree === 'phd') finalScore += 2;
            else if (degree.degree === 'master') finalScore += 1;
            
        } else {
            const firstDegree = sortedDegrees[0];
            const highestDegree = sortedDegrees[sortedDegrees.length - 1];
            
            const firstScore = this.getSchoolRankScore(firstDegree.school);
            const highestScore = this.getSchoolRankScore(highestDegree.school);
            
            const baseScore = firstScore * 0.5 + highestScore * 0.5;
            
            let degreeBonus = 0;
            if (highestDegree.degree === 'phd') degreeBonus = 3;
            else if (highestDegree.degree === 'master') degreeBonus = 2;
            
            finalScore = Math.round(baseScore + degreeBonus);
        }
        
        return Math.min(finalScore, 15);
    }
    
    // 修复：学校排名评分，适配新的分级体系
    getSchoolRankScore(schoolName) {
        if (!schoolName) return 2;
        
        const normalizedName = schoolName
            .replace(/大学$/, '')
            .replace(/学院$/, '')
            .replace(/科技$/, '')
            .replace(/理工$/, '');
        
        // 顶尖大学 (15分)
        if (this.schoolRanks.topTier.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 15;
        }
        
        // 一流大学A类 (13分)
        if (this.schoolRanks.tier1A.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 13;
        }
        
        // 一流大学B类 (11分)
        if (this.schoolRanks.tier1B.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 11;
        }
        
        // 一流学科大学 (9分)
        if (this.schoolRanks.tier2.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 9;
        }
        
        // 优质本科 (6分)
        if (this.schoolRanks.tier3.some(school => 
            this.matchSchoolName(schoolName, school) || 
            this.matchSchoolName(normalizedName, school.replace(/大学$/, '').replace(/学院$/, ''))
        )) {
            return 6;
        }
        
        // 其他识别
        if (/(大学|学院)/i.test(schoolName)) {
            if (/(985|211|双一流|重点)/i.test(schoolName)) return 8;
            return 4; // 普通本科
        }
        
        if (/(专科|高职)/i.test(schoolName)) return 2;
        
        return 3;
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
        // 特殊处理一些新兴优秀大学
        if (/(南方科技|西湖大学|上海科技|深圳大学)/i.test(text)) return 13;
        
        // 清华北大特殊处理
        if (/(清华|北大)/i.test(text)) return 15;
        if (/(985|211|双一流|重点)/i.test(text)) return 10;
        if (/(大学|学院)/i.test(text)) return 6;
        if (/(专科|高职)/i.test(text)) return 2;
        
        return 3;
    }
    
    extractGPA(text) {
        const gpaMatch = text.match(/GPA[：:\s]*([0-9.]+)/i) || 
                        text.match(/绩点[：:\s]*([0-9.]+)/) ||
                        text.match(/平均分[：:\s]*([0-9.]+)/);
        if (gpaMatch) {
            const gpa = parseFloat(gpaMatch[1]);
            return gpa > 5 ? gpa / 25 : gpa;
        }
        return 0;
    }
    
    // 修复：技能识别，确保所有类别都被正确初始化
    analyzeSkills(text) {
        const skills = {
            programming: [],
            design: [],
            data: [],
            business: [],
            language: [],
            office: [],
            engineering: [], // 确保初始化
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
        return {
            scholarshipCount: (text.match(/(奖学金|scholarship|学业奖励)/gi) || []).length,
            competitionCount: (text.match(/(竞赛|比赛|competition|contest|获奖|奖项)/gi) || []).length,
            certificateCount: (text.match(/(证书|证明|认证|certificate|资格证)/gi) || []).length,
            hasLeadership: /(主席|部长|队长|负责人|leader|班长|会长|社长|组长)/i.test(text)
        };
    }
    
    hasGoodStructure(text) {
        const sections = ['教育', '经历', '技能', '项目', '实习', '工作', '学习', '经验'];
        return sections.filter(section => text.includes(section)).length >= 3;
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
    
    scoreBasicInfoDetailed(analysis) {
        const details = {};
        let total = 0;
        
        details.name = analysis.hasName ? 3 : 0;
        total += details.name;
        
        details.phone = analysis.hasPhone ? 3 : 0;
        total += details.phone;
        
        details.email = analysis.hasEmail ? 3 : 0;
        total += details.email;
        
        details.location = analysis.hasAddress ? 1 : 0;
        total += details.location;
        
        return {
            total: Math.min(total, this.maxScores.basicInfo),
            details: details,
            maxScores: { name: 3, phone: 3, email: 3, location: 1 }
        };
    }
    
    scoreEducationDetailed(analysis) {
        const details = {};
        let total = 0;
        
        details.school = analysis.education.schoolLevel;
        total += details.school;
        
        if (analysis.education.gpa >= 3.8) details.academic = 7;
        else if (analysis.education.gpa >= 3.5) details.academic = 5;
        else if (analysis.education.gpa >= 3.0) details.academic = 3;
        else if (analysis.education.hasGPA) details.academic = 2;
        else details.academic = 1;
        total += details.academic;
        
        details.major = analysis.education.hasMajor ? 8 : 2;
        total += details.major;
        
        return {
            total: Math.min(total, this.maxScores.education),
            details: details,
            maxScores: { school: 15, academic: 7, major: 8 }
        };
    }
    
    // 修复：技能评分，确保包含工程技能
    scoreSkillsDetailed(analysis) {
        const details = {};
        let total = 0;
        const skills = analysis.skills;
        
        details.programming = Math.min(skills.programming.length * 2.5, 8);
        total += details.programming;
        
        details.design = Math.min(skills.design.length * 2, 4);
        total += details.design;
        
        details.data = Math.min(skills.data.length * 2, 4);
        total += details.data;
        
        // 确保 engineering 技能被正确评分
        details.engineering = Math.min((skills.engineering || []).length * 2, 4);
        total += details.engineering;
        
        details.business = Math.min(skills.business.length * 1.5, 3);
        total += details.business;
        
        details.language = Math.min(skills.language.length * 1, 2);
        total += details.language;
        
        return {
            total: Math.min(total, this.maxScores.skills),
            details: details,
            maxScores: { programming: 8, design: 4, data: 4, engineering: 4, business: 3, language: 2 }
        };
    }
    
    scoreExperienceDetailed(analysis) {
        const details = {};
        let total = 0;
        const exp = analysis.experience;
        
        details.internship = Math.min(exp.internshipCount * 6, 15);
        total += details.internship;
        
        details.project = Math.min(exp.projectCount * 4, 8);
        total += details.project;
        
        let quality = 0;
        if (exp.hasCompanyName) quality += 2;
        if (exp.hasDuration) quality += 1;
        if (exp.hasAchievement) quality += 2;
        details.quality = quality;
        total += details.quality;
        
        return {
            total: Math.min(total, this.maxScores.experience),
            details: details,
            maxScores: { internship: 15, project: 8, quality: 5 }
        };
    }
    
    scoreAchievementsDetailed(analysis) {
        const details = {};
        let total = 0;
        const ach = analysis.achievements;
        
        details.scholarship = Math.min(ach.scholarshipCount * 2.5, 3);
        total += details.scholarship;
        
        details.competition = Math.min(ach.competitionCount * 2.5, 3);
        total += details.competition;
        
        details.certificate = Math.min(ach.certificateCount * 1.5, 2);
        total += details.certificate;
        
        details.leadership = ach.hasLeadership ? 2 : 0;
        total += details.leadership;
        
        return {
            total: Math.min(total, this.maxScores.achievements),
            details: details,
            maxScores: { scholarship: 3, competition: 3, certificate: 2, leadership: 2 }
        };
    }
    
    // 岗位推荐（保持完整功能）
    recommendJobs(analysis, specializations = []) {
        const jobs = [];
        const skills = analysis.skills;
        const education = analysis.education;
        
        // 1. 技术开发类
        if (skills.programming && skills.programming.length > 0) {
            jobs.push({
                category: '软件开发工程师',
                match: Math.min(75 + skills.programming.length * 3, 95),
                reason: `掌握${skills.programming.slice(0, 3).join('、')}等编程技能`
            });
        }
        
        // 2. 数据分析类
        if (skills.data && skills.data.length > 0) {
            jobs.push({
                category: '数据分析师',
                match: Math.min(70 + skills.data.length * 4, 90),
                reason: `具备${skills.data.slice(0, 3).join('、')}等数据处理能力`
            });
        }
        
        // 3. 产品设计类
        if (skills.design && skills.design.length > 0) {
            jobs.push({
                category: '产品设计师',
                match: Math.min(65 + skills.design.length * 5, 88),
                reason: `熟练使用${skills.design.slice(0, 3).join('、')}等设计工具`
            });
        }
        
        // 4. 工程技术类
        if (skills.engineering && skills.engineering.length > 0) {
            jobs.push({
                category: '工程技术岗位',
                match: Math.min(60 + skills.engineering.length * 6, 85),
                reason: `掌握${skills.engineering.slice(0, 3).join('、')}等工程技术`
            });
        }
        
        // 5. 学术研究类
        const academicSignals = this.detectAcademicOrientation(analysis);
        if (academicSignals.score > 0) {
            jobs.push({
                category: '学术研究/高校教师',
                match: Math.min(60 + academicSignals.score, 85),
                reason: academicSignals.reason
            });
        }
        
        // 6. 商务运营类
        if (skills.business && skills.business.length > 0 || analysis.experience.internshipCount > 0) {
            jobs.push({
                category: '商务运营',
                match: Math.min(60 + analysis.experience.internshipCount * 5, 85),
                reason: '具备商业思维和实习经验'
            });
        }
        
        // 7. 专精加成推荐
        specializations.forEach(spec => {
            if (spec.type === 'programming' && spec.level >= 6) {
                jobs.push({
                    category: '高级软件工程师',
                    match: 90,
                    reason: `编程技能专精（掌握${spec.level}项技术）`
                });
            }
            if (spec.type === 'academic' && spec.level >= 4) {
                jobs.push({
                    category: '博士研究生/科研助理',
                    match: 88,
                    reason: `学术能力突出（${spec.level}项学术成果）`
                });
            }
        });
        
        // 8. 兜底推荐
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
        
        return {
            score: score,
            reason: reasons.length > 0 ? reasons.join('，') + '，适合学术研究发展' : ''
        };
    }
    
    // 生成建议
    generateSuggestions(scores, analysis) {
        const suggestions = [];
        
        const basicScore = typeof scores.basicInfo === 'object' ? scores.basicInfo.total : scores.basicInfo;
        const eduScore = typeof scores.education === 'object' ? scores.education.total : scores.education;
        const skillScore = typeof scores.skills === 'object' ? scores.skills.total : scores.skills;
        const expScore = typeof scores.experience === 'object' ? scores.experience.total : scores.experience;
        const achScore = typeof scores.achievements === 'object' ? scores.achievements.total : scores.achievements;
        
        if (basicScore < 8) {
            suggestions.push('完善联系方式，确保手机号、邮箱信息准确');
        }
        
        if (eduScore < 20) {
            if (!analysis.education.hasGPA) {
                suggestions.push('建议添加GPA或专业排名信息');
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
        
        if (achScore < 5) {
            suggestions.push('积极参加学术竞赛或获得奖学金');
            suggestions.push('争取担任学生干部或参与社团活动');
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
