根据您的要求，我重新优化打分标准和代码：

# 优化后的简历评分标准

## 1. 基本信息 (10分)
每有一条个人信息得2分，满5条即可得满分10分：
- **姓名信息**: 2分
- **联系电话**: 2分 
- **电子邮箱**: 2分
- **地址信息**: 2分
- **求职意向**: 2分
- **个人网站/GitHub**: 2分
- **LinkedIn等社交账号**: 2分
- **出生日期**: 2分
- **政治面貌**: 2分
- **其他联系方式**: 2分

*注：满5条信息即得满分10分*

## 2. 教育背景 (30分)

### 学校层次评分 (最高15分) - 基于高考分数线分类
- **TOP顶尖 (15分)**: 清华大学、北京大学
- **顶尖985 (13分)**: 稳定前10
- **优秀985 (11分)**: 前15-20名
- **普通985+顶尖211 (9分)**
- **普通211 (7分)**
- **省属重点+双一流学科 (5分)**
- **普通本科 (3分)**
- **专科 (1分)**

### 学业成绩评分 (最高5分) - 标准化为4分制
- **GPA ≥ 3.7**: 5分 (优秀)
- **GPA ≥ 3.3**: 4分 (良好)
- **GPA ≥ 2.7**: 3分 (中等)
- **GPA ≥ 2.0**: 2分 (及格)
- **其他**: 1分

### 学历层次评分 (最高10分)
- **博士学位**: 5分/个
- **硕士学位**: 3分/个
- **本科学位**: 1分/个
- **多学位加分**: 每多一个学位+1分

## 3. 专业技能 (20分) - 降低总分上限
每个技能类别上限4分：
- **编程开发**: 最高4分
- **数据分析**: 最高4分
- **设计创作**: 最高4分
- **工程技术**: 最高4分
- **文体艺术**: 最高4分 (新增)

## 4. 实践经验 (25分) - 重新设计
分为三个子类别，总上限25分：

### 实习经历 (最高15分)
- **每条实习**: 3分 (2分基础 + 1分附加)
- **附加分条件**: 知名公司、有具体成果描述等
- **专精标准**: 超过5条实习(15分)可获得专精加成

### 项目经验 (最高15分)
- **每个项目**: 3分 (2分基础 + 1分附加)
- **附加分条件**: 项目规模大、有明确成果等
- **专精标准**: 超过5个项目(15分)可获得专精加成

### 学术成果 (最高15分)
- **Nature/Science**: 5分/篇
- **JCR一区**: 4分/篇
- **SCI期刊**: 3分/篇
- **EI期刊**: 2分/篇
- **中文期刊**: 1分/篇
- **专精标准**: 超过5篇论文(15分)可获得专精加成

## 5. 奖励荣誉 (15分) - 按级别计分
不设细项上限，按级别和类型计分：

### 学生干部
- **主席级**: 3分 (学生会主席、社团主席等)
- **部长级**: 2分 (部长、副主席等)
- **干事级**: 1分 (干事、委员等)

### 荣誉奖励
- **国家级**: 4分 (国家奖学金、国家级荣誉等)
- **省级**: 3分 (省级奖学金、省级荣誉等)
- **校级**: 2分 (校级奖学金、校级荣誉等)
- **院级**: 1分 (院级奖学金、院级荣誉等)

### 竞赛获奖
- **国际级**: 4分
- **国家级**: 3分
- **省级**: 2分
- **校级**: 1分

### 证书认证
- **高级证书**: 2分 (如高级工程师、CPA等)
- **普通证书**: 1分 (如四六级、计算机等级等)

---

## 专精加成系统 (额外分数)

### 技能专精加成
- **编程专精**: 5项以上技能，每多1项+1分，上限+5分
- **数据专精**: 4项以上技能，每多1项+1分，上限+4分
- **设计专精**: 4项以上技能，每多1项+1分，上限+4分
- **工程专精**: 4项以上技能，每多1项+1分，上限+4分
- **文体艺术专精**: 4项以上技能，每多1项+1分，上限+4分

