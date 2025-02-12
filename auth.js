document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const authModal = document.getElementById('authModal');
    const authClose = document.getElementById('authClose');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    const loginTrigger = document.getElementById('loginRegisterBtn');

    // 添加调试信息
    console.log('Auth Modal:', authModal);
    console.log('Login Trigger:', loginTrigger);

    // 确保所有元素都存在
    if (!authModal || !loginTrigger) {
        console.error('找不到必要的DOM元素');
        return;
    }

    // 打开登录/注册弹窗
    loginTrigger.addEventListener('click', function(e) {
        console.log('Login button clicked'); // 添加点击事件调试信息
        e.preventDefault();
        e.stopPropagation();
        authModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    });

    // 关闭弹窗
    authClose.addEventListener('click', function() {
        authModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // 点击弹窗外部关闭
    authModal.addEventListener('click', function(e) {
        if (e.target === authModal) {
            authModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // 切换登录/注册表单
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
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
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 重置错误提示
        resetErrors();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // 表单验证
        let hasError = false;
        
        if (!validateEmail(email)) {
            showError('loginEmailError', '请输入有效的邮箱地址');
            hasError = true;
        }
        
        if (password.length < 6) {
            showError('loginPasswordError', '密码长度不能少于6位');
            hasError = true;
        }
        
        if (hasError) return;

        try {
            // 这里添加实际的登录API调用
            const response = await login(email, password);
            
            if (response.success) {
                // 登录成功，关闭弹窗并刷新页面
                authModal.classList.remove('active');
                document.body.style.overflow = '';
                window.location.reload();
            } else {
                showError('loginEmailError', response.message || '登录失败，请检查邮箱和密码');
            }
        } catch (error) {
            showError('loginEmailError', '登录失败，请稍后重试');
        }
    });

    // 处理注册表单提交
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 重置错误提示
        resetErrors();
        
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // 表单验证
        let hasError = false;
        
        if (!validateEmail(email)) {
            showError('registerEmailError', '请输入有效的邮箱地址');
            hasError = true;
        }
        
        if (password.length < 6) {
            showError('registerPasswordError', '密码长度不能少于6位');
            hasError = true;
        }
        
        if (password !== confirmPassword) {
            showError('confirmPasswordError', '两次输入的密码不一致');
            hasError = true;
        }
        
        if (hasError) return;

        try {
            // 这里添加实际的注册API调用
            const response = await register(email, password);
            
            if (response.success) {
                // 注册成功，自动登录并刷新页面
                authModal.classList.remove('active');
                document.body.style.overflow = '';
                window.location.reload();
            } else {
                showError('registerEmailError', response.message || '注册失败，请稍后重试');
            }
        } catch (error) {
            showError('registerEmailError', '注册失败，请稍后重试');
        }
    });

    // 辅助函数
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.classList.add('active');
    }

    function resetErrors() {
        const errors = document.querySelectorAll('.form-error');
        errors.forEach(error => {
            error.textContent = '';
            error.classList.remove('active');
        });
    }

    // API调用函数
    async function login(email, password) {
        // 这里替换为实际的API调用
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: '登录成功'
                });
            }, 1000);
        });
    }

    async function register(email, password) {
        // 这里替换为实际的API调用
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: '注册成功'
                });
            }, 1000);
        });
    }
}); 