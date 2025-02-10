document.querySelector('.theme-toggle').addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    
    // 更新按钮文本
    const button = document.querySelector('.theme-toggle');
    button.textContent = isDark ? '夜间模式' : '日间模式';
}); 

// 初始化趋势图表
const ctx = document.getElementById('trendChart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
        datasets: [{
            label: 'BTC价格趋势',
            data: [40000, 45000, 42000, 48000, 43000, 46000],
            borderColor: '#0b69ef',
            tension: 0.4,
            fill: false
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        }
    }
});

// 模拟实时数据更新
function updatePrices() {
    const prices = document.querySelectorAll('.data-table td:nth-child(3)');
    prices.forEach(price => {
        const currentPrice = parseFloat(price.textContent.replace(/[^0-9.-]+/g, ''));
        const change = (Math.random() - 0.5) * 100;
        const newPrice = (currentPrice + change).toFixed(2);
        price.textContent = `¥${newPrice}`;
        
        // 更新涨跌幅
        const changeCell = price.nextElementSibling;
        const changePercent = (change / currentPrice * 100).toFixed(2);
        changeCell.textContent = `${changePercent > 0 ? '+' : ''}${changePercent}%`;
        changeCell.className = changePercent > 0 ? 'up' : 'down';
    });
}

// 每5秒更新一次数据
setInterval(updatePrices, 5000); 

// 初始化市场数据图表
function initMarketCharts() {
    const charts = {
        marketCap: {
            ctx: document.getElementById('marketCapChart').getContext('2d'),
            color: '#2962FF',
            data: generateChartData(24, 80, 100)
        },
        volume: {
            ctx: document.getElementById('volumeChart').getContext('2d'),
            color: '#00B897',
            data: generateChartData(24, 60, 90)
        },
        defi: {
            ctx: document.getElementById('defiChart').getContext('2d'),
            color: '#ED4B82',
            data: generateChartData(24, 40, 70)
        }
    };

    // 为每个图表创建实例
    Object.entries(charts).forEach(([key, chart]) => {
        new Chart(chart.ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 24}, (_, i) => i),
                datasets: [{
                    data: chart.data,
                    borderColor: chart.color,
                    borderWidth: 1.5,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: `${chart.color}15`
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    });
}

// 生成模拟图表数据
function generateChartData(length, min, max) {
    let lastValue = (min + max) / 2;
    return Array.from({length}, () => {
        const change = (Math.random() - 0.5) * 10;
        lastValue = Math.max(min, Math.min(max, lastValue + change));
        return lastValue;
    });
}

// 定期更新图表数据
function updateChartData() {
    const charts = Chart.instances;
    charts.forEach(chart => {
        const data = chart.data.datasets[0].data;
        data.shift();
        data.push(generateChartData(1, 40, 100)[0]);
        chart.update('none');
    });
}

// 每30秒更新一次图表数据
setInterval(updateChartData, 30000);

// 页面加载完成后初始化图表
document.addEventListener('DOMContentLoaded', () => {
    initMarketCharts();
    handleTimeRangeChange();
    
    // 启动定时更新
    setInterval(updateMarketData, 10000);
    setInterval(updateChartData, 30000);
}); 

// 时间范围切换处理
function handleTimeRangeChange() {
    const timeSelect = document.querySelector('.time-select select');
    timeSelect.addEventListener('change', (e) => {
        const range = e.target.value;
        const charts = Chart.instances;
        
        // 根据时间范围更新数据点数量
        const dataPoints = {
            '24h': 24,
            '7d': 168,
            '30d': 720
        };
        
        charts.forEach(chart => {
            const data = generateChartData(dataPoints[range], 40, 100);
            chart.data.labels = Array.from({length: dataPoints[range]}, (_, i) => i);
            chart.data.datasets[0].data = data;
            chart.update('none');
        });
        
        // 更新卡片显示的时间范围
        document.querySelectorAll('.trend').forEach(trend => {
            const text = trend.textContent;
            trend.textContent = text.replace(/\d+[dhD]/, range);
        });
    });
}

// 数据更新动画效果
function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    const updateValue = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动��数使动画更自然
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = start + (end - start) * easeOutQuart;
        
        element.textContent = formatValue(current);
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    };
    
    requestAnimationFrame(updateValue);
}

// 格式化数值显示
function formatValue(value) {
    if (value >= 1e12) {
        return `$${(value / 1e12).toFixed(1)}T`;
    } else if (value >= 1e9) {
        return `$${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
        return `$${(value / 1e6).toFixed(1)}M`;
    }
    return `$${value.toFixed(1)}`;
}

// 更新市场数据
function updateMarketData() {
    const cards = document.querySelectorAll('.stat-card');
    
    cards.forEach(card => {
        const valueElement = card.querySelector('.value');
        const currentValue = parseFloat(valueElement.textContent.replace(/[^0-9.]/g, ''));
        const change = (Math.random() - 0.5) * currentValue * 0.02; // 2%的波动
        const newValue = currentValue + change;
        
        // 添加数值变化动画
        animateValue(valueElement, currentValue, newValue, 1000);
        
        // 更新涨跌幅
        const changeElement = card.querySelector('.change');
        const changePercent = (change / currentValue * 100).toFixed(1);
        const isUp = changePercent > 0;
        
        changeElement.textContent = `${isUp ? '+' : ''}${changePercent}%`;
        changeElement.className = `change ${isUp ? 'up' : 'down'}`;
        
        // 更新趋势文本
        const trendElement = card.querySelector('.trend');
        trendElement.textContent = `24h趋势：${isUp ? '上涨' : '下跌'}`;
    });
} 