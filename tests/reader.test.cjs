// 本地浏览器验证：拦截全部请求，不访问用户的浏览器或登录会话。
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const base = path.resolve(__dirname, '..');
const output = path.join(base, 'test-results');
fs.mkdirSync(output, { recursive: true });
const userscript = fs.readFileSync(path.join(base, 'xiaoheihe-reader.user.js'), 'utf8');
const fixtureCSS = fs.readFileSync(path.join(__dirname, 'fixture.css'), 'utf8');
const css = process.env.XHH_REFERENCE_CSS_DIR ? fixtureCSS + '\n' +
  ['index.css', 'index-Bihp8hbO.css', 'index-BQE5Tmp4.css', 'index-DBcvV3KQ.css', 'index-ChemEL1Y.css', 'index-CEV-W59j.css', 'index-vFYRmlki.css', 'index-D2QWFmGt.css']
    .map(name => fs.readFileSync(path.join(process.env.XHH_REFERENCE_CSS_DIR, name), 'utf8')).join('\n') : fixtureCSS;
const text = '这是一段用于验证阅读排版的社区内容。长时间阅读时，合适的字号与行距可以让段落更清晰。English words should wrap normally and URLs can break safely. '.repeat(3);
const svgImage = (width, height) => 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '"><rect width="100%" height="100%" fill="#87a9b8"/><circle cx="50%" cy="50%" r="25%" fill="#f2dba8"/></svg>');
const feedMedia = () => '<div class="bbs-content__imgs-wrapper" style="height:420px">' + Array.from({length:6},(_,i)=>'<div class="bbs-content__image hb-cpt__image" style="left:'+(i*205)+'px;top:0;width:200px;height:200px"><img class="hb-cpt__image-elem" src="'+svgImage(640,480)+'"></div>').join('') + '<span class="bbs-content__image-cnt">6张</span></div><div class="bbs-content__video_wrapper" style="width:700px;height:400px"><img class="bbs-content__video-cover" src="'+svgImage(1600,900)+'"></div>';
const postMedia = () => '<div class="com-img"><div class="hb-cpt__image" style="width:760px;height:1520px"><img id="portrait" class="hb-cpt__image-elem" src="'+svgImage(1000,2000)+'"></div></div><div class="img"><img id="landscape" src="'+svgImage(1600,900)+'"></div><img id="emoji" class="hb-emoji" width="18" height="18" src="'+svgImage(18,18)+'"><video id="post-video" width="800" height="450"></video>';
const fixture = (detail) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="app"><header style="height:64px">小黑盒 · 本地布局验证</header><main>
  <section id="${detail ? 'page-bbs-link' : 'page-bbs-community'}" class="${detail ? 'layout-normal' : ''}" data-v-38787230 data-v-a4016135>
  ${detail ? '' : '<div class="bbs-community__search-module" data-v-a4016135><div class="search-input"><div class="el-input__wrapper"><input placeholder="搜索小黑盒"></div></div></div>'}
  <div class="content" data-v-38787230 data-v-a4016135><main class="list" data-v-38787230 data-v-a4016135>
  ${detail ? `<div class="hb-bbs-link"><div class="image-text__header-image"><div class="header-image__container" style="height:600px"><div class="swiper-slide"><div class="header-image__item-image"><img src="${svgImage(1600,900)}"></div></div></div></div><div class="post__header-image"><img class="post_header-image-item" src="${svgImage(1600,900)}"></div><div class="hb-cpt-page-header hb-bbs-link__header"><div class="page-header__container"><button class="page-header__back-btn">返回</button></div></div><div class="hb-bbs-link__container"><article class="hb-bbs-post"><div class="post__container"><h1 class="link-section-title">用更舒服的排版阅读游戏社区</h1><div class="link-section-user"><span class="link-user__username">示例作者</span></div><div class="post__content">${postMedia()}<p class="com-text">${text}</p><p class="com-text">${text}</p><a href="#">正文链接</a><pre>${'code '.repeat(150)}</pre></div></div></article><div class="link-comment"><div class="link-comment__comment-item"><div class="comment-item__content-container"><div class="comment-item__content">评论文字示例</div></div><div class="link-comment__comment-children"><div class="comment-children-item"><span class="children-item__comment-content">回复文字</span></div></div></div><textarea aria-label="写评论"></textarea></div></div></div>` : `<div class="hb-bbs-home" data-v-a4016135><div class="bbs-home__topic-list-wrapper" data-v-a4016135>游戏社区快捷入口</div><div class="bbs-home__content-list" data-v-a4016135>${Array.from({ length: 12 }, (_, i) => `<div class="bbs-home__content-item hb-bbs-home__feed-splitline" data-v-a4016135><article class="hb-cpt__bbs-content"><h2 class="bbs-content__title">第 ${i + 1} 条帖子 · 阅读优化示例</h2><div class="bbs-content__content">${text}</div>${feedMedia()}</article></div>`).join('')}</div></div>`}
  </main><aside class="right" data-v-38787230 data-v-a4016135><div class="bbs-community-hot-topic" data-v-f1e287e0><p class="hot-topic__name">${detail ? '相关推荐' : '热门社区'}</p></div><div class="right-side-default"><p class="title">下载小黑盒 APP</p></div></aside></div></section></main></div><div class="hb-cpt__image-viewer" style="position:fixed;inset:0;display:none"><img id="viewer-image" style="width:900px;height:600px" src="${svgImage(900,600)}"></div></body></html>`;

const topicFixture = () => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="app"><header style="height:64px">小黑盒 · 社区页面布局验证</header><main><section id="page-topic-link" data-v-ef740a2d><div class="topic-link__content" data-v-ef740a2d><main class="topic-link__main" data-v-ef740a2d><div class="topic-link__panel" data-v-ef740a2d>
<div class="hb-cpt-page-header hb-topic-header topic-link__header" data-v-ef740a2d><div class="page-header__container"><div class="hb-cpt__slide-tab block topic-link__menu-tabs" data-v-ef740a2d><button class="slide-tab__tab-item active">社区</button><button class="slide-tab__tab-item">游戏详情</button></div></div></div>
<div class="topic-link__filter-row" data-v-ef740a2d><div class="hb-cpt__slide-tab underline topic-link__filter-tabs" data-v-ef740a2d><button id="filter-all" class="slide-tab__tab-item active">综合</button><button id="filter-new" class="slide-tab__tab-item">最新</button><button class="slide-tab__tab-item">精华</button></div><button id="topic-sorter" class="topic-link__sorter" data-v-ef740a2d>热门排序</button></div>
<div class="topic-link__list" data-v-ef740a2d>${Array.from({length:4}, (_,i) => `<div class="topic-link__item topic-link__splitline" data-v-ef740a2d><article class="hb-cpt__bbs-content"><h2 class="bbs-content__title">社区帖子 ${i+1}</h2><div class="bbs-content__content">${text}</div>${feedMedia()}</article></div>`).join('')}</div>
</div></main><aside class="cpt-right-side topic-link__right" data-v-ef740a2d><div class="topic-aside__topic-indicator"><p>社区信息 · 关注社区</p></div><div class="topic__aside-miniprogram"><p class="aside-miniprogram__header">推荐入口</p></div></aside></div></section></main></div></body></html>`;

