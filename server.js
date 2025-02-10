const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 启用 CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// 禁用响应缓存
app.use((req, res, next) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    next();
});

// 创建日志目录
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// 创建日志写入流
const logStream = fs.createWriteStream(
    path.join(logDir, `server-${new Date().toISOString().split('T')[0]}.log`),
    { flags: 'a' }
);

// 日志记录函数
function writeLog(level, message, data = null) {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] ${level}: ${message}`;
    if (data) {
        logMessage += `\n    ${JSON.stringify(data)}`;
    }
    logMessage += '\n';
    
    // 同时写入控制台和文件
    console.log(logMessage);
    logStream.write(logMessage);
}

// 替换所有 console.log 和 console.error
const log = {
    info: (message, data) => writeLog('INFO', message, data),
    error: (message, data) => writeLog('ERROR', message, data),
    warn: (message, data) => writeLog('WARN', message, data)
};

// 添加请求日志中间件
app.use((req, res, next) => {
    const start = Date.now();
    // 只记录关键信息，减少日志大小
    const logData = {
        method: req.method,
        url: req.url,
        query: req.query,
        clientIP: req.ip
    };
    log.info(`${req.method} ${req.url}`, logData);
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        log.info(`请求完成`, {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`
        });
    });
    next();
});

// 环境配置
const isDev = true;

// 服务器配置
const serverConfig = {
    port: process.env.PORT || (isDev ? 3000 : 8080)
};

