// ==UserScript==
// @name         小黑盒 · 阅读优化
// @namespace    local.xiaoheihe.reader
// @version      1.2.0
// @description  自定义图片、视频、字号、行距、宽度与信息密度，支持阅读预设、护眼/深色主题，设置自动保存。
// @match        https://www.xiaoheihe.cn/*
// @match        https://xiaoheihe.cn/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @noframes
// @homepageURL  https://github.com/Haorain-Li/xiaoheihe
// @supportURL   https://github.com/Haorain-Li/xiaoheihe/issues
// @downloadURL  https://raw.githubusercontent.com/Haorain-Li/xiaoheihe/main/xiaoheihe-reader.user.js
// @updateURL    https://raw.githubusercontent.com/Haorain-Li/xiaoheihe/main/xiaoheihe-reader.user.js
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';
  if (window.top !== window.self) return;
  const ID = 'xhh-reader-tools';
  const DISPOSE = 'xhh-reader-dispose-v1';
  // 同一文档重新注入时，先清理旧实例的监听器、计时器及菜单。
  document.dispatchEvent(new Event(DISPOSE));
  document.getElementById(ID)?.remove();
  document.getElementById('xhh-reader-style')?.remove();
  document.getElementById('xhh-reader-media-limit')?.remove();
  const controller = new AbortController();
  const on = (target, type, callback) => target.addEventListener(type, callback, { signal: controller.signal });
  let disposed = false;
  let suspended = false;
  let root = document.documentElement;
  let activeContainer = null;
  let routeTimer;
  let pollTimer;
  let saveTimer;
  let valueListener;
  const menuIDs = [];
  const dirty = new Map();

  // 选择器取自小黑盒网页 1.2.42（2026-10-14）。不修改站点数据或请求。
  const KEY = 'xhh-reader-options-v1';
  const DEFAULTS = Object.freeze({
    enabled: true, theme: 'paper', font: 18, line: 1.85, width: 820,
    focus: false, fullSummary: false, hideTopics: false, comments: true,
    mediaSizing: true, showImages: true, showVideos: true, imageFit: 'contain',
    cardPadding: 16, summaryLines: 5, thumbSize: 120, thumbCount: 3,
    imageWidth: 520, imageHeight: 420, galleryHeight: 320, videoWidth: 420, videoHeight: 280,
  });
  // 校验、控件和 CSS 变量共用范围，防止面板与实际样式不一致。
  const NUMBERS = Object.freeze({
    font: ['正文字号', 10, 40, 1, 'px'],
    line: ['正文行距', 1, 3, 0.05, '倍'],
    width: ['阅读栏宽度', 360, 2400, 20, 'px'],
    cardPadding: ['帖子上下留白', 0, 64, 1, 'px'],
    summaryLines: ['首页摘要行数', 1, 20, 1, '行'],
    thumbSize: ['首页缩略图尺寸', 48, 320, 4, 'px'],
    thumbCount: ['每帖最多预览图片', 1, 12, 1, '张'],
    imageWidth: ['正文图片最大宽度', 120, 2000, 20, 'px'],
    imageHeight: ['正文图片最大高度', 80, 1600, 20, 'px'],
    galleryHeight: ['帖子封面 / 轮播高度', 100, 1000, 20, 'px'],
    videoWidth: ['视频预览最大宽度', 120, 1600, 20, 'px'],
    videoHeight: ['视频预览最大高度', 80, 900, 20, 'px'],
  });
  const PRESETS = Object.freeze({
    compact: { font: 16, line: 1.55, width: 1000, cardPadding: 8, summaryLines: 2, thumbSize: 80, thumbCount: 3, imageWidth: 360, imageHeight: 260, galleryHeight: 240, videoWidth: 300, videoHeight: 220 },
    comfortable: Object.fromEntries(Object.keys(NUMBERS).map(key => [key, DEFAULTS[key]])),
    wide: { font: 20, line: 2, width: 1400, cardPadding: 24, summaryLines: 8, thumbSize: 200, thumbCount: 9, imageWidth: 1000, imageHeight: 800, galleryHeight: 520, videoWidth: 900, videoHeight: 560 },
  });
  const bounded = (value, fallback, min, max, step) => {
    // 不将 null、数组、布尔值或任意对象隐式转成数字。
    const n = typeof value === 'number' ? value :
      typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value) ? Number(value) : NaN;
    return Number.isFinite(n) ? Number((Math.round(Math.min(max, Math.max(min, n)) / step) * step).toFixed(2)) : fallback;
  };
  function normalize(raw) {
    const value = raw && typeof raw === 'object' ? raw : {};
    const next = { ...DEFAULTS };
    for (const key of ['enabled', 'focus', 'fullSummary', 'hideTopics', 'comments', 'mediaSizing', 'showImages', 'showVideos']) {
      if (typeof value[key] === 'boolean') next[key] = value[key];
    }
    if (['native', 'paper', 'dark'].includes(value.theme)) next.theme = value.theme;
    if (['contain', 'cover'].includes(value.imageFit)) next.imageFit = value.imageFit;
    for (const [key, [, min, max, step]] of Object.entries(NUMBERS)) next[key] = bounded(value[key], DEFAULTS[key], min, max, step);
    return next;
  }
  let options;
  const hasGMStorage = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';
  function readStored() {
    if (hasGMStorage) return normalize(GM_getValue(KEY, DEFAULTS));
    const encoded = localStorage.getItem(KEY);
    try { return normalize(JSON.parse(encoded || 'null')); }
    catch { return { ...DEFAULTS }; }
  }
  try { options = readStored(); }
  catch { options = { ...DEFAULTS }; }

  const style = document.createElement('style');
  style.id = 'xhh-reader-style';
  style.textContent = `
    html.xhr-on { --xhr-font:18px; --xhr-line:1.85; --xhr-width:820px; }
    html.xhr-on #app { min-width:0 !important; }
    html.xhr-on #app main:not(.list) { max-width:none !important; }
    html.xhr-on :is(#page-bbs-community, #page-bbs-link) {
      max-width:calc(var(--xhr-width) + 316px) !important;
      width:100% !important; margin-inline:auto !important;
    }
    html.xhr-on :is(#page-bbs-community, #page-bbs-link) > .content > .list {
      max-width:var(--xhr-width) !important; min-width:0 !important;
      flex:1 1 0 !important; border-radius:10px;
    }
    html.xhr-on :is(#page-bbs-community, #page-bbs-link) > .content > .right {
      width:300px !important;
    }
    html.xhr-on #page-bbs-community .bbs-home__content-list { padding-inline:20px !important; }
    html.xhr-on #page-bbs-community .hb-cpt__bbs-content { padding:var(--xhr-card-padding) 12px !important; }
    html.xhr-on .bbs-content__title {
      font-size:calc(var(--xhr-font) + 1px) !important; line-height:1.55 !important;
      word-break:normal !important; overflow-wrap:anywhere;
    }
    html.xhr-on .bbs-content__content {
      font-size:var(--xhr-font) !important; line-height:var(--xhr-line) !important;
      word-break:normal !important; overflow-wrap:anywhere;
      -webkit-line-clamp:var(--xhr-summary-lines) !important; margin-top:8px !important;
    }
    html.xhr-on.xhr-full .bbs-content__content {
      display:block !important; -webkit-line-clamp:unset !important;
      max-height:none !important; overflow:visible !important;
    }
    html.xhr-on #page-bbs-link :is(.post__container, .image-text__container) {
      padding:24px clamp(12px, 3vw, 32px) !important;
    }
    html.xhr-on #page-bbs-link :is(.post__content, .image-text__content) {
      font-size:var(--xhr-font) !important; line-height:var(--xhr-line) !important;
      font-family:system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
      word-break:normal !important; overflow-wrap:anywhere;
    }
    html.xhr-on #page-bbs-link :is(.post__content, .image-text__content) :is(.com-text, p, li, blockquote) {
      line-height:var(--xhr-line) !important;
    }
    html.xhr-on #page-bbs-link :is(.post__content, .image-text__content) :is(p, blockquote) {
      margin-block:0.8em;
    }
    html.xhr-on #page-bbs-link :is(.post__content, .image-text__content) a {
      font-size:inherit !important;
    }
    html.xhr-on #page-bbs-link .link-section-title {
      font-size:calc(var(--xhr-font) + 6px) !important; line-height:1.5 !important;
    }
    html.xhr-on #page-bbs-link :is(.post__content, .image-text__content) :is(img, video) {
      max-width:100% !important;
    }
    /* 缩略图由站点绝对定位改为可换行的方格，只改阅读容器，保留原图点击事件。 */
    html.xhr-on.xhr-media #page-bbs-community .bbs-content__imgs-wrapper {
      display:flex !important; flex-wrap:wrap !important; gap:8px;
      width:100% !important; height:auto !important; min-height:0 !important;
    }
    html.xhr-on.xhr-media #page-bbs-community .bbs-content__imgs-wrapper > .bbs-content__image {
      position:relative !important; inset:auto !important; flex:0 0 auto;
      width:min(100%, var(--xhr-thumb-size)) !important; max-width:100% !important;
      height:auto !important; min-height:0 !important; aspect-ratio:1;
      overflow:hidden; border-radius:6px;
    }
    html.xhr-on.xhr-media #page-bbs-community .bbs-content__image :is(img, .hb-cpt__image),
    html.xhr-on.xhr-media #page-bbs-community img.bbs-content__image {
      width:100% !important; height:100% !important; object-fit:var(--xhr-image-fit) !important;
    }
    html.xhr-on.xhr-media #page-bbs-community .bbs-content__image-cnt {
      inset:auto 4px 4px auto !important; transform:none !important;
    }
    /* 正文图片在正常文档流中按最大宽高等比缩小，不影响表情、头像和图片查看器。 */
    html.xhr-on.xhr-media #page-bbs-link :is(.post__content, .image-text__content) :is(.com-img, .img) {
      width:100% !important; height:auto !important; min-height:0 !important;
      padding-bottom:0 !important; text-align:center;
    }
    html.xhr-on.xhr-media #page-bbs-link :is(.post__content, .image-text__content) .hb-cpt__image {
      display:flex !important; justify-content:center; align-items:center;
      width:100% !important; height:auto !important; min-height:40px !important;
      max-height:none !important; aspect-ratio:auto !important;
    }
    html.xhr-on.xhr-media #page-bbs-link :is(.post__content, .image-text__content) :is(.com-img img, .img img, img.hb-cpt__image-elem),
    html.xhr-on.xhr-media #page-bbs-link :is(.post__content, .image-text__content) > img {
      position:static !important; display:block; margin-inline:auto !important;
      width:auto !important; height:auto !important;
      max-width:min(100%, var(--xhr-image-width)) !important;
      max-height:var(--xhr-image-height) !important; object-fit:contain !important;
    }
    html.xhr-on.xhr-media #page-bbs-link .image-text__header-image {
      width:min(100%, var(--xhr-image-width)) !important; margin-inline:auto;
    }
    html.xhr-on.xhr-media #page-bbs-link .header-image__container {
      width:100% !important; height:var(--xhr-gallery-height) !important;
    }
    html.xhr-on.xhr-media #page-bbs-link .header-image__item-image img {
      width:100% !important; height:100% !important; object-fit:contain !important;
    }
    html.xhr-on.xhr-media #page-bbs-link .post__header-image {
      width:min(100%, var(--xhr-image-width)) !important; height:var(--xhr-gallery-height) !important;
      padding-bottom:0 !important; margin-inline:auto;
    }
    html.xhr-on.xhr-media #page-bbs-link .post_header-image-item { object-fit:contain !important; }
    html.xhr-on.xhr-media #page-bbs-community .bbs-content__video_wrapper {
      width:min(100%, var(--xhr-video-width)) !important;
      height:auto !important; aspect-ratio:16 / 9; max-height:var(--xhr-video-height) !important;
    }
    html.xhr-on.xhr-media #page-bbs-community .bbs-content__video-cover { width:100% !important; height:100% !important; object-fit:contain !important; }
    html.xhr-on.xhr-media #page-bbs-link :is(.bbs-video__video-container, .bbs-video__video-box:not(.vjs-fullscreen):not(.vjs-picture-in-picture)) {
      width:min(100%, var(--xhr-video-width)) !important; max-height:var(--xhr-video-height) !important;
      margin-inline:auto;
    }
    html.xhr-on.xhr-media #page-bbs-link :is(.post__content, .image-text__content) video:not(:fullscreen) {
      display:block; width:min(100%, var(--xhr-video-width)) !important;
      height:auto !important; max-height:var(--xhr-video-height) !important; margin-inline:auto;
    }
    /* 隐藏图片仅影响帖子媒体，头像、表情和原站弹窗仍保留。 */
    html.xhr-on.xhr-no-images #page-bbs-community .bbs-content__imgs-wrapper,
    html.xhr-on.xhr-no-images #page-bbs-link :is(.post__header-image, .image-text__header-image),
    html.xhr-on.xhr-no-images #page-bbs-link :is(.post__content, .image-text__content) :is(.com-img, .img, .hb-cpt__image),
    html.xhr-on.xhr-no-images #page-bbs-link :is(.post__content, .image-text__content) > img,
    html.xhr-on.xhr-no-videos #page-bbs-community .bbs-content__video_wrapper,
    html.xhr-on.xhr-no-videos #page-bbs-link :is(.bbs-video__video-container, .bbs-video__video-box),
    html.xhr-on.xhr-no-videos #page-bbs-link :is(.post__content, .image-text__content) video { display:none !important; }
    html.xhr-on #page-bbs-link :is(.post__content, .image-text__content) pre {
      overflow:auto; white-space:pre; padding:14px; border-radius:8px;
      font-size:0.88em; line-height:1.6;
    }
    html.xhr-on #page-bbs-link :is(.post__content, .image-text__content) table {
      display:block; max-width:100%; overflow-x:auto;
    }
    html.xhr-on :is(.bbs-content__title, .bbs-content__content, .post__content, .image-text__content) {
      user-select:text !important; -webkit-user-select:text !important;
    }
    html.xhr-on.xhr-comments #page-bbs-link :is(.comment-item__content, .children-item__comment-content) {
      font-size:calc(var(--xhr-font) - 1px) !important; line-height:var(--xhr-line) !important;
      word-break:normal !important; overflow-wrap:anywhere;
    }
    html.xhr-on.xhr-focus :is(#page-bbs-community, #page-bbs-link) {
      max-width:var(--xhr-width) !important;
    }
    html.xhr-on.xhr-focus :is(#page-bbs-community, #page-bbs-link) > .content > .right,
    html.xhr-on.xhr-focus #page-bbs-link .bbs-link__related-recommend,
    html.xhr-on.xhr-topics #page-bbs-community .bbs-home__topic-list-wrapper {
      display:none !important;
    }
    /* 主题只覆盖阅读区域，不使用滤镜反转图片，也不覆盖编辑器和弹窗。 */
    html.xhr-on[data-xhr-theme="paper"] {
      --xhr-bg:#eeeae1; --xhr-surface:#faf7ef; --xhr-soft:#f0ebe0;
      --xhr-text:#33352f; --xhr-muted:#717369; --xhr-link:#306582; --xhr-border:#ded8ca;
    }
    html.xhr-on[data-xhr-theme="dark"] {
      --xhr-bg:#15181d; --xhr-surface:#1e232a; --xhr-soft:#272e37;
      --xhr-text:#dce2e9; --xhr-muted:#a1adbc; --xhr-link:#83bcf0; --xhr-border:#343d49;
    }
    html.xhr-on:not([data-xhr-theme="native"]),
    html.xhr-on:not([data-xhr-theme="native"]) body { background:var(--xhr-bg) !important; }
    html.xhr-on:not([data-xhr-theme="native"]) :is(#page-bbs-community, #page-bbs-link) {
      color:var(--xhr-text);
      --hb-general-color-text-1:var(--xhr-text); --hb-general-color-text-2:var(--xhr-muted);
      --hb-general-color-text-3:var(--xhr-muted); --hb-general-color-text-5:var(--xhr-link);
      --hb-general-color-bg-2:var(--xhr-soft); --hb-general-color-bg-4:var(--xhr-surface);
    }
    html.xhr-on:not([data-xhr-theme="native"]) :is(
      #page-bbs-community .list, #page-bbs-link .list, .hb-bbs-home, .bbs-home__content-list,
      .hb-cpt-page-header, .page-header__container-bg, .bbs-community-hot-topic,
      .cpt-right-side, .search-input .el-input__wrapper, .bbs-link__related-recommend
    ) { background:var(--xhr-surface) !important; }
    html.xhr-on:not([data-xhr-theme="native"]) :is(
      .bbs-content__title, .bbs-content__content, .link-section-title, .link-user__username,
      .post__content, .image-text__content, .comment-item__content, .children-item__comment-content,
      .info-box__username, .hot-topic__name, .bbs-home__topic-name, .page-header__username,
      .hot-topic-item__name, .related-recommend__container--header, .link-item__title,
      .search-input input, .comment__comment-header, .right-side-default .title,
      .right-side-default .app-link-item span
    ) { color:var(--xhr-text) !important; }
    html.xhr-on:not([data-xhr-theme="native"]) :is(
      .link-data__time, .link-data__ip, .link-section-link-data, .info-box__line-2,
      .children-item__other-info, .link-item__desc, .hot-topic-item__hot,
      .right-side-default .subtitle, .right-side-default .footer-info
    ) { color:var(--xhr-muted) !important; }
    html.xhr-on:not([data-xhr-theme="native"]) :is(
      .post__content a, .image-text__content a, .comment-item__content a,
      .children-item__comment-content a, .children-item__comment-creator
    ) { color:var(--xhr-link) !important; }
    html.xhr-on:not([data-xhr-theme="native"]) :is(
      .bbs-content__forward-wrapper, .link-comment__comment-children,
      .page-header__back-btn, .post__content pre, .image-text__content pre
    ) { background:var(--xhr-soft) !important; color:var(--xhr-text) !important; }
    html.xhr-on:not([data-xhr-theme="native"]) #page-bbs-community::before,
    html.xhr-on:not([data-xhr-theme="native"]) #page-bbs-community::after,
    html.xhr-on:not([data-xhr-theme="native"]) .hb-bbs-home__feed-splitline::after,
    html.xhr-on:not([data-xhr-theme="native"]) .hb-bbs-home__splitline::after {
      background:var(--xhr-bg) !important;
    }
    html.xhr-on:not([data-xhr-theme="native"]) #page-bbs-community .list::before,
    html.xhr-on:not([data-xhr-theme="native"]) #page-bbs-community .list::after {
      background:var(--xhr-surface) !important;
    }
    @media (max-width:1080px) {
      html.xhr-on :is(#page-bbs-community, #page-bbs-link) { max-width:var(--xhr-width) !important; }
      html.xhr-on :is(#page-bbs-community, #page-bbs-link) > .content > .right { display:none !important; }
    }
    @media (max-width:600px) {
      html.xhr-on #page-bbs-community .bbs-home__content-list { padding-inline:4px !important; }
      html.xhr-on #page-bbs-link .hb-bbs-link__container { padding-inline:4px !important; }
      html.xhr-on #page-bbs-link .comment-item__content-container { padding-left:20px !important; }
    }
  `;
  const mediaLimitStyle = document.createElement('style');
  mediaLimitStyle.id = 'xhh-reader-media-limit';
  (document.head || root).append(style);

  // Shadow DOM 隔离设置面板，避免被站点 CSS 影响。
  const host = document.createElement('div');
  host.id = ID;
  host.dataset.version = '1.2.0';
  const panel = host.attachShadow({ mode: 'open' });
  const sliders = keys => keys.map(key => {
    const [label, min, max, step, unit] = NUMBERS[key];
    return `<div class="range"><label for="${key}-range">${label}<output id="${key}-value"></output></label><div class="slider-row"><input id="${key}-range" aria-label="${label}" type="range" data-key="${key}" min="${min}" max="${max}" step="${step}"><input aria-label="${label}数值" type="number" data-number-key="${key}" min="${min}" max="${max}" step="${step}"></div></div>`;
  }).join('');
  panel.innerHTML = `
    <style>
      :host { all:initial; position:fixed; right:18px; bottom:24px; z-index:2147483646; }
      * { box-sizing:border-box; }
      .tools { font:14px/1.6 system-ui,'Microsoft YaHei',sans-serif; color:#e2e8f0; }
      button,select,input { font:inherit; }
      button { cursor:pointer; border:1px solid #485365; background:#293445; color:#e2e8f0; border-radius:8px; padding:7px 12px; }
      button:hover { background:#36455b; }
      :focus-visible { outline:2px solid #94c7ff; outline-offset:3px; }
      .bar { display:flex; gap:6px; justify-content:flex-end; }
      .settings { width:340px; max-width:calc(100vw - 24px); max-height:calc(100vh - 110px); max-height:calc(100dvh - 110px); overflow:auto; margin-bottom:10px; padding:18px; border:1px solid #485365; border-radius:14px; background:#1c2532; box-shadow:0 12px 40px #0005; }
      [hidden] { display:none !important; }
      header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
      header strong { font-size:16px; }
      header button { padding:2px 9px; font-size:20px; }
      label { display:flex; justify-content:space-between; align-items:center; gap:10px; margin:10px 0; }
      select { background:#293445; color:#e2e8f0; border:1px solid #485365; padding:4px; border-radius:6px; }
      .range { display:block; }
      .range label { margin-bottom:2px; }
      .slider-row { display:flex; align-items:center; gap:10px; }
      .slider-row input[type=range] { flex:1; min-width:0; }
      input[type=number] { width:76px; background:#293445; color:#e2e8f0; border:1px solid #485365; border-radius:6px; padding:3px 5px; }
      details { border-top:1px solid #485365; margin-top:12px; padding-top:8px; }
      summary { cursor:pointer; font-weight:600; }
      .presets { display:flex; gap:5px; margin:12px 0; }
      .presets button { flex:1; padding:6px 4px; font-size:12px; }
      input[type=range] { width:100%; accent-color:#94c7ff; }
      input[type=checkbox] { accent-color:#94c7ff; width:17px; height:17px; }
      .hint { color:#a6b6ca; font-size:12px; margin:12px 0; }
      .reset { width:100%; }
      @media(max-width:600px) { :host { right:10px; bottom:12px; } }
    </style>
    <div class="tools">
      <section class="settings" id="settings" aria-label="阅读设置" hidden>
        <header><strong>小黑盒 · 阅读优化</strong><button type="button" id="close" aria-label="关闭设置">×</button></header>
        <label>启用阅读优化<input type="checkbox" data-key="enabled"></label>
        <label>页面主题<select data-key="theme"><option value="native">原站配色</option><option value="paper">护眼纸色</option><option value="dark">深色阅读</option></select></label>
        <div class="presets" aria-label="显示预设"><button type="button" data-preset="compact">紧凑浏览</button><button type="button" data-preset="comfortable">舒适阅读</button><button type="button" data-preset="wide">宽屏展示</button></div>
        <details open><summary>图片与视频</summary>
          <label>自定义媒体尺寸<input type="checkbox" data-key="mediaSizing"></label>
          <label>显示帖子图片<input type="checkbox" data-key="showImages"></label>
          <label>显示帖子视频<input type="checkbox" data-key="showVideos"></label>
          <label>缩略图呈现<select data-key="imageFit"><option value="contain">完整显示</option><option value="cover">填满方格</option></select></label>
          ${sliders(['thumbSize', 'thumbCount', 'imageWidth', 'imageHeight', 'galleryHeight', 'videoWidth', 'videoHeight'])}
          <p class="hint">正文图片始终保持比例；点击图片可使用网站原图查看。缩略图“填满方格”可能裁切边缘。</p>
        </details>
        <details><summary>排版与信息密度</summary>${sliders(['font', 'line', 'width', 'cardPadding', 'summaryLines'])}<p class="hint">开启“展开首页已有摘要”时，摘要行数限制不生效。</p></details>
        <details open><summary>阅读选项</summary>
        <label>专注模式 · 隐藏右侧栏<input type="checkbox" data-key="focus"></label>
        <label>展开首页已有摘要<input type="checkbox" data-key="fullSummary"></label>
        <label>隐藏首页社区快捷入口<input type="checkbox" data-key="hideTopics"></label>
        <label>同步优化评论字号<input type="checkbox" data-key="comments"></label>
        </details>
        <p class="hint" id="hint">设置自动保存。Alt + R 打开/关闭设置；Esc 关闭。</p>
        <button class="reset" type="button" id="reset">恢复默认设置</button>
      </section>
      <div class="bar"><button type="button" id="top" title="回到页面顶部" aria-label="回到页面顶部">↑</button><button type="button" id="toggle" aria-controls="settings" aria-expanded="false">阅读设置</button></div>
    </div>
  `;
  (document.body || root).append(host);

  function isReadingPage() {
    return /^\/(?:app\/)?bbs\/(?:home\/?$|link\/[^/]+\/?$)/.test(location.pathname);
  }
  const cssName = key => `--xhr-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;
  const ownedClasses = ['xhr-on', 'xhr-focus', 'xhr-full', 'xhr-topics', 'xhr-comments', 'xhr-media', 'xhr-no-images', 'xhr-no-videos'];
  const ownedProperties = [...Object.keys(NUMBERS).map(cssName), '--xhr-image-fit'];
  function clearRoot(element) {
    element.classList.remove(...ownedClasses);
    element.removeAttribute('data-xhr-theme');
    for (const name of ownedProperties) element.style.removeProperty(name);
  }
  function mount() {
    if (root !== document.documentElement) {
      clearRoot(root);
      root = document.documentElement;
    }
    if (!style.isConnected) (document.head || root).append(style);
    if (!mediaLimitStyle.isConnected) (document.head || root).append(mediaLimitStyle);
    // body 被站点整体重建后恢复控制面板，保留面板已有状态。
    if (document.body && host.parentNode !== document.body) document.body.append(host);
  }
  function apply() {
    if (disposed || suspended) return;
    mount();
    const route = isReadingPage();
    activeContainer = route ? document.getElementById(/\/home\/?$/.test(location.pathname) ? 'page-bbs-community' : 'page-bbs-link') : null;
    // 类名失配或页面尚未挂载时，不向未知页面套用布局。
    const active = options.enabled && Boolean(activeContainer);
    root.classList.toggle('xhr-on', active);
    for (const [cls, key] of [['xhr-focus', 'focus'], ['xhr-full', 'fullSummary'], ['xhr-topics', 'hideTopics'], ['xhr-comments', 'comments']]) {
      root.classList.toggle(cls, active && options[key]);
    }
    root.classList.toggle('xhr-media', active && options.mediaSizing);
    root.classList.toggle('xhr-no-images', active && !options.showImages);
    root.classList.toggle('xhr-no-videos', active && !options.showVideos);
    if (active) {
      root.setAttribute('data-xhr-theme', options.theme);
      for (const [key, [, , , , unit]] of Object.entries(NUMBERS)) root.style.setProperty(cssName(key), `${options[key]}${unit === 'px' ? 'px' : ''}`);
      root.style.setProperty('--xhr-image-fit', options.imageFit);
      // :nth-child 的计数不能使用 CSS 变量；只重建这一条已校验的规则。
      const limitRule = `html.xhr-on.xhr-media #page-bbs-community .bbs-content__imgs-wrapper > .bbs-content__image:nth-child(n+${options.thumbCount + 1} of .bbs-content__image){display:none !important;}`;
      if (mediaLimitStyle.textContent !== limitRule) mediaLimitStyle.textContent = limitRule;
    } else {
      root.removeAttribute('data-xhr-theme');
      for (const name of ownedProperties) root.style.removeProperty(name);
    }
    host.style.display = route ? 'block' : 'none';
    updateHint();
  }
  function syncControls() {
    panel.querySelectorAll('[data-key], [data-number-key]').forEach(control => {
      const value = options[control.dataset.key || control.dataset.numberKey];
      if (control.type === 'checkbox') control.checked = value;
      else if (control !== panel.activeElement || control.type !== 'number') control.value = String(value);
    });
    for (const [key, [, , , , unit]] of Object.entries(NUMBERS)) panel.getElementById(`${key}-value`).textContent = `${options[key]}${unit}`;
  }
  let storageError = false;
  function updateHint() {
    panel.getElementById('hint').textContent = storageError ? '保存失败，设置仍在本页生效；下次修改或返回页面时会重试。' :
      !activeContainer && isReadingPage() ? '等待页面加载；若一直无效果，网站结构可能已变化。' :
      '设置自动保存。Alt + R 打开/关闭设置；Esc 关闭。';
  }
  function save() {
    clearTimeout(saveTimer);
    saveTimer = undefined;
    if (!dirty.size) return;
    try {
      // 仅合并本页改过的键，避免离开旧标签页时覆盖其他标签页的新设置。
      const next = normalize({ ...readStored(), ...Object.fromEntries(dirty) });
      if (hasGMStorage) GM_setValue(KEY, next);
      else localStorage.setItem(KEY, JSON.stringify(next));
      dirty.clear();
      options = next;
      storageError = false;
      apply(); syncControls();
    } catch {
      storageError = true;
    }
    updateHint();
  }
  function receiveStored(raw) {
    if (disposed) return;
    options = normalize({ ...normalize(raw), ...Object.fromEntries(dirty) });
    apply(); syncControls();
  }
  panel.querySelectorAll('[data-key]').forEach(control => {
    on(control, 'input', () => {
      const key = control.dataset.key;
      options = normalize({ ...options, [key]: control.type === 'checkbox' ? control.checked : control.value });
      dirty.set(key, options[key]);
      apply();
      syncControls();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(save, 150);
    });
  });
  panel.querySelectorAll('[data-number-key]').forEach(control => {
    on(control, 'change', () => {
      const key = control.dataset.numberKey;
      if (control.value !== '' && Number.isFinite(Number(control.value))) {
        options = normalize({ ...options, [key]: Number(control.value) });
        dirty.set(key, options[key]); apply(); save();
      }
      control.value = String(options[key]); syncControls();
    });
  });
  panel.querySelectorAll('[data-preset]').forEach(button => {
    on(button, 'click', () => {
      const patch = { ...PRESETS[button.dataset.preset], mediaSizing: true, showImages: true, showVideos: true };
      options = normalize({ ...options, ...patch });
      for (const key of Object.keys(patch)) dirty.set(key, options[key]);
      apply(); syncControls(); save();
    });
  });
  function showPanel(show) {
    panel.getElementById('settings').hidden = !show;
    panel.getElementById('toggle').setAttribute('aria-expanded', String(show));
    if (show) panel.getElementById('close').focus();
    else panel.getElementById('toggle').focus();
  }
  const togglePanel = () => showPanel(panel.getElementById('settings').hidden);
  on(panel.getElementById('toggle'), 'click', togglePanel);
  on(panel.getElementById('close'), 'click', () => showPanel(false));
  on(panel.getElementById('reset'), 'click', () => {
    options = { ...DEFAULTS };
    for (const [key, value] of Object.entries(options)) dirty.set(key, value);
    apply(); syncControls(); save();
  });
  on(panel.getElementById('top'), 'click', () => {
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  on(document, 'keydown', event => {
    if (!isReadingPage() || event.isComposing || event.repeat || event.defaultPrevented) return;
    // composedPath 能识别 Shadow DOM 内的输入框，编辑评论时不抢快捷键。
    const editing = event.composedPath().some(el => el instanceof Element && el.matches('input, textarea, select, [contenteditable]:not([contenteditable="false"])'));
    if (event.key === 'Escape' && event.composedPath().includes(host) && !panel.getElementById('settings').hidden) {
      showPanel(false); return;
    }
    if (!editing && event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.code === 'KeyR') {
      event.preventDefault(); togglePanel();
    }
  });
  if (typeof GM_registerMenuCommand === 'function') {
    try {
      menuIDs.push(GM_registerMenuCommand('小黑盒：阅读设置', () => { if (isReadingPage()) showPanel(true); }));
      menuIDs.push(GM_registerMenuCommand('小黑盒：启用/停用阅读优化', () => {
        options.enabled = !options.enabled; dirty.set('enabled', options.enabled); apply(); syncControls(); save();
      }));
    } catch { /* 扩展菜单不可用时，网页内的按钮仍可操作。 */ }
  }
  if (hasGMStorage && typeof GM_addValueChangeListener === 'function') {
    try { valueListener = GM_addValueChangeListener(KEY, (_key, _old, value, remote) => { if (remote) receiveStored(value); }); }
    catch { /* 返回标签页时仍会主动读取最新设置。 */ }
  } else if (!hasGMStorage) {
    on(window, 'storage', event => {
      if (event.key !== KEY && event.key !== null) return;
      try { receiveStored(JSON.parse(event.newValue || 'null')); } catch { /* 忽略损坏通知。 */ }
    });
  }

  let lastURL = location.href;
  function scheduleApply() {
    if (disposed || suspended || routeTimer !== undefined) return;
    routeTimer = setTimeout(() => { routeTimer = undefined; lastURL = location.href; apply(); }, 60);
  }
  const observer = new MutationObserver(records => {
    if (suspended || disposed) return;
    if (lastURL !== location.href || !host.isConnected || !style.isConnected || !mediaLimitStyle.isConnected ||
        host.parentNode !== document.body || (activeContainer && !activeContainer.isConnected)) {
      scheduleApply(); return;
    }
    // 常规追加帖子由 CSS 自动生效。仅关注页面容器的挂载，不扫描每条帖子的内容。
    if (!activeContainer && isReadingPage() && records.some(record => Array.from(record.addedNodes).some(node =>
      node.nodeType === 1 && (node.matches('#page-bbs-community, #page-bbs-link') || node.querySelector('#page-bbs-community, #page-bbs-link'))))) scheduleApply();
  });
  function startObserver() { observer.observe(document, { childList: true, subtree: true }); }
  function startPolling() {
    clearTimeout(pollTimer);
    pollTimer = undefined;
    if (disposed || suspended || document.hidden) return;
    pollTimer = setTimeout(() => {
      pollTimer = undefined;
      if (lastURL !== location.href || !host.isConnected || !style.isConnected || !mediaLimitStyle.isConnected) scheduleApply();
      startPolling();
    }, 1500);
  }
  function resume() {
    if (disposed) return;
    suspended = false;
    try { receiveStored(readStored()); } catch { /* 保留当前设置。 */ }
    save(); startObserver(); apply(); startPolling();
  }
  function dispose() {
    if (disposed) return;
    save();
    disposed = true;
    clearTimeout(saveTimer); clearTimeout(routeTimer); clearTimeout(pollTimer);
    observer.disconnect(); controller.abort();
    if (valueListener !== undefined && typeof GM_removeValueChangeListener === 'function') {
      try { GM_removeValueChangeListener(valueListener); } catch { /* 继续清理其余资源。 */ }
    }
    if (typeof GM_unregisterMenuCommand === 'function') {
      for (const id of menuIDs) { try { GM_unregisterMenuCommand(id); } catch { /* 继续清理。 */ } }
    }
    clearRoot(root); host.remove(); style.remove(); mediaLimitStyle.remove();
  }
  on(document, DISPOSE, dispose);
  on(window, 'popstate', scheduleApply);
  on(window, 'hashchange', scheduleApply);
  on(window, 'pageshow', resume);
  on(window, 'pagehide', event => {
    save();
    if (!event.persisted) { dispose(); return; }
    suspended = true;
    observer.disconnect(); clearTimeout(routeTimer); routeTimer = undefined;
    clearTimeout(pollTimer); pollTimer = undefined;
  });
  on(document, 'visibilitychange', () => {
    if (document.hidden) { save(); clearTimeout(pollTimer); pollTimer = undefined; }
    else resume();
  });
  on(window, 'focus', () => { if (!document.hidden && !suspended) resume(); });
  syncControls(); apply();
  startObserver(); startPolling();
})();
