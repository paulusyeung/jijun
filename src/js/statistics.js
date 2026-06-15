import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { zhTW } from 'date-fns/locale';
import { formatCurrency, getDateRange, escapeHTML, escAttr } from './utils.js';
import { createDateRangeModal } from './datePickerModal.js';

Chart.register(...registerables);

export class StatisticsManager {
    constructor(dataService, categoryManager) {
        this.dataService = dataService;
        this.categoryManager = categoryManager;
        this.container = null;
        this.modalsContainer = null;
        this.charts = {};
        this.accounts = [];
        this.advancedModeEnabled = false;
        this.filters = {
            period: 'month',
            customStartDate: null,
            customEndDate: null,
            selectedAccountId: null, // null means all accounts
            groupMode: false,
        };
        this._drillDownGroup = null; // group key when drilling into a group
    }

    async renderStatisticsPage(container) {
        this.container = container;

        const advancedMode = await this.dataService.getSetting('advancedAccountModeEnabled');
        this.advancedModeEnabled = !!advancedMode?.value;

                if (this.advancedModeEnabled) {

                    this.accounts = await this.dataService.getAccounts();

                }

        

                const accountFilterOptions = this.accounts.map(acc => `<option value="${acc.id}">${escapeHTML(acc.name)}</option>`).join('');

                const accountFilterHTML = this.advancedModeEnabled ? `

                    <div class="mb-4">

                        <label for="stats-account-filter" class="text-sm text-wabi-text-secondary">帳戶</label>

                        <select id="stats-account-filter" class="w-full mt-1 p-2 rounded-lg border-wabi-border bg-wabi-surface focus:ring-wabi-accent focus:border-wabi-accent">

                            <option value="all">所有帳戶</option>

                            ${accountFilterOptions}

                        </select>

                    </div>

                ` : '';

        

                        this.container.innerHTML = `

        

                            ${accountFilterHTML}

        

                            <!-- Time Range Selector -->
            <div class="flex h-10 w-full items-center justify-center rounded-lg bg-gray-200/50 p-1 mb-6">
                <button data-period="week" class="period-btn flex-1 h-full rounded-md px-2 text-sm font-medium text-wabi-text-secondary">週</button>
                <button data-period="month" class="period-btn flex-1 h-full rounded-md px-2 text-sm font-medium bg-wabi-surface text-wabi-primary shadow-sm">月</button>
                <button data-period="year" class="period-btn flex-1 h-full rounded-md px-2 text-sm font-medium text-wabi-text-secondary">年</button>
                <button data-period="custom" class="period-btn flex-1 h-full rounded-md px-2 text-sm font-medium text-wabi-text-secondary">自訂</button>
            </div>

            <!-- Key Metric Cards -->
            <div class="grid grid-cols-2 gap-4 mb-8">
                <div class="flex flex-col gap-1 rounded-xl bg-wabi-surface p-4 shadow-sm border border-wabi-border">
                    <p class="text-sm font-medium text-wabi-text-secondary">總收入</p>
                    <p id="stats-total-income" class="text-xl font-bold tracking-tight text-wabi-income">$0</p>
                </div>
                <div class="flex flex-col gap-1 rounded-xl bg-wabi-surface p-4 shadow-sm border border-wabi-border">
                    <p class="text-sm font-medium text-wabi-text-secondary">總支出</p>
                    <p id="stats-total-expense" class="text-xl font-bold tracking-tight text-wabi-expense">$0</p>
                </div>
                <div class="col-span-2 flex flex-col gap-1 rounded-xl bg-wabi-surface p-4 shadow-sm border border-wabi-border">
                    <p class="text-sm font-medium text-wabi-text-secondary">結餘</p>
                    <p id="stats-net-balance" class="text-2xl font-bold tracking-tight text-wabi-primary">$0</p>
                </div>
                <div id="stats-account-balance-card" class="col-span-2 flex flex-col gap-1 rounded-xl bg-wabi-surface p-4 shadow-sm border border-wabi-border hidden">
                    <p class="text-sm font-medium text-wabi-text-secondary">帳戶餘額</p>
                    <p id="stats-account-balance" class="text-2xl font-bold tracking-tight text-wabi-primary">$0</p>
                </div>
            </div>

            <!-- Donut Chart: Expense Distribution -->
            <div class="rounded-xl bg-wabi-surface p-4 sm:p-6 shadow-sm border border-wabi-border mb-8">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-base font-bold text-wabi-primary">支出分佈</h2>
                    <button id="stats-expense-group-toggle" class="text-xs px-2 py-1 rounded-lg border border-wabi-border text-wabi-text-secondary hover:bg-wabi-bg">依群組顯示</button>
                </div>
                <div id="stats-expense-donut-container" class="flex flex-col items-center gap-6 sm:flex-row">
                    <!-- Chart will be rendered here -->
                </div>
            </div>

            <!-- Donut Chart: Income Distribution -->
            <div class="mb-8 rounded-xl bg-wabi-surface p-4 sm:p-6 shadow-sm border border-wabi-border">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-base font-bold text-wabi-primary">收入分佈</h2>
                    <button id="stats-income-group-toggle" class="text-xs px-2 py-1 rounded-lg border border-wabi-border text-wabi-text-secondary hover:bg-wabi-bg">依群組顯示</button>
                </div>
                <div id="stats-income-donut-container" class="flex flex-col items-center gap-6 sm:flex-row">
                    <!-- Chart will be rendered here -->
                </div>
            </div>

            <!-- Line Chart: Income/Expense Trend -->
            <div class="rounded-xl bg-wabi-surface p-4 sm:p-6 shadow-sm border border-wabi-border mb-8">
                <h2 class="text-base font-bold mb-4 text-wabi-primary">收支趨勢</h2>
                <div class="relative h-48 w-full">
                    <canvas id="stats-trend-chart"></canvas>
                </div>
            </div>

            <!-- Heatmap: Annual Expense Activity -->
            <div class="rounded-xl bg-wabi-surface p-4 sm:p-6 shadow-sm border border-wabi-border mb-8">
                <h2 class="text-base font-bold mb-4 text-wabi-primary flex items-center gap-2">
                    <i class="fa-solid fa-fire text-orange-500"></i> 年度消費熱力圖
                </h2>
                <div class="overflow-x-auto pb-2">
                    <div id="stats-heatmap-container" class="min-w-[600px]">
                        <!-- Grid will be injected here -->
                    </div>
                </div>
                <div class="flex justify-end items-center gap-2 mt-2 text-xs text-wabi-text-secondary">
                    <span>跟錢包過不去</span>
                    <div class="flex gap-1">
                        <div class="size-3 bg-wabi-expense opacity-25 rounded-sm"></div>
                        <div class="size-3 bg-wabi-expense opacity-50 rounded-sm"></div>
                        <div class="size-3 bg-wabi-expense opacity-75 rounded-sm"></div>
                        <div class="size-3 bg-wabi-expense opacity-100 rounded-sm"></div>
                    </div>
                    <span>花錢如流水</span>
                </div>
            </div>

            <!-- Top Expenses List (New) -->
            <div class="rounded-xl bg-wabi-surface p-4 sm:p-6 shadow-sm border border-wabi-border mb-8">
                <h2 class="text-base font-bold mb-4 text-wabi-primary flex items-center gap-2">
                    <i class="fa-solid fa-ranking-star text-yellow-500"></i> 鉅額消費排行 (Top 5)
                </h2>
                <div id="stats-top-expenses-list" class="space-y-3">
                    <!-- List injected here -->
                </div>
            </div>

            <!-- Modals container -->
            <div id="stats-modals-container"></div>
        `;
        this.modalsContainer = this.container.querySelector('#stats-modals-container');
        this.setupEventListeners();
        await this.loadStatisticsData();
    }

