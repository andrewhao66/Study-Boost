// ==================================================
// Study Booster - 儀表板頁面邏輯
// ==================================================

class Dashboard {
  constructor() {
    this.data = window.studyBoosterData;
    this.utils = window.studyBoosterUtils;
    this.charts = {};
    
    this.init();
  }

  init() {
    this.updateStats();
    this.createCharts();
    this.updateQuickActions();
    this.setupEventListeners();
    
    // 定期更新
    setInterval(() => {
      this.updateStats();
      this.updateCharts();
    }, 60000); // 每分鐘更新一次
  }

  // 更新統計數據
  updateStats() {
    const today = new Date().toDateString();
    const todayStats = this.data.userStats.dailyStats;
    
    // 今日題數
    const totalQuestions = todayStats ? todayStats.questions : 0;
    document.getElementById('totalQuestions').textContent = totalQuestions;
    
    // 學習時間
    const studyTime = todayStats ? Math.round(todayStats.studyTime) : 0;
    document.getElementById('studyTime').textContent = `${studyTime} 分鐘`;
    
    // 正確率
    const accuracy = todayStats && todayStats.questions > 0 
      ? Math.round((todayStats.correctAnswers / todayStats.questions) * 100) 
      : 0;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
    
    // 連續天數
    document.getElementById('streak').textContent = `${this.data.userStats.streak} 天`;
  }

  // 創建圖表
  createCharts() {
    this.createProgressChart();
    this.createTrendChart();
    this.createSubjectChart();
    this.createActivityHeatmap();
  }

  // 學習進度圓餅圖
  createProgressChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    const goals = this.data.goals.daily;
    const todayStats = this.data.userStats.dailyStats || { questions: 0, studyTime: 0, correctAnswers: 0 };
    
    const questionsProgress = Math.min(100, (todayStats.questions / goals.questions) * 100);
    const timeProgress = Math.min(100, (todayStats.studyTime / goals.studyTime) * 100);
    const accuracyProgress = todayStats.questions > 0 
      ? Math.min(100, ((todayStats.correctAnswers / todayStats.questions) * 100) / goals.accuracy * 100)
      : 0;

