// ==UserScript==
// @name         小黑盒网页优化 - 工作场景纯净阅读版
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  隐藏登录/广告弹窗 · 移除左右侧栏 · 搜索栏始终置顶 · 图片清晰查看 · 工作场景高信息密度
// @author       You
// @match        https://www.xiaoheihe.cn/*
// @match        https://api.xiaoheihe.cn/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const styles = `
        /* ===== 1. 隐藏各类弹窗与遮罩 ===== */

        .hb-cpt-login-mask,
        .hb-cpt__route-to-app-wrapper,
        .hb-cpt__alert-wrapper,
        .hb-cpt__report-wrapper,
        .hb-cpt-evaluate-dialog-mask,
        .hb-cpt-download,
        .hb-cpt__dialog-wrapper {
            display: none !important;
        }

        html {
            overflow: auto !important;
        }

        /* ===== 2. 移除左侧导航栏 ===== */

        .hb-layout-main__container--left,
        .hb-websit__left-section,
        .hb-view-catalog,
        .hb-website__catalog,
        .hb-website__post-btn {
            display: none !important;
        }

        /* ===== 3. 移除右侧边栏 ===== */

        .hb-layout__content--right,
        .hb-view-aside,
        .hb-vire-aside__inner,
        .hb-cpt__recent-hot-topic,
        .hb-view-download,
        .hb-view__platforms,
        .hb-view__site-info {
            display: none !important;
        }

        /* ===== 4. 顶部搜索栏始终置顶 ===== */

        .hb-view-header {
            position: sticky !important;
            top: 0 !important;
            z-index: 9999 !important;
            height: 56px !important;
            min-height: 56px !important;
            padding: 0 12px !important;
            background: #fff !important;
            box-shadow: 0 1px 4px rgba(0,0,0,.06) !important;
            max-width: 100% !important;
        }

        .view-header__right {
            height: 56px !important;
            width: 100% !important;
            max-width: 100% !important;
        }

        .view-header__right .view-header__right--center {
            flex: 1 !important;
            width: 100% !important;
        }

        .hb-view-search {
            height: 34px !important;
            flex: 1 !important;
            max-width: 800px !important;
            width: 100% !important;
        }

        .view-header__search-wrap {
            flex: 1 !important;
            max-width: 800px !important;
            width: 100% !important;
        }

        /* 隐藏Logo腾出搜索栏空间 */
        .hb-header-logo,
        .hb-header-logo__image,
        .hb-header-logo__desc {
            display: none !important;
        }

        /* ===== 5. 主容器布局优化 ===== */

        .hb-layout__main {
            padding: 0 16px !important;
            max-width: 100% !important;
            width: 100% !important;
            box-sizing: border-box !important;
        }

        .hb-layout-main__container--main {
            max-width: 100% !important;
            width: 100% !important;
            flex: 1 !important;
            margin: 0 !important;
            padding: 0 !important;
            min-width: 0 !important;
        }

        .hb-layout__content {
            width: 100% !important;
            max-width: 100% !important;
        }

        .hb-layout__content--left {
            max-width: 100% !important;
            width: 100% !important;
            flex: 1 !important;
        }

        .hb-website__container,
        .hb-page__app {
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
        }

        .hb-bbs-home,
        .hb-cpt__scroll-list,
        .bbs-home__content-list {
            width: 100% !important;
            max-width: 100% !important;
        }

        .hb-layout__fake-frame {
            width: 100% !important;
        }

        .hb-layout__fake-frame .hb-layout__fake-frame-container {
            width: 100% !important;
        }

        /* 隐藏fake-frame的顶部/底部间隔条 */
        .hb-layout__fake-frame-left--top,
        .hb-layout__fake-frame-left--bottom {
            height: 8px !important;
            min-height: 8px !important;
        }

        /* ===== 6. 列表页 - 高信息密度 ===== */

        .hb-cpt__bbs-content,
        .hb-cpt__bbs-list-content,
        .bbs-home__content-item {
            padding: 8px 0 !important;
            margin-bottom: 0 !important;
            border-bottom: 1px solid #f0f0f0 !important;
            width: 100% !important;
        }

        .hb-bbs-home__splitline::after {
            display: none !important;
        }

        .hb-cpt__bbs-content:last-child,
        .bbs-home__content-item:last-child {
            border-bottom: none !important;
        }

        /* 列表页头部信息压缩 */
        .hb-cpt-avatar.list-content__avatar {
            --hb-avatar-size: 16px !important;
            --hb-avatar-deraction-size: 24px !important;
        }

        .list-content__avatar img {
            width: 16px !important;
            height: 16px !important;
        }

        .bbs-list-content__header {
            margin-bottom: 4px !important;
            height: 20px !important;
            line-height: 20px !important;
        }

        .header__user {
            gap: 4px !important;
        }

        .list-content__username {
            font-size: 13px !important;
            color: #666 !important;
            font-weight: normal !important;
        }

        .hb-cpt__level-tag.list-content__level {
            transform: scale(0.8) !important;
            transform-origin: left center !important;
        }

        /* 列表页标题 - 单行截断 */
        .bbs-content__title {
            font-size: 14px !important;
            font-weight: 600 !important;
            line-height: 1.4 !important;
            margin-bottom: 2px !important;
            color: #1a1a1a !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 1 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-height: 20px !important;
        }

        /* 列表页内容摘要 - 两行截断 */
        .bbs-content__content {
            font-size: 12px !important;
            line-height: 1.5 !important;
            color: #888 !important;
            margin-bottom: 4px !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-height: 36px !important;
        }

        /* 列表页图片 - 小尺寸缩略图 */
        .hb-cpt__bbs-content .bbs-content__imgs-wrapper,
        .hb-cpt__bbs-list-content .bbs-content__imgs-wrapper {
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 4px 0 !important;
            display: flex !important;
            flex-wrap: nowrap !important;
            gap: 4px !important;
            overflow: hidden !important;
        }

        .hb-cpt__bbs-content .bbs-content__image,
        .hb-cpt__bbs-list-content .bbs-content__image {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            width: 80px !important;
            height: 80px !important;
            flex: 0 0 80px !important;
            border-radius: 4px !important;
            overflow: hidden !important;
        }

        .hb-cpt__bbs-content .bbs-content__image:only-child,
        .hb-cpt__bbs-list-content .bbs-content__image:only-child {
            width: 100px !important;
            height: 100px !important;
            flex: 0 0 100px !important;
        }

        .hb-cpt__bbs-content .bbs-content__image img,
        .hb-cpt__bbs-list-content .bbs-content__image img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            border-radius: 4px !important;
        }

        /* 列表页视频帖子 - 限制封面尺寸 */
        .hb-cpt__bbs-content .bbs-content__video_wrapper,
        .hb-cpt__bbs-list-content .bbs-content__video_wrapper,
        .bbs-home__content-item .bbs-content__video_wrapper {
            width: 120px !important;
            height: 80px !important;
            min-width: 120px !important;
            max-width: 120px !important;
            min-height: 80px !important;
            max-height: 80px !important;
            flex: 0 0 120px !important;
            border-radius: 4px !important;
            overflow: hidden !important;
            position: relative !important;
        }

        .hb-cpt__bbs-content .bbs-content__video-cover,
        .hb-cpt__bbs-list-content .bbs-content__video-cover,
        .bbs-home__content-item .bbs-content__video-cover {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            border-radius: 4px !important;
            display: block !important;
        }

        .hb-cpt__bbs-content .bbs-content__video-play-btn,
        .hb-cpt__bbs-list-content .bbs-content__video-play-btn,
        .bbs-home__content-item .bbs-content__video-play-btn {
            width: 24px !important;
            height: 24px !important;
            opacity: 0.8 !important;
        }

        .hb-cpt__bbs-content .bbs-content__video-duration,
        .hb-cpt__bbs-list-content .bbs-content__video-duration,
        .bbs-home__content-item .bbs-content__video-duration {
            font-size: 10px !important;
            padding: 1px 4px !important;
        }

        /* 底部信息栏压缩 */
        .bbs-content__bottom-line {
            margin-top: 2px !important;
            height: 18px !important;
        }

        .content-list__tag-item {
            height: 18px !important;
            padding: 0 5px !important;
            font-size: 10px !important;
            border-radius: 2px !important;
        }

        .content-list__bottom--right {
            font-size: 11px !important;
            gap: 10px !important;
            color: #aaa !important;
        }

        /* ===== 7. 详情页 - 图片清晰查看 ===== */

        .hb-bbs-post {
            max-width: 780px !important;
            margin: 0 auto !important;
            padding: 0 16px !important;
        }

        .hb-bbs-post .com-img {
            margin: 12px 0 !important;
            width: 100% !important;
            display: flex !important;
            justify-content: center !important;
        }

        .hb-bbs-post .hb-cpt__image {
            width: 100% !important;
            max-width: 680px !important;
            height: auto !important;
            max-height: 800px !important;
            position: relative !important;
            border-radius: 6px !important;
            overflow: hidden !important;
            cursor: zoom-in !important;
        }

        .hb-bbs-post .hb-cpt__image-elem {
            width: 100% !important;
            height: auto !important;
            max-height: 800px !important;
            object-fit: contain !important;
            object-position: center !important;
            border-radius: 6px !important;
            display: block !important;
        }

        .hb-bbs-post .hb-cpt__image[style*="height"] {
            height: auto !important;
        }

        .hb-bbs-post .hb-cpt__image--default {
            width: 100% !important;
            height: 300px !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
        }

        /* 图片查看器 - 全屏无干扰 */
        .hb-cpt__image-viewer {
            background-color: rgba(0,0,0,.88) !important;
        }

        .hb-cpt__image-viewer .image-viewer__item-image img {
            max-width: 95vw !important;
            max-height: 95vh !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
        }

        .hb-cpt__image-viewer .swiper-wrapper .image-viewer__item .image-viewer__item-image.scroll .image-viewer__item-image--img {
            max-width: 800px !important;
        }

        /* ===== 8. 详情页文本样式 ===== */

        .hb-bbs-post .link-section-title {
            font-size: 19px !important;
            font-weight: 700 !important;
            line-height: 1.5 !important;
            margin: 12px 0 !important;
            color: #1a1a1a !important;
        }

        .hb-bbs-post .link-section-user {
            margin: 8px 0 !important;
            padding-bottom: 8px !important;
            border-bottom: 1px solid #f0f0f0 !important;
        }

        .hb-bbs-post .com-text {
            font-size: 15px !important;
            line-height: 1.8 !important;
            color: #333 !important;
            margin: 8px 0 !important;
        }

        .hb-bbs-post .com-sub-title {
            font-size: 16px !important;
            font-weight: 600 !important;
            color: #1a1a1a !important;
            margin: 16px 0 8px !important;
            line-height: 1.5 !important;
        }

        .hb-bbs-post .com-main-title {
            font-size: 17px !important;
            font-weight: 700 !important;
            color: #1a1a1a !important;
            margin: 20px 0 8px !important;
        }

        /* ===== 9. 热门话题栏隐藏 ===== */

        .bbs-home__topic-list-wrapper {
            display: none !important;
        }

        /* ===== 10. 隐藏App底部菜单栏 ===== */

        .hb-view__menu,
        .hb-view__menu-sticky {
            display: none !important;
        }

        /* ===== 11. 滚动条美化 ===== */

        ::-webkit-scrollbar {
            width: 5px !important;
            height: 5px !important;
        }

        ::-webkit-scrollbar-thumb {
            background: #d0d0d0 !important;
            border-radius: 3px !important;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #b0b0b0 !important;
        }

        ::-webkit-scrollbar-track {
            background: transparent !important;
        }

        /* ===== 12. 动画弱化（减少视觉干扰）===== */

        .hb-cpt__image .hb-cpt__image-elem.show {
            transition: opacity .2s !important;
        }

        .hb-cpt__image .hb-cpt__image--default.show {
            transition: opacity .2s !important;
        }

        /* ===== 13. 兼容详情页布局 ===== */

        .hb-layout__fake-frame .hb-layout__fake-frame-container {
            border-radius: 0 !important;
        }

        .hb-bbs-post__comment-wrapper {
            max-width: 780px !important;
            margin: 0 auto !important;
        }

        /* 评论区输入框 */
        .hb-bbs-post .comment-input__wrapper {
            max-width: 780px !important;
        }
    `;

    GM_addStyle(styles);

    /* ===== 强制隐藏弹窗的JS逻辑 ===== */

    function removeModals() {
        const selectors = [
            '.hb-cpt-login-mask',
            '.hb-cpt__route-to-app-wrapper',
            '.hb-cpt__alert-wrapper',
            '.hb-cpt__report-wrapper',
            '.hb-cpt-evaluate-dialog-mask'
        ];
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.style.display = 'none';
                el.remove();
            });
        });

        if (document.documentElement.style.overflow === 'hidden') {
            document.documentElement.style.overflow = 'auto';
        }
        if (document.body && document.body.style.overflow === 'hidden') {
            document.body.style.overflow = 'auto';
        }
    }

    function forceHideSidebars() {
        document.querySelectorAll('.hb-layout-main__container--left, .hb-layout__content--right').forEach(el => {
            el.style.display = 'none';
        });
    }

    function ensureHeaderSticky() {
        const header = document.querySelector('.hb-view-header');
        if (header) {
            header.style.position = 'sticky';
            header.style.top = '0';
            header.style.zIndex = '9999';
        }
    }

    function optimizeDetailImages() {
        document.querySelectorAll('.hb-bbs-post .hb-cpt__image').forEach(container => {
            container.style.height = 'auto';
            container.style.maxHeight = '800px';
            const img = container.querySelector('img');
            if (img) {
                img.style.width = '100%';
                img.style.height = 'auto';
                img.style.maxHeight = '800px';
                img.style.objectFit = 'contain';
            }
        });

        const post = document.querySelector('.hb-bbs-post');
        if (post) {
            post.style.maxWidth = '780px';
            post.style.margin = '0 auto';
        }
    }

    function limitListImages() {
        document.querySelectorAll('.hb-cpt__bbs-content, .hb-cpt__bbs-list-content').forEach(post => {
            const wrapper = post.querySelector('.bbs-content__imgs-wrapper');
            if (wrapper) {
                wrapper.querySelectorAll('.bbs-content__image').forEach((img, i) => {
                    img.style.display = i >= 3 ? 'none' : 'flex';
                });
            }
        });
    }

    function optimizeLayout() {
        removeModals();
        forceHideSidebars();
        ensureHeaderSticky();

        if (document.querySelector('.hb-bbs-post')) {
            optimizeDetailImages();
        } else {
            limitListImages();
        }
    }

    /* ===== 初始化 ===== */

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', optimizeLayout);
    } else {
        optimizeLayout();
    }

    /* ===== 监听动态内容 ===== */

    const observer = new MutationObserver(mutations => {
        let needOptimize = false;
        for (const m of mutations) {
            for (const n of m.addedNodes) {
                if (n.nodeType !== 1) continue;
                const cls = n.classList;
                if (!cls) continue;
                if (
                    cls.contains('hb-cpt-login-mask') ||
                    cls.contains('hb-cpt__route-to-app-wrapper') ||
                    cls.contains('hb-cpt__alert-wrapper') ||
                    cls.contains('hb-cpt__image') ||
                    cls.contains('hb-bbs-post') ||
                    n.querySelector?.('.hb-cpt-login-mask') ||
                    n.querySelector?.('.hb-cpt__route-to-app-wrapper') ||
                    n.querySelector?.('.hb-cpt__image')
                ) {
                    needOptimize = true;
                    break;
                }
            }
            if (needOptimize) break;
        }
        if (needOptimize) {
            setTimeout(optimizeLayout, 80);
        }
    });

    setTimeout(() => {
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }, 300);

    console.log('[小黑盒优化 v3.0] 已启用：纯净阅读 | 弹窗隐藏 | 搜索栏置顶 | 图片清晰查看');
})();
