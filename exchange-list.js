class ExchangeList {
    constructor() {
        // 检查是否在交易所列表页面
        if (!document.querySelector('.exchange-list')) {
            console.log('不在交易所列表页面');
            return;
        }
        
        this.currentPage = 1;
        this.pageSize = 50;  // 每页显示50个
        this.sortField = 'score';
        this.sortOrder = 'desc';
        this.totalItems = 0;
        this.exchanges = [];
        
        this.init();
    }

    init() {
        this.initPagination();
        this.fetchData();
    }

    fetchData() {
        fetch(`${window.API_CONFIG.baseURL}/exchanges`)
            .then(response => response.json())
            .then(data => {
                if (data.code === 0) {
                    this.exchanges = data.data;
                    this.totalItems = this.exchanges.length;
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
        const endIndex = Math.min(startIndex + this.pageSize, this.totalItems);
        const currentPageData = this.exchanges.slice(startIndex, endIndex);
        
        this.renderTable(currentPageData);
        this.updatePageInfo();
    }

    renderTable(exchanges) {
        const tbody = document.querySelector('tbody');
        tbody.innerHTML = '';

        exchanges.forEach(exchange => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${exchange.id}</td>
                <td>${exchange.name}</td>
                <td>${exchange.exrank}</td>
                <td>${exchange.volume_24h}</td>
                <td>${exchange.change_24h}</td>
                <td>${exchange.assets}</td>
                <td>${exchange.pairs}</td>
                <td>${exchange.popularity}</td>
                <td>N/A</td>
            `;
            tbody.appendChild(tr);
        });
    }

    initPagination() {
        // 创建分页容器
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        
        // 创建分页信息显示
        const pageInfo = document.createElement('div');
        pageInfo.className = 'page-info';
        
        // 创建分页控制按钮
        const pageControls = document.createElement('div');
        pageControls.className = 'page-controls';
        
        paginationContainer.appendChild(pageInfo);
        paginationContainer.appendChild(pageControls);
        
        // 将分页容器添加到表格后面
        const table = document.querySelector('.exchange-list table');
        table.parentNode.insertBefore(paginationContainer, table.nextSibling);
    }

    updatePagination() {
        const totalPages = Math.ceil(this.totalItems / this.pageSize);
        const controls = document.querySelector('.page-controls');
        controls.innerHTML = '';
        
        // 创建分页按钮组
        const btnGroup = document.createElement('div');
        btnGroup.className = 'page-btn-group';
        
        // 上一页按钮
        const prevBtn = document.createElement('button');
        prevBtn.className = `page-btn prev${this.currentPage <= 1 ? ' disabled' : ''}`;
        prevBtn.innerHTML = '<i class="icon-arrow-left"></i><span>上一页</span>';
        prevBtn.disabled = this.currentPage <= 1;
        prevBtn.onclick = () => this.goToPage(this.currentPage - 1);
        btnGroup.appendChild(prevBtn);
        
        // 页码按钮
        const pageList = document.createElement('div');
        pageList.className = 'page-list';
        
        // 计算显示的页码范围
        let startPage = Math.max(1, this.currentPage - 1);
        let endPage = Math.min(totalPages, startPage + 2);
        if (endPage - startPage < 2) {
            startPage = Math.max(1, endPage - 2);
        }
        
        // 添加页码按钮
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn${i === this.currentPage ? ' active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => this.goToPage(i);
            pageList.appendChild(pageBtn);
        }
        
        btnGroup.appendChild(pageList);
        
        // 下一页按钮
        const nextBtn = document.createElement('button');
        nextBtn.className = `page-btn next${this.currentPage >= totalPages ? ' disabled' : ''}`;
        nextBtn.innerHTML = '<span>下一页</span><i class="icon-arrow-right"></i>';
        nextBtn.disabled = this.currentPage >= totalPages;
        nextBtn.onclick = () => this.goToPage(this.currentPage + 1);
        btnGroup.appendChild(nextBtn);
        
        controls.appendChild(btnGroup);
    }

    updatePageInfo() {
        const startIndex = (this.currentPage - 1) * this.pageSize + 1;
        const endIndex = Math.min(this.currentPage * this.pageSize, this.totalItems);
        const pageInfo = document.querySelector('.page-info');
        pageInfo.textContent = `显示 ${startIndex}-${endIndex} 条，共 ${this.totalItems} 条`;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.totalItems / this.pageSize);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updateTable();
            this.updatePagination();
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    new ExchangeList();
}); 