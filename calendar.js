// 当前选中的筛选条件
let currentFilter = '全部';
let currentDate = new Date();

// API 基础URL
const API_BASE_URL = window.API_CONFIG.baseURL;

// 调试函数
function debug(message, data) {
    console.log(`[Debug] ${message}:`, data);
}

// 检查是否在日历页面
function isCalendarPage() {
    return document.querySelector('.calendar-page') !== null;
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    if (!isCalendarPage()) return;
    
    debug('页面加载完成');
    initCalendar();
    refreshData();
    initNewsDetail();
});

// 初始化筛选按钮
function initFilters(categories = []) {
    debug('初始化筛选按钮', categories);
    const filterContainer = document.querySelector('.filter');
    if (!filterContainer) {
        console.error('找不到筛选按钮容器');
        return;
    }
    filterContainer.innerHTML = '';

    // 添加"全部"按钮
    const allButton = document.createElement('a');
    allButton.href = '#';
    allButton.className = 'filter-btn' + (currentFilter === '全部' ? ' active' : '');
    allButton.textContent = '全部';
    filterContainer.appendChild(allButton);

    // 为每个分类添加按钮
    categories.forEach(category => {
        if (!category || !category.type) return;
        const button = document.createElement('a');
        button.href = '#';
        button.className = 'filter-btn' + (currentFilter === category.type ? ' active' : '');
        button.textContent = category.type;
        filterContainer.appendChild(button);
    });

    // 添加点击事件
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const activeBtn = document.querySelector('.filter-btn.active');
            if (activeBtn) {
                activeBtn.classList.remove('active');
            }
            btn.classList.add('active');
            currentFilter = btn.textContent;
            refreshData();
        });
    });
}

// 获取日历数据
async function fetchCalendarData(year, month, day) {
    try {
        const params = new URLSearchParams();
        if (year) params.append('year', year);
        if (month) params.append('month', month);
        if (day) params.append('day', day);
        if (currentFilter !== '全部') params.append('category', currentFilter);

        const url = `${API_BASE_URL}/calendar?${params.toString()}`;
        debug('请求URL', url);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        debug('服务器响应', result);
        
        if (result.code === 0) {
            displayCalendarData(result.data || []);
            if (result.categories && Array.isArray(result.categories)) {
                initFilters(result.categories);
                updateCategories(result.categories);
            }
        } else {
            console.error('获取日历数据失败:', result.message);
            displayError('获取数据失败，请稍后重试');
        }
    } catch (error) {
        console.error('请求日历数据出错:', error);
        displayError('网络错误，请检查连接');
    }
}

