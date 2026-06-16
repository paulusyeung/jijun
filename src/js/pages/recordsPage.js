import { RecordsListManager } from '../recordsList.js';
import { t } from '../i18n.js';

export class RecordsPage {
    constructor(app) {
        this.app = app;
    }

    async render() {
        this.app.appContainer.innerHTML = `
            <div class="page active p-4 pb-24 md:pb-8 max-w-3xl mx-auto">
                <!-- Header -->
                <div class="flex items-center pb-2 justify-between">
                    <button id="prev-period-btn" class="w-10 h-10 flex items-center justify-center text-wabi-text-secondary hover:text-wabi-primary hover:bg-wabi-bg rounded-full transition-colors">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <h1 id="records-header-title" class="text-wabi-primary text-lg font-bold text-center flex-1 cursor-pointer hover:bg-wabi-bg py-1 rounded transition-colors mx-2"></h1>
                    <button id="next-period-btn" class="w-10 h-10 flex items-center justify-center text-wabi-text-secondary hover:text-wabi-primary hover:bg-wabi-bg rounded-full transition-colors">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>

                <!-- Search Bar -->
                <div class="mb-4 relative">
                    <i class="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-wabi-text-secondary"></i>
                    <input type="text" id="records-search-input" class="w-full pl-10 pr-4 py-2 bg-wabi-surface border border-wabi-border rounded-lg outline-none focus:ring-2 focus:ring-wabi-primary transition-all text-wabi-text-primary text-sm placeholder-gray-400" placeholder="${t('records:searchPlaceholder')}">
                </div>

                <!-- Period Filter (Date Filter) - New Row -->
                <div id="records-period-filter" class="flex h-10 w-full items-center justify-center rounded-lg bg-gray-200/50 p-1 mb-4">
                    <button data-period="week" class="period-btn flex-1 h-full rounded-md px-3 py-1 text-sm font-medium text-wabi-text-secondary">${t('records:week')}</button>
                    <button data-period="month" class="period-btn flex-1 h-full rounded-md px-3 py-1 text-sm font-medium bg-wabi-surface text-wabi-primary shadow-sm">${t('records:month')}</button>
                    <button data-period="year" class="period-btn flex-1 h-full rounded-md px-3 py-1 text-sm font-medium text-wabi-text-secondary">${t('records:year')}</button>
                    <button data-period="custom" class="period-btn flex-1 h-full rounded-md px-3 py-1 text-sm font-medium text-wabi-text-secondary">${t('records:custom')}</button>
                </div>

                <!-- Type & Category Filters -->
                <div class="flex gap-2 py-2 overflow-x-auto">
                    <div id="records-type-filter" class="flex items-center justify-center rounded-lg bg-gray-200/50 p-1">
                        <button data-type="all" class="type-btn flex-1 h-full rounded-md px-3 py-1 text-sm font-medium bg-wabi-surface text-wabi-primary shadow-sm">${t('records:all')}</button>
                        <button data-type="expense" class="type-btn flex-1 h-full rounded-md px-3 py-1 text-sm font-medium text-wabi-text-secondary">${t('records:expense')}</button>
                        <button data-type="income" class="type-btn flex-1 h-full rounded-md px-3 py-1 text-sm font-medium text-wabi-text-secondary">${t('records:income')}</button>
                    </div>
                    <button id="records-category-filter-btn" class="h-9 shrink-0 flex items-center justify-center gap-x-1.5 rounded-full bg-wabi-surface px-4 border border-wabi-border">
                        <p class="text-wabi-text-primary text-sm font-medium leading-normal">${t('records:category')}</p>
                        <i class="fa-solid fa-chevron-down text-xs text-wabi-text-secondary"></i>
                    </button>
                    <select id="records-group-filter" class="h-9 shrink-0 rounded-full bg-wabi-surface px-3 border border-wabi-border text-sm text-wabi-text-primary outline-none focus:ring-2 focus:ring-wabi-primary/50">
                        <option value="">${t('records:allGroups')}</option>
                    </select>
                    <button id="records-account-filter-btn" class="h-9 shrink-0 flex items-center justify-center gap-x-1.5 rounded-full bg-wabi-surface px-4 border border-wabi-border hidden">
                        <p class="text-wabi-text-primary text-sm font-medium leading-normal">${t('records:account')}</p>
                        <i class="fa-solid fa-chevron-down text-xs text-wabi-text-secondary"></i>
                    </button>
                    <button id="records-currency-toggle" class="h-9 shrink-0 flex items-center justify-center gap-x-1.5 rounded-full bg-wabi-surface px-3 border border-wabi-border" title="${t('records:currencyToggle')}">
                        <i class="fa-solid fa-dollar-sign text-xs"></i>
                        <span id="records-currency-mode-label" class="text-xs font-medium">${t('records:currencyConverted')}</span>
                    </button>
                </div>

                <!-- Summary Cards -->
                <div class="grid grid-cols-3 gap-3 my-4">
                    <div class="bg-wabi-surface p-3 rounded-lg shadow-sm border border-wabi-border text-center">
                        <div class="text-sm text-wabi-text-secondary">${t('records:count')}</div>
                        <div id="record-count" class="text-lg font-bold text-wabi-primary">0</div>
                    </div>
                    <div class="bg-wabi-surface p-3 rounded-lg shadow-sm border border-wabi-border text-center">
                        <div class="text-sm text-wabi-income">${t('records:income')}</div>
                        <div id="total-income" class="text-lg font-bold text-wabi-income">$0</div>
                    </div>
                    <div class="bg-wabi-surface p-3 rounded-lg shadow-sm border border-wabi-border text-center">
                        <div class="text-sm text-wabi-expense">${t('records:expense')}</div>
                        <div id="total-expense" class="text-lg font-bold text-wabi-expense">$0</div>
                    </div>
                </div>

                <!-- Transaction List -->
                <div id="records-list-container" class="flex flex-col space-y-1"></div>

                <!-- Modals -->
                <div id="records-modals-container"></div>
            </div>
        `;
        const pageElement = this.app.appContainer.querySelector('.page');
        const recordsListManager = new RecordsListManager(this.app.dataService, this.app.categoryManager, pageElement);
        recordsListManager.init();
    }
}
