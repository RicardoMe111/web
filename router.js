class Router {
    constructor() {
        this.routes = {
            '/': 'coin-list.html',
            '/exchange': 'exchange-list.html',
            '/wallet': 'wallet-list.html',
            '/calendar': 'calendar.html'
        };
        
        this.init();
        this.loadComponents();
    }

    async loadComponents() {
        try {
            const [header, subnav, marketOverview, marketVote, newsFeed, footer] = await Promise.all([
                fetch('header.html').then(response => response.text()),
                fetch('subnav.html').then(response => response.text()),
                fetch('market-overview.html').then(response => response.text()),
                fetch('market-vote.html').then(response => response.text()),
                fetch('news-feed.html').then(response => response.text()),
                fetch('footer.html').then(response => response.text())
            ]);

            // 加载组件
            document.getElementById('header').innerHTML = header;
            document.getElementById('subnav').innerHTML = subnav;
            document.getElementById('market-overview').innerHTML = marketOverview;
            document.getElementById('market-vote').innerHTML = marketVote;
            document.getElementById('news-feed').innerHTML = newsFeed;
            document.getElementById('footer').innerHTML = footer;
        } catch (error) {
            console.error('Failed to load components:', error);
        }
    }

    init() {
        // 监听路由变化
        window.addEventListener('popstate', () => this.handleRoute());
        
        // 拦截链接点击
        document.addEventListener('click', (e) => {
            if (e.target.matches('.subnav a')) {
                e.preventDefault();
                const href = e.target.getAttribute('href');
                this.navigate(href);
            }
        });

        // 初始加载
        this.handleRoute();
    }

    async handleRoute() {
        const path = window.location.pathname;
        const template = this.routes[path] || this.routes['/'];
        
        try {
            // 加载页面模板
            const response = await fetch(template);
            const content = await response.text();
            
            // 更新内容
            document.querySelector('.left-column').innerHTML = content;
            
            // 更新导航状态
            this.updateNavState(path);
            
            // 更新右侧边栏
            this.updateSidebar(path);
            
            // 等待DOM更新完成
            await new Promise(resolve => setTimeout(resolve, 0));
            
            // 初始化对应的组件
            if (path === '/exchange') {
                window.exchangeList = new ExchangeList();
            } else if (path === '/wallet') {
                window.walletList = new WalletList();
            } else if (path === '/calendar') {
                window.calendar = new Calendar();
            } else {
                window.coinList = new CoinList();
            }
        } catch (error) {
            console.error('Failed to load page:', error);
        }
    }

    navigate(path) {
        window.history.pushState(null, '', path);
        this.handleRoute();
    }

    updateNavState(path) {
        // 移除所有活动状态
        document.querySelectorAll('.subnav .link').forEach(link => {
            link.parentElement.classList.remove('active');
        });
        
        // 设置当前活动项
        const activeLink = document.querySelector(`.subnav a[href="${path}"]`);
        if (activeLink) {
            activeLink.parentElement.classList.add('active');
        }
    }

    updateSidebar(path) {
        const marketComponents = document.getElementById('market-vote');
        const newsFeed = document.getElementById('news-feed');
        const exchangeAnnouncements = document.getElementById('exchange-announcements');

        if (path === '/exchange') {
            // 交易所页面显示公告，隐藏其他组件
            if (marketComponents) marketComponents.style.display = 'none';
            if (newsFeed) newsFeed.style.display = 'none';
            if (exchangeAnnouncements) {
                exchangeAnnouncements.style.display = 'block';
                // 加载公告内容
                fetch('exchange-announcements.html')
                    .then(response => response.text())
                    .then(html => {
                        exchangeAnnouncements.innerHTML = html;
                    })
                    .catch(error => {
                        console.error('Failed to load exchange announcements:', error);
                    });
            }
        } else if (path === '/calendar') {
            // 日历页面隐藏所有右侧组件
            if (marketComponents) marketComponents.style.display = 'none';
            if (newsFeed) newsFeed.style.display = 'none';
            if (exchangeAnnouncements) exchangeAnnouncements.style.display = 'none';
        } else {
            // 其他页面显示市场投票和新闻，隐藏公告
            if (marketComponents) marketComponents.style.display = 'block';
            if (newsFeed) newsFeed.style.display = 'block';
            if (exchangeAnnouncements) exchangeAnnouncements.style.display = 'none';
        }
    }
} 