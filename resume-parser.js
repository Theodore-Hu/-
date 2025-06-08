// 简历解析器
class ResumeParser {
    // PDF解析
    static async parsePDF(file) {
        try {
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
            throw new Error('PDF解析失败: ' + error.message);
        }
    }
    
    // Word文档解析
    static async parseWord(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } catch (error) {
            throw new Error('Word文档解析失败: ' + error.message);
        }
    }
    
    // 统一解析入口
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

// 替换整个 ResumeScorer 类
class ResumeScorer {
    constructor() {
        this.maxScores = {
            basicInfo: 10,
            education: 30,
            skills: 25,
            experience: 25,
            achievements: 10
        };
        
        // 完善学校分级 - 添加更多985/211学校
        this.schoolRanks = {
            top2: ['清华', '北大', '清华大学', '北京大学'],
            top985: [
                '复旦', '上海交通', '浙江大学', '中国科学技术大学', '南京大学', 
                '西安交通', '哈尔滨工业', '中国人民大学', '北京理工', '北京航空',
                '东南大学', '华中科技', '中南大学', '电子科技大学', '重庆大学', 
                '大连理工', '吉林大学', '厦门大学', '山东大学', '华南理工',
                '北京师范', '同济大学', '天津大学', '南开大学', '中山大学',
                '西北工业', '华东师范', '中国农业', '国防科技', '中央民族',
                '兰州大学', '东北大学', '湖南大学', '中国海洋', '西北农林'
            ],
            c211: [
                '北京交通', '北京工业', '北京科技', '北京化工', '北京邮电',
                '华北电力', '中国石油', '中国地质', '中国矿业', '华东理工',
                '河海大学', '江南大学', '南京农业', '中国药科', '南京理工',
                '南京航空', '苏州大学', '安徽大学', '合肥工业', '福州大学',
                '南昌大学', '郑州大学', '华中农业', '华中师范', '中南财经',
                '湖南师范', '暨南大学', '华南师范', '广西大学', '海南大学',
                '四川大学', '西南交通', '西南财经', '贵州大学', '云南大学',
                '西北大学', '西安电子', '长安大学', '陕西师范', '青海大学',
                '宁夏大学', '新疆大学', '石河子', '延边大学', '内蒙古大学',
                '辽宁大学', '大连海事', '东北师范', '哈尔滨工程', '东北农业',
                '东北林业', '上海财经', '上海大学', '第二军医', '第四军医'
            ]
        };
        
        // 扩展技能关键词库
        this.skillKeywords = {
            programming: [
                'Java', 'Python', 'JavaScript', 'C++', 'C#', 'Go', 'Rust', 'Swift',
                'React', 'Vue', 'Angular', 'Node.js', 'Spring', 'Django', 'Flask',
                '前端', '后端', '全栈', '编程', '开发', '程序设计', 'HTML', 'CSS',
                'TypeScript', 'jQuery', 'Bootstrap', 'Webpack', 'Git', 'Linux',
                'Docker', 'Kubernetes', 'Redis', 'Nginx', 'Apache', 'MVC', 'API'
            ],
            design: [
                'Photoshop', 'Illustrator', 'Sketch', 'Figma', 'XD', 'Axure',
                'UI', 'UX', '平面设计', '交互设计', '视觉设计', '用户体验',
                '界面设计', '原型设计', '设计思维', 'Premiere', 'After Effects',
                '美工', '创意设计', '品牌设计', '包装设计'
            ],
            data: [
                'SQL', 'MySQL', 'MongoDB', 'PostgreSQL', 'Oracle', 'Excel',
                'SPSS', 'R语言', 'MATLAB', 'Tableau', 'Power BI', 'Spark',
                '数据分析', '数据挖掘', '数据可视化', '机器学习', '深度学习',
                'TensorFlow', 'PyTorch', '统计分析', '数据库', '大数据',
                'Hadoop', 'Hive', 'Pandas', 'NumPy', 'scikit-learn'
            ],
            business: [
                '市场营销', '项目管理', '商业分析', '财务分析', '运营', '策划',
                'PPT', '团队管理', '客户服务', '销售', '商务谈判', '品牌推广',
                '内容运营', '用户运营', '活动策划', '文案写作', '新媒体',
                '电商运营', '社群运营', '产品运营', 'CRM', 'ERP'
            ],
            language: [
                '英语', '日语', '韩语', '德语', '法语', '西班牙语', '俄语',
                '四级', '六级', '雅思', '托福', 'GRE', 'GMAT', 'CET',
                'IELTS', 'TOEFL', '口语', '翻译', '同声传译'
            ],
            office: [
                'Office', 'Word', 'Excel', 'PowerPoint', 'Access', 'Outlook',
                'WPS', '办公软件', '文档处理', '表格制作', '演示文稿'
            ]
        };
    }
    
