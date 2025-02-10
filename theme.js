// 主题管理类
class ThemeManager {
    constructor() {
        this.storageKey = 'preferred-theme';
        this.themeToggleClass = 'theme-toggle';
        this.headerThemeToggleClass = 'theme-toggle-header';
        this.darkTheme = 'dark';
        this.lightTheme = 'light';
        this.autoTheme = 'auto';
        this.themeChangeEvent = 'themeChange';
        
        // 主题配置
        this.themes = {
            light: {
                name: '浅色',
                icon: 'sun',
                next: 'dark',
                color: '#f1c40f'
            },
            dark: {
                name: '深色',
                icon: 'moon',
                next: 'auto',
                color: '#34495e'
            },
            auto: {
                name: '跟随系统',
                icon: 'desktop',
                next: 'light',
                color: '#3498db'
            }
        };
        
        this.init();
    }

    // 初始化主题
    init() {
        // 获取存储的主题
        const storedTheme = localStorage.getItem(this.storageKey);
        
        if (storedTheme) {
            // 应用存储的主题
            this.setTheme(storedTheme);
        } else {
            // 检查系统主题偏好
            this.setThemeBySystemPreference();
        }

        // 监听系统主题变化
        this.watchSystemTheme();
        
        // 添加主题切换按钮
        this.addThemeToggle();
        
        // 添加键盘快捷键
        this.addKeyboardShortcuts();
        
        // 初始化主题切换动画
        this.initThemeTransition();
    }

    // 设置主题
    setTheme(theme) {
        const root = document.documentElement;
        const prevTheme = root.getAttribute('data-theme');
        
        // 如果是自动主题，则根据系统偏好设置
        if (theme === this.autoTheme) {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? this.darkTheme
                : this.lightTheme;
            root.setAttribute('data-theme', systemTheme);
            root.setAttribute('data-theme-auto', '');
        } else {
            root.setAttribute('data-theme', theme);
            root.removeAttribute('data-theme-auto');
        }

        localStorage.setItem(this.storageKey, theme);
        
        // 更新切换按钮状态
        this.updateToggleButton(theme);
        
        // 触发主题变更事件
        if (prevTheme !== theme) {
            this.dispatchThemeChangeEvent(theme, prevTheme);
        }
        
        // 更新meta主题色
        this.updateMetaThemeColor(theme);
    }

    // 切换主题
    toggleTheme() {
        const currentTheme = localStorage.getItem(this.storageKey) || this.lightTheme;
        const nextTheme = this.themes[currentTheme].next;
        this.setTheme(nextTheme);
    }

    // 根据系统偏好设置主题
    setThemeBySystemPreference() {
        const theme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? this.darkTheme
            : this.lightTheme;
        this.setTheme(theme);
    }

