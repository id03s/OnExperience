const axios = require('axios');
const cheerio = require('cheerio');

async function fetchText(url, headers = {}) {
  const res = await axios.get(url, {
    timeout: 15000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      ...headers
    }
  });
  return res.data;
}

function detectPlatform(url) {
  if (/blog\.naver\.com\//i.test(url) || /m\.blog\.naver\.com\//i.test(url)) return 'naver';
  if (/tistory\.com/i.test(url)) return 'tistory';
  return 'generic';
}

function naverRssUrl(url) {
  // https://rss.blog.naver.com/{blogId}.xml
  const m = url.match(/blog\.naver\.com\/([a-zA-Z0-9._-]+)/);
  if (!m) return null;
  return `https://rss.blog.naver.com/${m[1]}.xml`;
}

function tistoryRssUrl(url) {
  const m = url.match(/https?:\/\/(.+?tistory\.com)/);
  return m ? `https://${m[1]}/rss` : null;
}

async function parseRss(xmlText) {
  const $ = cheerio.load(xmlText, { xmlMode: true });
  const items = [];
  $('item').slice(0, 20).each((_, el) => {
    const $el = $(el);
    items.push({
      title: $el.find('title').text(),
      link: $el.find('link').text(),
      pubDate: $el.find('pubDate').text(),
      summary: $el.find('description').text(),
    });
  });
  return items;
}

async function fetchFullPost(link) {
  const html = await fetchText(link);
  const $ = cheerio.load(html);
  const contentText = $('article, .se-main-container, #content, .post, .entry, body').text();

  const altTexts = [];
  $('img').each((_, img) => {
    const alt = $(img).attr('alt');
    if (alt) altTexts.push(alt);
  });

  const tags = [];
  $('a, span').each((_, a) => {
    const tx = ($(a).text() || '').trim();
    if (/^#/.test(tx)) tags.push(tx);
  });

  return { content: contentText, altTexts, tags };
}

async function fetchPosts(baseUrl) {
  const platform = detectPlatform(baseUrl);
  let rssUrl = null;
  if (platform === 'naver') rssUrl = naverRssUrl(baseUrl);
  if (platform === 'tistory') rssUrl = tistoryRssUrl(baseUrl);

  let posts = [];
  if (rssUrl) {
    try {
      const xml = await fetchText(rssUrl);
      const items = await parseRss(xml);
      for (const it of items) {
        try {
          const full = await fetchFullPost(it.link);
          posts.push({ ...it, ...full });
          await new Promise(r => setTimeout(r, 800)); // throttle
        } catch (e) { /* skip this post */ }
      }
    } catch (e) {
      // RSS 실패 시 generic 시도
    }
  }

  if (!posts.length) {
    // generic: 첫 페이지에서 최신 글 링크 수집 (휴리스틱)
    const html = await fetchText(baseUrl);
    const $ = cheerio.load(html);
    const links = [];
    $('a').each((_, a) => {
      const href = $(a).attr('href') || '';
      if (/\d{4}\/\d{2}\//.test(href) || /post|entry|article|\d{6,}/i.test(href)) {
        const abs = href.startsWith('http') ? href : new URL(href, baseUrl).href;
        links.push(abs);
      }
    });
    const uniq = Array.from(new Set(links)).slice(0, 15);
    for (const link of uniq) {
      try {
        const full = await fetchFullPost(link);
        posts.push({ title: link, link, pubDate: '', summary: '', ...full });
        await new Promise(r => setTimeout(r, 800));
      } catch (e) { /* skip */ }
    }
  }

  return posts;
}

module.exports = { fetchPosts };