    setupEventListeners() {
        this.container.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                if (period === 'custom') {
                    this.showDateRangeModal();
                } else {
                    this.filters.period = period;
                    this.updatePeriodButtons();
                    this.loadStatisticsData();
                }
            });
        });

        if (this.advancedModeEnabled) {
            const accountFilter = this.container.querySelector('#stats-account-filter');
            if (accountFilter) {
                accountFilter.addEventListener('change', (e) => {
                    this.filters.selectedAccountId = e.target.value === 'all' ? null : parseInt(e.target.value, 10);
                    this.loadStatisticsData();
                });
            }
        }

        const expenseToggle = this.container.querySelector('#stats-expense-group-toggle');
        const incomeToggle = this.container.querySelector('#stats-income-group-toggle');
        if (expenseToggle) {
            expenseToggle.addEventListener('click', () => {
                this.filters.groupMode = !this.filters.groupMode;
                this._drillDownGroup = null;
                this.loadStatisticsData();
            });
        }
        if (incomeToggle) {
            incomeToggle.addEventListener('click', () => {
                this.filters.groupMode = !this.filters.groupMode;
                this._drillDownGroup = null;
                this.loadStatisticsData();
            });
        }
    }

    updatePeriodButtons() {
        this.container.querySelectorAll('.period-btn').forEach(btn => {
            if (btn.dataset.period === this.filters.period) {
                btn.classList.add('bg-wabi-surface', 'text-wabi-primary', 'shadow-sm');
                btn.classList.remove('text-wabi-text-secondary');
            } else {
                btn.classList.remove('bg-wabi-surface', 'text-wabi-primary', 'shadow-sm');
                btn.classList.add('text-wabi-text-secondary');
            }
        });
    }

    async loadStatisticsData() {
        const dateRange = this.filters.period === 'custom' && this.filters.customStartDate
            ? { startDate: this.filters.customStartDate, endDate: this.filters.customEndDate }
            : getDateRange(this.filters.period);

        const offsetTransfers = this.filters.selectedAccountId === null;
        const stats = await this.dataService.getStatistics(dateRange.startDate, dateRange.endDate, this.filters.selectedAccountId, offsetTransfers);

        // Handle Account Balance display
        const accountBalanceCard = this.container.querySelector('#stats-account-balance-card');
        if (this.advancedModeEnabled && this.filters.selectedAccountId !== null) {
            const account = this.accounts.find(a => a.id === this.filters.selectedAccountId);
            if (account) {
                const allRecordsForAccount = await this.dataService.getRecords({ accountId: this.filters.selectedAccountId });
                const currentBalance = allRecordsForAccount.reduce((balance, record) => {
                    if (record.category === 'transfer') {
                        // Transfers are handled as simple income/expense
                        return balance + (record.type === 'income' ? record.amount : -record.amount);
                    }
                    return balance + (record.type === 'income' ? record.amount : -record.amount);
                }, account.balance);

                const accountBalanceEl = accountBalanceCard.querySelector('#stats-account-balance');
                accountBalanceEl.textContent = formatCurrency(currentBalance);
                accountBalanceCard.classList.remove('hidden');
            }
        } else {
            accountBalanceCard.classList.add('hidden');
        }

        this.updateSummaryCards(stats);
        this.renderTrendChart(stats.dailyTotals, dateRange);
        this.renderExpenseDonutChart(stats.expenseByCategory);
        this.renderIncomeDonutChart(stats.incomeByCategory);
        this.renderAnnualHeatmap(dateRange);
        this.renderTopExpenses(stats.records); // Pass records
    }

    renderTopExpenses(records) {
        const topList = records
            .filter(r => r.type === 'expense')
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
            
        const container = this.container.querySelector('#stats-top-expenses-list');
        if (!container) return;
        
        if (topList.length === 0) {
            container.innerHTML = '<p class="text-sm text-center text-wabi-text-secondary">無消費紀錄</p>';
            return;
        }
        
        container.innerHTML = topList.map((r, index) => {
            const category = this.categoryManager.getCategoryById('expense', r.category);
            const categoryName = category ? category.name : (r.category === 'others' ? '其他' : r.category);
            const icon = category ? category.icon : 'fa-solid fa-question';
            
            return `
                <div class="flex items-center justify-between p-3 rounded-lg bg-wabi-bg border border-wabi-border">
                    <div class="flex items-center gap-3">
                        <div class="flex size-8 items-center justify-center rounded-full bg-wabi-expense/20 text-wabi-expense font-bold text-xs">
                             ${index + 1}
                        </div>
                        <div>
                             <p class="text-sm font-bold text-wabi-text-primary">${escAttr(r.description || categoryName)}</p>
                             <div class="flex items-center gap-2 text-xs text-wabi-text-secondary">
                                 <span><i class="${icon} mr-1"></i>${escAttr(categoryName)}</span>
                                 <span>•</span>
                                 <span>${r.date}</span>
                             </div>
                        </div>
                    </div>
                    <span class="font-bold text-wabi-expense">${formatCurrency(r.amount)}</span>
                </div>
            `;
        }).join('');
    }

    updateSummaryCards(stats) {
        const netBalance = stats.totalIncome - stats.totalExpense;
        this.container.querySelector('#stats-total-income').textContent = formatCurrency(stats.totalIncome);
        this.container.querySelector('#stats-total-expense').textContent = formatCurrency(stats.totalExpense);
        this.container.querySelector('#stats-net-balance').textContent = formatCurrency(netBalance);
        this.container.querySelector('#stats-net-balance').className = `text-2xl font-bold tracking-tight ${netBalance >= 0 ? 'text-wabi-income' : 'text-wabi-expense'}`;
    }

    renderTrendChart(dailyData, dateRange) {
        const ctx = this.container.querySelector('#stats-trend-chart').getContext('2d');
        if (this.charts.trend) this.charts.trend.destroy();

        const labels = Object.keys(dailyData).sort();
        const incomeValues = labels.map(label => dailyData[label].income);
        const expenseValues = labels.map(label => dailyData[label].expense);

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '收入',
                        data: incomeValues,
                        borderColor: '#6A9C89', // wabi-income
                        backgroundColor: '#6A9C8933',
                        fill: true,
                        tension: 0.3,
                    },
                    {
                        label: '支出',
                        data: expenseValues,
                        borderColor: '#B95A5A', // wabi-expense
                        backgroundColor: '#B95A5A33',
                        fill: true,
                        tension: 0.3,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: this.getChartTimeUnit(dateRange),
                            tooltipFormat: 'yyyy-MM-dd',
                            displayFormats: { day: 'MM-dd', week: 'MM-dd', month: 'yyyy-MM' }
                        },
                        adapters: { date: { locale: zhTW } },
                        grid: { display: false },
                        ticks: { color: '#718096' }
                    },
                    y: {
                        grid: { color: '#E2E8F0' },
                        ticks: { 
                            color: '#718096',
                            callback: value => formatCurrency(value, 0)
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                        }
                    }
                }
            }
        });
    }

    _aggregateByGroup(categoryData, type) {
        const grouped = this.categoryManager.getGroupedCategories(type);
        const groupMap = {};
        for (const cat of categoryData) {
            let groupKey = null;
            for (const entry of grouped) {
                if (entry.categories.some(c => c.id === cat.id)) {
                    groupKey = entry.group.key || entry.group.uuid;
                    if (!groupMap[groupKey]) {
                        groupMap[groupKey] = {
                            id: groupKey, name: entry.group.name,
                            icon: entry.group.icon, color: entry.group.color,
                            value: 0, categories: []
                        };
                    }
                    groupMap[groupKey].value += cat.value;
                    groupMap[groupKey].categories.push(cat);
                    break;
                }
            }
            if (!groupKey) {
                const key = '__ungrouped';
                if (!groupMap[key]) {
                    const uncatGroup = grouped.find(g => g.group.id === null) || { group: { name: '未分類', icon: 'fas fa-question', color: 'bg-gray-300' } };
                    groupMap[key] = {
                        id: key, name: uncatGroup.group.name,
                        icon: uncatGroup.group.icon, color: uncatGroup.group.color,
                        value: 0, categories: []
                    };
                }
                groupMap[key].value += cat.value;
                groupMap[key].categories.push(cat);
            }
        }
        return Object.values(groupMap).sort((a, b) => b.value - a.value);
    }

    _buildDonutChart(rawData, type, containerId, chartId, legendId, toggleBtnId) {
        const container = this.container.querySelector(containerId);
        if (containerId === '#stats-expense-donut-container') {
            if (this.charts.expenseDonut) this.charts.expenseDonut.destroy();
        } else {
            if (this.charts.incomeDonut) this.charts.incomeDonut.destroy();
        }

        const toggle = this.container.querySelector(toggleBtnId);
        if (toggle) {
            toggle.textContent = this.filters.groupMode ? '依分類顯示' : '依群組顯示';
            toggle.classList.toggle('bg-wabi-primary/10', this.filters.groupMode);
            toggle.classList.toggle('text-wabi-primary', this.filters.groupMode);
        }

        const total = Object.values(rawData).reduce((a, b) => a + b, 0);
        if (total === 0) {
            const label = type === 'expense' ? '支出' : '收入';
            container.innerHTML = `<p class="text-center text-wabi-text-secondary py-8">此期間無${label}紀錄</p>`;
            return;
        }

        let resolvedData;
        if (this.filters.groupMode && !this._drillDownGroup) {
            resolvedData = this._aggregateByGroup(
                Object.keys(rawData).map(id => ({ id, value: rawData[id] })), type
            );
        } else {
            const drillIds = this.filters.groupMode && this._drillDownGroup
                ? this._getGroupCategoryIds(type, this._drillDownGroup)
                : null;
            resolvedData = Object.keys(rawData)
                .filter(id => !drillIds || drillIds.includes(id))
                .map(id => {
                    const category = this.categoryManager.getCategoryById(type, id);
                    return { id, name: category?.name || '其他', value: rawData[id], color: category?.color || 'bg-gray-400' };
                }).sort((a, b) => b.value - a.value);
        }

        const labels = resolvedData.map(d => d.name || d.name);
        const values = resolvedData.map(d => d.value);
        const colors = resolvedData.map(d => {
            const color = d.color;
            if (color.startsWith('#')) return color;
            const match = color.match(/bg-(.*)-(\d+)/);
            if (match) {
                const colorMap = {
                    slate: '#64748b', stone: '#78716c', red: '#ef4444', orange: '#f97316',
                    amber: '#f59e0b', yellow: '#eab308', lime: '#84cc16', green: '#22c55e',
                    emerald: '#10b981', teal: '#14b8a6', cyan: '#06b6d4', sky: '#0ea5e9',
                    blue: '#3b82f6', indigo: '#6366f1', violet: '#8b5cf6', purple: '#a855f7',
                };
                return colorMap[match[1]] || '#9ca3af';
            }
            return '#9ca3af';
        });

        container.innerHTML = `
            <div class="relative flex size-40 items-center justify-center sm:size-48">
                <canvas id="${chartId.replace('#', '')}"></canvas>
                <div class="absolute text-center">
                    <p class="text-xs text-wabi-text-secondary">${type === 'expense' ? '總支出' : '總收入'}</p>
                    <p class="text-lg font-bold text-wabi-primary">${formatCurrency(total)}</p>
                </div>
            </div>
            <div id="${legendId.replace('#', '')}" class="w-full flex-1 space-y-3"></div>
        `;

        const ctx = this.container.querySelector(chartId).getContext('2d');
        const chartKey = type === 'expense' ? 'expenseDonut' : 'incomeDonut';
        this.charts[chartKey] = new Chart(ctx, {
            type: 'doughnut',
            data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '75%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                onClick: this.filters.groupMode && !this._drillDownGroup ? (e, elements) => {
                    if (elements.length > 0) {
                        const idx = elements[0].index;
                        this._drillDownGroup = resolvedData[idx].id;
                        this._buildDonutChart(rawData, type, containerId, chartId, legendId, toggleBtnId);
                    }
                } : undefined
            }
        });

        const legendContainer = this.container.querySelector(legendId);
        legendContainer.innerHTML = resolvedData.map((d, i) => `
            <div class="flex items-center justify-between text-sm${this.filters.groupMode && !this._drillDownGroup ? ' cursor-pointer hover:opacity-80' : ''}">
                <div class="flex items-center gap-2">
                    <span class="size-3 rounded-full" style="background-color: ${colors[i]};"></span>
                    <span>${escAttr(d.name || d.name)}</span>
                </div>
                <div class="font-medium">
                    <span>${formatCurrency(d.value)}</span>
                    <span class="ml-2 text-xs text-wabi-text-secondary">${((d.value / total) * 100).toFixed(0)}%</span>
                </div>
            </div>
        `).join('');

        if (this.filters.groupMode && this._drillDownGroup) {
            const backBtn = document.createElement('button');
            backBtn.className = 'text-xs text-wabi-primary mt-2 flex items-center gap-1';
            backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> 返回群組總覽';
            backBtn.addEventListener('click', () => {
                this._drillDownGroup = null;
                this._buildDonutChart(rawData, type, containerId, chartId, legendId, toggleBtnId);
            });
            legendContainer.appendChild(backBtn);
        }

        if (this.filters.groupMode && !this._drillDownGroup) {
            legendContainer.querySelectorAll('div.cursor-pointer').forEach(el => {
                el.addEventListener('click', function() { });
            });
            legendContainer.addEventListener('click', (e) => {
                const item = e.target.closest('.flex.items-center.justify-between');
                if (item) {
                    const idx = Array.from(legendContainer.children).indexOf(item);
                    if (idx >= 0 && idx < resolvedData.length) {
                        this._drillDownGroup = resolvedData[idx].id;
                        this._buildDonutChart(rawData, type, containerId, chartId, legendId, toggleBtnId);
                    }
                }
            });
        }
    }

    _getGroupCategoryIds(type, groupId) {
        const grouped = this.categoryManager.getGroupedCategories(type);
        for (const entry of grouped) {
            const gid = entry.group.key || entry.group.uuid;
            if (gid === groupId) {
                return new Set(entry.categories.map(c => c.id));
            }
        }
        return null;
    }

    renderExpenseDonutChart(expenseData) {
        this._buildDonutChart(expenseData, 'expense',
            '#stats-expense-donut-container', '#stats-expense-donut-chart',
            '#stats-expense-legend', '#stats-expense-group-toggle');
    }

    renderIncomeDonutChart(incomeData) {
        this._buildDonutChart(incomeData, 'income',
            '#stats-income-donut-container', '#stats-income-donut-chart',
            '#stats-income-legend', '#stats-income-group-toggle');
    }

    getChartTimeUnit(dateRange) {
        const days = (new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24);
        if (days <= 14) return 'day';
        if (days <= 90) return 'week';
        return 'month';
    }

    showDateRangeModal() {
        const modal = createDateRangeModal({
            initialStartDate: this.filters.customStartDate,
            initialEndDate: this.filters.customEndDate,
            onApply: (start, end) => {
                this.filters.period = 'custom';
                this.filters.customStartDate = start;
                this.filters.customEndDate = end;
                this.updatePeriodButtons();
                this.loadStatisticsData();
            }
        });
        this.modalsContainer.appendChild(modal);
    }

    async renderAnnualHeatmap(dateRange) {
        const container = this.container.querySelector('#stats-heatmap-container');
        if (!container) return;

        // Clear previous content to prevent duplication
        container.innerHTML = '';

        // Determine target year from current filters
        // Default to current year if no range provided (shouldn't happen via loadStatisticsData)
        const targetDate = dateRange ? new Date(dateRange.startDate) : new Date();
        const targetYear = targetDate.getFullYear();

        // Fetch all expense records for the target year
        const records = await this.dataService.getRecords({
            startDate: `${targetYear}-01-01`,
            endDate: `${targetYear}-12-31`,
            type: 'expense'
        });

        // Group by date
        const dailyCounts = {};
        let maxAmount = 0;
        records.forEach(r => {
            const date = r.date; // YYYY-MM-DD
            dailyCounts[date] = (dailyCounts[date] || 0) + r.amount;
            if (dailyCounts[date] > maxAmount) maxAmount = dailyCounts[date];
        });

        // Generate grid (53 weeks * 7 days)
        const startDate = new Date(targetYear, 0, 1);
        
        // CSS Grid
        container.style.display = 'grid';
        container.style.gridTemplateRows = 'repeat(7, 1fr)';
        container.style.gridAutoFlow = 'column';
        container.style.gap = '3px';

        const dayMilliseconds = 24 * 60 * 60 * 1000;
        
        // We only show the target year
        const isLeapYear = (targetYear % 4 === 0 && targetYear % 100 !== 0) || (targetYear % 400 === 0);
        const daysInYear = isLeapYear ? 366 : 365;

        for (let i = 0; i < daysInYear + (7 - (daysInYear % 7)); i++) { // Fill up the grid columns
            const currentDate = new Date(startDate.getTime() + i * dayMilliseconds);
            if (currentDate.getFullYear() > targetYear) {
                 const cell = document.createElement('div');
                 cell.className = 'size-3 rounded-sm bg-transparent';
                 container.appendChild(cell);
                 continue;
            }

            const dateStr = currentDate.toISOString().split('T')[0];
            const amount = dailyCounts[dateStr] || 0;
            
            const cell = document.createElement('div');
            // Default color
            cell.className = 'size-3 rounded-sm bg-wabi-border transition-all hover:ring-2 hover:ring-wabi-expense/50 cursor-pointer relative group';
            // Tooltip using title for now
            cell.title = `${dateStr}: $${amount}`;

            if (amount > 0) {
                const intensity = amount / (maxAmount || 1);
                if (intensity > 0.75) cell.className = 'size-3 rounded-sm bg-wabi-expense opacity-100 transition-all hover:ring-2 hover:ring-wabi-expense/50 cursor-pointer';
                else if (intensity > 0.5) cell.className = 'size-3 rounded-sm bg-wabi-expense opacity-75 transition-all hover:ring-2 hover:ring-wabi-expense/50 cursor-pointer';
                else if (intensity > 0.25) cell.className = 'size-3 rounded-sm bg-wabi-expense opacity-50 transition-all hover:ring-2 hover:ring-wabi-expense/50 cursor-pointer';
                else cell.className = 'size-3 rounded-sm bg-wabi-expense opacity-25 transition-all hover:ring-2 hover:ring-wabi-expense/50 cursor-pointer';
            }
            
            container.appendChild(cell);
        }
    }

    destroy() {
        Object.values(this.charts).forEach(chart => chart?.destroy());
        this.charts = {};
    }
}