    // 监听系统主题变化
    watchSystemTheme() {
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (document.documentElement.hasAttribute('data-theme-auto')) {
                    this.setTheme(this.autoTheme);
                }
            });
        }
    }

    // 添加主题切换按钮
    addThemeToggle() {
        const toggleButton = document.createElement('button');
        toggleButton.className = this.themeToggleClass;
        toggleButton.setAttribute('aria-label', '切换主题');
        
        // 为每个主题创建图标
        Object.keys(this.themes).forEach(themeName => {
            const span = document.createElement('span');
            span.className = `theme-toggle-${themeName}`;
            span.innerHTML = `<i class="fas fa-${this.themes[themeName].icon}"></i>`;
            toggleButton.appendChild(span);
        });
        
        toggleButton.addEventListener('click', () => this.toggleTheme());
        
        // 添加工具提示
        this.addTooltip(toggleButton);
        
        // 添加到页面
        document.body.appendChild(toggleButton);
        
        // 初始化按钮状态
        const currentTheme = localStorage.getItem(this.storageKey) || this.lightTheme;
        this.updateToggleButton(currentTheme);
    }

    // 更新切换按钮状态
    updateToggleButton(theme) {
        // 更新固定按钮
        const toggleButton = document.querySelector(`.${this.themeToggleClass}`);
        if (toggleButton) {
            const nextTheme = this.themes[theme].next;
            toggleButton.setAttribute('data-tooltip', `切换到${this.themes[nextTheme].name}主题`);
            
            Object.keys(this.themes).forEach(themeName => {
                toggleButton.classList.toggle(`is-${themeName}`, theme === themeName);
            });
        }

        // 更新导航栏按钮
        const headerToggleButton = document.querySelector(`.${this.headerThemeToggleClass}`);
        if (headerToggleButton) {
            headerToggleButton.classList.remove('is-light', 'is-dark', 'is-auto');
            headerToggleButton.classList.add(`is-${theme}`);
            
            // 更新点击事件
            if (!headerToggleButton.hasAttribute('data-theme-initialized')) {
                headerToggleButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleTheme();
                });
                headerToggleButton.setAttribute('data-theme-initialized', 'true');
            }
        }
    }

    // 添加工具提示
    addTooltip(element) {
        const tooltip = document.createElement('div');
        tooltip.className = 'theme-toggle-tooltip';
        element.appendChild(tooltip);

        element.addEventListener('mouseenter', () => {
            tooltip.textContent = element.getAttribute('data-tooltip');
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
        });

        element.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
        });
    }

    // 添加键盘快捷键
    addKeyboardShortcuts() {
        document.addEventListener('keydown', e => {
            // Alt + T 切换主题
            if (e.altKey && e.key.toLowerCase() === 't') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    // 初始化主题切换动画
    initThemeTransition() {
        document.documentElement.classList.add('theme-transition');
        document.addEventListener('DOMContentLoaded', () => {
            document.documentElement.classList.remove('theme-transition');
        });
    }

    // 更新meta主题色
    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        const themeColors = {
            [this.lightTheme]: '#ffffff',
            [this.darkTheme]: '#1a1c1e',
            [this.autoTheme]: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#1a1c1e' : '#ffffff'
        };
        
        metaThemeColor.content = themeColors[theme];
    }

    // 触发主题变更事件
    dispatchThemeChangeEvent(newTheme, oldTheme) {
        const event = new CustomEvent(this.themeChangeEvent, {
            detail: {
                newTheme,
                oldTheme,
                isAuto: newTheme === this.autoTheme
            }
        });
        document.dispatchEvent(event);
    }
}

// 创建主题样式
const themeStyles = document.createElement('style');
themeStyles.textContent = `
    .theme-transition * {
        transition: none !important;
    }

    .theme-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: var(--shadow-sm);
    }

    .theme-toggle:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }

    .theme-toggle:active {
        transform: translateY(0);
    }

    .theme-toggle-light,
    .theme-toggle-dark,
    .theme-toggle-auto {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        transition: all 0.3s ease;
    }

    .theme-toggle i {
        font-size: 20px;
        transition: all 0.3s ease;
    }

    .theme-toggle-light i {
        color: #f1c40f;
    }

    .theme-toggle-dark i {
        color: #34495e;
    }

    .theme-toggle-auto i {
        color: #3498db;
    }

    .theme-toggle span {
        opacity: 0;
        transform: scale(0.5);
    }

    .theme-toggle.is-light .theme-toggle-light,
    .theme-toggle.is-dark .theme-toggle-dark,
    .theme-toggle.is-auto .theme-toggle-auto {
        opacity: 1;
        transform: scale(1);
    }

    .theme-toggle-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(-8px);
        background: var(--tooltip-bg);
        color: var(--tooltip-color);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }

    .theme-toggle:hover .theme-toggle-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(-12px);
    }

    @media (max-width: 768px) {
        .theme-toggle {
            bottom: 16px;
            right: 16px;
            width: 40px;
            height: 40px;
        }

        .theme-toggle i {
            font-size: 16px;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .theme-toggle,
        .theme-toggle *,
        .theme-toggle-tooltip {
            transition: none !important;
        }
    }

    /* 导航栏主题切换按钮样式 */
    .theme-toggle-header {
        display: flex;
        align-items: center;
        cursor: pointer;
    }

    .theme-toggle-header span {
        margin-left: 4px;
    }

    .theme-toggle-header .theme-toggle-light,
    .theme-toggle-header .theme-toggle-dark,
    .theme-toggle-header .theme-toggle-auto {
        display: none;
        align-items: center;
    }

    .theme-toggle-header.is-light .theme-toggle-light,
    .theme-toggle-header.is-dark .theme-toggle-dark,
    .theme-toggle-header.is-auto .theme-toggle-auto {
        display: flex;
    }

    .theme-toggle-header .fa-sun {
        color: #f1c40f;
    }

    .theme-toggle-header .fa-moon {
        color: #34495e;
    }

    .theme-toggle-header .fa-desktop {
        color: #3498db;
    }

    .theme-toggle-header:hover {
        opacity: 0.8;
    }

    @media (prefers-reduced-motion: reduce) {
        .theme-toggle-header {
            transition: none !important;
        }
    }
`;

document.head.appendChild(themeStyles);

// 初始化主题管理器
const themeManager = new ThemeManager(); 