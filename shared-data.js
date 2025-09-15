// ==================================================
// Study Booster - 共用數據管理系統
// ==================================================

class StudyBoosterData {
  constructor() {
    this.initializeData();
    this.setupEventListeners();
  }

  // 初始化數據
  initializeData() {
    // 題庫數據
    this.questions = this.loadData('questions', this.getDefaultQuestions());
    
    // 用戶設定
    this.settings = this.loadData('settings', this.getDefaultSettings());
    
    // 學習記錄
    this.attempts = this.loadData('attempts', []);
    
    // 錯題集
    this.wrongQuestions = new Set(this.loadData('wrongQuestions', []));
    
    // 用戶統計
    this.userStats = this.loadData('userStats', this.getDefaultStats());
    
    // 學習目標
    this.goals = this.loadData('goals', this.getDefaultGoals());
    
    // 檢查是否為新的一天
    this.checkNewDay();
  }

  // 預設題庫
  getDefaultQuestions() {
    return [
      {
        id: 'q001',
        subject: ['數學', '二次函數'],
        difficulty: 'E',
        stem: '函數 f(x) = x² - 4x + 3 的對稱軸方程式為？',
        options: ['x = 1', 'x = 2', 'x = 3', 'x = 4'],
        answer: 1,
        explanation: '二次函數 f(x) = ax² + bx + c 的對稱軸為 x = -b/(2a)。這裡 a=1, b=-4，所以對稱軸為 x = -(-4)/(2×1) = 2。',
        mastery: 0.3,
        lastSeen: null,
        tags: ['二次函數', '對稱軸'],
        estimatedTime: 60
      },
      {
        id: 'q002',
        subject: ['物理', '力學'],
        difficulty: 'M',
        stem: '一物體從高度 h 自由落下，落地時的速度大小為？',
        options: ['√(gh)', '√(2gh)', '2√(gh)', '√(gh/2)'],
        answer: 1,
        explanation: '由能量守恆定律：mgh = ½mv²，解得 v = √(2gh)。',
        mastery: 0.4,
        lastSeen: null,
        tags: ['自由落體', '能量守恆'],
        estimatedTime: 90
      },
      {
        id: 'q003',
        subject: ['英文', '文法'],
        difficulty: 'M',
        stem: 'Choose the correct sentence:',
        options: [
          'He don\'t like apples.',
          'He doesn\'t likes apples.',
          'He doesn\'t like apples.',
          'He not like apples.'
        ],
        answer: 2,
        explanation: '第三人稱單數的否定句使用 "doesn\'t" + 動詞原形。',
        mastery: 0.5,
        lastSeen: null,
        tags: ['第三人稱單數', '否定句'],
        estimatedTime: 45
      },
      {
        id: 'q004',
        subject: ['化學', '原子結構'],
        difficulty: 'H',
        stem: '氫原子的第一游離能約為多少 eV？',
        options: ['10.8', '13.6', '15.4', '17.2'],
        answer: 1,
        explanation: '氫原子的第一游離能是將電子從基態移除所需的能量，約為 13.6 eV。',
        mastery: 0.35,
        lastSeen: null,
        tags: ['游離能', '氫原子'],
        estimatedTime: 120
      },
      {
        id: 'q005',
        subject: ['數學', '三角函數'],
        difficulty: 'M',
        stem: 'sin²θ + cos²θ 的值恆等於？',
        options: ['0', '1', '2', 'sinθ'],
        answer: 1,
        explanation: '這是三角函數的基本恆等式，對於任意角度 θ 都成立。',
        mastery: 0.6,
        lastSeen: null,
        tags: ['三角恆等式'],
        estimatedTime: 30
      }
    ];
  }

