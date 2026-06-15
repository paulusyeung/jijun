import { formatCurrency, showToast, formatDateToString, escapeHTML, customConfirm } from '../utils.js';
import { t } from '../i18n.js';

export class RecurringPage {
    constructor(app) {
        this.app = app;
    }

    async render() {

        this.app.appContainer.innerHTML = `
            <div class="page active p-4 pb-24 md:pb-8 max-w-3xl mx-auto">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                    <a href="#settings" class="text-wabi-text-secondary hover:text-wabi-primary">
                        <i class="fa-solid fa-chevron-left text-xl"></i>
                    </a>
                    <h1 class="text-xl font-bold text-wabi-primary">${t('recurring:title')}</h1>
                    <div class="w-6"></div> <!-- Placeholder for alignment -->
                </div>

                <!-- Recurring Transaction List -->
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-wabi-primary">${t('recurring:subtitle')}</h3>
                    <button id="add-recurring-btn" class="bg-wabi-primary text-wabi-surface rounded-full w-8 h-8 flex items-center justify-center">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
                <div id="recurring-list-container" class="space-y-2"></div>
            </div>
        `;
        this.setupRecurringPageListeners();
    }

    async setupRecurringPageListeners() {
        const pageElement = this.app.appContainer.querySelector('.page.active');
        if (!pageElement) return;

        const recurringTxs = await this.app.dataService.getRecurringTransactions();
        const container = pageElement.querySelector('#recurring-list-container');
        container.innerHTML = '';

        if (recurringTxs.length === 0) {
            container.innerHTML = `<p class="text-center text-wabi-text-secondary py-8">${t('recurring:emptyState')}</p>`;
            // Still need to set up the add button listener
        } else {
            for (const tx of recurringTxs) {
                const txEl = document.createElement('div');
                txEl.className = 'flex items-center justify-between bg-wabi-surface p-4 rounded-lg border border-wabi-border';
                txEl.innerHTML = `
                    <div>
                        <p class="font-medium text-wabi-text-primary">${escapeHTML(tx.description)}</p>
                        <p class="text-sm text-wabi-text-secondary">${t('recurring:amountLabel')}${formatCurrency(tx.amount)} | ${t('recurring:nextDateLabel')}${tx.nextDueDate}</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="edit-recurring-btn" data-id="${tx.id}"><i class="fa-solid fa-pen text-wabi-text-secondary"></i></button>
                        <button class="delete-recurring-btn" data-id="${tx.id}"><i class="fa-solid fa-trash-can text-wabi-expense"></i></button>
                    </div>
                `;
                container.appendChild(txEl);
            }
        }

        const addBtn = pageElement.querySelector('#add-recurring-btn');
        if (addBtn) {
            addBtn.addEventListener('click', async () => {
                await this.showRecurringTransactionModal();
            });
        }

        pageElement.querySelectorAll('.edit-recurring-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const txId = parseInt(e.currentTarget.dataset.id, 10);
                const tx = recurringTxs.find(t => t.id === txId);
                await this.showRecurringTransactionModal(tx);
            });
        });

        pageElement.querySelectorAll('.delete-recurring-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const txId = parseInt(e.currentTarget.dataset.id, 10);
                if (await customConfirm(t('recurring:toastConfirmDelete'))) {
                    await this.app.dataService.deleteRecurringTransaction(txId);
                    showToast(t('recurring:toastDeleted'));
                    this.render();
                }
            });
        });
    }

    async showRecurringTransactionModal(txToEdit = null) {
        const isEdit = !!txToEdit;
        const modal = document.createElement('div');
        modal.id = 'recurring-tx-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';

        // Ensure accounts are loaded
        const advancedModeSetting = await this.app.dataService.getSetting('advancedAccountModeEnabled');
        const advancedModeEnabled = !!advancedModeSetting?.value;
        const accounts = advancedModeEnabled ? await this.app.dataService.getAccounts() : [];

        // Prepare category and account options
        const expenseCategories = this.app.categoryManager.getAllCategories('expense').map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');
        const incomeCategories = this.app.categoryManager.getAllCategories('income').map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');
        const accountOptions = advancedModeEnabled ? accounts.map(acc => `<option value="${acc.id}">${escapeHTML(acc.name)}</option>`).join('') : '';

        modal.innerHTML = `
            <div class="bg-wabi-bg rounded-lg max-w-sm w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <h3 class="text-lg font-bold text-wabi-primary">${t(isEdit ? 'recurring:editTitle' : 'recurring:addTitle')}</h3>

                <div>
                    <label class="text-sm">${t('recurring:description')}</label>
                    <input type="text" id="recurring-desc" value="${txToEdit ? escapeHTML(txToEdit.description) : ''}" class="w-full mt-1 p-2 rounded-lg border-wabi-border bg-wabi-surface">
                </div>

                <div>
                    <label class="text-sm">${t('recurring:amount')}</label>
                    <input type="number" id="recurring-amount" value="${txToEdit?.amount || ''}" class="w-full mt-1 p-2 rounded-lg border-wabi-border bg-wabi-surface">
                </div>

                <div>
                    <label class="text-sm">${t('recurring:type')}</label>
                    <div class="flex h-10 w-full items-center justify-center rounded-lg bg-gray-200/50 p-1 mt-1">
                        <button data-type="expense" class="recurring-type-btn flex-1 h-full rounded-md text-sm font-medium">${t('recurring:expense')}</button>
                        <button data-type="income" class="recurring-type-btn flex-1 h-full rounded-md text-sm font-medium">${t('recurring:income')}</button>
                    </div>
                </div>

                <div>
                    <label class="text-sm">${t('recurring:category')}</label>
                    <select id="recurring-category" class="w-full mt-1 p-2 rounded-lg border-wabi-border bg-wabi-surface"></select>
                </div>

                ${advancedModeEnabled ? `
                <div>
                    <label class="text-sm">${t('recurring:account')}</label>
                    <select id="recurring-account" class="w-full mt-1 p-2 rounded-lg border-wabi-border bg-wabi-surface">${accountOptions}</select>
                </div>
                ` : ''}

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-sm">${t('recurring:frequency')}</label>
                        <select id="recurring-frequency" class="w-full mt-1 p-2 rounded-lg border-wabi-border bg-wabi-surface">
                            <option value="daily">${t('recurring:daily')}</option>
                            <option value="weekly">${t('recurring:weekly')}</option>
                            <option value="monthly">${t('recurring:monthly')}</option>
                            <option value="yearly">${t('recurring:yearly')}</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-sm">${t('recurring:interval')}</label>
                        <input type="number" id="recurring-interval" value="${txToEdit?.interval || 1}" min="1" class="w-full mt-1 p-2 rounded-lg border-wabi-border bg-wabi-surface">
                    </div>
                </div>

                <div>
                    <label class="text-sm">${t('recurring:startDate')}</label>
                    <input type="date" id="recurring-start-date" value="${txToEdit?.startDate || formatDateToString(new Date())}" class="w-full mt-1 p-2 rounded-lg border-wabi-border bg-wabi-surface">
                </div>

                <!-- Skip Rules -->
                <div id="skip-rules-container" class="space-y-2 pt-2 hidden">
                    <label class="text-sm font-medium text-wabi-text-primary">${t('recurring:skipRules')}</label>
                    <!-- Weekly Skip -->
                    <div id="skip-weekly-controls" class="hidden">
                        <div class="grid grid-cols-4 gap-2 text-center">
                            ${[0,1,2,3,4,5,6].map(i => `
                                <label class="p-2 rounded-lg border border-wabi-border has-[:checked]:bg-wabi-accent has-[:checked]:border-wabi-primary">
                                    <input type="checkbox" name="skipDayOfWeek" value="${i}" class="sr-only">
                                    <span>${t('recurring:day' + i)}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <!-- Monthly Skip -->
                    <div id="skip-monthly-controls" class="hidden">
                        <label class="text-sm font-medium text-wabi-text-primary" for="skip-day-of-month-input">${t('recurring:skipDayOfMonth')}</label>
                        <input type="text" id="skip-day-of-month-input" placeholder="${t('recurring:skipDayOfMonthPlaceholder')}" class="w-full p-2 rounded-lg border-wabi-border bg-wabi-surface">
                    </div>
                    <!-- Yearly Skip -->
                    <div id="skip-yearly-controls" class="hidden">
                        <label class="text-sm font-medium text-wabi-text-primary" for="skip-month-of-year-input">${t('recurring:skipMonthOfYear')}</label>
                         <input type="text" id="skip-month-of-year-input" placeholder="${t('recurring:skipMonthOfYearPlaceholder')}" class="w-full p-2 rounded-lg border-wabi-border bg-wabi-surface">
                    </div>
                </div>

                <div class="flex gap-2 mt-6">
                    <button id="save-recurring-btn" class="flex-1 py-3 bg-wabi-accent text-wabi-primary font-bold rounded-lg">${t('common:buttons.save')}</button>
                    <button id="cancel-recurring-btn" class="flex-1 py-3 bg-wabi-surface border border-wabi-border text-wabi-text-primary rounded-lg">${t('common:buttons.cancel')}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const typeExpenseBtn = modal.querySelector('.recurring-type-btn[data-type="expense"]');
        const typeIncomeBtn = modal.querySelector('.recurring-type-btn[data-type="income"]');
        const categorySelect = modal.querySelector('#recurring-category');
        const frequencySelect = modal.querySelector('#recurring-frequency');
        let currentType = txToEdit?.type || 'expense';

        const skipRulesContainer = modal.querySelector('#skip-rules-container');
        const skipWeeklyControls = modal.querySelector('#skip-weekly-controls');
        const skipMonthlyControls = modal.querySelector('#skip-monthly-controls');
        const skipYearlyControls = modal.querySelector('#skip-yearly-controls');

        // Make all skip rule controls visible
        skipRulesContainer.classList.remove('hidden');
        skipWeeklyControls.classList.remove('hidden');
        skipMonthlyControls.classList.remove('hidden');
        skipYearlyControls.classList.remove('hidden');

        const updateCategoryOptions = () => {
            if (currentType === 'expense') {
                categorySelect.innerHTML = expenseCategories;
                typeExpenseBtn.classList.add('bg-wabi-expense', 'text-wabi-surface');
                typeIncomeBtn.classList.remove('bg-wabi-income', 'text-wabi-surface');
            } else {
                categorySelect.innerHTML = incomeCategories;
                typeIncomeBtn.classList.add('bg-wabi-income', 'text-wabi-surface');
                typeExpenseBtn.classList.remove('bg-wabi-expense', 'text-wabi-surface');
            }
        };

        updateCategoryOptions();

        if (txToEdit) {
            categorySelect.value = txToEdit.category;
            if (advancedModeEnabled) modal.querySelector('#recurring-account').value = txToEdit.accountId;
            frequencySelect.value = txToEdit.frequency;

            // Populate skip rules
            if (txToEdit.skipRules && Array.isArray(txToEdit.skipRules)) {
                txToEdit.skipRules.forEach(rule => {
                    const { type, values } = rule;
                    if (type === 'dayOfWeek') {
                        values.forEach(day => {
                            const checkbox = modal.querySelector(`input[name="skipDayOfWeek"][value="${day}"]`);
                            if (checkbox) checkbox.checked = true;
                        });
                    } else if (type === 'dayOfMonth') {
                        modal.querySelector('#skip-day-of-month-input').value = values.join(', ');
                    } else if (type === 'monthOfYear') {
                        // Convert 0-indexed month back to 1-indexed for display
                        modal.querySelector('#skip-month-of-year-input').value = values.map(m => m + 1).join(', ');
                    }
                });
            }
        }

        typeExpenseBtn.addEventListener('click', () => { currentType = 'expense'; updateCategoryOptions(); });
        typeIncomeBtn.addEventListener('click', () => { currentType = 'income'; updateCategoryOptions(); });

        const closeModal = () => modal.remove();
        modal.querySelector('#cancel-recurring-btn').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        modal.querySelector('#save-recurring-btn').addEventListener('click', async () => {
            const data = {
                description: modal.querySelector('#recurring-desc').value,
                amount: parseFloat(modal.querySelector('#recurring-amount').value),
                type: currentType,
                category: categorySelect.value,
                accountId: advancedModeEnabled ? parseInt(modal.querySelector('#recurring-account').value, 10) : null,
                frequency: frequencySelect.value,
                interval: parseInt(modal.querySelector('#recurring-interval').value, 10),
                startDate: modal.querySelector('#recurring-start-date').value,
                nextDueDate: modal.querySelector('#recurring-start-date').value, // First due date is the start date
                skipRules: [],
            };

            // Parse all skip rules
            const weeklyValues = [...modal.querySelectorAll('input[name="skipDayOfWeek"]:checked')].map(cb => parseInt(cb.value, 10));
            if (weeklyValues.length > 0) {
                data.skipRules.push({ type: 'dayOfWeek', values: weeklyValues });
            }

            const monthlyInput = modal.querySelector('#skip-day-of-month-input').value;
            const monthlyValues = monthlyInput.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n >= 1 && n <= 31);
            if (monthlyValues.length > 0) {
                data.skipRules.push({ type: 'dayOfMonth', values: monthlyValues });
            }

            const yearlyInput = modal.querySelector('#skip-month-of-year-input').value;
            const yearlyValues = yearlyInput.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n >= 1 && n <= 12);
            if (yearlyValues.length > 0) {
                // Convert to 0-indexed month for storage
                data.skipRules.push({ type: 'monthOfYear', values: yearlyValues.map(m => m - 1) });
            }

            if (data.skipRules.length === 0) {
                data.skipRules = null;
            }

            if (!data.description || !data.amount || data.amount <= 0 || !data.startDate) {
                showToast(t('recurring:toastRequiredFields'), 'error');
                return;
            }

            if (isEdit) {
                await this.app.dataService.updateRecurringTransaction(txToEdit.id, { ...txToEdit, ...data });
                showToast(t('recurring:toastUpdated'));
            } else {
                await this.app.dataService.addRecurringTransaction(data);
                showToast(t('recurring:toastAdded'));
            }
            this.render();
            closeModal();
        });
    }
}