    this.charts.progressChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['題數進度', '時間進度', '正確率進度', '未完成'],
        datasets: [{
          data: [
            questionsProgress,
            timeProgress,
            accuracyProgress,
            Math.max(0, 300 - questionsProgress - timeProgress - accuracyProgress)
          ],
          backgroundColor: [
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#374151'
          ],
          borderColor: '#1a2332',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#cbd5e1' }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.label}: ${Math.round(context.parsed)}%`;
              }
            }
          }
        }
      }
    });
  }

  // 正確率趨勢折線圖
  createTrendChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    const analyticsData = this.data.getAnalyticsData(7);
    
    this.charts.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: analyticsData.dailyProgress.map(d => this.utils.formatDate(d.date)),
        datasets: [{
          label: '正確率',
          data: analyticsData.dailyProgress.map(d => d.accuracy),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true
        }, {
          label: '題數',
          data: analyticsData.dailyProgress.map(d => d.questions),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          yAxisID: 'y1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: { color: '#374151' },
            ticks: { color: '#cbd5e1' },
            title: {
              display: true,
              text: '正確率 (%)',
              color: '#cbd5e1'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#cbd5e1' },
            title: {
              display: true,
              text: '題數',
              color: '#cbd5e1'
            }
          },
          x: {
            grid: { color: '#374151' },
            ticks: { color: '#cbd5e1' }
          }
        },
        plugins: {
          legend: {
            labels: { color: '#cbd5e1' }
          }
        }
      }
    });
  }

  // 科目分佈圓餅圖
  createSubjectChart() {
    const ctx = document.getElementById('subjectChart').getContext('2d');
    const analyticsData = this.data.getAnalyticsData(30);
    const subjectData = analyticsData.subjectDistribution;
    
    const subjects = Object.keys(subjectData);
    const counts = Object.values(subjectData);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    this.charts.subjectChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: subjects,
        datasets: [{
          data: counts,
          backgroundColor: colors.slice(0, subjects.length),
          borderColor: '#1a2332',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#cbd5e1' }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((context.parsed / total) * 100);
                return `${context.label}: ${context.parsed} 題 (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  // 學習活動熱力圖
  createActivityHeatmap() {
    const container = document.getElementById('activityHeatmap');
    const analyticsData = this.data.getAnalyticsData(365);
    
    // 生成過去一年的熱力圖
    const today = new Date();
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 1);
    
    let html = '<div class="heatmap-grid">';
    
    // 月份標籤
    html += '<div class="heatmap-months">';
    for (let month = 0; month < 12; month++) {
      const date = new Date(today.getFullYear(), month, 1);
      html += `<div class="heatmap-month">${date.toLocaleDateString('zh-TW', { month: 'short' })}</div>`;
    }
    html += '</div>';
    
    // 星期標籤
    html += '<div class="heatmap-weekdays">';
    ['一', '二', '三', '四', '五', '六', '日'].forEach(day => {
      html += `<div class="heatmap-weekday">${day}</div>`;
    });
    html += '</div>';
    
    // 日期格子
    html += '<div class="heatmap-days">';
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = analyticsData.dailyProgress.find(d => d.date === dateStr);
      const level = this.getHeatmapLevel(dayData ? dayData.questions : 0);
      
      html += `<div class="heatmap-day level-${level}" 
                    title="${this.utils.formatDate(currentDate)}: ${dayData ? dayData.questions : 0} 題"
                    data-date="${dateStr}"></div>`;
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    html += '</div>';
    
    html += '</div>';
    container.innerHTML = html;
  }

  // 獲取熱力圖等級
  getHeatmapLevel(questions) {
    if (questions === 0) return 0;
    if (questions <= 5) return 1;
    if (questions <= 15) return 2;
    if (questions <= 30) return 3;
    return 4;
  }

  // 更新快速操作
  updateQuickActions() {
    const wrongCount = this.data.wrongQuestions.size;
    const actionCard = document.querySelector('.action-card:nth-child(2) .action-desc');
    if (actionCard) {
      actionCard.textContent = `${wrongCount} 題待複習`;
    }
  }

  // 更新圖表
  updateCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.update === 'function') {
        chart.update();
      }
    });
  }

  // 設置事件監聽器
  setupEventListeners() {
    // 圖表刷新按鈕
    document.querySelectorAll('[onclick*="refreshChart"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const chartId = e.target.getAttribute('onclick').match(/'(\w+)'/)[1];
        this.refreshChart(chartId);
      });
    });

    // 趨勢圖時間範圍選擇
    const trendPeriod = document.getElementById('trendPeriod');
    if (trendPeriod) {
      trendPeriod.addEventListener('change', () => {
        this.updateTrendChart(parseInt(trendPeriod.value));
      });
    }
  }

  // 刷新指定圖表
  refreshChart(chartId) {
    switch (chartId) {
      case 'progressChart':
        this.charts.progressChart.destroy();
        this.createProgressChart();
        break;
      case 'trendChart':
        this.charts.trendChart.destroy();
        this.createTrendChart();
        break;
      case 'subjectChart':
        this.charts.subjectChart.destroy();
        this.createSubjectChart();
        break;
    }
    
    this.utils.showNotification('圖表已更新', 'success');
  }

  // 更新趨勢圖時間範圍
  updateTrendChart(days) {
    this.charts.trendChart.destroy();
    
    const ctx = document.getElementById('trendChart').getContext('2d');
    const analyticsData = this.data.getAnalyticsData(days);
    
    // 重新創建趨勢圖，使用新的時間範圍
    this.createTrendChart();
  }
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
});

// 添加熱力圖樣式
const heatmapStyles = `
<style>
.heatmap-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
  gap: 8px;
  font-size: 12px;
}

.heatmap-months {
  grid-column: 2;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 2px;
  margin-bottom: 4px;
}

.heatmap-month {
  text-align: center;
  color: var(--text-muted);
}

.heatmap-weekdays {
  grid-row: 2;
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  gap: 2px;
  margin-right: 4px;
}

.heatmap-weekday {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  height: 12px;
}

.heatmap-days {
  grid-column: 2;
  grid-row: 2;
  display: grid;
  grid-template-columns: repeat(53, 12px);
  grid-template-rows: repeat(7, 12px);
  gap: 2px;
  grid-auto-flow: column;
}

.heatmap-day {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.heatmap-day.level-0 { background-color: #374151; }
.heatmap-day.level-1 { background-color: #1e40af; }
.heatmap-day.level-2 { background-color: #3b82f6; }
.heatmap-day.level-3 { background-color: #60a5fa; }
.heatmap-day.level-4 { background-color: #93c5fd; }

.heatmap-day:hover {
  transform: scale(1.2);
  z-index: 10;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', heatmapStyles);