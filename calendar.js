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
        // 检查是否在日历页面
        if (!document.querySelector('.calendar-page')) {
            console.log('不在日历页面');
            return;
        }
        
        this.currentDate = new Date();
        this.currentFilter = '全部';
        this.init();
    }

    init() {
        this.initCalendar();
        this.fetchCalendarData();
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
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 创建日历实例
    window.calendar = new Calendar();
}); 