(async () => {
  const browser = await chromium.launch({ ...(process.env.BROWSER_EXECUTABLE_PATH ? { executablePath: process.env.BROWSER_EXECUTABLE_PATH } : {}), headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.route('**/*', route => {
      const request = route.request();
      if (request.isNavigationRequest()) {
        const pathname = new URL(request.url()).pathname;
        const body = /^\/(?:app\/)?topic\/link\//.test(pathname) ? topicFixture() : fixture(/^\/(?:app\/)?bbs\/link\//.test(pathname));
        return route.fulfill({ contentType: 'text/html; charset=utf-8', body });
      }
      return route.abort();
    });
    await context.addInitScript(() => {
      const state = window.__readerTest = { writeFailure: false, readFailure: false, writes: 0, nextID: 0, menus: new Map(), listeners: new Map(), polls: new Set() };
      window.GM_getValue = (key, fallback) => {
        if (state.readFailure) throw new Error('Storage read unavailable');
        return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
      };
      window.GM_setValue = (key, value) => {
        if (state.writeFailure) throw new Error('Storage write unavailable');
        state.writes++;
        const old = JSON.parse(localStorage.getItem(key) || 'null');
        localStorage.setItem(key, JSON.stringify(value));
        for (const [name, callback] of state.listeners.values()) if (name === key) callback(key, old, value, false);
      };
      window.GM_registerMenuCommand = (name, callback) => { const id = ++state.nextID; state.menus.set(id, callback); return id; };
      window.GM_unregisterMenuCommand = id => state.menus.delete(id);
      window.GM_addValueChangeListener = (key, callback) => { const id = ++state.nextID; state.listeners.set(id, [key, callback]); return id; };
      window.GM_removeValueChangeListener = id => state.listeners.delete(id);
      window.addEventListener('storage', event => {
        for (const [key, callback] of state.listeners.values()) if (key === event.key) callback(key, JSON.parse(event.oldValue || 'null'), JSON.parse(event.newValue || 'null'), true);
      });
      const nativeTimeout = window.setTimeout;
      const nativeClear = window.clearTimeout;
      window.setTimeout = (callback, delay, ...args) => {
        const id = nativeTimeout(() => { state.polls.delete(id); callback(...args); }, delay);
        if (delay === 1500) state.polls.add(id);
        return id;
      };
      window.clearTimeout = id => { state.polls.delete(id); nativeClear(id); };
    });
    const install = () => page.addScriptTag({ content: userscript });
    const computed = selector => page.locator(selector).first().evaluate(el => {
      const s = getComputedStyle(el); return { font: s.fontSize, line: s.lineHeight, color: s.color, width: el.getBoundingClientRect().width, display: s.display };
    });
    const control = key => page.locator(`#xhh-reader-tools [data-key="${key}"]`);
    const changeRange = (key, value) => control(key).evaluate((el, next) => { el.value = String(next); el.dispatchEvent(new Event('input', { bubbles: true })); }, value);
    const bounds = selector => page.locator(selector).first().evaluate(el => {
      const rect = el.getBoundingClientRect(); const s = getComputedStyle(el);
      return { width:rect.width, height:rect.height, display:s.display, fit:s.objectFit, position:s.position };
    });
    const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1, `${actual} should be near ${expected}`);
    await page.goto('https://www.xiaoheihe.cn/app/bbs/home');
    await install();
    assert.equal((await computed('.bbs-content__content')).font, '18px');
    assert.equal((await computed('.bbs-content__content')).line, '33.3px');
    assert.equal((await computed('#page-bbs-community > .content > .list')).width, 820);
    assert.equal((await computed('.bbs-content__content')).color, 'rgb(51, 53, 47)');
    await page.locator('#xhh-reader-tools #toggle').click();
    // 首页缩略图默认缩小并限制为三张；原点击事件及完整图片仍存在于 DOM。
    near((await bounds('.bbs-content__image')).width, 120);
    near((await bounds('.bbs-content__image')).height, 120);
    assert.equal(await page.locator('.bbs-content__imgs-wrapper').first().locator('.bbs-content__image:visible').count(), 3);
    assert.equal(await page.locator('.bbs-content__imgs-wrapper').first().locator('.bbs-content__image').count(), 6);
    assert.equal((await bounds('.bbs-content__image img')).fit, 'contain');
    await changeRange('thumbSize', 64); await changeRange('thumbCount', 5);
    near((await bounds('.bbs-content__image')).width, 64);
    assert.equal(await page.locator('.bbs-content__imgs-wrapper').first().locator('.bbs-content__image:visible').count(), 5);
    await control('imageFit').selectOption('cover');
    assert.equal((await bounds('.bbs-content__image img')).fit, 'cover');
    await control('mediaSizing').uncheck();
    near((await bounds('.bbs-content__image')).width, 200);
    assert.equal((await bounds('.bbs-content__image')).position, 'absolute');
    assert.equal(await page.locator('.bbs-content__imgs-wrapper').first().locator('.bbs-content__image:visible').count(), 6);
    await control('mediaSizing').check();
    await control('showImages').uncheck();
    assert.equal((await bounds('.bbs-content__imgs-wrapper')).display, 'none');
    await control('showImages').check();
    await control('showVideos').uncheck();
    assert.equal((await bounds('.bbs-content__video_wrapper')).display, 'none');
    await control('showVideos').check();
    assert.ok((await bounds('.bbs-content__video_wrapper')).width <= 420);
    assert.ok((await bounds('.bbs-content__video_wrapper')).height <= 280);
    await page.locator('#xhh-reader-tools [data-preset="compact"]').click();
    near((await bounds('.bbs-content__image')).width, 80);
    assert.equal((await computed('.bbs-content__content')).font, '16px');
    assert.equal(await page.locator('.bbs-content__content').first().evaluate(el => getComputedStyle(el).webkitLineClamp), '2');
    // 支持直接输入，超出范围的数字会限制在支持范围。
    await page.locator('#xhh-reader-tools details').nth(1).evaluate(el => { el.open = true; });
    await page.locator('#xhh-reader-tools [data-number-key="width"]').fill('1840');
    await page.locator('#xhh-reader-tools [data-number-key="width"]').dispatchEvent('change');
    assert.equal(await page.locator('html').evaluate(el => el.style.getPropertyValue('--xhr-width')), '1840px');
    await page.locator('#xhh-reader-tools [data-number-key="font"]').fill('99');
    await page.locator('#xhh-reader-tools [data-number-key="font"]').dispatchEvent('change');
    assert.equal((await computed('.bbs-content__content')).font, '40px');
    await page.locator('#xhh-reader-tools [data-preset="comfortable"]').click();
    // 预设不会重置主题和专注等阅读选项。
    await control('focus').check();
    assert.equal((await computed('.right')).display, 'none');
    await control('fullSummary').check();
    assert.equal((await computed('.bbs-content__content')).display, 'block');
    await control('hideTopics').check();
    assert.equal((await computed('.bbs-home__topic-list-wrapper')).display, 'none');
    await control('theme').selectOption('dark');
    assert.equal((await computed('.bbs-content__content')).color, 'rgb(220, 226, 233)');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('xhh-reader-options-v1'))?.theme === 'dark');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('#xhh-reader-tools #settings').evaluate(el => { el.scrollTop = 0; });
    await page.screenshot({ path: path.join(output, 'preview-home-dark.png') });
    await page.reload(); await install();
    assert.equal(await page.locator('html').getAttribute('data-xhr-theme'), 'dark');
    assert.equal((await computed('.right')).display, 'none');
    await page.locator('#xhh-reader-tools #toggle').click();
    await control('enabled').uncheck();
    assert.equal(await page.locator('html').getAttribute('data-xhr-theme'), null);
    assert.equal((await computed('.bbs-content__content')).font, '15px');
    assert.notEqual((await computed('.right')).display, 'none');
    await page.locator('#xhh-reader-tools #reset').click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('xhh-reader-options-v1'))?.enabled);
    // 验证站内 pushState 无刷新离开 / 返回阅读路径。
    await page.evaluate(() => history.pushState({}, '', '/game/steam/123'));
    await page.waitForFunction(() => !document.documentElement.classList.contains('xhr-on'));
    await page.evaluate(() => history.pushState({}, '', '/app/bbs/home'));
    await page.waitForFunction(() => document.documentElement.classList.contains('xhr-on'));
    // 动态新帖子无需 JS 扫描也应应用 CSS。
    await page.evaluate(() => {
      const article = document.createElement('div'); article.className = 'bbs-content__content'; article.id = 'new-card'; article.textContent = '新加载的帖子';
      document.querySelector('.bbs-home__content-list').append(article);
    });
    assert.equal((await computed('#new-card')).font, '18px');
    await page.goto('https://www.xiaoheihe.cn/app/bbs/link/123'); await install();
    await page.locator('#portrait').evaluate(img => img.decode());
    near((await bounds('#portrait')).width, 210); near((await bounds('#portrait')).height, 420);
    assert.ok((await bounds('#portrait')).height / (await bounds('#portrait')).width === 2);
    assert.ok((await bounds('.com-img .hb-cpt__image')).height <= 420);
    assert.ok((await bounds('#landscape')).width <= 520);
    near((await bounds('#emoji')).width, 18); near((await bounds('#emoji')).height, 18);
    assert.equal(await page.locator('#viewer-image').evaluate(el => getComputedStyle(el).width), '900px');
    assert.ok((await bounds('#post-video')).width <= 420);
    assert.ok((await bounds('#post-video')).height <= 280);
    near((await bounds('.header-image__container')).height, 320);
    near((await bounds('.post__header-image')).height, 320);
    await page.locator('#portrait').evaluate(img => { img.onclick = () => { window.__imageClicks = (window.__imageClicks || 0) + 1; }; });
    await page.locator('#portrait').click();
    assert.equal(await page.evaluate(() => window.__imageClicks), 1);
    assert.equal((await computed('.post__content')).font, '18px');
    assert.equal((await computed('.comment-item__content')).font, '17px');
    assert.equal((await computed('#page-bbs-link > .content > .list')).width, 820);
    await page.locator('#xhh-reader-tools #toggle').click();
    await changeRange('imageWidth', 300); await changeRange('imageHeight', 200);
    near((await bounds('#portrait')).height, 200); near((await bounds('#portrait')).width, 100);
    assert.ok((await bounds('#landscape')).width <= 300);
    await page.locator('#xhh-reader-tools [data-preset="wide"]').click();
    assert.equal(await page.locator('html').getAttribute('data-xhr-theme'), 'paper');
    assert.equal(await page.locator('html').evaluate(el => el.style.getPropertyValue('--xhr-width')), '1400px');
    await page.locator('#xhh-reader-tools [data-preset="comfortable"]').click();
    await control('comments').uncheck();
    assert.equal((await computed('.comment-item__content')).font, '15px');
    await control('font').evaluate(el => { el.value = '22'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.equal((await computed('.post__content')).font, '22px');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#xhh-reader-tools #settings').isVisible(), false);
    await page.keyboard.press('Alt+r');
    assert.equal(await page.locator('#xhh-reader-tools #settings').isVisible(), true);
    await page.keyboard.press('Escape');
    await page.locator('textarea').focus(); await page.keyboard.press('Alt+r');
    assert.equal(await page.locator('#xhh-reader-tools #settings').isVisible(), false);
    await page.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 0); });
    await page.screenshot({ path: path.join(output, 'preview-post-paper.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal((await computed('.right')).display, 'none');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile has no horizontal overflow');
    await page.screenshot({ path: path.join(output, 'preview-post-mobile.png') });
    // 具体社区页复用已有设置，独立的主栏/侧栏结构也必须正确优化。
    await page.setViewportSize({ width:1440, height:960 });
    await page.goto('https://www.xiaoheihe.cn/app/topic/link/235709?sort=hot'); await install();
    assert.equal(await page.locator('html').evaluate(el => el.classList.contains('xhr-on')), true);
    assert.equal((await computed('.bbs-content__content')).font, '22px');
    near((await bounds('.topic-link__main')).width, 820);
    near((await bounds('.bbs-content__image')).width, 120);
    assert.equal(await page.locator('.bbs-content__imgs-wrapper').first().locator('.bbs-content__image:visible').count(), 3);
    await page.locator('#xhh-reader-tools #toggle').click();
    await changeRange('thumbSize', 96); await changeRange('thumbCount', 5);
    near((await bounds('.bbs-content__image')).width, 96);
    assert.equal(await page.locator('.bbs-content__imgs-wrapper').first().locator('.bbs-content__image:visible').count(), 5);
    await control('theme').selectOption('dark'); await control('focus').check();
    assert.equal((await bounds('.topic-link__right')).display, 'none');
    near((await bounds('.topic-link__main')).width, 820);
    assert.equal(await page.locator('.topic-link__panel').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(30, 35, 42)');
    assert.equal(await page.locator('.topic-link__filter-row').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(30, 35, 42)');
    // 分类和排序仍可操作，主菜单的选中白字也保持可读。
    await page.evaluate(() => {
      document.getElementById('filter-new').onclick = event => { window.__filterClicks = (window.__filterClicks || 0) + 1; event.target.classList.add('active'); };
      document.getElementById('topic-sorter').onclick = () => { window.__sortClicks = (window.__sortClicks || 0) + 1; };
    });
    await page.locator('#filter-new').click(); await page.locator('#topic-sorter').click();
    assert.deepEqual(await page.evaluate(() => [window.__filterClicks, window.__sortClicks]), [1, 1]);
    assert.equal(await page.locator('#filter-new').evaluate(el => getComputedStyle(el).color), 'rgb(220, 226, 233)');
    assert.equal(await page.locator('.topic-link__menu-tabs .active').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
    await control('fullSummary').uncheck(); await changeRange('summaryLines', 2);
    assert.equal(await page.locator('.bbs-content__content').first().evaluate(el => getComputedStyle(el).webkitLineClamp), '2');
    await control('fullSummary').check();
    assert.equal((await bounds('.bbs-content__content')).display, 'block');
    await control('showImages').uncheck();
    assert.equal((await bounds('.bbs-content__imgs-wrapper')).display, 'none'); await control('showImages').check();
    await control('showVideos').uncheck();
    assert.equal((await bounds('.bbs-content__video_wrapper')).display, 'none'); await control('showVideos').check();
    await control('mediaSizing').uncheck();
    near((await bounds('.bbs-content__image')).width, 200);
    assert.equal(await page.locator('.bbs-content__imgs-wrapper').first().locator('.bbs-content__image:visible').count(), 6);
    await control('mediaSizing').check();
    await control('enabled').uncheck();
    near((await bounds('.topic-link__main')).width, 660);
    assert.notEqual((await bounds('.topic-link__right')).display, 'none');
    await control('enabled').check();
    await page.locator('#xhh-reader-tools #close').click();
    await page.setViewportSize({ width:390, height:844 });
    assert.equal((await bounds('.topic-link__right')).display, 'none');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Topic page has no horizontal overflow');
    await page.setViewportSize({ width:1440, height:960 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path:path.join(output, 'preview-topic-dark.png') });
    const transition = async (url, html, id) => {
      await page.evaluate(({url, html}) => {
        history.pushState({}, '', url);
        const next = new DOMParser().parseFromString(html, 'text/html').getElementById('app');
        document.getElementById('app').replaceWith(next);
      }, {url, html});
      await page.waitForFunction(id => document.getElementById(id) && document.documentElement.classList.contains('xhr-on'), id);
      assert.equal(await page.locator('#xhh-reader-tools').count(), 1);
    };
    await transition('/app/bbs/link/123', fixture(true), 'page-bbs-link');
    assert.equal((await computed('.post__content')).font, '22px');
    await transition('/app/topic/link/999999', topicFixture(), 'page-topic-link');
    near((await bounds('.bbs-content__image')).width, 96);
    await transition('/app/bbs/home', fixture(false), 'page-bbs-community');
    near((await bounds('.bbs-content__image')).width, 96);
    // 游戏详情没有包含在本次社区阅读适配里，不能仅因容器共用就套用样式。
    await page.evaluate(() => history.pushState({}, '', '/app/topic/game/pc/730'));
    await page.waitForFunction(() => !document.documentElement.classList.contains('xhr-on'));
    assert.equal(await page.locator('#xhh-reader-tools').isVisible(), false);
    // 社区页延迟挂载时暂停，识别到社区容器后再应用。
    await page.evaluate(() => { history.pushState({}, '', '/app/topic/link/235709'); document.getElementById('app').innerHTML = '<main>正在加载社区</main>'; });
    await page.waitForFunction(() => document.getElementById('xhh-reader-tools').shadowRoot.getElementById('hint').textContent.includes('等待页面加载'));
    await transition('/app/topic/link/235709', topicFixture(), 'page-topic-link');
    near((await bounds('.bbs-content__image')).width, 96);
    await page.goto('https://www.xiaoheihe.cn/app/bbs/link/123');
    // 被损坏或越界的设置不得生成任意 CSS。
    await page.reload();
    await page.evaluate(() => localStorage.setItem('xhh-reader-options-v1', JSON.stringify({ font: 999, line: 'bad', width: -1, theme: 'invalid' })));
    await install();
    assert.equal((await computed('.post__content')).font, '40px');
    assert.equal(await page.locator('html').getAttribute('data-xhr-theme'), 'paper');
    assert.equal(await page.locator('html').evaluate(el => el.style.getPropertyValue('--xhr-width')), '360px');
    await page.setViewportSize({ width: 1440, height: 960 });
    // 重复注入不能叠加扩展菜单、存储监听、快捷键或轮询。
    for (let i = 0; i < 4; i++) await install();
    assert.equal(await page.locator('#xhh-reader-tools').count(), 1);
    assert.equal(await page.locator('#xhh-reader-style').count(), 1);
    assert.equal(await page.locator('#xhh-reader-media-limit').count(), 1);
    assert.deepEqual(await page.evaluate(() => [__readerTest.menus.size, __readerTest.listeners.size, __readerTest.polls.size]), [2, 1, 1]);
    await page.keyboard.press('Alt+r');
    assert.equal(await page.locator('#xhh-reader-tools #settings').isVisible(), true);
    await page.locator('#xhh-reader-tools #reset').click();
    await page.keyboard.press('Escape');
    // head 中脚本样式和整个 body 被站点替换时恢复；未知容器暂停布局。
    await page.evaluate(() => {
      document.getElementById('xhh-reader-style').remove();
      const body = document.createElement('body'); body.innerHTML = '<div id="app"><main id="unknown-layout">新页面</main></div>';
      document.body.replaceWith(body);
    });
    await page.waitForFunction(() => document.getElementById('xhh-reader-style') && document.getElementById('xhh-reader-tools'));
    assert.equal(await page.locator('html').evaluate(el => el.classList.contains('xhr-on')), false);
    assert.deepEqual(await page.locator('html').evaluate(el => Array.from(el.style).filter(name => name.startsWith('--xhr-'))), []);
    const hint = await page.locator('#xhh-reader-tools #hint').textContent();
    assert.ok(hint.includes('等待页面加载'));
    await page.evaluate(() => {
      const section = document.createElement('section'); section.id = 'page-bbs-link'; section.innerHTML = '<div class="post__content">延迟加载的正文</div>';
      document.querySelector('#app').append(section);
    });
    await page.waitForFunction(() => document.documentElement.classList.contains('xhr-on'));
    assert.equal((await computed('.post__content')).font, '18px');
    // 存储写入失败不使 UI 崩溃，不丢弃待保存改动；重新获得焦点时重试。
    await page.evaluate(() => { __readerTest.writeFailure = true; });
    await page.locator('#xhh-reader-tools #toggle').click();
    await control('theme').selectOption('dark');
    await page.waitForFunction(() => document.getElementById('xhh-reader-tools').shadowRoot.getElementById('hint').textContent.includes('保存失败'));
    assert.equal((await computed('.post__content')).color, 'rgb(220, 226, 233)');
    await page.evaluate(() => { __readerTest.writeFailure = false; window.dispatchEvent(new Event('focus')); });
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('xhh-reader-options-v1'))?.theme === 'dark');
    assert.ok(!(await page.locator('#xhh-reader-tools #hint').textContent()).includes('保存失败'));
    // 未修改页面的 pagehide 不应产生额外写入。
    const writes = await page.evaluate(() => __readerTest.writes);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    assert.equal(await page.evaluate(() => __readerTest.writes), writes);
    assert.equal(await page.evaluate(() => __readerTest.polls.size), 0);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    assert.equal(await page.evaluate(() => __readerTest.polls.size), 1);
    // 后台停止轮询，返回前台恢复一个计时器。
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    assert.equal(await page.evaluate(() => __readerTest.polls.size), 0);
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    assert.equal(await page.evaluate(() => __readerTest.polls.size), 1);
    // 两页分别修改不同字段：后保存的主题不能覆盖另一页已保存的字号。
    // 此处显式触发保存；GM 存储没有事务，测试不假定同时写入具有原子性。
    const second = await context.newPage();
    second.on('pageerror', error => errors.push(error.message));
    await second.goto('https://www.xiaoheihe.cn/app/bbs/link/456');
    await second.addScriptTag({ content: userscript });
    await page.evaluate(() => {
      const control = document.getElementById('xhh-reader-tools').shadowRoot.querySelector('[data-key="font"]');
      control.value = '20'; control.dispatchEvent(new Event('input', { bubbles: true }));
      Object.defineProperty(document, 'hidden', { configurable:true, value:true });
      document.dispatchEvent(new Event('visibilitychange'));
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await second.waitForFunction(() => JSON.parse(localStorage.getItem('xhh-reader-options-v1')).font === 20);
    await second.evaluate(() => {
      const control = document.getElementById('xhh-reader-tools').shadowRoot.querySelector('[data-key="theme"]');
      control.value = 'paper'; control.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await second.waitForFunction(() => { const o = JSON.parse(localStorage.getItem('xhh-reader-options-v1')); return o.font === 20 && o.theme === 'paper'; });
    await page.waitForFunction(() => document.documentElement.getAttribute('data-xhr-theme') === 'paper');
    await second.waitForFunction(() => getComputedStyle(document.querySelector('.post__content')).fontSize === '20px');
    assert.equal((await computed('.post__content')).font, '20px');
    assert.equal(await second.locator('.post__content').evaluate(el => getComputedStyle(el).fontSize), '20px');
    await second.close();
    // 读存储失败时可以启动并调整排版，存储恢复后仍能保存。
    await page.evaluate(() => { __readerTest.readFailure = true; });
    await install();
    assert.equal((await computed('.post__content')).font, '18px');
    await page.evaluate(() => { __readerTest.readFailure = false; });
    await page.locator('#xhh-reader-tools #toggle').click();
    await control('font').evaluate(el => { el.value = '19'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('xhh-reader-options-v1')).font === 19);
    // 顶层页面之外不挂载界面。
    await page.evaluate(() => { const frame = document.createElement('iframe'); frame.id = 'test-frame'; frame.srcdoc = '<div id="page-bbs-link"></div>'; document.body.append(frame); });
    const frame = await page.locator('#test-frame').elementHandle();
    const child = await frame.contentFrame();
    await child.addScriptTag({ content: userscript });
    assert.equal(await child.locator('#xhh-reader-tools').count(), 0);
    await page.evaluate(() => document.dispatchEvent(new Event('xhh-reader-dispose-v1')));
    assert.deepEqual(await page.evaluate(() => [__readerTest.menus.size, __readerTest.listeners.size, __readerTest.polls.size]), [0, 0, 0]);
    assert.equal(await page.locator('#xhh-reader-tools').count(), 0);
    assert.equal(await page.locator('html').evaluate(el => el.classList.contains('xhr-on')), false);
    // 缺少 GM 存储 API 时只使用自己的 localStorage 键，损坏 JSON 可自动恢复。
    const fallback = await context.newPage();
    fallback.on('pageerror', error => errors.push(error.message));
    await fallback.goto('https://www.xiaoheihe.cn/app/bbs/home');
    await fallback.evaluate(() => { delete window.GM_getValue; delete window.GM_setValue; localStorage.setItem('xhh-reader-options-v1', '{broken'); });
    await fallback.addScriptTag({ content: userscript });
    await fallback.locator('#xhh-reader-tools #toggle').click();
    await fallback.locator('#xhh-reader-tools [data-key="theme"]').selectOption('dark');
    await fallback.waitForFunction(() => { try { return JSON.parse(localStorage.getItem('xhh-reader-options-v1')).theme === 'dark'; } catch { return false; } });
    await fallback.close();
    assert.deepEqual(errors, []);
    console.log('PASS: community layout/media/themes/filter/sorter, home-topic-post transitions, topic lazy mount, media sizing/count/aspect ratio, presets, numeric inputs, preferences, responsive layout, cleanup, storage failures, cross-tab sync, bfcache and iframe isolation.');
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