// 显示日历数据
function displayCalendarData(data = []) {
    debug('显示日历数据', data);
    const newsItems = document.querySelector('.news-items');
    if (!newsItems) {
        console.error('找不到新闻列表容器');
        return;
    }
    
    // 更新日期显示
    const dateDisplay = document.querySelector('.date span');
    if (dateDisplay) {
        dateDisplay.textContent = formatDate(currentDate);
    }

    // 更新消息数量
    const newsCount = document.querySelector('.news-count');
    if (newsCount) {
        newsCount.textContent = `${data.length}条讯息`;
    }

    // 清空现有内容并显示加载状态
    newsItems.innerHTML = '<div class="loading">加载中...</div>';

    // 检查数据是否为空
    if (!Array.isArray(data) || data.length === 0) {
        newsItems.innerHTML = '<div class="no-data">暂无数据</div>';
        return;
    }

    // 创建新闻列表容器
    const newsContainer = document.createElement('div');
    newsContainer.className = 'news-container';

    // 显示新闻列表
    data.forEach(item => {
        if (!item) return;
        
        try {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            
            const date = new Date(item.datetime);
            const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            
            newsItem.innerHTML = `
                <div class="time">${time}</div>
                <div class="content">
                    <div class="title">${escapeHtml(item.title || '无标题')}</div>
                    <div class="desc">${escapeHtml(item.content || '无描述')}</div>
                    <div class="source">
                        <a href="${item.source_url || '#'}" target="_blank" class="source-name">查看原文</a>
                        <div class="stats">
                            ${item.score ? `
                            <span class="stat-item">
                                <span class="rating">评分: ${item.score}</span>
                            </span>` : ''}
                            <span class="stat-item">
                                <span class="week-day">星期${item.weekday || '未知'}</span>
                            </span>
                            ${item.type ? `
                            <span class="stat-item">
                                <span class="type">${item.type}</span>
                            </span>` : ''}
                            ${item.related_coins ? `
                            <span class="stat-item">
                                <span class="coins">${item.related_coins}</span>
                            </span>` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            if (item.importance === 1) {
                newsItem.classList.add('important');
            }

            // 为每个新闻项添加点击事件
            newsItem.addEventListener('click', (e) => {
                // 阻止链接的默认点击事件
                if (e.target.tagName === 'A') {
                    e.stopPropagation();
                    return;
                }
                
                const newsData = {
                    title: item.title || '无标题',
                    time: time,
                    source: '查看原文',
                    sourceUrl: item.source_url || '#',
                    content: item.content || '无描述',
                    type: item.type,
                    score: item.score,
                    related_coins: item.related_coins,
                    importance: item.importance
                };
                showNewsDetail(newsData);
            });
            
            newsContainer.appendChild(newsItem);
        } catch (error) {
            console.error('处理新闻项时出错:', error, item);
        }
    });

    // 清空加载状态并添加新闻列表
    newsItems.innerHTML = '';
    newsItems.appendChild(newsContainer);
}

// HTML转义函数
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 显示错误信息
function displayError(message) {
    debug('显示错误信息', message);
    const newsItems = document.querySelector('.news-items');
    if (newsItems) {
        newsItems.innerHTML = `<div class="error-message">${message}</div>`;
        const newsCount = document.querySelector('.news-count');
        if (newsCount) {
            newsCount.textContent = '加载失败';
        }
    }
}

// 显示加载状态
function showLoading() {
    const newsItems = document.querySelector('.news-items');
    if (newsItems) {
        newsItems.innerHTML = '<div class="loading">加载中...</div>';
    }
}

// 格式化日期显示
function formatDate(date) {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return `${date.getMonth() + 1}月${date.getDate()}日 星期${days[date.getDay()]}`;
}

// 刷新数据
async function refreshData() {
    debug('刷新数据');
    showLoading();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    await fetchCalendarData(year, month, day);
}

// 初始化日历
function initCalendar() {
    debug('初始化日历');
    const daysContainer = document.querySelector('.days');
    if (!daysContainer) {
        console.error('找不到日历容器');
        return;
    }

    function renderCalendar() {
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // 获取上个月的最后一天
        const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        const prevMonthDays = prevMonthLastDay.getDate();
        
        // 更新月份显示
        const currentMonthElement = document.querySelector('.current-month');
        if (currentMonthElement) {
            currentMonthElement.textContent = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
        }

        daysContainer.innerHTML = '';
        
        // 添加上个月的天数
        const firstDayOfWeek = firstDay.getDay();
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const dayElement = document.createElement('div');
            const day = prevMonthDays - i;
            dayElement.className = 'day other-month';
            dayElement.textContent = day;
            dayElement.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() - 1);
                currentDate.setDate(day);
                refreshData();
                renderCalendar();
            });
            daysContainer.appendChild(dayElement);
        }
        
        // 添加当前月的天数
        const today = new Date();
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = i;
            
            // 标记今天
            if (i === today.getDate() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear()) {
                dayElement.classList.add('today');
            }
            
            // 标记选中的日期
            if (i === currentDate.getDate()) {
                dayElement.classList.add('active');
            }
            
            dayElement.addEventListener('click', () => {
                const activeDay = document.querySelector('.day.active');
                if (activeDay) {
                    activeDay.classList.remove('active');
                }
                dayElement.classList.add('active');
                currentDate.setDate(i);
                refreshData();
            });
            
            daysContainer.appendChild(dayElement);
        }
        
        // 添加下个月的天数
        const totalDaysShown = firstDayOfWeek + lastDay.getDate();
        const nextMonthDays = 42 - totalDaysShown; // 6行7列 = 42
        for (let i = 1; i <= nextMonthDays; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day other-month';
            dayElement.textContent = i;
            dayElement.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() + 1);
                currentDate.setDate(i);
                refreshData();
                renderCalendar();
            });
            daysContainer.appendChild(dayElement);
        }
    }

    // 添加导航按钮事件
    const prevButton = document.querySelector('.nav-btn.prev');
    const nextButton = document.querySelector('.nav-btn.next');
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
            refreshData();
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
            refreshData();
        });
    }

    renderCalendar();
}

// 更新分类统计
function updateCategories(categories = []) {
    debug('更新分类统计', categories);
    const categoryList = document.querySelector('.category-list');
    if (!categoryList) {
        console.error('找不到分类列表容器');
        return;
    }
    categoryList.innerHTML = '';

    const categoryColors = {
        '重要公告': 'var(--up-color)',
        '项目进展': 'var(--primary-color)',
        '数据分析': 'var(--down-color)'
    };

    // 添加"全部"选项
    const allCategoryItem = document.createElement('label');
    allCategoryItem.className = 'category-item';
    const totalCount = categories.reduce((sum, cat) => sum + (cat.count || 0), 0);
    allCategoryItem.innerHTML = `
        <input type="checkbox" checked>
        <span class="category-color" style="background: var(--primary-color)"></span>
        <span class="category-name">全部</span>
        <span class="category-count">${totalCount}</span>
    `;
    categoryList.appendChild(allCategoryItem);

    // 添加其他分类
    categories.forEach(category => {
        if (!category || !category.type) return;
        const categoryItem = document.createElement('label');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
            <input type="checkbox" ${currentFilter === category.type ? 'checked' : ''}>
            <span class="category-color" style="background: ${categoryColors[category.type] || 'var(--primary-color)'}"></span>
            <span class="category-name">${category.type}</span>
            <span class="category-count">${category.count || 0}</span>
        `;
        categoryList.appendChild(categoryItem);

        // 添加点击事件
        categoryItem.addEventListener('click', () => {
            currentFilter = category.type;
            refreshData();
        });
    });

    // 为"全部"添加点击事件
    allCategoryItem.addEventListener('click', () => {
        currentFilter = '全部';
        refreshData();
    });
}

class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.currentFilter = '全部';
        this.themeObserver = null;
        this.init();
    }

    init() {
        this.initCalendar();
        this.initThemeListener();
        this.fetchCalendarData();
    }

    initThemeListener() {
        // 监听系统主题变化
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener(this.handleThemeChange.bind(this));

        // 监听手动主题变化
        this.themeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    this.handleThemeChange();
                }
            });
        });

        // 开始观察 html 标签的 data-theme 属性变化
        const htmlElement = document.documentElement;
        this.themeObserver.observe(htmlElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        // 初始化时更新一次主题
        this.handleThemeChange();
    }

    handleThemeChange() {
        const calendar = document.querySelector('.calendar-wrapper');
        if (!calendar) return;

        // 获取当前主题
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isAutoTheme = currentTheme === 'auto';

        // 确定实际使用的主题
        const isDarkMode = currentTheme === 'dark' || (isAutoTheme && systemDarkMode);

        // 更新主题类
        calendar.classList.remove('theme-transitioning');
        calendar.classList.remove('theme-light', 'theme-dark');
        
        // 触发重排以确保过渡效果
        calendar.offsetHeight;

        // 添加过渡类
        calendar.classList.add('theme-transitioning');
        calendar.classList.add(isDarkMode ? 'theme-dark' : 'theme-light');

        // 更新日期样式
        this.updateDayStyles(isDarkMode);

        // 移除过渡类
        setTimeout(() => {
            calendar.classList.remove('theme-transitioning');
        }, 300);
    }

    updateDayStyles(isDarkMode) {
        const days = document.querySelectorAll('.calendar-day');
        const today = new Date();
        
        days.forEach(day => {
            const dayNumber = parseInt(day.textContent);
            const isToday = dayNumber === today.getDate() &&
                this.currentDate.getMonth() === today.getMonth() &&
                this.currentDate.getFullYear() === today.getFullYear();
            const isSelected = dayNumber === this.currentDate.getDate();
            
            // 更新今天的样式
            day.classList.toggle('today', isToday);
            
            // 更新选中状态
            day.classList.toggle('active', isSelected);
            
            // 更新主题相关的样式
            day.style.setProperty('--day-hover-opacity', isDarkMode ? '0.2' : '0.1');
            
            // 为事件添加主题特定的样式
            const events = day.querySelectorAll('.calendar-event');
            events.forEach(event => {
                event.style.setProperty('--event-hover-brightness', isDarkMode ? '1.2' : '1.1');
            });
        });
    }

    initCalendar() {
        const daysContainer = document.querySelector('.days');
        if (!daysContainer) {
            console.error('找不到日历容器');
            return;
        }

        // 使用箭头函数保持 this 上下文
        const renderCalendar = () => {
            const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
            const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
            
            // 获取上个月的最后一天
            const prevMonthLastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 0);
            const prevMonthDays = prevMonthLastDay.getDate();
            
            // 更新月份显示
            const currentMonthElement = document.querySelector('.current-month');
            if (currentMonthElement) {
                currentMonthElement.textContent = `${this.currentDate.getFullYear()}年${this.currentDate.getMonth() + 1}月`;
            }

            daysContainer.innerHTML = '';
            
            // 添加上个月的天数
            const firstDayOfWeek = firstDay.getDay();
            for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                const dayElement = document.createElement('div');
                const day = prevMonthDays - i;
                dayElement.className = 'day other-month';
                dayElement.textContent = day;
                dayElement.addEventListener('click', () => {
                    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                    this.currentDate.setDate(day);
                    this.fetchCalendarData();
                    renderCalendar();
                });
                daysContainer.appendChild(dayElement);
            }
            
            // 添加当前月的天数
            const today = new Date();
            for (let i = 1; i <= lastDay.getDate(); i++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'day';
                dayElement.textContent = i;
                
                // 标记今天
                if (i === today.getDate() &&
                    this.currentDate.getMonth() === today.getMonth() &&
                    this.currentDate.getFullYear() === today.getFullYear()) {
                    dayElement.classList.add('today');
                }
                
                // 标记选中的日期
                if (i === this.currentDate.getDate()) {
                    dayElement.classList.add('active');
                }
                
                dayElement.addEventListener('click', () => {
                    const activeDay = document.querySelector('.day.active');
                    if (activeDay) {
                        activeDay.classList.remove('active');
                    }
                    dayElement.classList.add('active');
                    this.currentDate.setDate(i);
                    this.fetchCalendarData();
                });
                
                daysContainer.appendChild(dayElement);
            }
            
            // 添加下个月的天数
            const totalDaysShown = firstDayOfWeek + lastDay.getDate();
            const nextMonthDays = 42 - totalDaysShown; // 6行7列 = 42
            for (let i = 1; i <= nextMonthDays; i++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'day other-month';
                dayElement.textContent = i;
                dayElement.addEventListener('click', () => {
                    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                    this.currentDate.setDate(i);
                    this.fetchCalendarData();
                    renderCalendar();
                });
                daysContainer.appendChild(dayElement);
            }
        };

        // 添加导航按钮事件
        const prevButton = document.querySelector('.nav-btn.prev');
        const nextButton = document.querySelector('.nav-btn.next');
        
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                renderCalendar();
                this.fetchCalendarData();
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                renderCalendar();
                this.fetchCalendarData();
            });
        }

        renderCalendar();
    }

    async fetchCalendarData() {
        try {
            const year = this.currentDate.getFullYear();
            const month = (this.currentDate.getMonth() + 1).toString().padStart(2, '0');
            const day = this.currentDate.getDate().toString().padStart(2, '0');
            
            const params = new URLSearchParams();
            params.append('year', year);
            params.append('month', month);
            params.append('day', day);
            if (this.currentFilter !== '全部') {
                params.append('category', this.currentFilter);
            }

            const url = `${API_BASE_URL}/calendar?${params.toString()}`;
            debug('请求URL', url);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            debug('服务器响应', result);
            
            if (result.code === 0) {
                this.displayCalendarData(result.data || []);
                if (result.categories && Array.isArray(result.categories)) {
                    this.initFilters(result.categories);
                    this.updateCategories(result.categories);
                }
            } else {
                console.error('获取日历数据失败:', result.message);
                this.displayError('获取数据失败，请稍后重试');
            }
        } catch (error) {
            console.error('请求日历数据出错:', error);
            this.displayError('网络错误，请检查连接');
        }
    }

    displayError(message) {
        debug('显示错误信息', message);
        const newsItems = document.querySelector('.news-items');
        if (newsItems) {
            newsItems.innerHTML = `<div class="error-message">${message}</div>`;
            const newsCount = document.querySelector('.news-count');
            if (newsCount) {
                newsCount.textContent = '加载失败';
            }
        }
    }

    displayCalendarData(data = []) {
        debug('显示日历数据', data);
        const newsItems = document.querySelector('.news-items');
        if (!newsItems) {
            console.error('找不到新闻列表容器');
            return;
        }
        
        // 更新日期显示
        const dateDisplay = document.querySelector('.date span');
        if (dateDisplay) {
            dateDisplay.textContent = this.formatDate(this.currentDate);
        }

        // 更新消息数量
        const newsCount = document.querySelector('.news-count');
        if (newsCount) {
            newsCount.textContent = `${data.length}条讯息`;
        }

        // 清空现有内容并显示加载状态
        newsItems.innerHTML = '<div class="loading">加载中...</div>';

        // 检查数据是否为空
        if (!Array.isArray(data) || data.length === 0) {
            newsItems.innerHTML = '<div class="no-data">暂无数据</div>';
            return;
        }

        // 创建新闻列表容器
        const newsContainer = document.createElement('div');
        newsContainer.className = 'news-container';

        // 显示新闻列表
        data.forEach(item => {
            if (!item) return;
            
            try {
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item';
                
                const date = new Date(item.datetime);
                const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                
                newsItem.innerHTML = `
                    <div class="time">${time}</div>
                    <div class="content">
                        <div class="title">${escapeHtml(item.title || '无标题')}</div>
                        <div class="desc">${escapeHtml(item.content || '无描述')}</div>
                        <div class="source">
                            <a href="${item.source_url || '#'}" target="_blank" class="source-name">查看原文</a>
                            <div class="stats">
                                ${item.score ? `
                                <span class="stat-item">
                                    <span class="rating">评分: ${item.score}</span>
                                </span>` : ''}
                                <span class="stat-item">
                                    <span class="week-day">星期${item.weekday || '未知'}</span>
                                </span>
                                ${item.type ? `
                                <span class="stat-item">
                                    <span class="type">${item.type}</span>
                                </span>` : ''}
                                ${item.related_coins ? `
                                <span class="stat-item">
                                    <span class="coins">${item.related_coins}</span>
                                </span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
                
                if (item.importance === 1) {
                    newsItem.classList.add('important');
                }

                // 为每个新闻项添加点击事件
                newsItem.addEventListener('click', (e) => {
                    // 阻止链接的默认点击事件
                    if (e.target.tagName === 'A') {
                        e.stopPropagation();
                        return;
                    }
                    
                    const newsData = {
                        title: item.title || '无标题',
                        time: time,
                        source: '查看原文',
                        sourceUrl: item.source_url || '#',
                        content: item.content || '无描述',
                        type: item.type,
                        score: item.score,
                        related_coins: item.related_coins,
                        importance: item.importance
                    };
                    this.showNewsDetail(newsData);
                });
                
                newsContainer.appendChild(newsItem);
            } catch (error) {
                console.error('处理新闻项时出错:', error, item);
            }
        });

        // 清空加载状态并添加新闻列表
        newsItems.innerHTML = '';
        newsItems.appendChild(newsContainer);
    }

    formatDate(date) {
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        return `${date.getMonth() + 1}月${date.getDate()}日 星期${days[date.getDay()]}`;
    }

    initFilters(categories = []) {
        debug('初始化筛选按钮', categories);
        const filterContainer = document.querySelector('.filter');
        if (!filterContainer) {
            console.error('找不到筛选按钮容器');
            return;
        }
        filterContainer.innerHTML = '';

        // 添加"全部"按钮
        const allButton = document.createElement('a');
        allButton.href = '#';
        allButton.className = 'filter-btn' + (this.currentFilter === '全部' ? ' active' : '');
        allButton.textContent = '全部';
        filterContainer.appendChild(allButton);

        // 为每个分类添加按钮
        categories.forEach(category => {
            if (!category || !category.type) return;
            const button = document.createElement('a');
            button.href = '#';
            button.className = 'filter-btn' + (this.currentFilter === category.type ? ' active' : '');
            button.textContent = category.type;
            filterContainer.appendChild(button);
        });

        // 添加点击事件
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const activeBtn = document.querySelector('.filter-btn.active');
                if (activeBtn) {
                    activeBtn.classList.remove('active');
                }
                btn.classList.add('active');
                this.currentFilter = btn.textContent;
                this.fetchCalendarData();
            });
        });
    }

    updateCategories(categories = []) {
        debug('更新分类统计', categories);
        const categoryList = document.querySelector('.category-list');
        if (!categoryList) {
            console.error('找不到分类列表容器');
            return;
        }
        categoryList.innerHTML = '';

        const categoryColors = {
            '重要公告': 'var(--up-color)',
            '项目进展': 'var(--primary-color)',
            '数据分析': 'var(--down-color)'
        };

        // 添加"全部"选项
        const allCategoryItem = document.createElement('label');
        allCategoryItem.className = 'category-item';
        const totalCount = categories.reduce((sum, cat) => sum + (cat.count || 0), 0);
        allCategoryItem.innerHTML = `
            <input type="checkbox" checked>
            <span class="category-color" style="background: var(--primary-color)"></span>
            <span class="category-name">全部</span>
            <span class="category-count">${totalCount}</span>
        `;
        categoryList.appendChild(allCategoryItem);

        // 添加其他分类
        categories.forEach(category => {
            if (!category || !category.type) return;
            const categoryItem = document.createElement('label');
            categoryItem.className = 'category-item';
            categoryItem.innerHTML = `
                <input type="checkbox" ${this.currentFilter === category.type ? 'checked' : ''}>
                <span class="category-color" style="background: ${categoryColors[category.type] || 'var(--primary-color)'}"></span>
                <span class="category-name">${category.type}</span>
                <span class="category-count">${category.count || 0}</span>
            `;
            categoryList.appendChild(categoryItem);

            // 添加点击事件
            categoryItem.addEventListener('click', () => {
                this.currentFilter = category.type;
                this.fetchCalendarData();
            });
        });

        // 为"全部"添加点击事件
        allCategoryItem.addEventListener('click', () => {
            this.currentFilter = '全部';
            this.fetchCalendarData();
        });
    }

    // 在组件销毁时清理
    destroy() {
        if (this.themeObserver) {
            this.themeObserver.disconnect();
            this.themeObserver = null;
        }
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 创建日历实例
    window.calendar = new Calendar();
});