  // 預設設定
  getDefaultSettings() {
    return {
      profile: {
        displayName: '學習者',
        studyLevel: 'highschool',
        subjects: ['math', 'physics', 'chemistry', 'english']
      },
      appearance: {
        theme: 'dark',
        fontSize: 'medium',
        animations: true,
        soundEffects: true
      },
      notifications: {
        studyReminder: true,
        goalAchievement: true,
        reviewReminder: true,
        weeklyReport: false,
        reminderTime: '19:00'
      },
      advanced: {
        ewmaAlpha: 0.15,
        difficultyFactor: 1.2,
        forgettingCurve: 0.7,
        aiRecommendation: false,
        voiceInput: false,
        collaborative: false
      }
    };
  }

  // 預設統計數據
  getDefaultStats() {
    return {
      totalQuestions: 0,
      totalStudyTime: 0, // 分鐘
      streak: 0,
      longestStreak: 0,
      subjectStats: {},
      dailyStats: {},
      weeklyStats: {},
      monthlyStats: {}
    };
  }

  // 預設學習目標
  getDefaultGoals() {
    return {
      daily: {
        questions: 30,
        studyTime: 45, // 分鐘
        accuracy: 75
      },
      longTerm: []
    };
  }

  // 數據持久化
  saveData(key, data) {
    try {
      localStorage.setItem(`studyBooster_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('保存數據失敗:', error);
    }
  }

  loadData(key, defaultValue) {
    try {
      const data = localStorage.getItem(`studyBooster_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error('載入數據失敗:', error);
      return defaultValue;
    }
  }

  // 檢查新的一天
  checkNewDay() {
    const today = new Date().toDateString();
    const lastDate = this.loadData('lastActiveDate', null);
    
    if (lastDate !== today) {
      this.onNewDay();
      this.saveData('lastActiveDate', today);
    }
  }

  // 新一天的處理
  onNewDay() {
    // 重置每日統計
    this.userStats.dailyStats = {
      date: new Date().toISOString().split('T')[0],
      questions: 0,
      correctAnswers: 0,
      studyTime: 0,
      subjects: {}
    };
    
    // 檢查昨日目標達成情況
    this.checkDailyGoals();
    
    this.saveAllData();
  }

  // 檢查每日目標
  checkDailyGoals() {
    const yesterday = this.userStats.dailyStats;
    if (!yesterday) return;
    
    const goals = this.goals.daily;
    const achieved = [
      yesterday.questions >= goals.questions,
      yesterday.studyTime >= goals.studyTime,
      (yesterday.correctAnswers / Math.max(yesterday.questions, 1)) >= (goals.accuracy / 100)
    ].filter(Boolean).length;
    
    if (achieved >= 2) {
      this.userStats.streak++;
      this.userStats.longestStreak = Math.max(this.userStats.streak, this.userStats.longestStreak);
    } else {
      this.userStats.streak = 0;
    }
  }

  // 記錄答題
  recordAttempt(questionId, isCorrect, timeSpent) {
    const attempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      questionId,
      isCorrect,
      timeSpent,
      timestamp: new Date().toISOString(),
      date: new Date().toDateString()
    };
    
    this.attempts.push(attempt);
    
    // 更新題目掌握度
    const question = this.questions.find(q => q.id === questionId);
    if (question) {
      question.mastery = this.updateMastery(question.mastery, isCorrect);
      question.lastSeen = new Date().toISOString();
    }
    
    // 更新錯題集
    if (!isCorrect) {
      this.wrongQuestions.add(questionId);
    } else {
      // 如果答對了，檢查是否可以從錯題集移除
      if (question && question.mastery > 0.7) {
        this.wrongQuestions.delete(questionId);
      }
    }
    
    // 更新統計數據
    this.updateStats(questionId, isCorrect, timeSpent);
    
    this.saveAllData();
    
    return attempt;
  }

  // 更新掌握度
  updateMastery(currentMastery, isCorrect) {
    const alpha = this.settings.advanced.ewmaAlpha;
    const target = isCorrect ? 1 : 0;
    return alpha * target + (1 - alpha) * currentMastery;
  }

