import { t } from './i18n.js';
import { showToast, triggerHaptic } from './utils.js';

export class Router {
    constructor(app) {
        this.app = app;
        this.routes = {};
        this.currentHash = null;
        this.navItems = document.querySelectorAll('.nav-item');
    }

    register(name, page) {
        this.routes[name] = page;
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRouteChange());
        document.addEventListener('click', (e) => {
            this.app.pluginManager.triggerHook('onPageClick', e);
        });
        document.addEventListener('app:languageChanged', () => this.reRender());

        // Initial route
        this.handleRouteChange();
    }

    reRender() {
        const scrollY = window.scrollY;
        document.querySelectorAll('.fixed.inset-0, [id$="-modal"], [id$="-popup"]').forEach(el => {
            if (el && el.parentNode) el.remove();
        });
        const page = this.routes[this.currentPageName];
        if (page && page.render) {
            page.render(this.currentParams);
        }
        requestAnimationFrame(() => window.scrollTo(0, scrollY));
    }

    async handleRouteChange() {
        const hash = window.location.hash || '#home';
        triggerHaptic();
        if (hash === this.currentHash) return;
        this.currentHash = hash;

        const [pageName, query] = hash.substring(1).split('?');
        const params = new URLSearchParams(query);
        this.currentPageName = pageName;
        this.currentParams = params;

        this.updateActiveNavItem(pageName);

        // Scroll to top on page change
        window.scrollTo(0, 0);

        try {
            await this.app.pluginManager.triggerHook('onPageRenderBefore', pageName);

            const page = this.routes[pageName];
            if (page) {
                if (page.render) {
                    await page.render(params);
                } else {
                    console.error(`Page ${pageName} does not implement render method`);
                }
            } else {
                // Check for custom pages from plugins
                const customPage = this.app.pluginManager.getCustomPage(pageName);
                if (customPage) {
                    this.app.appContainer.innerHTML = ''; // Clear container
                    try {
                        customPage.renderFn(this.app.appContainer);
                    } catch (e) {
                        console.error('Error rendering custom page:', e);
                        showToast(t('errors:pageLoadFailed'), 'error');
                    }
                } else {
                    console.warn('Route not found, redirecting to home:', pageName);
                    window.location.hash = 'home';
                    return;
                }
            }

            await this.app.pluginManager.triggerHook('onPageRenderAfter', pageName);
        } catch (error) {
            console.error('Error during route change:', error);
            showToast(t('errors:pageLoadError'), 'error');
        }
    }

    updateActiveNavItem(activePage) {
        this.navItems.forEach(item => {
            if (item.dataset.page === activePage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
}
