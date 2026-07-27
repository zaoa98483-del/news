const https = require('https');

// 用 rss2json 服务抓取 RSS，直接返回 JSON
function fetchRSS(url) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
    https.get(apiUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'ok' && json.items) {
            resolve(json.items.map(item => ({
              title: item.title,
              description: (item.description || '').replace(/<[^>]*>/g, '').substring(0, 80),
              source: new URL(url).hostname.replace('www.','')
            })));
          } else {
            reject('RSS 解析失败');
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  let allNews = [];
  try {
    const cctv = await fetchRSS('https://news.cctv.com/rss/');
    allNews = allNews.concat(cctv);
  } catch (e) { console.log('央视新闻抓取失败'); }

  try {
    const xinhua = await fetchRSS('http://www.xinhuanet.com/rss/title/10.xml');
    allNews = allNews.concat(xinhua);
  } catch (e) { console.log('新华社抓取失败'); }

  // 去重
  const seen = new Set();
  const uniqueNews = [];
  for (let item of allNews) {
    if (!seen.has(item.title)) {
      seen.add(item.title);
      uniqueNews.push(item);
    }
  }

  const xinwenlianbo = uniqueNews.slice(0, 5);
  const shehui = uniqueNews.slice(5, 11).map((item, i) => {
    const tags = ['热门','攀升','新','热门','攀升','新'];
    return { ...item, tag: tags[i % 6] };
  });

  const data = {
    update_time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    xinwenlianbo,
    shehui,
    jiaodian: {
      title: xinwenlianbo[0] ? xinwenlianbo[0].title : '今日焦点',
      summary: xinwenlianbo[0] ? xinwenlianbo[0].description : '请关注今日重要新闻。'
    },
    guoji: ["联合国大会就全球治理改革展开讨论","欧盟推动数字经济发展新战略","东盟外长会议聚焦区域一体化","中东多国加速能源转型","非洲自贸区建设取得进展"],
    shijie: ["全球气候行动峰会在巴黎举行","国际空间站新实验模块对接","世界人工智能大会召开","全球粮食安全指数发布","IMF上调全球增长预期"],
    wangluo: [
      { title: "AI绘画引发创意产业讨论", heat: "🔥 980万" },
      { title: "夏日旅行打卡地推荐", heat: "🔥 756万" },
      { title: "国产动画电影票房破纪录", heat: "🔥 620万" },
      { title: "全民健身挑战赛", heat: "📈 480万" },
      { title: "智能家居新体验", heat: "📈 350万" },
      { title: "各地特色美食出圈", heat: "🆕 210万" }
    ]
  };

  require('fs').writeFileSync('data.json', JSON.stringify(data, null, 2), 'utf-8');
  console.log('✅ data.json 生成成功，共', uniqueNews.length, '条新闻');
})();