    // 主评分函数
    scoreResume(text) {
        const analysis = this.analyzeResume(text);
        const scores = this.calculateScores(analysis);
        const suggestions = this.generateSuggestions(scores, analysis);
        const jobRecommendations = this.recommendJobs(analysis);
        
        // 修复：正确计算总分
        const totalScore = Object.values(scores).reduce((sum, scoreObj) => {
            return sum + (typeof scoreObj === 'object' ? scoreObj.total : scoreObj);
        }, 0);
        
        return {
            totalScore: Math.min(Math.round(totalScore), 100),
            categoryScores: scores,
            analysis: analysis,
            suggestions: suggestions,
            jobRecommendations: jobRecommendations
        };
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
    
    // 改进学校识别
    analyzeEducation(text) {
        const education = {
            schoolLevel: 0,
            hasGPA: /GPA|绩点|平均分|成绩/.test(text),
            gpa: this.extractGPA(text),
            hasMajor: /(专业|学院|系|计算机|软件|电子|机械|经济|金融|管理|文学|理学|工学)/.test(text),
            isRelevant: false
        };
        
        // 学校层次判断 - 改进匹配逻辑
        const textLower = text.toLowerCase();
        if (this.schoolRanks.top2.some(school => text.includes(school))) {
            education.schoolLevel = 15;
        } else if (this.schoolRanks.top985.some(school => 
            text.includes(school) || text.includes(school.replace('大学', '')) || text.includes(school.replace('学院', ''))
        )) {
            education.schoolLevel = 12;
        } else if (this.schoolRanks.c211.some(school => 
            text.includes(school) || text.includes(school.replace('大学', '')) || text.includes(school.replace('学院', ''))
        )) {
            education.schoolLevel = 8;
        } else if (/(大学|学院|college|university)/i.test(text)) {
            if (/(985|211|双一流|重点)/i.test(text)) {
                education.schoolLevel = 10;
            } else if (/(本科|学士|bachelor)/i.test(text)) {
                education.schoolLevel = 4;
            } else {
                education.schoolLevel = 6; // 默认本科
            }
        } else if (/(专科|高职|college)/i.test(text)) {
            education.schoolLevel = 2;
        } else {
            education.schoolLevel = 3; // 有教育信息但不明确
        }
        
        return education;
    }
    
    // 改进技能识别
    analyzeSkills(text) {
        const skills = {
            programming: [],
            design: [],
            data: [],
            business: [],
            language: [],
            office: [],
            total: 0
        };
        
        const textLower = text.toLowerCase();
        
        Object.keys(this.skillKeywords).forEach(category => {
            this.skillKeywords[category].forEach(skill => {
                const skillLower = skill.toLowerCase();
                // 更灵活的匹配：包含关键词或部分匹配
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
    
    // 模糊匹配函数
    fuzzyMatch(text, keyword) {
        // 简单的模糊匹配：去掉空格和特殊字符后比较
        const cleanText = text.replace(/[\s\-_.]/g, '');
        const cleanKeyword = keyword.replace(/[\s\-_.]/g, '');
        return cleanText.includes(cleanKeyword) || cleanKeyword.includes(cleanText);
    }
    
    // 其他方法保持不变...
    hasName(text) {
        const namePatterns = [
            /姓名[：:]\s*([^\s\n]{2,4})/,
            /^([^\s\n]{2,4})$/m,
            /(个人简历|简历)/
        ];
        return namePatterns.some(pattern => pattern.test(text)) || text.length > 50;
    }
    
    extractGPA(text) {
        const gpaMatch = text.match(/GPA[：:\s]*([0-9.]+)/i) || 
                        text.match(/绩点[：:\s]*([0-9.]+)/) ||
                        text.match(/平均分[：:\s]*([0-9.]+)/);
        if (gpaMatch) {
            const gpa = parseFloat(gpaMatch[1]);
            return gpa > 5 ? gpa / 25 : gpa; // 处理百分制转换为4分制
        }
        return 0;
    }
    
    analyzeExperience(text) {
        return {
            internshipCount: Math.max((text.match(/实习|intern/gi) || []).length, 
                                    (text.match(/(公司|企业|集团|科技|有限).*?(实习|intern)/gi) || []).length),
            projectCount: Math.max((text.match(/项目|project/gi) || []).length,
                                 (text.match(/(开发|设计|完成|负责).*?(项目|系统|网站|APP)/gi) || []).length),
            hasCompanyName: /(有限公司|股份|集团|科技|互联网|腾讯|阿里|百度|字节|美团|京东|华为|小米)/i.test(text),
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
    
    // 保持详细评分方法不变
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
    
    scoreSkillsDetailed(analysis) {
        const details = {};
        let total = 0;
        const skills = analysis.skills;
        
        // 提高技能评分，避免过低
        details.programming = Math.min(skills.programming.length * 2.5, 10);
        total += details.programming;
        
        details.design = Math.min(skills.design.length * 2, 5);
        total += details.design;
        
        details.data = Math.min(skills.data.length * 2, 5);
        total += details.data;
        
        details.business = Math.min(skills.business.length * 1.5, 3);
        total += details.business;
        
        details.language = Math.min(skills.language.length * 1, 2);
        total += details.language;
        
        return {
            total: Math.min(total, this.maxScores.skills),
            details: details,
            maxScores: { programming: 10, design: 5, data: 5, business: 3, language: 2 }
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
    
    // 其他方法（建议生成、岗位推荐等）保持不变...
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
        
        if (suggestions.length === 0) {
            suggestions.push('简历质量很好！建议针对不同岗位定制化调整');
        }
        
        return suggestions;
    }
    
    recommendJobs(analysis) {
        const jobs = [];
        const skills = analysis.skills;
        
        if (skills.programming.length > 0) {
            jobs.push({
                category: '技术开发',
                match: Math.min(75 + skills.programming.length * 3, 95),
                reason: `掌握${skills.programming.slice(0, 3).join('、')}等编程技能`
            });
        }
        
        if (skills.data.length > 0) {
            jobs.push({
                category: '数据分析',
                match: Math.min(70 + skills.data.length * 4, 90),
                reason: `具备${skills.data.slice(0, 3).join('、')}等数据处理能力`
            });
        }
        
        if (skills.design.length > 0) {
            jobs.push({
                category: '产品设计',
                match: Math.min(65 + skills.design.length * 5, 88),
                reason: `熟练使用${skills.design.slice(0, 3).join('、')}等设计工具`
            });
        }
        
        if (skills.business.length > 0 || analysis.experience.internshipCount > 0) {
            jobs.push({
                category: '商务运营',
                match: Math.min(60 + analysis.experience.internshipCount * 5, 85),
                reason: '具备商业思维和实习经验'
            });
        }
        
        if (jobs.length === 0) {
            jobs.push({
                category: '管理培训生',
                match: 60,
                reason: '适合全面发展的应届毕业生'
            });
        }
        
        return jobs.sort((a, b) => b.match - a.match).slice(0, 3);
    }
}
