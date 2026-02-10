// ==UserScript==
// @name         小黑盒网页社区优化 - 高信息密度版
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  高信息密度布局：中等图片、紧凑排版、一屏更多帖子
// @author       You
// @match        https://www.xiaoheihe.cn/*
// @match        https://api.xiaoheihe.cn/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const styles = `
        /* ========== 删除两侧边栏 ========== */

        /* 删除左侧边栏 */
        .hb-layout-main__container--left,
        .hb-websit__left-section,
        .hb-view-catalog,
        .hb-website__catalog,
        .hb-website__post-btn {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            width: 0 !important;
            min-width: 0 !important;
            max-width: 0 !important;
            flex: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
        }

        /* 删除右侧边栏 */
        .hb-layout__content--right,
        .hb-view-aside,
        .hb-vire-aside__inner,
        .hb-cpt__recent-hot-topic,
        .hb-view-download,
        .hb-view__platforms,
        .hb-view__site-info {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            width: 0 !important;
            min-width: 0 !important;
            max-width: 0 !important;
            flex: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
        }

        /* ========== 主容器全宽 ========== */

        .hb-layout__main,
        .hb-website__container,
        .hb-page__app {
            padding: 0 8px !important;
            max-width: 100% !important;
            width: 100% !important;
        }

        /* 中间内容区最大化 */
        .hb-layout-main__container--main,
        .hb-layout__content--left {
            max-width: 100% !important;
            width: 100% !important;
            flex: 1 !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        /* 内容列表全宽 */
        .hb-bbs-home,
        .hb-cpt__scroll-list,
        .bbs-home__content-list {
            width: 100% !important;
            max-width: 100% !important;
        }

        /* ========== 帖子卡片紧凑化 ========== */

        .hb-cpt__bbs-content,
        .hb-cpt__bbs-list-content,
        .bbs-home__content-item {
            padding: 10px 0 !important;
            margin-bottom: 0 !important;
            border-bottom: 1px solid #f0f0f0 !important;
            width: 100% !important;
            max-width: 100% !important;
        }

        .hb-bbs-home__splitline::after {
            display: none !important;
        }

        .hb-cpt__bbs-content:last-child {
            border-bottom: none !important;
        }

        /* ========== 头部信息压缩 ========== */

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

        .list-content__medal {
            height: 14px !important;
            width: auto !important;
        }

        .list-cotent__operation-btn {
            padding: 2px !important;
        }

        .list-cotent__operation-btn .hb-icon {
            font-size: 16px !important;
        }

        /* ========== 标题优化 ========== */

        .bbs-content__title {
            font-size: 15px !important;
            font-weight: 600 !important;
            line-height: 1.4 !important;
            margin-bottom: 4px !important;
            color: #14191e !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 1 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-height: 21px !important;
        }

        /* ========== 内容文本压缩 ========== */

        .bbs-content__content {
            font-size: 13px !important;
            line-height: 1.5 !important;
            color: #666 !important;
            margin-bottom: 6px !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-height: 39px !important;
        }

        .bbs-content__content .hb-emoji {
            width: 16px !important;
            height: 16px !important;
            vertical-align: middle !important;
        }

        /* ========== 图片区域 - 中等尺寸 ========== */

        .bbs-content__imgs-wrapper {
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 6px 0 !important;
            display: flex !important;
            flex-wrap: nowrap !important;
            gap: 6px !important;
            overflow: hidden !important;
        }

        .bbs-content__image {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            width: 100px !important;
            height: 100px !important;
            flex: 0 0 100px !important;
            border-radius: 6px !important;
            overflow: hidden !important;
        }

        .bbs-content__image:only-child {
            width: 120px !important;
            height: 120px !important;
            flex: 0 0 120px !important;
        }

        .bbs-content__image img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            border-radius: 6px !important;
        }

        .bbs-content__image .hb-cpt__image--default {
            width: 100% !important;
            height: 100% !important;
        }

        .bbs-content__image .hb-cpt__image--default svg {
            width: 24px !important;
            height: 24px !important;
        }

        .bbs-content__image-cnt {
            display: none !important;
        }

        /* ========== 底部信息栏压缩 ========== */

        .bbs-content__bottom-line {
            margin-top: 4px !important;
            height: 22px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
        }

        .content-list__tag-item {
            height: 20px !important;
            padding: 0 6px !important;
            font-size: 11px !important;
            border-radius: 3px !important;
        }

        .content-list__tag-item.small,
        .content-list__tag-item.big {
            background: #f5f5f5 !important;
        }

        .content-tag-icon {
            width: 12px !important;
            height: 12px !important;
            margin-right: 3px !important;
        }

        .content-tag-text {
            font-size: 11px !important;
            color: #666 !important;
        }

        .static-color-suffix-tag {
            display: none !important;
        }

        .content-list__bottom--right {
            display: flex !important;
            gap: 12px !important;
            color: #999 !important;
            font-size: 12px !important;
        }

        .content-list__comment,
        .content-list__like {
            display: flex !important;
            align-items: center !important;
            gap: 3px !important;
        }

        .content-list__comment .hb-icon,
        .content-list__like .hb-icon {
            font-size: 14px !important;
            color: #ccc !important;
        }

        .content-list__comment-cnt,
        .content-list__like-cnt {
            font-size: 12px !important;
            color: #999 !important;
        }

        /* ========== 话题列表压缩 ========== */

        .bbs-home__topic-list-wrapper {
            padding: 8px 0 !important;
            margin-bottom: 0 !important;
            width: 100% !important;
        }

        .bbs-home__topic-list {
            height: 70px !important;
            padding: 0 !important;
            width: 100% !important;
        }

        .bbs-home__topic-item {
            width: 56px !important;
            margin-right: 12px !important;
        }

        .bbs-home__topic-item-icon {
            width: 40px !important;
            height: 40px !important;
            border-radius: 8px !important;
        }

        .bbs-home__topic-name {
            font-size: 10px !important;
            margin-top: 4px !important;
            color: #666 !important;
        }

        .hb-bbs-home__splitline {
            position: relative !important;
        }

        /* ========== 顶部导航压缩 ========== */

        .hb-view-header {
            height: 50px !important;
            padding: 0 10px !important;
        }

        .view-header__right {
            height: 50px !important;
            width: 100% !important;
        }

        .hb-view-search {
            height: 34px !important;
            flex: 1 !important;
            max-width: 600px !important;
        }

        .search__input-item {
            height: 34px !important;
            font-size: 13px !important;
            padding: 0 12px !important;
        }

        .view-header__user-box {
            height: 50px !important;
        }

        .user-box__avatar {
            --hb-avatar-size: 28px !important;
        }

        .user-box__username {
            font-size: 12px !important;
            margin-left: 6px !important;
        }

        .message-center__btn {
            width: 20px !important;
            height: 20px !important;
            margin-left: 12px !important;
        }

        .message-center__btn .hb-icon {
            font-size: 20px !important;
        }

        /* ========== 滚动优化 ========== */

        ::-webkit-scrollbar {
            width: 6px !important;
            height: 6px !important;
        }

        ::-webkit-scrollbar-thumb {
            background: #ccc !important;
            border-radius: 3px !important;
        }

        .scroll-list__button-group {
            right: 10px !important;
            bottom: 10px !important;
        }

        .scroll-list__top-btn {
            width: 40px !important;
            height: 40px !important;
        }

        /* ========== 加载动画压缩 ========== */

        .hb-cpt__loading.point {
            height: 40px !important;
            padding: 10px 0 !important;
        }

        .hb-cpt__loading-point {
            width: 6px !important;
            height: 6px !important;
        }

        /* ========== 分页条优化 ========== */

        .pagetual_pageBar {
            height: 40px !important;
            margin: 5px 0 !important;
            font-size: 14px !important;
            width: 100% !important;
            max-width: 100% !important;
        }

        .pagetual_pageBar svg {
            width: 24px !important;
            height: 24px !important;
        }

        /* ========== 隐藏多余元素 ========== */

        .scroll-list__no-more-desc {
            height: 50px !important;
            padding-bottom: 10px !important;
            font-size: 12px !important;
        }

        .scroll-list__to-login {
            height: 80px !important;
        }

        .hb-cpt__pagination--left,
        .hb-cpt__pagination--right {
            display: none !important;
        }

        /* 隐藏顶部Logo */
        .hb-header-logo,
        .hb-header-logo__image,
        .hb-header-logo__desc {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            width: 0 !important;
            height: 0 !important;
        }
    `;

    GM_addStyle(styles);

    // 动态优化函数
    function optimizePosts() {
        const posts = document.querySelectorAll('.hb-cpt__bbs-content, .hb-cpt__bbs-list-content');

        posts.forEach(post => {
            const imgWrapper = post.querySelector('.bbs-content__imgs-wrapper');
            if (imgWrapper) {
                imgWrapper.style.display = 'flex';
                imgWrapper.style.flexWrap = 'nowrap';
                imgWrapper.style.gap = '6px';

                const images = imgWrapper.querySelectorAll('.bbs-content__image');
                images.forEach((img, index) => {
                    if (index >= 3) {
                        img.style.display = 'none';
                    } else {
                        img.style.display = 'block';
                        img.style.position = 'relative';
                        img.style.top = 'auto';
                        img.style.left = 'auto';

                        if (images.length === 1) {
                            img.style.width = '120px';
                            img.style.height = '120px';
                            img.style.flex = '0 0 120px';
                        } else {
                            img.style.width = '100px';
                            img.style.height = '100px';
                            img.style.flex = '0 0 100px';
                        }
                    }
                });
            }

            const title = post.querySelector('.bbs-content__title');
            if (title) {
                title.style.maxHeight = '21px';
                title.style.overflow = 'hidden';
                title.style.textOverflow = 'ellipsis';
                title.style.display = '-webkit-box';
                title.style.webkitLineClamp = '1';
                title.style.webkitBoxOrient = 'vertical';
            }

            const content = post.querySelector('.bbs-content__content');
            if (content) {
                content.style.maxHeight = '39px';
                content.style.overflow = 'hidden';
                content.style.textOverflow = 'ellipsis';
                content.style.display = '-webkit-box';
                content.style.webkitLineClamp = '2';
                content.style.webkitBoxOrient = 'vertical';
            }
        });

        // 强制隐藏侧边栏（处理动态加载）
        const leftSidebar = document.querySelector('.hb-layout-main__container--left');
        const rightSidebar = document.querySelector('.hb-layout__content--right');

        if (leftSidebar) {
            leftSidebar.style.display = 'none';
            leftSidebar.style.width = '0';
        }
        if (rightSidebar) {
            rightSidebar.style.display = 'none';
            rightSidebar.style.width = '0';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', optimizePosts);
    } else {
        optimizePosts();
    }

    const observer = new MutationObserver((mutations) => {
        let hasNewPosts = false;
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && (
                    node.classList?.contains('hb-cpt__bbs-content') ||
                    node.querySelector?.('.hb-cpt__bbs-content') ||
                    node.classList?.contains('hb-layout-main__container--left') ||
                    node.classList?.contains('hb-layout__content--right')
                )) {
                    hasNewPosts = true;
                }
            });
        });

        if (hasNewPosts) {
            setTimeout(optimizePosts, 100);
        }
    });

    setTimeout(() => {
        const container = document.querySelector('.hb-cpt__scroll-list') ||
                         document.querySelector('.bbs-home__content-list') ||
                         document.body;

        observer.observe(container, {
            childList: true,
            subtree: true
        });
    }, 500);

    setInterval(optimizePosts, 2000);

    console.log('[小黑盒优化] 高信息密度模式已启用：已删除两侧边栏 | 中等图片 | 一屏更多内容');
})();