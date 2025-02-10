class WalletList {
    constructor() {
        // 检查是否在钱包列表页面
        if (!document.querySelector('.wallet-list')) {
            console.log('不在钱包列表页面');
            return;
        }
        
        this.currentPage = 1;
        this.pageSize = 20;
        this.sortField = 'score';
        this.sortOrder = 'desc';
        this.totalItems = 0;
        this.wallets = [];
        
        this.filters = {
            storage: [],
            source: [],
            type: []
        };
        
        this.selectedChains = new Set();
        this.init();
    }

    init() {
        // 移除已存在的分页容器
        const existingPaginations = document.querySelectorAll('.pagination-container');
        existingPaginations.forEach(pagination => pagination.remove());
        
        this.initPagination();
        this.fetchData();
        this.initSorting();
        this.initChainFilter();
        this.initListeners();
    }

    fetchData() {
        fetch(`${window.API_CONFIG.baseURL}/wallets`)
            .then(response => response.json())
            .then(data => {
                if (data.code === 0) {
                    this.wallets = data.data;
                    this.totalItems = this.wallets.length;
                    this.updateTable();
                    this.updatePagination();
                } else {
                    console.error('获取数据失败:', data.message);
                }
            })
            .catch(error => console.error('请求失败:', error));
    }

    updateTable() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const currentPageData = this.wallets.slice(startIndex, endIndex);
        this.renderTable(currentPageData);
    }

    renderTable(wallets) {
        const listContent = document.querySelector('.list-content');
        listContent.innerHTML = '';

        wallets.forEach(wallet => {
            const div = document.createElement('div');
            div.className = 'list-item';
            
            // 处理去中心化显示
            const decentralizedDisplay = wallet.decentralized === '1' ? 
                '<img src="https://s3.flink1.com/p/new/v1.0.11/static/images/wallet_ic_correct.svg?v=27e0434" class="status-icon" alt="是">' : 
                (wallet.decentralized === '0' ? '<img src="https://s3.flink1.com/p/new/v1.0.11/static/images/wallet_ic_fault.svg?v=b66d2ce" class="status-icon" alt="否">' : '-');
            
            // 处理中心化程度显示
            let typeClass = '';
            if (wallet.type === '完全去中心化') {
                typeClass = 'type-decentralized';
            } else if (wallet.type === '半中心化') {
                typeClass = 'type-semi';
            } else if (wallet.type === '中心化') {
                typeClass = 'type-centralized';
            }
            const typeDisplay = wallet.type ? `<span class="type-tag ${typeClass}">${wallet.type}</span>` : '-';
            
            // 处理多重签名显示
            const multiSigDisplay = wallet.multi_sig === '1' ? 
                '<img src="https://s3.flink1.com/p/new/v1.0.11/static/images/wallet_ic_correct.svg?v=27e0434" class="status-icon" alt="是">' : 
                (wallet.multi_sig === '0' ? '<img src="https://s3.flink1.com/p/new/v1.0.11/static/images/wallet_ic_fault.svg?v=b66d2ce" class="status-icon" alt="否">' : '-');

            // 处理额外服务显示
            const servicesArray = wallet.services ? wallet.services.split(',') : [];
            const servicesDisplay = servicesArray.length > 0 ? 
                servicesArray.map(service => `<span class="service-tag">${service.trim()}</span>`).join('') : 
                '-';

            div.innerHTML = `
                <div class="rank">${wallet.rank}</div>
                <div class="name">
                    <span>${wallet.name}</span>
                </div>
                <div class="decentralized">${decentralizedDisplay}</div>
                <div class="platform">${wallet.supported_types || '-'}</div>
                <div class="chains">${wallet.supported_coins || '-'}</div>
                <div class="storage">${wallet.key_storage || '-'}</div>
                <div class="source">${wallet.open_source || '-'}</div>
                <div class="type">${typeDisplay}</div>
                <div class="multi-sig">${multiSigDisplay}</div>
                <div class="services">${servicesDisplay}</div>
                <div class="score">${wallet.score || '-'}</div>
            `;
            listContent.appendChild(div);
        });
    }

    initSorting() {
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const field = header.className.split(' ')[0];
                if (this.sortField === field) {
                    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortField = field;
                    this.sortOrder = 'desc';
                }
                this.updateList();
            });
        });
    }

    initPagination() {
        // 检查是否已存在分页容器
        if (document.querySelector('.pagination-container')) {
            return;
        }

        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        
        // 创建分页按钮组
        const btnGroup = document.createElement('div');
        btnGroup.className = 'page-btn-group';
        
        // 上一页按钮
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn prev';
        prevBtn.innerHTML = '<i class="icon-arrow-left"></i><span>上一页</span>';
        prevBtn.onclick = () => this.goToPage(this.currentPage - 1);
        btnGroup.appendChild(prevBtn);
        
        // 页码列表容器
        const pageList = document.createElement('div');
        pageList.className = 'page-list';
        btnGroup.appendChild(pageList);
        
        // 下一页按钮
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn next';
        nextBtn.innerHTML = '<span>下一页</span><i class="icon-arrow-right"></i>';
        nextBtn.onclick = () => this.goToPage(this.currentPage + 1);
        btnGroup.appendChild(nextBtn);
        
        paginationContainer.appendChild(btnGroup);
        
        // 添加到页面
        const walletList = document.querySelector('.wallet-list');
        if (walletList) {
            walletList.appendChild(paginationContainer);
        }
    }

    updatePagination() {
        const paginationContainer = document.querySelector('.pagination-container');
        if (!paginationContainer) {
            return;
        }

        const totalPages = Math.ceil(this.totalItems / this.pageSize);
        const pageList = paginationContainer.querySelector('.page-list');
        const prevBtn = paginationContainer.querySelector('.page-btn.prev');
        const nextBtn = paginationContainer.querySelector('.page-btn.next');
        
        // 更新上一页/下一页按钮状态
        if (this.currentPage <= 1) {
            prevBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
        }
        
        if (this.currentPage >= totalPages) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'flex';
        }
        
        // 清空页码列表
        pageList.innerHTML = '';
        
        // 计算要显示的页码范围
        let startPage = 1;
        let endPage = totalPages;
        
        // 如果总页数大于5，则显示部分页码
        if (totalPages > 5) {
            if (this.currentPage <= 3) {
                // 当前页靠近开始
                endPage = 5;
            } else if (this.currentPage >= totalPages - 2) {
                // 当前页靠近结束
                startPage = totalPages - 4;
            } else {
                // 当前页在中间
                startPage = this.currentPage - 2;
                endPage = this.currentPage + 2;
            }
        }
        
        // 添加页码按钮
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn${i === this.currentPage ? ' active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => this.goToPage(i);
            pageList.appendChild(pageBtn);
        }
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.totalItems / this.pageSize);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.updateTable();
        this.updatePagination();
    }

    initListeners() {
        // 添加列表项的点击事件
        document.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', () => {
                // 处理钱包详情页跳转
                const name = item.querySelector('.name span').textContent;
                console.log(`Clicked wallet: ${name}`);
            });
        });
    }

    initFilters() {
        document.querySelectorAll('.filter-option input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const type = e.target.closest('.filter-group').dataset.type;
                const value = e.target.value;
                
                if (e.target.checked) {
                    this.filters[type].push(value);
                } else {
                    const index = this.filters[type].indexOf(value);
                    if (index > -1) {
                        this.filters[type].splice(index, 1);
                    }
                }
                
                this.updateList();
            });
        });
    }

    initChainFilter() {
        const chainFilter = document.querySelector('.chain-filter');
        if (!chainFilter) return;

        // 点击筛选按钮时切换下拉菜单
        chainFilter.addEventListener('click', (e) => {
            if (!e.target.closest('.chain-dropdown')) {
                chainFilter.classList.toggle('active');
            }
        });

        // 点击外部关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (!chainFilter.contains(e.target)) {
                chainFilter.classList.remove('active');
            }
        });

        // 阻止下拉菜单内的点击事件冒泡
        const chainDropdown = chainFilter.querySelector('.chain-dropdown');
        if (chainDropdown) {
            chainDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // 复选框选择
        const checkboxes = chainFilter.querySelectorAll('.chain-option input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const value = e.target.value;
                
                if (value === 'all') {
                    // 处理全选
                    const isChecked = e.target.checked;
                    checkboxes.forEach(cb => {
                        if (cb !== e.target) {
                            cb.checked = isChecked;
                            if (isChecked) {
                                this.selectedChains.add(cb.value);
                            } else {
                                this.selectedChains.delete(cb.value);
                            }
                        }
                    });
                } else {
                    // 处理单个选择
                    if (e.target.checked) {
                        this.selectedChains.add(value);
                    } else {
                        this.selectedChains.delete(value);
                        // 取消全选
                        const allCheckbox = chainFilter.querySelector('input[value="all"]');
                        if (allCheckbox) {
                            allCheckbox.checked = false;
                        }
                    }
                }

                this.updateChainFilterText();
                this.updateList();
            });
        });
    }

    updateChainFilterText() {
        const chainFilter = document.querySelector('.chain-filter');
        const span = chainFilter.querySelector('span');
        if (!span) return;

        const selectedCount = this.selectedChains.size;
        if (selectedCount === 0) {
            span.textContent = '支持公链';
        } else {
            const totalOptions = document.querySelectorAll('.chain-option input[type="checkbox"]').length - 1; // 减去全选选项
            if (selectedCount === totalOptions) {
                span.textContent = '全部公链';
            } else {
                span.textContent = `已选择 ${selectedCount} 个公链`;
            }
        }
    }
}

// 确保在 DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.walletList = new WalletList();
}); 