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

// 简历评分器
class ResumeScorer {
    constructor() {
        // 评分权重
        this.maxScores = {
            basicInfo: 10,
            education: 30,
            skills: 25,
            experience: 25,
            achievements: 10
        };
        
        // 学校分级
        this.schoolRanks = {
            top2: ['清华', '北大', '清华大学', '北京大学'],
            top985: ['复旦', '上海交通', '浙江大学', '中国科学技术大学', '南京大学', '西安交通', '哈尔滨工业', '中国人民大学'],
            c9: ['北京理工', '北京航空', '东南大学', '华中科技', '中南大学', '电子科技大学', '重庆大学', '大连理工', '吉林大学']
        };
        
        // 技能关键词
        this.skillKeywords = {
            programming: ['Java', 'Python', 'JavaScript', 'C++', 'C#', 'React', 'Vue', 'Angular', 'Node.js', 'Spring', 'Django'],
            design: ['Photoshop', 'Illustrator', 'Sketch', 'Figma', 'UI', 'UX', '平面设计', '交互设计'],
            data: ['SQL', 'MySQL', 'MongoDB', 'Excel', 'SPSS', 'R语言', '数据分析', '数据挖掘'],
            business: ['市场营销', '项目管理', '商业分析', '财务分析', 'PPT', '运营'],
            language: ['英语', '日语', '韩语', '德语', '法语', '四级', '六级', '雅思', '托福']
        };
    }
    
    // 主评分函数
    scoreResume(text) {
        const analysis = this.analyzeResume(text);
        const scores = this.calculateScores(analysis);
        const suggestions = this.generateSuggestions(scores, analysis);
        const jobRecommendations = this.recommendJobs(analysis);
        
        const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
        
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
            // 基本信息
            hasName: this.hasName(text),
            hasPhone: /1[3-9]\d{9}/.test(text),
            hasEmail: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text),
            hasAddress: /(市|省|区|县|路|街|号)/.test(text),
            
            // 教育背景
            education: this.analyzeEducation(text),
            
            // 技能分析
            skills: this.analyzeSkills(text),
            
            // 经验分析
            experience: this.analyzeExperience(text),
            
            // 成就分析
            achievements: this.analyzeAchievements(text),
            
