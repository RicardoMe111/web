class CoinDetail {
    constructor() {
        this.coinId = new URLSearchParams(window.location.search).get('id');
        this.currentPrice = 0;
        this.chart = null;
        this.currentTab = 'overview';
        this.init();
    }

    async init() {
        try {
            await this.loadCoinData();
            this.bindEvents();
            await this.loadPriceChart('24h');
            this.initPriceConverter();
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError('初始化失败，请刷新页面重试');
        }
    }

    bindEvents() {
        // 绑定标签页切换事件
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // 绑定时间过滤器事件
        document.querySelectorAll('.time-filter').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                document.querySelectorAll('.time-filter').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const period = e.target.dataset.period;
                await this.loadPriceChart(period);
            });
        });

        // 绑定图表类型切换事件
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const type = e.target.dataset.type;
                await this.loadPriceChart(document.querySelector('.time-filter.active').dataset.period, type);
            });
        });
    }

    async switchTab(tabName) {
        if (this.currentTab === tabName) return;

        // 更新标签页状态
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        this.currentTab = tabName;

        // 根据标签页加载相应数据
        switch (tabName) {
            case 'markets':
                await this.loadMarkets();
                break;
            case 'historical':
                await this.loadHistoricalData();
                break;
            case 'news':
                await this.loadNews();
                break;
            case 'social':
                await this.loadSocialData();
                break;
            case 'analysis':
                await this.loadTechnicalAnalysis();
                break;
        }
    }

    async loadCoinData() {
        try {
            // 使用币种列表API
            const response = await fetch('/api/coin/detail?id=' + this.coinId);
            const result = await response.json();

            if (result.code === 0 && result.data) {
                const coinData = this.transformCoinData(result.data);
                this.updateCoinInfo(coinData);
                this.currentPrice = coinData.price;
                this.updateAdditionalInfo(coinData);
            } else {
                throw new Error(result.message || '获取数据失败');
            }
        } catch (error) {
            console.error('加载币种数据失败:', error);
            this.showError('加载失败，请重试');
        }
    }

    transformCoinData(apiData) {
        // 转换API返回的数据格式以匹配我们的需求
        return {
            id: apiData.id,
            name: apiData.name,
            symbol: apiData.symbol,
            rank: apiData.rank,
            price: apiData.price,
            change: apiData.change_24h,
            high24h: apiData.high_24h,
            low24h: apiData.low_24h,
            volume24h: apiData.volume_24h,
            marketCap: apiData.market_cap,
            circulatingSupply: apiData.circulating_supply,
            totalSupply: apiData.total_supply,
            maxSupply: apiData.max_supply,
            marketCapChange24h: apiData.market_cap_change_24h,
            volumeChange24h: apiData.volume_change_24h,
            description: apiData.description || '',
            tags: apiData.tags || [],
            websites: [
                {
                    name: "官方网站",
                    url: apiData.website || '#',
                    icon: "/images/icons/website.png"
                }
            ],
            explorers: [
                {
                    name: "区块浏览器",
                    url: apiData.explorer || '#',
                    icon: "/images/icons/explorer.png"
                }
            ],
            community: [
                {
                    name: "Twitter",
                    url: apiData.twitter || '#',
                    icon: "/images/icons/twitter.png"
                },
                {
                    name: "Telegram",
                    url: apiData.telegram || '#',
                    icon: "/images/icons/telegram.png"
                }
            ],
            sourceCode: [
                {
                    name: "Github",
                    url: apiData.github || '#',
                    icon: "/images/icons/github.png"
                }
            ]
        };
    }

    updateCoinInfo(data) {
        // 更新基本信息
        document.getElementById('coinName').textContent = data.name;
        document.getElementById('coinSymbol').textContent = data.symbol;
        document.getElementById('coinIcon').src = `/images/coins/${data.symbol.toLowerCase()}.png`;
        document.getElementById('coinRank').textContent = data.rank || '--';
        document.getElementById('coinSymbolChart').textContent = data.symbol;

        // 更新价格信息
        document.getElementById('currentPrice').textContent = this.formatPrice(data.price);
        document.getElementById('chartCurrentPrice').textContent = this.formatPrice(data.price);
        
        const priceChangeValue = parseFloat(data.change);
        const priceChangeElement = document.getElementById('priceChange');
        const chartPriceChangeElement = document.getElementById('chartPriceChange');
        
        priceChangeElement.textContent = this.formatChange(data.change);
        chartPriceChangeElement.textContent = this.formatChange(data.change);
        
        priceChangeElement.className = `price-change ${priceChangeValue >= 0 ? 'positive' : 'negative'}`;
        chartPriceChangeElement.className = `price-change ${priceChangeValue >= 0 ? 'positive' : 'negative'}`;

        // 更新24小时统计
        document.getElementById('high24h').textContent = this.formatPrice(data.high24h);
        document.getElementById('low24h').textContent = this.formatPrice(data.low24h);
        document.getElementById('volume24h').textContent = this.formatLargeNumber(data.volume24h);
        document.getElementById('volume24hDetailed').textContent = this.formatPrice(data.volume24h);
        
        // 计算成交量/市值比
        const volumeMarketCapRatio = (data.volume24h / data.marketCap * 100).toFixed(2);
        document.getElementById('volumeMarketCapRatio').textContent = volumeMarketCapRatio + '%';

        // 更新市场信息
        document.getElementById('marketCap').textContent = this.formatLargeNumber(data.marketCap);
        document.getElementById('marketCapRank').textContent = '#' + (data.rank || '--');
        document.getElementById('circulatingSupply').textContent = this.formatLargeNumber(data.circulatingSupply);
        document.getElementById('totalSupply').textContent = this.formatLargeNumber(data.totalSupply);
        document.getElementById('maxSupply').textContent = data.maxSupply ? this.formatLargeNumber(data.maxSupply) : 'N/A';
        
        // 更新完全稀释市值
        const fullyDilutedMarketCap = data.maxSupply ? data.price * data.maxSupply : null;
        document.getElementById('fullyDilutedMarketCap').textContent = fullyDilutedMarketCap ? this.formatLargeNumber(fullyDilutedMarketCap) : 'N/A';
        document.getElementById('fullyDilutedValuation').textContent = fullyDilutedMarketCap ? this.formatLargeNumber(fullyDilutedMarketCap) : 'N/A';

        // 更新涨跌幅
        const marketCapChangeElement = document.getElementById('marketCapChange');
        const volumeChangeElement = document.getElementById('volumeChange');
        const marketCapChangeValue = parseFloat(data.marketCapChange24h);
        const volumeChangeValue = parseFloat(data.volumeChange24h);

        marketCapChangeElement.textContent = this.formatChange(data.marketCapChange24h);
        volumeChangeElement.textContent = this.formatChange(data.volumeChange24h);
        
        marketCapChangeElement.className = `stat-change ${marketCapChangeValue >= 0 ? 'positive' : 'negative'}`;
        volumeChangeElement.className = `stat-change ${volumeChangeValue >= 0 ? 'positive' : 'negative'}`;
    }

    updateAdditionalInfo(data) {
        // 更新币种描述
        document.getElementById('coinNameAbout').textContent = data.name;
        document.getElementById('coinDescription').textContent = data.description || '暂无描述';

        // 更新标签
        const tagsContainer = document.getElementById('coinTags');
        tagsContainer.innerHTML = '';
        if (data.tags && data.tags.length > 0) {
            data.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });
        }

        // 更新链接
        this.updateLinks('websiteLinks', data.websites || []);
        this.updateLinks('explorerLinks', data.explorers || []);
        this.updateLinks('communityLinks', data.community || []);
        this.updateLinks('sourceCodeLinks', data.sourceCode || []);
    }

    updateLinks(containerId, links) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        if (links.length === 0) {
            container.innerHTML = '<span style="color: #94a3b8;">暂无数据</span>';
            return;
        }

        links.forEach(link => {
            const linkElement = document.createElement('a');
            linkElement.className = 'link-value';
            linkElement.href = link.url;
            linkElement.target = '_blank';
            linkElement.rel = 'noopener noreferrer';
            
            if (link.icon) {
                const icon = document.createElement('img');
                icon.src = link.icon;
                icon.alt = link.name;
                linkElement.appendChild(icon);
            }
            
            const text = document.createElement('span');
            text.textContent = link.name;
            linkElement.appendChild(text);
            
            container.appendChild(linkElement);
        });
    }

    async loadPriceChart(period, type = 'price') {
        try {
            // 使用币种K线数据API
            const url = '/api/coin/kline';
            const params = new URLSearchParams({
                id: this.coinId,
                period: period
            });

            const response = await fetch(`${url}?${params}`);
            const result = await response.json();

            if (result.code === 0 && result.data) {
                const chartData = this.transformChartData(result.data, type);
                this.renderChart(chartData, type);
            } else {
                throw new Error(result.message || '获取数据失败');
            }
        } catch (error) {
            console.error('加载价格图表失败:', error);
            this.showError('加载图表失败，请重试');
        }
    }

    transformChartData(apiData, type) {
        // 转换K线数据为图表所需格式
        return {
            timestamps: apiData.map(item => item.time * 1000), // 转换为毫秒时间戳
            prices: apiData.map(item => parseFloat(item.close)),
            marketCaps: apiData.map(item => parseFloat(item.close) * parseFloat(item.volume))
        };
    }

    renderChart(data, type = 'price') {
        const ctx = document.getElementById('priceChart');
        
        if (this.chart) {
            this.chart.destroy();
        }

        const chartData = {
            labels: data.timestamps.map(ts => new Date(ts).toLocaleString()),
            datasets: [{
                label: type === 'price' ? 'Price' : 'Market Cap',
                data: type === 'price' ? data.prices : data.marketCaps,
                borderColor: '#3861fb',
                backgroundColor: 'rgba(56, 97, 251, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
            }]
        };

        this.chart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#fff',
                        bodyColor: '#94a3b8',
                        borderColor: '#334155',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                return type === 'price' ? 
                                    this.formatPrice(value) :
                                    this.formatLargeNumber(value);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            maxRotation: 0
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: (value) => type === 'price' ? 
                                this.formatPrice(value) :
                                this.formatLargeNumber(value)
                        }
                    }
                }
            }
        });
    }

    initPriceConverter() {
        const cryptoInput = document.getElementById('cryptoAmount');
        const fiatInput = document.getElementById('fiatAmount');
        const cryptoSymbol = document.getElementById('cryptoSymbol');
        
        // 设置币种符号
        cryptoSymbol.textContent = document.getElementById('coinSymbol').textContent;

        // 绑定输入事件
        cryptoInput.addEventListener('input', () => {
            const cryptoAmount = parseFloat(cryptoInput.value) || 0;
            fiatInput.value = (cryptoAmount * this.currentPrice).toFixed(2);
        });

        fiatInput.addEventListener('input', () => {
            const fiatAmount = parseFloat(fiatInput.value) || 0;
            cryptoInput.value = (fiatAmount / this.currentPrice).toFixed(8);
        });
    }

    formatPrice(price) {
        if (!price) return '--';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        }).format(price);
    }

    formatLargeNumber(num) {
        if (!num) return '--';
        const units = ['', 'K', 'M', 'B', 'T'];
        const order = Math.floor(Math.log10(Math.abs(num)) / 3);
        const unit = units[order];
        const value = num / Math.pow(10, order * 3);
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value) + unit;
    }

    formatChange(change) {
        if (!change) return '--';
        const value = parseFloat(change);
        return (value >= 0 ? '+' : '') + value.toFixed(2) + '%';
    }

    showError(message) {
        // 可以根据需要实现错误提示UI
        console.error(message);
    }

    async loadMarkets() {
        // TODO: 实现市场数据加载
        console.log('Loading markets data...');
    }

    async loadHistoricalData() {
        // TODO: 实现历史数据加载
        console.log('Loading historical data...');
    }

    async loadNews() {
        // TODO: 实现新闻数据加载
        console.log('Loading news...');
    }

    async loadSocialData() {
        // TODO: 实现社交数据加载
        console.log('Loading social data...');
    }

    async loadTechnicalAnalysis() {
        // TODO: 实现技术分析数据加载
        console.log('Loading technical analysis...');
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new CoinDetail();
}); 