// 在页面卸载时清理
window.addEventListener('unload', () => {
    if (window.calendar) {
        window.calendar.destroy();
    }
});

// 新闻详细页面功能
function initNewsDetail() {
    const newsItems = document.querySelectorAll('.news-item');
    
    newsItems.forEach(item => {
        item.addEventListener('click', () => {
            const newsData = {
                title: item.querySelector('.title').textContent,
                time: item.querySelector('.time').textContent,
                source: item.querySelector('.source-name').textContent,
                sourceUrl: item.querySelector('.source-name').getAttribute('href'),
                content: item.querySelector('.desc').textContent,
                type: item.querySelector('.type')?.textContent,
                score: item.querySelector('.rating')?.textContent.replace('评分: ', ''),
                related_coins: item.querySelector('.coins')?.textContent,
                importance: item.classList.contains('important') ? 1 : 0
            };
            this.showNewsDetail(newsData);
        });
    });
}

// 显示新闻详细页面
function showNewsDetail(newsData) {
    // 创建详细页面元素
    const detailElement = document.createElement('div');
    detailElement.className = 'news-detail';
    
    detailElement.innerHTML = `
        <div class="detail-content">
            <button class="close-btn">
                <i class="icon-close"></i>
            </button>
            <h1 class="detail-title">${newsData.title}</h1>
            <div class="detail-meta">
                <div class="meta-left">
                    <span class="detail-time">
                        <i class="icon-time"></i>
                        ${newsData.time}
                    </span>
                    <a href="${newsData.sourceUrl}" class="detail-source" target="_blank">
                        <i class="icon-link"></i>
                        ${newsData.source}
                    </a>
                </div>
                <div class="meta-right">
                    ${newsData.type ? `
                    <span class="detail-type">
                        <i class="icon-tag"></i>
                        ${newsData.type}
                    </span>` : ''}
                    ${newsData.score ? `
                    <span class="detail-score">
                        <i class="icon-star"></i>
                        评分：${newsData.score}
                    </span>` : ''}
                </div>
            </div>
            <div class="detail-body">
                ${newsData.content.split('\n').map(paragraph => 
                    paragraph ? `<p>${paragraph}</p>` : ''
                ).join('')}
            </div>
            ${newsData.related_coins ? `
            <div class="detail-tags">
                <h3>相关币种</h3>
                <div class="coin-tags">
                    ${newsData.related_coins.split(',').map(coin => 
                        `<span class="coin-tag">${coin.trim()}</span>`
                    ).join('')}
                </div>
            </div>` : ''}
            <div class="detail-footer">
                <div class="related-news">
                    <h3>相关新闻</h3>
                    <div class="related-list">
                        <div class="loading">加载中...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(detailElement);
    
    // 添加动画类
    requestAnimationFrame(() => {
        detailElement.classList.add('active');
    });
    
    // 绑定关闭按钮事件
    const closeBtn = detailElement.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        this.closeNewsDetail(detailElement);
    });
    
    // 点击外部区域关闭
    detailElement.addEventListener('click', (e) => {
        if (e.target === detailElement) {
            this.closeNewsDetail(detailElement);
        }
    });
    
    // 绑定ESC键关闭
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            this.closeNewsDetail(detailElement);
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // 加载相关新闻
    this.loadRelatedNews(newsData.title).then(relatedNews => {
        const relatedList = detailElement.querySelector('.related-list');
        if (!relatedNews || relatedNews.length === 0) {
            relatedList.innerHTML = '<div class="no-data">暂无相关新闻</div>';
            return;
        }
        
        relatedList.innerHTML = '';
        relatedNews.forEach(news => {
            const relatedItem = document.createElement('div');
            relatedItem.className = 'related-item';
            relatedItem.innerHTML = `
                <div class="title">${news.title}</div>
                <div class="meta">
                    <span class="time">
                        <i class="icon-time"></i>
                        ${news.time}
                    </span>
                    <span class="source">
                        <i class="icon-source"></i>
                        ${news.source}
                    </span>
                </div>
            `;
            relatedList.appendChild(relatedItem);
            
            // 为相关新闻添加点击事件
            relatedItem.addEventListener('click', () => {
                this.closeNewsDetail(detailElement);
                this.showNewsDetail(news);
            });
        });
    }).catch(error => {
        const relatedList = detailElement.querySelector('.related-list');
        relatedList.innerHTML = '<div class="error">加载相关新闻失败</div>';
        console.error('加载相关新闻失败:', error);
    });
}

// 关闭新闻详细页面
function closeNewsDetail(detailElement) {
    detailElement.classList.remove('active');
    setTimeout(() => {
        document.body.removeChild(detailElement);
    }, 300);
}

// 加载相关新闻
async function loadRelatedNews(title) {
    try {
        // 构建API请求参数
        const params = new URLSearchParams({
            title: title,
            limit: 5 // 限制相关新闻数量
        });

        const url = `${API_BASE_URL}/related-news?${params.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.code === 0 && Array.isArray(result.data)) {
            return result.data;
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('获取相关新闻失败:', error);
        // 如果API调用失败，返回空数组
        return [];
    }
} 