            // 文本基本信息
            wordCount: text.length,
            hasStructure: this.hasGoodStructure(text)
        };
    }
    
    // 姓名检测
    hasName(text) {
        const namePatterns = [
            /姓名[：:]\s*([^\s\n]{2,4})/,
            /^([^\s\n]{2,4})$/m,
            /个人简历/
        ];
        return namePatterns.some(pattern => pattern.test(text));
    }
    
    // 教育背景分析
    analyzeEducation(text) {
        const education = {
            schoolLevel: 0,
            hasGPA: /GPA|绩点|平均分/.test(text),
            gpa: this.extractGPA(text),
            hasMajor: /(专业|学院|系)/.test(text),
            isRelevant: false
        };
        
        // 学校层次判断
        if (this.schoolRanks.top2.some(school => text.includes(school))) {
            education.schoolLevel = 15;
        } else if (this.schoolRanks.top985.some(school => text.includes(school))) {
            education.schoolLevel = 12;
        } else if (this.schoolRanks.c9.some(school => text.includes(school))) {
            education.schoolLevel = 10;
        } else if (/大学|学院/.test(text)) {
            if (/211|985|双一流/.test(text)) {
                education.schoolLevel = 8;
            } else {
                education.schoolLevel = 4;
            }
        } else {
            education.schoolLevel = 2;
        }
        
        return education;
    }
    
    // GPA提取
    extractGPA(text) {
        const gpaMatch = text.match(/GPA[：:\s]*([0-9.]+)/i) || text.match(/绩点[：:\s]*([0-9.]+)/);
        if (gpaMatch) {
            const gpa = parseFloat(gpaMatch[1]);
            return gpa > 5 ? gpa / 25 : gpa; // 处理百分制
        }
        return 0;
    }
    
    // 技能分析
    analyzeSkills(text) {
        const skills = {
            programming: [],
            design: [],
            data: [],
            business: [],
            language: [],
            total: 0
        };
        
        Object.keys(this.skillKeywords).forEach(category => {
            this.skillKeywords[category].forEach(skill => {
                if (text.toLowerCase().includes(skill.toLowerCase())) {
                    skills[category].push(skill);
                }
            });
        });
        
        skills.total = Object.values(skills).reduce((sum, arr) => 
            sum + (Array.isArray(arr) ? arr.length : 0), 0
        );
        
        return skills;
    }
    
    // 经验分析
    analyzeExperience(text) {
        return {
            internshipCount: (text.match(/实习|intern/gi) || []).length,
            projectCount: (text.match(/项目|project/gi) || []).length,
            hasCompanyName: /(有限公司|股份|集团|科技|互联网)/.test(text),
            hasDuration: /(年|月|day|week)/.test(text),
            hasAchievement: /(完成|实现|提升|优化|负责)/.test(text)
        };
    }
    
    // 成就分析
    analyzeAchievements(text) {
        return {
            scholarshipCount: (text.match(/奖学金|scholarship/gi) || []).length,
            competitionCount: (text.match(/竞赛|比赛|competition|contest/gi) || []).length,
            certificateCount: (text.match(/证书|证明|认证|certificate/gi) || []).length,
            hasLeadership: /(主席|部长|队长|负责人|leader)/.test(text)
        };
    }
    
    // 结构分析
    hasGoodStructure(text) {
        const sections = ['教育', '经历', '技能', '项目', '实习'];
        return sections.filter(section => text.includes(section)).length >= 3;
    }
    
    // 在 ResumeScorer 类中替换 calculateScores 方法
    calculateScores(analysis) {
        return {
            basicInfo: this.scoreBasicInfoDetailed(analysis),
            education: this.scoreEducationDetailed(analysis),
            skills: this.scoreSkillsDetailed(analysis),
            experience: this.scoreExperienceDetailed(analysis),
            achievements: this.scoreAchievementsDetailed(analysis)
        };
    }
    
    // 添加以下详细评分方法
    
    // 基本信息详细评分
    scoreBasicInfoDetailed(analysis) {
        const details = {};
        let total = 0;
        
        // 姓名
        details.name = analysis.hasName ? 3 : 0;
        total += details.name;
        
        // 手机号
        details.phone = analysis.hasPhone ? 3 : 0;
        total += details.phone;
        
        // 邮箱
        details.email = analysis.hasEmail ? 3 : 0;
        total += details.email;
        
        // 地址/求职意向
        details.location = analysis.hasAddress ? 1 : 0;
        total += details.location;
        
        return {
            total: Math.min(total, this.maxScores.basicInfo),
            details: details,
            maxScores: {
                name: 3,
                phone: 3,
                email: 3,
                location: 1
            }
        };
    }
    
    // 教育背景详细评分
    scoreEducationDetailed(analysis) {
        const details = {};
        let total = 0;
        
        // 学校层次
        details.school = analysis.education.schoolLevel;
        total += details.school;
        
        // 学术表现
        if (analysis.education.gpa >= 3.8) details.academic = 7;
        else if (analysis.education.gpa >= 3.5) details.academic = 5;
        else if (analysis.education.gpa >= 3.0) details.academic = 3;
        else if (analysis.education.hasGPA) details.academic = 2;
        else details.academic = 1;
        total += details.academic;
        
        // 专业相关性
        details.major = analysis.education.hasMajor ? 8 : 2;
        total += details.major;
        
        return {
            total: Math.min(total, this.maxScores.education),
            details: details,
            maxScores: {
                school: 15,
                academic: 7,
                major: 8
            }
        };
    }
    
    // 技能详细评分
    scoreSkillsDetailed(analysis) {
        const details = {};
        let total = 0;
        const skills = analysis.skills;
        
        // 编程技能
        details.programming = Math.min(skills.programming.length * 2, 10);
        total += details.programming;
        
        // 设计技能
        details.design = Math.min(skills.design.length * 1.5, 6);
        total += details.design;
        
        // 数据分析技能
        details.data = Math.min(skills.data.length * 1.5, 6);
        total += details.data;
        
        // 商务技能
        details.business = Math.min(skills.business.length * 1, 4);
        total += details.business;
        
        // 语言技能
        details.language = Math.min(skills.language.length * 1, 3);
        total += details.language;
        
        return {
            total: Math.min(total, this.maxScores.skills),
            details: details,
            maxScores: {
                programming: 10,
                design: 6,
                data: 6,
                business: 4,
                language: 3
            }
        };
    }
    
    // 经验详细评分
    scoreExperienceDetailed(analysis) {
        const details = {};
        let total = 0;
        const exp = analysis.experience;
        
        // 实习经验
        details.internship = Math.min(exp.internshipCount * 5, 15);
        total += details.internship;
        
        // 项目经验
        details.project = Math.min(exp.projectCount * 3, 10);
        total += details.project;
        
        // 经验质量
        let quality = 0;
        if (exp.hasCompanyName) quality += 2;
        if (exp.hasDuration) quality += 1;
        if (exp.hasAchievement) quality += 2;
        details.quality = quality;
        total += details.quality;
        
        return {
            total: Math.min(total, this.maxScores.experience),
            details: details,
            maxScores: {
                internship: 15,
                project: 10,
                quality: 5
            }
        };
    }
    
    // 成就详细评分
    scoreAchievementsDetailed(analysis) {
        const details = {};
        let total = 0;
        const ach = analysis.achievements;
        
        // 奖学金
        details.scholarship = Math.min(ach.scholarshipCount * 2, 4);
        total += details.scholarship;
        
        // 竞赛获奖
        details.competition = Math.min(ach.competitionCount * 2, 4);
        total += details.competition;
        
        // 证书认证
        details.certificate = Math.min(ach.certificateCount * 1, 2);
        total += details.certificate;
        
        // 领导力
        details.leadership = ach.hasLeadership ? 2 : 0;
        total += details.leadership;
        
        return {
            total: Math.min(total, this.maxScores.achievements),
            details: details,
            maxScores: {
                scholarship: 4,
                competition: 4,
                certificate: 2,
                leadership: 2
            }
        };
    }
    
    // 生成建议
    generateSuggestions(scores, analysis) {
        const suggestions = [];
        
        if (scores.basicInfo < 8) {
            suggestions.push('完善联系方式，确保手机号、邮箱信息准确');
        }
        
        if (scores.education < 20) {
            if (!analysis.education.hasGPA) {
                suggestions.push('建议添加GPA或专业排名信息');
            }
            suggestions.push('突出学校优势或专业特色');
        }
        
        if (scores.skills < 15) {
            suggestions.push('增加与目标岗位相关的技能描述');
            suggestions.push('考虑获得相关技能认证或证书');
        }
        
        if (scores.experience < 15) {
            suggestions.push('寻找更多实习或项目经验机会');
            suggestions.push('详细描述项目成果和个人贡献');
        }
        
        if (scores.achievements < 5) {
            suggestions.push('积极参加学术竞赛或获得奖学金');
            suggestions.push('争取担任学生干部或参与社团活动');
        }
        
        if (suggestions.length === 0) {
            suggestions.push('简历质量很好！建议针对不同岗位定制化调整');
        }
        
        return suggestions;
    }
    
    // 岗位推荐
    recommendJobs(analysis) {
        const jobs = [];
        const skills = analysis.skills;
        
        // 技术开发类
        if (skills.programming.length > 0) {
            jobs.push({
                category: '技术开发',
                match: Math.min(85 + skills.programming.length * 3, 95),
                reason: `掌握${skills.programming.join('、')}等编程技能`
            });
        }
        
        // 数据分析类
        if (skills.data.length > 0) {
            jobs.push({
                category: '数据分析',
                match: Math.min(75 + skills.data.length * 5, 90),
                reason: `具备${skills.data.join('、')}等数据处理能力`
            });
        }
        
        // 产品设计类
        if (skills.design.length > 0) {
            jobs.push({
                category: '产品设计',
                match: Math.min(70 + skills.design.length * 4, 88),
                reason: `熟练使用${skills.design.join('、')}等设计工具`
            });
        }
        
        // 商务运营类
        if (skills.business.length > 0 || analysis.experience.internshipCount > 0) {
            jobs.push({
                category: '商务运营',
                match: Math.min(65 + analysis.experience.internshipCount * 5, 85),
                reason: '具备商业思维和实习经验'
            });
        }
        
        // 如果没有特别匹配的，推荐通用岗位
        if (jobs.length === 0) {
            jobs.push({
                category: '管理培训生',
                match: 60,
                reason: '适合全面发展的应届毕业生'
            });
        }
        
        // 按匹配度排序
        return jobs.sort((a, b) => b.match - a.match).slice(0, 3);
    }
}