  // 更新統計數據
  updateStats(questionId, isCorrect, timeSpent) {
    const today = new Date().toDateString();
    
    // 初始化今日統計
    if (!this.userStats.dailyStats || this.userStats.dailyStats.date !== today) {
      this.userStats.dailyStats = {
        date: today,
        questions: 0,
        correctAnswers: 0,
        studyTime: 0,
        subjects: {}
      };
    }
    
    const dailyStats = this.userStats.dailyStats;
    const question = this.questions.find(q => q.id === questionId);
    
    if (question) {
      const subject = question.subject[0];
      
      // 更新每日統計
      dailyStats.questions++;
      if (isCorrect) dailyStats.correctAnswers++;
      dailyStats.studyTime += timeSpent / 60; // 轉換為分鐘
      
      // 更新科目統計
      if (!dailyStats.subjects[subject]) {
        dailyStats.subjects[subject] = { questions: 0, correct: 0, time: 0 };
      }
      dailyStats.subjects[subject].questions++;
      if (isCorrect) dailyStats.subjects[subject].correct++;
      dailyStats.subjects[subject].time += timeSpent / 60;
      
      // 更新總統計
      this.userStats.totalQuestions++;
      this.userStats.totalStudyTime += timeSpent / 60;
    }
  }

  // 智能題目推薦
  getRecommendedQuestion(options = {}) {
    const {
      preferWrongQuestions = true,
      excludeRecent = true,
      difficultyRange = null,
      subjects = null
    } = options;
    
    let candidates = [...this.questions];
    
    // 篩選科目
    if (subjects && subjects.length > 0) {
      candidates = candidates.filter(q => 
        q.subject.some(s => subjects.includes(s))
      );
    }
    
    // 篩選難度
    if (difficultyRange) {
      candidates = candidates.filter(q => 
        difficultyRange.includes(q.difficulty)
      );
    }
    
    // 排除最近做過的題目
    if (excludeRecent) {
      const recentThreshold = Date.now() - (2 * 60 * 60 * 1000); // 2小時
      candidates = candidates.filter(q => 
        !q.lastSeen || new Date(q.lastSeen).getTime() < recentThreshold
      );
    }
    
    if (candidates.length === 0) {
      candidates = [...this.questions];
    }
    
    // 計算權重
    const weights = candidates.map(question => {
      let weight = 1;
      
      // 錯題優先
      if (preferWrongQuestions && this.wrongQuestions.has(question.id)) {
        weight *= 3;
      }
      
      // 掌握度低的優先
      weight *= (1 - question.mastery) * 2 + 0.5;
      
      // 難度權重
      const difficultyWeights = { E: 1, M: 1.2, H: 1.5 };
      weight *= difficultyWeights[question.difficulty] || 1;
      
      // 時間間隔權重
      if (question.lastSeen) {
        const daysSince = (Date.now() - new Date(question.lastSeen).getTime()) / (24 * 60 * 60 * 1000);
        weight *= Math.min(daysSince / 7, 2); // 一週後權重最大
      } else {
        weight *= 1.5; // 從未做過的題目
      }
      
      return weight;
    });
    
    // 加權隨機選擇
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < candidates.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return candidates[i];
      }
    }
    
    return candidates[candidates.length - 1];
  }

  // 獲取學習分析數據
  getAnalyticsData(timeRange = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - timeRange);
    
    const filteredAttempts = this.attempts.filter(attempt => {
      const attemptDate = new Date(attempt.timestamp);
      return attemptDate >= startDate && attemptDate <= endDate;
    });
    
    return {
      attempts: filteredAttempts,
      accuracy: this.calculateAccuracy(filteredAttempts),
      studyTime: this.calculateStudyTime(filteredAttempts),
      subjectDistribution: this.calculateSubjectDistribution(filteredAttempts),
      difficultyDistribution: this.calculateDifficultyDistribution(filteredAttempts),
      dailyProgress: this.calculateDailyProgress(filteredAttempts, timeRange),
      improvements: this.calculateImprovements(filteredAttempts)
    };
  }

  // 計算正確率
  calculateAccuracy(attempts) {
    if (attempts.length === 0) return 0;
    const correct = attempts.filter(a => a.isCorrect).length;
    return (correct / attempts.length) * 100;
  }

  // 計算學習時間
  calculateStudyTime(attempts) {
    return attempts.reduce((total, attempt) => total + attempt.timeSpent, 0) / 60; // 分鐘
  }

  // 計算科目分佈
  calculateSubjectDistribution(attempts) {
    const distribution = {};
    attempts.forEach(attempt => {
      const question = this.questions.find(q => q.id === attempt.questionId);
      if (question) {
        const subject = question.subject[0];
        distribution[subject] = (distribution[subject] || 0) + 1;
      }
    });
    return distribution;
  }

  // 計算難度分佈
  calculateDifficultyDistribution(attempts) {
    const distribution = { E: 0, M: 0, H: 0 };
    attempts.forEach(attempt => {
      const question = this.questions.find(q => q.id === attempt.questionId);
      if (question) {
        distribution[question.difficulty]++;
      }
    });
    return distribution;
  }

  // 計算每日進度
  calculateDailyProgress(attempts, days) {
    const progress = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const dayAttempts = attempts.filter(a => 
        new Date(a.timestamp).toDateString() === dateStr
      );
      
      progress.push({
        date: date.toISOString().split('T')[0],
        questions: dayAttempts.length,
        accuracy: this.calculateAccuracy(dayAttempts),
        studyTime: this.calculateStudyTime(dayAttempts)
      });
    }
    return progress;
  }

  // 計算改善情況
  calculateImprovements(attempts) {
    // 這裡可以實現更複雜的改善分析算法
    const recentAttempts = attempts.slice(-50);
    const olderAttempts = attempts.slice(-100, -50);
    
    const recentAccuracy = this.calculateAccuracy(recentAttempts);
    const olderAccuracy = this.calculateAccuracy(olderAttempts);
    
    return {
      accuracyChange: recentAccuracy - olderAccuracy,
      trend: recentAccuracy > olderAccuracy ? 'improving' : 'declining'
    };
  }

  // 保存所有數據
  saveAllData() {
    this.saveData('questions', this.questions);
    this.saveData('settings', this.settings);
    this.saveData('attempts', this.attempts);
    this.saveData('wrongQuestions', Array.from(this.wrongQuestions));
    this.saveData('userStats', this.userStats);
    this.saveData('goals', this.goals);
  }

  // 設置事件監聽器
  setupEventListeners() {
    // 頁面卸載時保存數據
    window.addEventListener('beforeunload', () => {
      this.saveAllData();
    });
    
    // 定期保存數據
    setInterval(() => {
      this.saveAllData();
    }, 30000); // 每30秒保存一次
  }

  // 匯出數據
  exportData() {
    const data = {
      questions: this.questions,
      settings: this.settings,
      attempts: this.attempts,
      wrongQuestions: Array.from(this.wrongQuestions),
      userStats: this.userStats,
      goals: this.goals,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_booster_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 匯入數據
  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // 驗證數據格式
      if (data.questions && data.settings && data.attempts) {
        this.questions = data.questions;
        this.settings = data.settings;
        this.attempts = data.attempts;
        this.wrongQuestions = new Set(data.wrongQuestions || []);
        this.userStats = data.userStats || this.getDefaultStats();
        this.goals = data.goals || this.getDefaultGoals();
        
        this.saveAllData();
        return true;
      } else {
        throw new Error('數據格式不正確');
      }
    } catch (error) {
      console.error('匯入數據失敗:', error);
      return false;
    }
  }

  // 重置所有數據
  resetAllData() {
    if (confirm('確定要重置所有數據嗎？此操作無法復原！')) {
      localStorage.clear();
      this.initializeData();
      window.location.reload();
    }
  }
}

// 創建全局數據管理實例
window.studyBoosterData = new StudyBoosterData();

// 工具函數
window.studyBoosterUtils = {
  // 格式化時間
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },
  
  // 格式化日期
  formatDate(date) {
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  },
  
  // 顯示通知
  showNotification(message, type = 'info') {
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加樣式
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: '10000',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // 顯示動畫
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自動隱藏
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  },
  
  // 防抖函數
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // 節流函數
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};