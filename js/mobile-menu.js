document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navbar = document.querySelector('.navbar');
    
    if (menuToggle && navbar) {
        menuToggle.addEventListener('click', function() {
            navbar.classList.toggle('mobile-menu-open');
        });
        
        // 点击菜单外区域关闭菜单
        document.addEventListener('click', function(event) {
            if (!navbar.contains(event.target) && navbar.classList.contains('mobile-menu-open')) {
                navbar.classList.remove('mobile-menu-open');
            }
        });
    }
}); 