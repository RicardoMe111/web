// 直接绑定事件，不等待window.onload
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const authModal = document.getElementById('authModal');
    const authClose = document.getElementById('authClose');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    const loginTrigger = document.getElementById('loginRegisterBtn');

    console.log('初始化登录/注册模块');
    console.log('登录按钮:', loginTrigger);
    console.log('模态框:', authModal);

    // 检查元素是否存在
    if (!loginTrigger || !authModal) {
        console.error('找不到必要的DOM元素:', {
            loginTrigger: !!loginTrigger,
            authModal: !!authModal
        });
        return;
    }

    // 打开登录/注册弹窗
    loginTrigger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('点击登录按钮');
        authModal.style.display = 'flex';
        authModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // 关闭弹窗
    if (authClose) {
        authClose.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('点击关闭按钮');
            authModal.classList.remove('active');
            setTimeout(() => {
                authModal.style.display = 'none';
            }, 300);
            document.body.style.overflow = '';
        });
    }

    // 点击弹窗外部关闭
    authModal.addEventListener('click', function(e) {
        if (e.target === authModal) {
            authModal.classList.remove('active');
            setTimeout(() => {
                authModal.style.display = 'none';
            }, 300);
            document.body.style.overflow = '';
        }
    });

    // 阻止弹窗内部点击事件冒泡
    const authContainer = authModal.querySelector('.auth-container');
    if (authContainer) {
        authContainer.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // 切换登录/注册表单
    authTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const targetTab = this.dataset.tab;
            console.log('切换到:', targetTab);
            
            // 更新标签状态
            authTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 更新表单显示
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${targetTab}Form`) {
                    form.classList.add('active');
                }
            });
        });
    });

    // 处理登录表单提交
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('提交登录表单');
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            // 这里添加实际的登录逻辑
            console.log('登录信息:', { email, password });
        });
    }

    // 处理注册表单提交
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('提交注册表单');
            
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // 这里添加实际的注册逻辑
            console.log('注册信息:', { email, password, confirmPassword });
        });
    }
}); 