### 实践专精加成
- **实习专精**: 超过5条实习，每多1条+1分，上限+5分
- **项目专精**: 超过5个项目，每多1个+1分，上限+5分
- **学术专精**: 超过5篇论文，每多1篇+1分，上限+5分

---

## 完整代码实现

### resume-parser.js (简历解析器保持不变)

### 优化后的评分器代码：

```javascript
// 简历评分器 - 重新优化版
class ResumeScorer {
    constructor() {
        this.maxScores = {
            basicInfo: 10,
            education: 30,
            skills: 20,      // 降低到20分
            experience: 25,  // 调整为25分
            achievements: 15
        };
      
        // 学校分级体系保持不变
        this.schoolRanks = {
            topTier: ['清华大学', '北京大学', '清华', '北大'],
            tier1A: [
                '复旦大学', '上海交通大学', '浙江大学', '中国科学技术大学', '南京大学',
                '中国人民大学', '北京航空航天大学', '北京理工大学',
                '中国科学院大学', '南方科技大学',
                '复旦', '交大', '浙大', '中科大', '南大', '人大', '北航', '北理工', '国科大', '南科大'
            ],
            tier1B: [
                '西安交通大学', '哈尔滨工业大学', '华中科技大学', '同济大学',
                '东南大学', '天津大学', '北京师范大学', '南开大学',
                '中山大学', '西北工业大学', '华东师范大学',
                '西交', '哈工大', '华科', '同济', '东南', '天大', '北师大', '南开',
                '中大', '西工大', '华师大'
            ],
            tier2A: [
                '中南大学', '电子科技大学', '重庆大学', '大连理工大学', '吉林大学',
                '厦门大学', '山东大学', '华南理工大学', '湖南大学', '东北大学',
                '兰州大学', '中国农业大学', '中国海洋大学', '西北农林科技大学',
                '北京邮电大学', '华东理工大学', '西安电子科技大学', '北京科技大学',
                '上海财经大学', '对外经济贸易大学', '中央财经大学'
            ],
            tier2B: [
                '北京交通大学', '北京工业大学', '北京化工大学', '中国石油大学', '中国地质大学',
                '中国矿业大学', '河海大学', '江南大学', '南京理工大学', '南京航空航天大学',
                '安徽大学', '合肥工业大学', '福州大学', '南昌大学', '郑州大学'
            ],
            tier3: [
                '西湖大学', '上海科技大学', '深圳大学', '苏州大学',
                '杭州电子科技大学', '宁波大学', '江苏科技大学', '南京信息工程大学'
            ]
        };
      
        // 技能关键词库 - 新增文体艺术
        this.skillKeywords = {
            programming: [
                'Java', 'Python', 'JavaScript', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin',
                'React', 'Vue', 'Angular', 'Node.js', 'Spring', 'Django', 'Flask', 'Express',
                '前端', '后端', '全栈', '编程', '开发', '程序设计', 'HTML', 'CSS', 'PHP'
            ],
            design: [
                'Photoshop', 'Illustrator', 'Sketch', 'Figma', 'XD', 'Axure', 'Principle',
                'UI', 'UX', '平面设计', '交互设计', '视觉设计', '用户体验', '用户界面',
                '界面设计', '原型设计', '设计思维', 'Premiere', 'After Effects', 'Cinema 4D'
            ],
            data: [
                'SQL', 'MySQL', 'MongoDB', 'PostgreSQL', 'Oracle', 'Excel', 'Tableau',
                'SPSS', 'R语言', 'MATLAB', 'Power BI', 'Spark', 'Hadoop', 'Hive',
                '数据分析', '数据挖掘', '数据可视化', '机器学习', '深度学习', '人工智能'
            ],
            engineering: [
                'CAD', 'AutoCAD', 'SolidWorks', 'Pro/E', 'UG', 'CATIA', 'Inventor',
                'ANSYS', 'ABAQUS', 'COMSOL', '有限元', '仿真', '建模', '测试', '实验设计'
            ],
            arts: [  // 新增文体艺术
                '钢琴', '吉他', '小提琴', '舞蹈', '唱歌', '绘画', '书法', '摄影', '视频制作',
                '篮球', '足球', '乒乓球', '羽毛球', '游泳', '跑步', '健身', '瑜伽',
                '演讲', '主持', '辩论', '表演', '相声', '话剧', '朗诵', '配音',
                '文学创作', '诗歌', '小说', '散文', '新闻写作', '编剧', '导演',
                '乐器演奏', '声乐', '作曲', '编曲', '音乐制作', '音响师'
            ]
        };
    }
  
    // 检测专精类型 - 简化版
    detectSpecialization(analysis) {
        const specializations = [];
        const skills = analysis.skills;
        const experience = analysis.experience;
      
        // 技能专精检测
        if (skills.programming && skills.programming.length >= 5) {
            specializations.push({
                type: 'programming',
                category: 'skill',
                level: skills.programming.length,
                bonus: Math.min(skills.programming.length - 4, 5),
                description: `编程开发专精 (掌握${skills.programming.length}项技术)`
            });
        }
      
        if (skills.data && skills.data.length >= 4) {
            specializations.push({
                type: 'data',
                category: 'skill',
                level: skills.data.length,
                bonus: Math.min(skills.data.length - 3, 4),
                description: `数据分析专精 (掌握${skills.data.length}项技术)`
            });
        }
      
        if (skills.design && skills.design.length >= 4) {
            specializations.push({
                type: 'design',
                category: 'skill',
                level: skills.design.length,
                bonus: Math.min(skills.design.length - 3, 4),
                description: `设计创作专精 (掌握${skills.design.length}项技术)`
            });
        }
      
        if (skills.engineering && skills.engineering.length >= 4) {
            specializations.push({
                type: 'engineering',
                category: 'skill',
                level: skills.engineering.length,
                bonus: Math.min(skills.engineering.length - 3, 4),
                description: `工程技术专精 (掌握${skills.engineering.length}项技术)`
            });
        }
      
        if (skills.arts && skills.arts.length >= 4) {
            specializations.push({
                type: 'arts',
                category: 'skill',
                level: skills.arts.length,
                bonus: Math.min(skills.arts.length - 3, 4),
                description: `文体艺术专精 (掌握${skills.arts.length}项技能)`
            });
        }
      
        // 实践专精检测
        if (experience.internshipScore > 15) {
            const extraCount = Math.floor((experience.internshipScore - 15) / 3);
            specializations.push({
                type: 'internship',
                category: 'experience',
                level: Math.floor(experience.internshipScore / 3),
                bonus: Math.min(extraCount, 5),
                description: `实习专精 (${Math.floor(experience.internshipScore / 3)}次实习经历)`
            });
        }
      
        if (experience.projectScore > 15) {
            const extraCount = Math.floor((experience.projectScore - 15) / 3);
            specializations.push({
                type: 'project',
                category: 'experience',
                level: Math.floor(experience.projectScore / 3),
                bonus: Math.min(extraCount, 5),
                description: `项目专精 (${Math.floor(experience.projectScore / 3)}个项目经验)`
            });
        }
      
        if (experience.academicScore > 15) {
            const extraPapers = Math.floor((experience.academicScore - 15) / 3);
            specializations.push({
                type: 'academic',
                category: 'experience',
                level: this.countPapers(analysis.originalText),
                bonus: Math.min(extraPapers, 5),
                description: `学术专精 (${this.countPapers(analysis.originalText)}篇学术成果)`
            });
        }
      
        return specializations;
    }
  
    // 计算论文数量
    countPapers(text) {
        const patterns = [
            /(nature|science)/gi,
            /(JCR.*?[一1]区|影响因子.*?[5-9])/gi,
            /(SCI|sci)/gi,
            /(EI|ei)/gi,
            /(核心期刊|中文期刊)/gi
        ];
      
        let count = 0;
        patterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) count += matches.length;
        });
      
        return count;
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
  
    // 基本信息分析 - 保持不变
    analyzeBasicInfo(text) {
        const info = {};
        let count = 0;
      
        if (this.hasName(text)) { info.name = true; count++; }
        if (/1[3-9]\d{9}/.test(text)) { info.phone = true; count++; }
        if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) { info.email = true; count++; }
        if (/(市|省|区|县|路|街|号|意向|求职)/.test(text)) { info.address = true; count++; }
        if (/(求职|应聘|岗位|职位|意向)/.test(text)) { info.intention = true; count++; }
        if (/(github|gitlab|个人网站|博客|portfolio)/i.test(text)) { info.website = true; count++; }
        if (/(linkedin|微博|知乎)/i.test(text)) { info.social = true; count++; }
        if (/(出生|生日|\d{4}年\d{1,2}月)/.test(text)) { info.birthday = true; count++; }
        if (/(党员|团员|群众|政治面貌)/.test(text)) { info.political = true; count++; }
      
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
  
    // 教育背景分析 - 重新设计
    analyzeEducation(text) {
        const education = {
            schoolLevel: 0,
            hasGPA: /GPA|绩点|平均分|成绩/.test(text),
            gpa: this.extractGPA(text),
            degrees: this.extractDegrees(text),
            degreeScore: 0
        };
      
        education.schoolLevel = this.calculateSchoolScore(text, education.degrees);
        education.degreeScore = this.calculateDegreeScore(education.degrees);
      
        return education;
    }
  
    // 计算学历层次分数
    calculateDegreeScore(degrees) {
        let score = 0;
        const degreeCount = {};
      
        degrees.forEach(degree => {
            if (degree.degree === 'phd') {
                score += 5;
                degreeCount.phd = (degreeCount.phd || 0) + 1;
            } else if (degree.degree === 'master') {
                score += 3;
                degreeCount.master = (degreeCount.master || 0) + 1;
            } else if (degree.degree === 'bachelor') {
                score += 1;
                degreeCount.bachelor = (degreeCount.bachelor || 0) + 1;
            }
        });
      
        // 多学位加分
        const totalDegrees = Object.values(degreeCount).reduce((sum, count) => sum + count, 0);
        if (totalDegrees > 1) {
            score += (totalDegrees - 1) * 1; // 每多一个学位+1分
        }
      
        return Math.min(score, 10); // 最高10分
    }
  
    // 技能识别 - 新增文体艺术
    analyzeSkills(text) {
        const skills = {
            programming: [],
            design: [],
            data: [],
            engineering: [],
            arts: [],  // 新增
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
  
    // 实践经验分析 - 重新设计
    analyzeExperience(text) {
        const internshipCount = Math.max(
            (text.match(/实习|intern/gi) || []).length, 
            (text.match(/(公司|企业|集团|科技|有限).*?(实习|intern)/gi) || []).length
        );
      
        const projectCount = Math.max(
            (text.match(/项目|project/gi) || []).length,
            (text.match(/(开发|设计|完成|负责).*?(项目|系统|网站|APP)/gi) || []).length
        );
      
        const hasCompanyName = /(有限公司|股份|集团|科技|互联网|腾讯|阿里|百度|字节|美团|京东|华为|小米|网易|滴滴|快手)/i.test(text);
        const hasAchievement = /(完成|实现|提升|优化|负责|开发|设计|获得|达到)/i.test(text);
      
        // 计算各项分数
        const internshipScore = Math.min(internshipCount * (hasCompanyName ? 3 : 2.5), 15);
        const projectScore = Math.min(projectCount * (hasAchievement ? 3 : 2.5), 15);
        const academicScore = this.calculateAcademicScore(text);
      
        return {
            internshipCount: internshipCount,
            projectCount: projectCount,
            hasCompanyName: hasCompanyName,
            hasAchievement: hasAchievement,
            internshipScore: internshipScore,
            projectScore: projectScore,
            academicScore: academicScore
        };
    }
  
    // 计算学术成果分数
    calculateAcademicScore(text) {
        let score = 0;
      
        // Nature/Science
        const natureMatches = text.match(/(nature|science)/gi);
        if (natureMatches) score += natureMatches.length * 5;
      
        // JCR一区
        const jcr1Matches = text.match(/(JCR.*?[一1]区|影响因子.*?[5-9])/gi);
        if (jcr1Matches) score += jcr1Matches.length * 4;
      
        // SCI
        const sciMatches = text.match(/(SCI|sci)/gi);
        if (sciMatches) score += sciMatches.length * 3;
      
        // EI
        const eiMatches = text.match(/(EI|ei)/gi);
        if (eiMatches) score += eiMatches.length * 2;
      
        // 中文期刊
        const chineseMatches = text.match(/(核心期刊|中文期刊)/gi);
        if (chineseMatches) score += chineseMatches.length * 1;
      
        return Math.min(score, 15);
    }
  
    // 奖励荣誉分析 - 重新设计
    analyzeAchievements(text) {
        let totalScore = 0;
        const details = {};
      
        // 学生干部
        const chairmanMatches = text.match(/(主席|会长|社长)/gi);
        const ministerMatches = text.match(/(部长|副主席|副会长)/gi);
        const memberMatches = text.match(/(干事|委员|成员)/gi);
      
        if (chairmanMatches) {
            details.chairman = chairmanMatches.length;
            totalScore += chairmanMatches.length * 3;
        }
        if (ministerMatches) {
            details.minister = ministerMatches.length;
            totalScore += ministerMatches.length * 2;
        }
        if (memberMatches) {
            details.member = memberMatches.length;
            totalScore += memberMatches.length * 1;
        }
      
        // 荣誉奖励
        const nationalHonorMatches = text.match(/(国家.*?奖学金|国家.*?荣誉)/gi);
        const provincialHonorMatches = text.match(/(省.*?奖学金|省.*?荣誉)/gi);
        const schoolHonorMatches = text.match(/(校.*?奖学金|校.*?荣誉)/gi);
        const collegeHonorMatches = text.match(/(院.*?奖学金|院.*?荣誉)/gi);
      
        if (nationalHonorMatches) {
            details.nationalHonor = nationalHonorMatches.length;
            totalScore += nationalHonorMatches.length * 4;
        }
        if (provincialHonorMatches) {
            details.provincialHonor = provincialHonorMatches.length;
            totalScore += provincialHonorMatches.length * 3;
        }
        if (schoolHonorMatches) {
            details.schoolHonor = schoolHonorMatches.length;
            totalScore += schoolHonorMatches.length * 2;
        }
        if (collegeHonorMatches) {
            details.collegeHonor = collegeHonorMatches.length;
            totalScore += collegeHonorMatches.length * 1;
        }
      
        // 竞赛获奖
        const internationalCompMatches = text.match(/(国际.*?竞赛|国际.*?比赛)/gi);
        const nationalCompMatches = text.match(/(国家.*?竞赛|全国.*?比赛)/gi);
        const provincialCompMatches = text.match(/(省.*?竞赛|省.*?比赛)/gi);
        const schoolCompMatches = text.match(/(校.*?竞赛|校.*?比赛)/gi);
      
        if (internationalCompMatches) {
            details.internationalComp = internationalCompMatches.length;
            totalScore += internationalCompMatches.length * 4;
        }
        if (nationalCompMatches) {
            details.nationalComp = nationalCompMatches.length;
            totalScore += nationalCompMatches.length * 3;
        }
        if (provincialCompMatches) {
            details.provincialComp = provincialCompMatches.length;
            totalScore += provincialCompMatches.length * 2;
        }
        if (schoolCompMatches) {
            details.schoolComp = schoolCompMatches.length;
            totalScore += schoolCompMatches.length * 1;
        }
      
        // 证书认证
        const advancedCertMatches = text.match(/(高级.*?证书|注册.*?师|CPA|司法考试)/gi);
        const generalCertMatches = text.match(/(四级|六级|计算机.*?级|普通话)/gi);
      
        if (advancedCertMatches) {
            details.advancedCert = advancedCertMatches.length;
            totalScore += advancedCertMatches.length * 2;
        }
        if (generalCertMatches) {
            details.generalCert = generalCertMatches.length;
            totalScore += generalCertMatches.length * 1;
        }
      
        return {
            totalScore: Math.min(totalScore, 15),
            details: details
        };
    }
  
    hasGoodStructure(text) {
        const sections = ['教育', '经历', '技能', '项目', '实习', '工作', '学习', '经验'];
        return sections.filter(section => text.includes(section)).length >= 3;
    }
  
    // 其他方法保持不变 (extractDegrees, calculateSchoolScore, extractGPA等)
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
    
    // 基本信息评分
    scoreBasicInfoDetailed(analysis) {
        const count = analysis.basicInfo.count;
        const total = Math.min(count * 2, this.maxScores.basicInfo);
        
        return {
            total: total,
            details: analysis.basicInfo,
            maxScore: this.maxScores.basicInfo
        };
    }
    
    // 教育背景评分 - 重新设计
    scoreEducationDetailed(analysis) {
        const details = {};
        let total = 0;
        
        // 学校层次分数（最高15分）
        details.school = Math.min(analysis.education.schoolLevel, 15);
        total += details.school;
        
        // 学业成绩（最高5分）
        const gpa4 = analysis.education.gpa;
        if (gpa4 >= 3.7) details.academic = 5;
        else if (gpa4 >= 3.3) details.academic = 4;
        else if (gpa4 >= 2.7) details.academic = 3;
        else if (gpa4 >= 2.0) details.academic = 2;
        else if (analysis.education.hasGPA) details.academic = 1;
        else details.academic = 0;
        total += details.academic;
        
        // 学历层次（最高10分）
        details.degree = analysis.education.degreeScore;
        total += details.degree;
        
        return {
            total: Math.min(total, this.maxScores.education),
            details: details,
            maxScores: { school: 15, academic: 5, degree: 10 }
        };
    }
    
    // 技能评分 - 新增文体艺术，总分降为20
    scoreSkillsDetailed(analysis) {
        const details = {};
        let total = 0;
        const skills = analysis.skills;
        
        // 编程技能（最高4分）
        details.programming = Math.min(skills.programming.length, 4);
        total += details.programming;
        
        // 设计技能（最高4分）
        details.design = Math.min(skills.design.length, 4);
        total += details.design;
        
        // 数据分析（最高4分）
        details.data = Math.min(skills.data.length, 4);
        total += details.data;
        
        // 工程技能（最高4分）
        details.engineering = Math.min(skills.engineering.length, 4);
        total += details.engineering;
        
        // 文体艺术（最高4分）
        details.arts = Math.min(skills.arts.length, 4);
        total += details.arts;
        
        return {
            total: Math.min(total, this.maxScores.skills),
            details: details,
            maxScores: { programming: 4, design: 4, data: 4, engineering: 4, arts: 4 }
        };
    }
    
    // 经验评分 - 重新设计
    scoreExperienceDetailed(analysis) {
        const exp = analysis.experience;
        
        const details = {
            internship: exp.internshipScore,
            project: exp.projectScore,
            academic: exp.academicScore
        };
        
        const total = Math.min(
            details.internship + details.project + details.academic, 
            this.maxScores.experience
        );
        
        return {
            total: total,
            details: details,
            maxScores: { internship: 15, project: 15, academic: 15 }
        };
    }
    
    // 奖励荣誉评分 - 重新设计
    scoreAchievementsDetailed(analysis) {
        const ach = analysis.achievements;
        
        return {
            total: ach.totalScore,
            details: ach.details,
            maxScore: this.maxScores.achievements
        };
    }
    
    // 岗位推荐 - 保持不变但调整匹配度计算
    recommendJobs(analysis, specializations = []) {
        const jobs = [];
        const skills = analysis.skills;
        const education = analysis.education;
        
        // 1. 技术开发类
        if (skills.programming && skills.programming.length > 0) {
            jobs.push({
                category: '软件开发工程师',
                match: Math.min(75 + skills.programming.length * 5, 95),
                reason: `掌握${skills.programming.slice(0, 3).join('、')}等编程技能`
            });
        }
        
        // 2. 数据分析类
        if (skills.data && skills.data.length > 0) {
            jobs.push({
                category: '数据分析师',
                match: Math.min(70 + skills.data.length * 6, 90),
                reason: `具备${skills.data.slice(0, 3).join('、')}等数据处理能力`
            });
        }
        
        // 3. 产品设计类
        if (skills.design && skills.design.length > 0) {
            jobs.push({
                category: '产品设计师',
                match: Math.min(65 + skills.design.length * 7, 88),
                reason: `熟练使用${skills.design.slice(0, 3).join('、')}等设计工具`
            });
        }
        
        // 4. 工程技术类
        if (skills.engineering && skills.engineering.length > 0) {
            jobs.push({
                category: '工程技术岗位',
                match: Math.min(60 + skills.engineering.length * 8, 85),
                reason: `掌握${skills.engineering.slice(0, 3).join('、')}等工程技术`
            });
        }
        
        // 5. 文体艺术类 - 新增
        if (skills.arts && skills.arts.length > 0) {
            jobs.push({
                category: '文体艺术相关岗位',
                match: Math.min(60 + skills.arts.length * 6, 80),
                reason: `具备${skills.arts.slice(0, 3).join('、')}等文体艺术技能`
            });
        }
        
        // 6. 学术研究类
        if (analysis.experience.academicScore > 0) {
            jobs.push({
                category: '学术研究/科研助理',
                match: Math.min(60 + analysis.experience.academicScore * 2, 85),
                reason: `具备学术研究能力和成果`
            });
        }
        
        // 7. 商务运营类
        if (analysis.experience.internshipScore > 0) {
            jobs.push({
                category: '商务运营',
                match: Math.min(60 + analysis.experience.internshipScore, 85),
                reason: '具备商业思维和实习经验'
            });
        }
        
        // 8. 专精加成推荐
        specializations.forEach(spec => {
            if (spec.type === 'programming' && spec.level >= 5) {
                jobs.push({
                    category: '高级软件工程师',
                    match: 90,
                    reason: `编程技能专精（掌握${spec.level}项技术）`
                });
            }
            if (spec.type === 'academic' && spec.level >= 3) {
                jobs.push({
                    category: '博士研究生/高级研发',
                    match: 88,
                    reason: `学术能力突出（${spec.description}）`
                });
            }
        });
        
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
            if (analysis.education.degreeScore < 3) {
                suggestions.push('考虑继续深造提升学历层次');
            }
            suggestions.push('突出学校优势和学术表现');
        }
        
        if (skillScore < 12) {
            suggestions.push('增加与目标岗位相关的技能描述');
            suggestions.push('可以补充文体艺术等综合技能展示');
        }
        
        if (expScore < 15) {
            if (analysis.experience.internshipScore < 6) {
                suggestions.push('寻找更多实习机会，积累实践经验');
            }
            if (analysis.experience.projectScore < 6) {
                suggestions.push('参与更多项目，详细描述项目成果');
            }
            if (analysis.experience.academicScore === 0) {
                suggestions.push('考虑参与学术研究或发表论文');
            }
        }
        
        if (achScore < 8) {
            suggestions.push('积极参加各类竞赛和申请奖学金');
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

// 导出为全局变量
window.ResumeParser = ResumeParser;
window.ResumeScorer = ResumeScorer;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ResumeParser, ResumeScorer };
}
