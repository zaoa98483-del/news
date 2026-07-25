const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 使用免费的 RSS 转 JSON 服务，稳定可靠
async function fetchRSS(url) {
    const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
    const res = await axios.get(api);
    if (res.data && res.data.status === 'ok' && res.data.items) {
        return res.data.items.slice(0, 6).map(item => ({
            title: item.title,
            description: (item.description || '').replace(/<[^>]*>/g, '').substring(0, 80),
            time: item.pubDate ? new Date(item.pubDate).toISOString().slice(11, 16) : ''
        }));
    }
    return [];
}

async function main() {
    let xinwen = [];
    // 优先尝试央视网 RSS（https）
    try {
        xinwen = await fetchRSS('https://news.cctv.com/rss/');
    } catch (e) {
        console.log('央视网 RSS 抓取失败，尝试备用源');
    }
    // 如果失败，尝试新华社 RSS（通过 rss2json 中转）
    if (xinwen.length === 0) {
        try {
            xinwen = await fetchRSS('http://www.xinhuanet.com/rss/title/10.xml');
        } catch (e) {
            console.log('新华社 RSS 抓取失败');
        }
    }
    // 最终备用：万一都失败，显示提示
    if (xinwen.length === 0) {
        xinwen = [{ title: '今日新闻正在更新中…', description: '请稍后刷新页面', time: '' }];
    }

    // 社会热点直接用新闻前几条生成
    const shehui = xinwen.slice(0, 6).map((item, i) => ({
        title: item.title,
        tag: i < 2 ? '热门' : (i < 4 ? '攀升' : '新'),
        tagClass: i < 2 ? 'hot' : (i < 4 ? 'rising' : 'new')
    }));

    // 国际、世界、网络热门用固定模板（您也可以之后自己改）
    const data = {
        xinwenlianbo: xinwen.slice(0, 5),
        shehui: shehui,
        jiaodian: {
            title: '今日焦点：' + (xinwen[0]?.title || '新闻观察'),
            summary: xinwen[0]?.description || '详细报道请关注官方媒体。',
            meta: ['📅 今日播出', '⏱️ 深度 · 15分钟', '👤 自动采编']
        },
        guoji: [
            { title: '联合国大会就全球治理改革展开讨论' },
            { title: '欧盟推动数字经济发展新战略' },
            { title: '东盟外长会议聚焦区域一体化' },
            { title: '中东多国加速能源转型' },
            { title: '非洲自贸区建设取得进展' }
        ],
        shijie: [
            { title: '全球气候行动峰会在巴黎举行' },
            { title: '国际空间站新实验模块对接' },
            { title: '世界人工智能大会召开' },
            { title: '全球粮食安全指数发布' },
            { title: 'IMF上调全球增长预期' }
        ],
        wangluo: [
            { title: 'AI绘画引发创意产业讨论', heat: '🔥 980万' },
            { title: '夏日旅行打卡地推荐', heat: '🔥 756万' },
            { title: '国产动画电影票房破纪录', heat: '🔥 620万' },
            { title: '全民健身挑战赛', heat: '📈 480万' },
            { title: '智能家居新体验', heat: '📈 350万' },
            { title: '各地特色美食出圈', heat: '🆕 210万' }
        ]
    };

    fs.writeFileSync(
        path.join(__dirname, '..', 'data.json'),
        JSON.stringify(data, null, 2),
        'utf-8'
    );
    console.log('✅ 新闻 data.json 已生成');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
