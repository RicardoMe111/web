class CoinList {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 100;
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.bindEvents();
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError('初始化失败，请刷新页面重试');
        }
    }

    bindEvents() {
        // 绑定筛选按钮事件
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPage = 1;
                await this.loadData();
            });
        });

        // 绑定分页事件
        document.querySelector('.page-btn.prev')?.addEventListener('click', async () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                await this.loadData();
            }
        });

        document.querySelector('.page-btn.next')?.addEventListener('click', async () => {
                this.currentPage++;
            await this.loadData();
        });

        // 绑定排序事件
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', async () => {
                const sortKey = th.dataset.sort;
                await this.loadData(sortKey);
            });
        });
    }

    async loadData(sortKey = 'rank') {
        try {
            this.showLoading();
            const activeFilter = document.querySelector('.filter-btn.active');
            const type = activeFilter ? activeFilter.dataset.type : 'all';
            
            // 根据排序字段决定排序顺序
            const order = sortKey === 'rank' ? 'ASC' : 'DESC';
            
            const url = new URL(`${window.API_CONFIG.baseURL}/coins`, window.location.origin);
            url.searchParams.append('page', this.currentPage.toString());
            url.searchParams.append('limit', this.pageSize.toString());
            url.searchParams.append('type', type);
            url.searchParams.append('sort', sortKey);
            url.searchParams.append('order', order);

            console.log('Fetching data from:', url.toString());

            const response = await fetch(url);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '网络请求失败');
            }

            console.log('Received data:', result);

            if (result.code === 0) {
                this.renderTable(result.data);
                this.updatePagination(result.total, result.page, result.limit);
            this.hideLoading();
            } else {
                throw new Error(result.message || '获取数据失败');
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            this.showError('加载失败，请重试');
        }
    }

    updatePagination(total, currentPage, limit) {
        const totalPages = Math.ceil(total / limit);
        const prevBtn = document.querySelector('.page-btn.prev');
        const nextBtn = document.querySelector('.page-btn.next');
        const pageNumbers = document.querySelector('.page-numbers');

        // 更新按钮状态
        if (prevBtn) {
            prevBtn.disabled = currentPage <= 1;
        }
        if (nextBtn) {
            nextBtn.disabled = currentPage >= totalPages;
        }

        // 清空页码容器
        if (pageNumbers) {
            pageNumbers.innerHTML = '';

            // 生成所有页码按钮
            for (let i = 1; i <= totalPages; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `page-btn number${i === currentPage ? ' active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.onclick = () => {
                    this.currentPage = i;
                    this.loadData();
                };
                pageNumbers.appendChild(pageBtn);
            }
        }
    }

    renderTable(coins) {
        const tbody = document.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        if (!coins || coins.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">暂无数据</td></tr>';
            return;
        }

        coins.forEach(coin => {
            const tr = document.createElement('tr');
            const riseValue = parseFloat(coin.rise);
            const isPositive = riseValue >= 0;
            
            tr.innerHTML = `
                <td>${coin.rank || '-'}</td>
                <td>
                    <div style="display: flex; align-items: center;">
                        <img src="/images/coins/${coin.symbol?.toLowerCase()}.png" 
                             onerror="this.style.display='none'" 
                             class="coin-icon" />
                        <div>
                            <span class="coin-name">${coin.name || '-'}</span>
                            <span class="coin-symbol">${coin.symbol || '-'}</span>
                        </div>
                    </div>
                </td>
                <td>${this.formatPrice(coin.price)}</td>
                <td>${this.formatLargeNumber(coin.marketCap)}</td>
                <td>${this.formatLargeNumber(coin.volume)}</td>
                <td>${this.formatChange(coin.change)}</td>
                <td>${this.formatTurnover(coin.turnover)}</td>
                <td class="${isPositive ? 'up' : 'down'}">
                    ${this.formatRise(coin.rise)}
                </td>
                <td>
                    <div class="trend-chart" style="background-color: ${isPositive ? 'rgba(0, 184, 151, 0.1)' : 'rgba(255, 92, 92, 0.1)'}">
                        <div class="trend-line">${coin.trend || 'N/A'}</div>
                    </div>
                </td>
        `;
            tbody.appendChild(tr);
        });

        // 更新表格信息
        const tableInfo = document.querySelector('.table-info');
        if (tableInfo) {
            tableInfo.textContent = `共 ${coins.length} 条数据`;
        }
    }

    formatPrice(price) {
        if (!price) return '-';
        return price;
    }

    formatLargeNumber(num) {
        if (!num) return '-';
        return num;
    }

    formatChange(change) {
        if (!change) return '-';
        return change;
    }

    formatTurnover(turnover) {
        if (!turnover) return '-';
        return turnover + '%';
    }

    formatRise(rise) {
        if (!rise) return '-';
        const value = parseFloat(rise);
        if (isNaN(value)) return '-';
        return (value >= 0 ? '+' : '') + rise + '%';
    }

    showLoading() {
        const tbody = document.querySelector('tbody');
        const tableInfo = document.querySelector('.table-info');
        if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="text-center">加载中...</td></tr>';
        if (tableInfo) tableInfo.textContent = '加载中...';
    }

    hideLoading() {
        const tableInfo = document.querySelector('.table-info');
        if (tableInfo) tableInfo.textContent = '';
    }

    showError(message) {
        const tbody = document.querySelector('tbody');
        const tableInfo = document.querySelector('.table-info');
        if (tbody) tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">${message}</td></tr>`;
        if (tableInfo) tableInfo.textContent = message;
    }
} 