// 数据库配置
const dbConfig = isDev ? {
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'coinbit',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000,
    acquireTimeout: 10000,
    timeout: 10000
} : {
    host: '127.0.0.1',
    port: 3306,
    user: 'coinbit',
    password: 'coinbit',
    database: 'coinbit',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 数据库连接处理
let isConnected = false;
async function handleDisconnect() {
    if (isConnected) {
        return;
    }
    
    try {
        const connection = await pool.getConnection();
        isConnected = true;
        log.info('数据库连接成功', {
            host: connection.config.host,
            port: connection.config.port,
            database: connection.config.database
        });
        connection.release();
    } catch (err) {
        isConnected = false;
        log.error('数据库连接错误', err);
        setTimeout(handleDisconnect, 2000);
    }
}

// 初始化数据库连接
handleDisconnect();

// API 路由
app.get('/api/coins', async (req, res) => {
    const requestStart = Date.now();
    
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const sort = req.query.sort || 'rank';
        const order = req.query.order || 'ASC';
        const type = req.query.type || 'all';

        let whereClause = '';
        if (type === 'up') {
            whereClause = 'WHERE rise_24h > 0';
        } else if (type === 'down') {
            whereClause = 'WHERE rise_24h < 0';
        }

        const sortFieldMap = {
            'rank': 'rank',
            'name': 'name',
            'price': 'price',
            'marketCap': 'market_cap',
            'volume': 'volume_24h',
            'change': 'change_24h',
            'turnover': 'turnover_24h',
            'rise': 'rise_24h'
        };

        let sortOrder = order;
        if (!req.query.order) {
            sortOrder = sort === 'rank' ? 'ASC' : 'DESC';
        }

        const sortField = sortFieldMap[sort] || 'rank';
        
        let connection;
        try {
            connection = await pool.getConnection();
            
            // 使用事务确保数据一致性
            await connection.beginTransaction();
            
            const [rows] = await connection.query(`
                SELECT 
                    id,
                    \`rank\`,
                    name,
                    symbol,
                    CAST(price AS DECIMAL(20,8)) as price,
                    CAST(market_cap AS DECIMAL(20,2)) as market_cap,
                    CAST(volume_24h AS DECIMAL(20,2)) as volume_24h,
                    CAST(change_24h AS DECIMAL(20,2)) as change_24h,
                    CAST(turnover_24h AS DECIMAL(20,2)) as turnover_24h,
                    CAST(rise_24h AS DECIMAL(20,2)) as rise_24h,
                    trend_7d
                FROM crypto_prices 
                ${whereClause}
                ORDER BY ${sortField} ${sortOrder}
                LIMIT ? OFFSET ?
            `, [limit, offset]);

            const [countResults] = await connection.query(
                `SELECT COUNT(*) as total FROM crypto_prices ${whereClause}`
            );
            
            await connection.commit();
            
            const duration = Date.now() - requestStart;
            log.info('查询完成', {
                duration: `${duration}ms`,
                rowCount: rows.length,
                total: countResults[0].total
            });

            const formattedResults = rows.map(coin => ({
                id: coin.id,
                rank: parseInt(coin.rank) || 0,
                name: coin.name || '-',
                symbol: coin.symbol || '-',
                price: formatPrice(coin.price),
                marketCap: coin.market_cap || '0',
                volume: formatVolume(coin.volume_24h),
                change: formatChange(coin.change_24h),
                turnover: coin.turnover_24h || '0',
                rise: coin.rise_24h || '0',
                trend: coin.trend_7d || 'N/A'
            }));

            res.json({
                code: 0,
                message: 'success',
                data: formattedResults,
                total: countResults[0].total,
                page,
                limit,
                timestamp: new Date().getTime()
            });
        } catch (err) {
            if (connection) {
                await connection.rollback();
            }
            throw err;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    } catch (err) {
        log.error('API错误', err);
        res.status(500).json({
            code: 500,
            message: '服务器内部错误',
            error: err.message,
            timestamp: new Date().getTime()
        });
    }
});

// 格式化工具函数
function formatPrice(price) {
    price = parseFloat(price || 0);
    if (price >= 1000000000000) {
        return (price / 1000000000000).toFixed(2) + '万亿';
    } else if (price >= 100000000) {
        return (price / 100000000).toFixed(2) + '亿';
    }
    return price.toString();
}

function formatVolume(volume) {
    volume = parseFloat(volume || 0);
    if (volume >= 100000000) {
        return (volume / 100000000).toFixed(2) + '亿';
    }
    return volume.toString();
}

function formatChange(change) {
    if (!change) return '0';
    let changeValue = parseFloat(change);
    if (isNaN(changeValue)) return change;
    
    if (changeValue >= 100000000) {
        change = (changeValue / 100000000).toFixed(2) + '亿';
    } else if (changeValue >= 10000) {
        change = (changeValue / 10000).toFixed(2) + '万';
    }
    return change;
}

// 优化 exchanges 接口
app.get('/api/exchanges', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [results] = await connection.query('SELECT * FROM exchanges');
        res.json({
            code: 0,
            message: 'success',
            data: results,
            timestamp: new Date().getTime()
        });
    } catch (error) {
        log.error('exchanges查询错误', error);
        res.status(500).json({ 
            code: 500, 
            error: '数据库查询失败',
            timestamp: new Date().getTime()
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// 优化 wallets 接口
app.get('/api/wallets', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [results] = await connection.query('SELECT * FROM wallets');
        res.json({ 
            code: 0, 
            data: results,
            timestamp: new Date().getTime()
        });
    } catch (error) {
        log.error('wallets查询错误', error);
        res.json({ 
            code: 1, 
            message: '获取数据失败', 
            error,
            timestamp: new Date().getTime()
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// 添加路由以处理 calendar.js 文件
app.get('/calendar.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'calendar.js'));
});

// 添加路由以处理 iconfont.woff2 文件
app.get('/iconfont.woff2', (req, res) => {
    res.sendFile(path.join(__dirname, 'iconfont.woff2'), {
        headers: {
            'Content-Type': 'font/woff2'
        }
    });
});

// 添加路由以处理图标文件
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'favicon.ico'), {
        headers: {
            'Content-Type': 'image/x-icon'
        }
    });
});

// 特定的页面路由
const pageRoutes = {
    '/': 'coin-list.html',
    '/wallet': 'wallet-list.html',
    '/calendar': 'calendar.html',
    '/exchange': 'exchange-list.html'
};

// 统一的页面处理函数
async function handlePageRequest(pagePath, req, res) {
    try {
        // 始终返回 index.html
        const indexPath = path.join(__dirname, 'index.html');
        
        if (!fs.existsSync(indexPath)) {
            log.error('页面文件不存在', { path: indexPath });
            return res.status(404).send('页面不存在');
        }

        // 设置响应头
        res.set({
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        // 直接发送 index.html
        res.sendFile(indexPath);

    } catch (error) {
        log.error('处理页面请求失败', error);
        res.status(500).send('加载页面失败');
    }
}

// 注册页面路由
Object.entries(pageRoutes).forEach(([route, page]) => {
    app.get(route, (req, res) => handlePageRequest(page, req, res));
});

// 修改通配符路由
app.get('*', (req, res, next) => {
    // 如果是API请求或静态资源，交给下一个处理器
    if (req.path.startsWith('/api/') || req.path.includes('.')) {
        return next();
    }
    
    // 检查是否是已知路由
    const targetPage = pageRoutes[req.path];
    if (targetPage) {
        return handlePageRequest(targetPage, req, res);
    }

    // 未知路由返回首页
    handlePageRequest('coin-list.html', req, res);
});

// 添加测试路由
app.get('/api/test', (req, res) => {
    // 测试数据库连接
    pool.getConnection().then(connection => {
        connection.query('SELECT 1 + 1 AS result').then(([results]) => {
            // 测试 news_info 表
            connection.query('SELECT COUNT(*) as count FROM news_info').then(([tableResults]) => {
                res.json({
                    code: 0,
                    message: 'success',
                    dbConnected: true,
                    tableExists: true,
                    recordCount: tableResults[0].count
                });
            }).catch((tableError) => {
                console.error('news_info表访问失败:', tableError);
                res.status(500).json({
                    error: '表访问失败',
                    message: tableError.message
                });
            });
        }).catch((error) => {
            console.error('数据库连接测试失败:', error);
            res.status(500).json({
                error: '数据库连接失败',
                message: error.message
            });
        });
    }).catch((err) => {
        console.error('数据库连接已断开，尝试重新连接...');
        handleDisconnect();
    });
});

// 添加日历数据 API
app.get('/api/calendar', async (req, res) => {
    const requestStart = Date.now();
    log.info('收到日历数据请求', {
        query: req.query,
        headers: req.headers,
        url: req.url
    });

    let connection;
    try {
        const { year, month, day, category } = req.query;
        const date = `${year}-${month}-${day}`;
        
        log.info('解析请求参数', { year, month, day, category, date });
        
        connection = await pool.getConnection();
        log.info('数据库连接成功');
        
        // 构建查询条件
        let whereClause = 'WHERE DATE(datetime) = ?';
        let queryParams = [date];
        
        if (category && category !== '全部') {
            whereClause += ' AND type = ?';
            queryParams.push(category);
        }

        log.info('执行新闻查询', { whereClause, queryParams });

        // 获取新闻数据
        const [news] = await connection.query(`
            SELECT 
                id,
                title,
                content,
                datetime,
                type,
                importance,
                related_coins,
                source_url
            FROM news_info
            ${whereClause}
            ORDER BY datetime DESC, importance DESC
        `, queryParams);

        log.info('新闻查询完成', { count: news.length });

        // 获取所有分类及其数量
        const [categories] = await connection.query(`
            SELECT type, COUNT(*) as count
            FROM news_info
            WHERE DATE(datetime) = ?
            GROUP BY type
        `, [date]);

        log.info('分类查询完成', { categories: categories.length });

        const response = {
            code: 0,
            message: 'success',
            data: news.map(item => ({
                ...item,
                datetime: item.datetime.toISOString(),
                importance: parseInt(item.importance) || 0
            })),
            categories: categories.map(cat => ({
                type: cat.type,
                count: cat.count
            })),
            timestamp: new Date().getTime()
        };

        const duration = Date.now() - requestStart;
        log.info('请求处理完成', {
            duration: `${duration}ms`,
            newsCount: news.length,
            categoriesCount: categories.length
        });

        res.json(response);
    } catch (error) {
        log.error('获取日历新闻失败', error);
        res.status(500).json({
            code: 500,
            message: '获取数据失败',
            error: error.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// 添加404处理
app.use((req, res) => {
    res.status(404).json({
        code: 404,
        message: '请求的资源不存在'
    });
});

// 添加全局错误处理
app.use((err, req, res, next) => {
    log.error('全局错误', err);
    res.status(500).json({
        code: 500,
        message: '服务器内部错误',
        error: err.message
    });
});

// 启动服务器
const PORT = serverConfig.port;
app.listen(PORT, () => {
    log.info('服务器启动', {
        port: PORT,
        environment: isDev ? '开发环境' : '生产环境',
        nodeVersion: process.version
    });
}); 