// 欠款管理模組
import { formatCurrency, formatDate, formatDateToString, showToast, customConfirm, customAlert, escapeHTML, escAttr } from './utils.js';
import { t } from './i18n.js';

export class DebtManager {
  constructor(dataService) {
    this.dataService = dataService;
    this.container = null;
    this.currentFilter = 'unsettled'; // 'unsettled' | 'settled' | 'all'
    this.currentContactFilter = null; // null means all contacts
    this.currentPage = 1;
    this.pageSize = 10;
  }

  // 渲染欠款管理頁面
  async renderDebtsPage(container) {
    this.container = container;
    
    // Reset filters on page load
    this.currentContactFilter = null;
    this.currentFilter = 'unsettled';
    this.currentPage = 1;
    
    const contacts = await this.dataService.getContacts();

    container.innerHTML = `
      <div class="page active p-4 pb-24 md:pb-8 max-w-3xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <a href="#settings" class="text-wabi-text-secondary hover:text-wabi-primary">
            <i class="fa-solid fa-chevron-left text-xl"></i>
          </a>
          <h1 class="text-xl font-bold text-wabi-primary">${t('debts:pageTitle')}</h1>
          <button id="add-debt-btn" class="bg-wabi-primary text-wabi-surface rounded-full w-8 h-8 flex items-center justify-center">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>

        <!-- Summary Cards (dynamic) -->
        <div id="summary-cards-container" class="grid grid-cols-2 gap-4 mb-4"></div>

        <!-- Contact Summary Table Button -->
        <div class="mb-4">
          <button id="show-summary-table-btn" class="w-full flex items-center justify-between p-3 bg-wabi-surface rounded-lg border border-wabi-border hover:bg-wabi-bg">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-table-list text-wabi-primary"></i>
              <span class="text-wabi-text-primary font-medium">${t('debts:summaryTable')}</span>
            </div>
            <i class="fa-solid fa-chevron-right text-wabi-text-secondary"></i>
          </button>
        </div>

        <!-- Filter Tabs -->
        <div class="flex h-10 w-full items-center justify-center rounded-lg bg-wabi-bg border border-wabi-border p-1 mb-4">
          <button data-filter="unsettled" class="debt-filter-btn flex-1 h-full rounded-md px-3 py-1 text-sm font-medium ${this.currentFilter === 'unsettled' ? 'bg-wabi-surface text-wabi-primary shadow-sm' : 'text-wabi-text-secondary hover:text-wabi-text-primary'}">${t('debts:unsettled')}</button>
          <button data-filter="settled" class="debt-filter-btn flex-1 h-full rounded-md px-3 py-1 text-sm font-medium ${this.currentFilter === 'settled' ? 'bg-wabi-surface text-wabi-primary shadow-sm' : 'text-wabi-text-secondary hover:text-wabi-text-primary'}">${t('debts:filter.settled')}</button>
          <button data-filter="all" class="debt-filter-btn flex-1 h-full rounded-md px-3 py-1 text-sm font-medium ${this.currentFilter === 'all' ? 'bg-wabi-surface text-wabi-primary shadow-sm' : 'text-wabi-text-secondary hover:text-wabi-text-primary'}">${t('common:common.all')}</button>
        </div>

        <!-- Contact Filter -->
        <div class="mb-4">
          <select id="contact-filter-select" class="w-full p-3 bg-wabi-surface rounded-lg border border-wabi-border text-wabi-text-primary">
            <option value="">${t('debts:contactFilterAll')}</option>
            ${contacts.map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('')}
          </select>
        </div>

        <!-- Contacts Link -->
        <div class="mb-4">
          <a href="#contacts" class="flex items-center justify-between p-3 bg-wabi-surface rounded-lg border border-wabi-border hover:bg-wabi-bg">
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-address-book text-wabi-primary"></i>
              <span class="text-wabi-text-primary">${t('debts:contactsLink')}</span>
            </div>
            <i class="fa-solid fa-chevron-right text-wabi-text-secondary"></i>
          </a>
        </div>

        <!-- Debt List -->
        <div id="debt-list-container" class="space-y-3"></div>
      </div>
    `;

    this.setupEventListeners();
    await this.updateSummaryCards();
    await this.loadDebtList();
  }

  // Update summary cards based on current contact filter
  async updateSummaryCards() {
    const container = this.container.querySelector('#summary-cards-container');
    const allDebts = await this.dataService.getDebts({ settled: false });
    
    let filteredDebts = allDebts;
    if (this.currentContactFilter) {
      filteredDebts = allDebts.filter(d => d.contactId === this.currentContactFilter);
    }
    
    let totalReceivable = 0;
    let totalPayable = 0;
    
    filteredDebts.forEach(debt => {
      const amount = debt.remainingAmount ?? debt.originalAmount ?? debt.amount ?? 0;
      if (debt.type === 'receivable') {
        totalReceivable += amount;
      } else {
        totalPayable += amount;
      }
    });
    
    const contacts = await this.dataService.getContacts();
    const selectedContact = this.currentContactFilter 
      ? contacts.find(c => c.id === this.currentContactFilter)?.name || t('debts:placeholderContact') 
      : null;
    
    container.innerHTML = `
      <div class="bg-wabi-income/10 rounded-xl p-4 text-center border border-wabi-income/20">
        <p class="text-sm text-wabi-income font-medium">${selectedContact ? t('debts:summary.contactOwesMe', { name: selectedContact }) : t('debts:summary.theyOweMe')}</p>
        <p class="text-2xl font-bold text-wabi-income">${formatCurrency(totalReceivable)}</p>
      </div>
      <div class="bg-wabi-expense/10 rounded-xl p-4 text-center border border-wabi-expense/20">
        <p class="text-sm text-wabi-expense font-medium">${selectedContact ? t('debts:summary.iOweContact', { name: selectedContact }) : t('debts:summary.iOweThem')}</p>
        <p class="text-2xl font-bold text-wabi-expense">${formatCurrency(totalPayable)}</p>
      </div>
    `;
  }

  // Show contact summary table as modal
  async showContactSummaryModal() {
    const allDebts = await this.dataService.getDebts({ settled: false });
    const contacts = await this.dataService.getContacts();
    
    // Build summary per contact
    const contactSummary = {};
    allDebts.forEach(debt => {
      const contactId = debt.contactId;
      if (!contactSummary[contactId]) {
        contactSummary[contactId] = { receivable: 0, payable: 0 };
      }
      const amount = debt.remainingAmount ?? debt.originalAmount ?? debt.amount ?? 0;
      if (debt.type === 'receivable') {
        contactSummary[contactId].receivable += amount;
      } else {
        contactSummary[contactId].payable += amount;
      }
    });
    
    const rows = contacts.map(contact => {
      const summary = contactSummary[contact.id] || { receivable: 0, payable: 0 };
      const net = summary.receivable - summary.payable;
      if (summary.receivable === 0 && summary.payable === 0) return '';
      
      return `
        <tr class="border-b border-wabi-border last:border-b-0 hover:bg-wabi-bg cursor-pointer" data-contact-id="${contact.id}">
          <td class="px-4 py-3 text-sm text-wabi-text-primary font-medium">${escAttr(contact.name)}</td>
          <td class="px-4 py-3 text-sm text-wabi-income text-right">${summary.receivable > 0 ? formatCurrency(summary.receivable) : '-'}</td>
          <td class="px-4 py-3 text-sm text-wabi-expense text-right">${summary.payable > 0 ? formatCurrency(summary.payable) : '-'}</td>
          <td class="px-4 py-3 text-sm font-bold text-right ${net > 0 ? 'text-wabi-income' : net < 0 ? 'text-wabi-expense' : 'text-wabi-text-secondary'}">${net > 0 ? '+' : ''}${formatCurrency(net)}</td>
        </tr>
      `;
    }).filter(Boolean).join('');
    
    const tableContent = !rows 
      ? `<p class="p-8 text-center text-wabi-text-secondary">${t('debts:table.noUnsettled')}</p>`
      : `
        <table class="w-full text-left">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-2 text-xs text-wabi-text-secondary font-medium">${t('debts:table.contact')}</th>
              <th class="px-4 py-2 text-xs text-wabi-text-secondary font-medium text-right">${t('debts:table.theyOweMe')}</th>
              <th class="px-4 py-2 text-xs text-wabi-text-secondary font-medium text-right">${t('debts:table.iOwe')}</th>
              <th class="px-4 py-2 text-xs text-wabi-text-secondary font-medium text-right">${t('debts:table.net')}</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    
    const modal = document.createElement('div');
    modal.id = 'contact-summary-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-wabi-bg rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col">
        <div class="flex items-center justify-between p-4 border-b border-wabi-border">
          <h3 class="text-lg font-semibold text-wabi-primary">
            <i class="fa-solid fa-table-list mr-2"></i>${t('debts:summaryTable')}
          </h3>
          <button id="close-summary-modal" class="text-wabi-text-secondary hover:text-wabi-primary">
            <i class="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          ${tableContent}
        </div>
        <div class="p-3 border-t border-wabi-border text-center text-xs text-wabi-text-secondary">
          ${t('debts:table.clickToFilter')}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close button
    modal.querySelector('#close-summary-modal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
    // Click on row to filter by contact
    modal.querySelectorAll('tr[data-contact-id]').forEach(row => {
      row.addEventListener('click', () => {
        const contactId = parseInt(row.dataset.contactId);
        this.currentContactFilter = contactId;
        this.currentPage = 1;
        const select = this.container.querySelector('#contact-filter-select');
        if (select) select.value = contactId;
        this.updateSummaryCards();
        this.loadDebtList();
        modal.remove();
      });
    });
  }

  setupEventListeners() {
    // Add debt button
    this.container.querySelector('#add-debt-btn').addEventListener('click', () => {
      this.showAddDebtModal();
    });

    // Show summary table modal
    this.container.querySelector('#show-summary-table-btn')?.addEventListener('click', () => {
      this.showContactSummaryModal();
    });

    // Filter buttons
    this.container.querySelectorAll('.debt-filter-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        this.currentFilter = e.target.dataset.filter;
        // Update UI
        this.container.querySelectorAll('.debt-filter-btn').forEach(b => {
          b.classList.remove('bg-wabi-surface', 'text-wabi-primary', 'shadow-sm');
          b.classList.add('text-wabi-text-secondary');
        });
        e.target.classList.add('bg-wabi-surface', 'text-wabi-primary', 'shadow-sm');
        e.target.classList.remove('text-wabi-text-secondary');
        this.currentPage = 1; // Reset to first page when filter changes
        await this.loadDebtList();
      });
    });

    // Contact filter select
    this.container.querySelector('#contact-filter-select')?.addEventListener('change', async (e) => {
      this.currentContactFilter = e.target.value ? parseInt(e.target.value) : null;
      this.currentPage = 1; // Reset to first page when filter changes
      await this.updateSummaryCards();
      await this.loadDebtList();
    });
  }

  async loadDebtList() {
    const listContainer = this.container.querySelector('#debt-list-container');
    const filters = {};
    
    if (this.currentFilter === 'unsettled') {
      filters.settled = false;
    } else if (this.currentFilter === 'settled') {
      filters.settled = true;
    }

    let allDebts = await this.dataService.getDebts(filters);
    const contacts = await this.dataService.getContacts();

    // Apply contact filter
    if (this.currentContactFilter) {
      allDebts = allDebts.filter(d => d.contactId === this.currentContactFilter);
    }

    // Pagination
    const totalDebts = allDebts.length;
    const totalPages = Math.ceil(totalDebts / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const debts = allDebts.slice(startIndex, startIndex + this.pageSize);

    if (allDebts.length === 0) {
      const filterLabel = this.currentFilter === 'unsettled' ? t('debts:unsettled') : this.currentFilter === 'settled' ? t('debts:filter.settled') : '';
      listContainer.innerHTML = `
        <div class="text-center py-8 text-wabi-text-secondary">
          <i class="fa-solid fa-receipt text-4xl mb-3"></i>
          <p>${filterLabel ? t('debts:empty.listFiltered', { filter: filterLabel }) : t('debts:empty.listAll')}</p>
        </div>
      `;
      return;
    }

    let html = debts.map(debt => {
      const contact = contacts.find(c => c.id === debt.contactId);
      const contactName = contact?.name || t('debts:unknownContact');
      const isReceivable = debt.type === 'receivable';
      // Use remainingAmount for display, fallback for backward compatibility
      const remainingAmount = debt.remainingAmount ?? debt.originalAmount ?? debt.amount ?? 0;
      const originalAmount = debt.originalAmount ?? debt.amount ?? remainingAmount;
      const paidAmount = originalAmount - remainingAmount;
      const progressPercent = originalAmount > 0 ? ((paidAmount / originalAmount) * 100).toFixed(0) : 0;
      const hasPartialPayments = paidAmount > 0 && remainingAmount > 0;
      const hasPaymentHistory = debt.payments && debt.payments.length > 0;
      
      return `
        <div class="bg-wabi-surface rounded-lg border border-wabi-border p-4 ${debt.settled ? 'opacity-60' : ''}" data-debt-id="${debt.id}">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center rounded-full ${isReceivable ? 'bg-wabi-income/20 text-wabi-income' : 'bg-wabi-expense/20 text-wabi-expense'} size-10">
                <i class="fa-solid fa-user"></i>
              </div>
              <div>
                <p class="font-medium text-wabi-text-primary">${escAttr(contactName)}</p>
                <p class="text-sm text-wabi-text-secondary">${isReceivable ? t('debts:badge.theyOweMe') : t('debts:badge.iOwe')}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-bold ${isReceivable ? 'text-wabi-income' : 'text-wabi-expense'}">${isReceivable ? '+' : '-'}${formatCurrency(remainingAmount, debt.currency)}</p>
              ${hasPartialPayments ? `<p class="text-xs text-wabi-text-secondary line-through">${formatCurrency(originalAmount, debt.currency)}</p>` : ''}
              <p class="text-xs text-wabi-text-secondary">${formatDate(debt.date, 'short')}</p>
            </div>
          </div>
          ${debt.description ? `<p class="text-sm text-wabi-text-secondary mt-2 pl-13">${escAttr(debt.description)}</p>` : ''}
          ${hasPartialPayments ? `
            <div class="mt-2">
              <div class="flex justify-between text-xs text-wabi-text-secondary mb-1">
                <span>${isReceivable ? t('debts:progress.received') : t('debts:progress.repaid')} ${formatCurrency(paidAmount, debt.currency)}</span>
                <span>${progressPercent}%</span>
              </div>
              <div class="w-full bg-wabi-bg rounded-full h-1.5">
                <div class="${isReceivable ? 'bg-wabi-income' : 'bg-wabi-expense'} h-1.5 rounded-full" style="width: ${progressPercent}%"></div>
              </div>
            </div>
          ` : ''}
          ${hasPaymentHistory ? `
            <button class="view-history-btn w-full mt-2 py-1 text-xs text-wabi-primary border border-wabi-primary/30 rounded bg-wabi-primary/5" data-id="${debt.id}">
              <i class="fa-solid fa-clock-rotate-left mr-1"></i>${t('debts:history.view', { count: debt.payments.length })}
            </button>
          ` : ''}
          ${!debt.settled ? `
            <div class="flex gap-2 mt-3 pt-3 border-t border-wabi-border">
              <button class="settle-debt-btn flex-1 py-2 text-sm font-medium text-wabi-surface bg-wabi-primary rounded-lg" data-id="${debt.id}">
                ${isReceivable ? t('debts:button.settleFullReceivable') : t('debts:button.settleFullPayable')}
              </button>
              <button class="partial-payment-btn px-4 py-2 text-sm font-medium text-wabi-primary border border-wabi-primary rounded-lg" data-id="${debt.id}">
                ${t('debts:button.partial')}
              </button>
              <button class="edit-debt-btn px-4 py-2 text-sm font-medium text-wabi-primary border border-wabi-primary rounded-lg" data-id="${debt.id}">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="remind-debt-btn px-4 py-2 text-sm font-medium text-wabi-primary border border-wabi-primary rounded-lg" data-id="${debt.id}">
                <i class="fa-solid fa-paper-plane"></i>
              </button>
              <button class="delete-debt-btn px-4 py-2 text-sm font-medium text-wabi-expense border border-wabi-expense rounded-lg" data-id="${debt.id}">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          ` : `
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-wabi-border">
              <div class="flex items-center gap-2 text-sm text-wabi-text-secondary">
                <i class="fa-solid fa-check-circle text-wabi-income"></i>
                <span>${t('debts:label.settledOn', { date: formatDate(new Date(debt.settledAt).toISOString().split('T')[0], 'short') })}</span>
              </div>
              <div class="flex gap-2">
                <button class="edit-debt-btn px-3 py-1 text-xs font-medium text-wabi-primary border border-wabi-primary rounded-lg" data-id="${debt.id}">
                  ${t('common:buttons.edit')}
                </button>
                <button class="delete-debt-btn px-3 py-1 text-xs font-medium text-wabi-expense border border-wabi-expense rounded-lg" data-id="${debt.id}">
                  ${t('common:buttons.delete')}
                </button>
              </div>
            </div>
          `}
        </div>
      `;
    }).join('');

    // Add pagination controls
    if (totalPages > 1) {
      html += `
        <div class="flex items-center justify-center gap-4 mt-4 py-3">
          <button id="prev-page-btn" class="px-4 py-2 text-sm font-medium rounded-lg ${this.currentPage === 1 ? 'bg-wabi-bg text-wabi-text-secondary cursor-not-allowed' : 'bg-wabi-primary text-wabi-surface'}" ${this.currentPage === 1 ? 'disabled' : ''}>
            <i class="fa-solid fa-chevron-left mr-1"></i>${t('debts:pagination.prev')}
          </button>
          <span class="text-sm text-wabi-text-secondary">${this.currentPage} / ${totalPages}</span>
          <button id="next-page-btn" class="px-4 py-2 text-sm font-medium rounded-lg ${this.currentPage === totalPages ? 'bg-wabi-bg text-wabi-text-secondary cursor-not-allowed' : 'bg-wabi-primary text-wabi-surface'}" ${this.currentPage === totalPages ? 'disabled' : ''}>
            ${t('debts:pagination.next')}<i class="fa-solid fa-chevron-right ml-1"></i>
          </button>
        </div>
      `;
    }

    listContainer.innerHTML = html;

    // Bind settle buttons
    listContainer.querySelectorAll('.settle-debt-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const debtId = parseInt(btn.dataset.id);
        if (await customConfirm(t('debts:confirm.settleFull'))) {
          await this.dataService.settleDebt(debtId);
          showToast(t('debts:toast.settled'), 'success');
          // Maintain current filter state instead of full re-render
          await this.updateSummaryCards();
          await this.loadDebtList();
        }
      });
    });

    // Bind partial payment buttons
    listContainer.querySelectorAll('.partial-payment-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const debtId = parseInt(btn.dataset.id);
        await this.showPartialPaymentModal(debtId);
      });
    });

    // Bind remind buttons
    listContainer.querySelectorAll('.remind-debt-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const debtId = parseInt(btn.dataset.id);
        await this.showReminderModal(debtId);
      });
    });

    // Bind delete buttons
    listContainer.querySelectorAll('.delete-debt-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const debtId = parseInt(btn.dataset.id);
        const debt = await this.dataService.getDebt(debtId);
        
        if (await customConfirm(t('debts:confirm.deleteDebt'))) {
          const recordId = debt?.recordId;
          await this.dataService.deleteDebt(debtId);
          
          if (recordId) {
              if (await customConfirm(t('debts:confirm.deleteRelatedRecord'))) {
                  await this.dataService.deleteRecord(recordId);
                  showToast(t('debts:toast.deletedWithRecord'), 'success');
              } else {
                  await this.dataService.updateRecord(recordId, { debtId: null });
                  showToast(t('debts:toast.deleted'), 'success');
              }
          } else {
              showToast(t('debts:toast.deleted'), 'success');
          }
          
          await this.updateSummaryCards();
          await this.loadDebtList();
        }
      });
    });

    // Bind view history buttons
    listContainer.querySelectorAll('.view-history-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const debtId = parseInt(btn.dataset.id);
        await this.showPaymentHistoryModal(debtId);
      });
    });

    // Bind edit buttons
    listContainer.querySelectorAll('.edit-debt-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const debtId = parseInt(btn.dataset.id);
        const debt = await this.dataService.getDebt(debtId);
        await this.showAddDebtModal(debt);
      });
    });

    // Bind pagination buttons
    const prevBtn = listContainer.querySelector('#prev-page-btn');
    const nextBtn = listContainer.querySelector('#next-page-btn');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', async () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          await this.loadDebtList();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', async () => {
        if (this.currentPage < totalPages) {
          this.currentPage++;
          await this.loadDebtList();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  async showPartialPaymentModal(debtId) {
    const debt = await this.dataService.getDebt(debtId);
    const contact = await this.dataService.getContact(debt.contactId);
    const contactName = contact?.name || t('debts:unknownContact');
    const remainingAmount = debt.remainingAmount ?? debt.originalAmount ?? debt.amount ?? 0;
    const isReceivable = debt.type === 'receivable';

    const modal = document.createElement('div');
    modal.id = 'partial-payment-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';

    modal.innerHTML = `
      <div class="bg-wabi-bg rounded-lg max-w-sm w-full p-6">
        <h3 class="text-lg font-semibold mb-4 text-wabi-primary">${isReceivable ? t('debts:partialPayment.titleReceivable') : t('debts:partialPayment.titlePayable')}</h3>
        <p class="text-sm text-wabi-text-secondary mb-4">${escAttr(contactName)} - ${escAttr(debt.description || t('debts:label.noNote'))}</p>
        <p class="text-sm text-wabi-text-secondary mb-2">${t('debts:label.remaining')}<span class="font-bold ${isReceivable ? 'text-wabi-income' : 'text-wabi-expense'}">${formatCurrency(remainingAmount, debt.currency)}</span></p>
        
        <div class="mb-6">
          <label class="text-sm font-medium text-wabi-text-primary mb-2 block">${isReceivable ? t('debts:partialPayment.amountLabelReceivable') : t('debts:partialPayment.amountLabelPayable')}</label>
          <input type="number" id="partial-amount" value="" min="1" max="${remainingAmount}" step="1" placeholder="${t('debts:partialPayment.enterAmount')}"
                 class="w-full p-3 bg-wabi-surface border border-wabi-border rounded-lg text-wabi-text-primary">
        </div>

        <div class="flex space-x-3">
          <button id="confirm-partial-btn" class="flex-1 bg-wabi-primary hover:bg-wabi-primary/90 text-wabi-surface font-bold py-3 rounded-lg transition-colors">
            ${t('common:buttons.confirm')}
          </button>
          <button id="cancel-partial-btn" class="px-6 bg-wabi-border hover:bg-wabi-border text-wabi-text-primary py-3 rounded-lg transition-colors">
            ${t('common:buttons.cancel')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();

    modal.querySelector('#cancel-partial-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Focus input
    setTimeout(() => {
      modal.querySelector('#partial-amount').focus();
    }, 100);

    modal.querySelector('#confirm-partial-btn').addEventListener('click', async () => {
      const amount = parseFloat(modal.querySelector('#partial-amount').value);

      if (!amount || amount <= 0) {
        customAlert(t('debts:partialPayment.invalidAmount'));
        return;
      }

      if (amount > remainingAmount) {
        customAlert(t('debts:partialPayment.exceedsRemaining', { amount: formatCurrency(remainingAmount, debt.currency) }));
        return;
      }

      await this.dataService.addPartialPayment(debtId, amount);
      closeModal();
      // Maintain current filter state instead of full re-render
      await this.updateSummaryCards();
      await this.loadDebtList();
    });
  }

  async showPaymentHistoryModal(debtId) {
    const debt = await this.dataService.getDebt(debtId);
    const contact = await this.dataService.getContact(debt.contactId);
    const contactName = contact?.name || t('debts:unknownContact');
    const isReceivable = debt.type === 'receivable';
    const payments = debt.payments || [];

    const modal = document.createElement('div');
    modal.id = 'payment-history-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';

    modal.innerHTML = `
      <div class="bg-wabi-bg rounded-lg max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
        <h3 class="text-lg font-semibold mb-2 text-wabi-primary">${isReceivable ? t('debts:history.titleReceivable') : t('debts:history.titlePayable')}</h3>
        <p class="text-sm text-wabi-text-secondary mb-4">${contactName} - ${debt.description || t('debts:label.noNote')}</p>
        
        <div class="space-y-3 mb-4">
          ${payments.length === 0 ? `
            <p class="text-center py-4 text-wabi-text-secondary">${t('debts:history.noPayments')}</p>
          ` : payments.map((payment, index) => `
            <div class="flex items-center justify-between p-3 bg-wabi-surface rounded-lg border border-wabi-border">
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center rounded-full ${isReceivable ? 'bg-wabi-income/20 text-wabi-income' : 'bg-wabi-expense/20 text-wabi-expense'} size-8 text-sm">
                  ${index + 1}
                </div>
                <div>
                  <p class="font-medium ${isReceivable ? 'text-wabi-income' : 'text-wabi-expense'}">
                    ${isReceivable ? '+' : '-'}${formatCurrency(payment.amount, debt.currency)}
                  </p>
                  <p class="text-xs text-wabi-text-secondary">${formatDate(payment.date, 'short')}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="border-t border-wabi-border pt-3">
          <div class="flex justify-between text-sm mb-2">
            <span class="text-wabi-text-secondary">${t('debts:history.originalAmount')}</span>
            <span class="font-medium">${formatCurrency(debt.originalAmount || debt.amount, debt.currency)}</span>
          </div>
          <div class="flex justify-between text-sm mb-2">
            <span class="text-wabi-text-secondary">${isReceivable ? t('debts:history.totalReceived') : t('debts:history.totalRepaid')}</span>
            <span class="font-medium ${isReceivable ? 'text-wabi-income' : 'text-wabi-expense'}">
              ${formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0), debt.currency)}
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-wabi-text-secondary">${t('debts:history.remaining')}</span>
            <span class="font-bold">${formatCurrency(debt.remainingAmount || 0, debt.currency)}</span>
          </div>
        </div>

        <button id="close-history-btn" class="w-full mt-4 py-3 bg-wabi-border hover:bg-wabi-border text-wabi-text-primary rounded-lg transition-colors">
          ${t('common:buttons.close')}
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();

    modal.querySelector('#close-history-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  async showAddDebtModal(debtToEdit = null) {
    const isEdit = !!debtToEdit;
    const contacts = await this.dataService.getContacts();

    if (contacts.length === 0) {
      customAlert(t('debts:addDebt.noContacts'));
      window.location.hash = '#contacts';
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'add-debt-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';

    const contactOptions = contacts.map(c => 
      `<option value="${c.id}" ${debtToEdit?.contactId === c.id ? 'selected' : ''}>${escapeHTML(c.name)}</option>`
    ).join('');

    modal.innerHTML = `
      <div class="bg-wabi-bg rounded-lg max-w-md w-full p-6">
        <h3 class="text-lg font-semibold mb-4 text-wabi-primary">${isEdit ? t('debts:addDebt.titleEdit') : t('debts:addDebt.titleAdd')}</h3>
        
        <!-- Type Selector -->
        <div class="mb-4">
          <label class="text-sm font-medium text-wabi-text-primary mb-2 block">${t('common:common.type')}</label>
          <div class="flex h-10 w-full items-center justify-center rounded-lg bg-wabi-bg/50 p-1">
            <button id="debt-type-receivable" class="debt-type-btn flex-1 h-full rounded-md px-3 py-1 text-sm font-medium ${(!isEdit || debtToEdit?.type === 'receivable') ? 'bg-wabi-income text-wabi-surface' : 'text-wabi-text-secondary'}">${t('debts:addDebt.typeReceivable')}</button>
            <button id="debt-type-payable" class="debt-type-btn flex-1 h-full rounded-md px-3 py-1 text-sm font-medium ${(isEdit && debtToEdit?.type === 'payable') ? 'bg-wabi-expense text-wabi-surface' : 'text-wabi-text-secondary'}">${t('debts:addDebt.typePayable')}</button>
          </div>
        </div>

        <!-- Contact -->
        <div class="mb-4">
          <label class="text-sm font-medium text-wabi-text-primary mb-2 block">${t('common:common.contact')}</label>
          <select id="debt-contact" class="w-full p-3 bg-wabi-surface border border-wabi-border rounded-lg text-wabi-text-primary">
            ${contactOptions}
          </select>
        </div>

        <!-- Amount -->
        <div class="mb-4">
          <label class="text-sm font-medium text-wabi-text-primary mb-2 block">${t('common:common.amount')}</label>
          <input type="number" id="debt-amount" value="${debtToEdit?.originalAmount ?? debtToEdit?.amount ?? ''}" min="0" step="1" placeholder="${t('debts:partialPayment.enterAmount')}"
                 class="w-full p-3 bg-wabi-surface border border-wabi-border rounded-lg text-wabi-text-primary">
        </div>

        <!-- Date -->
        <div class="mb-4">
          <label class="text-sm font-medium text-wabi-text-primary mb-2 block">${t('common:common.date')}</label>
          <input type="date" id="debt-date" value="${debtToEdit?.date || formatDateToString(new Date())}"
                 class="w-full p-3 bg-wabi-surface border border-wabi-border rounded-lg text-wabi-text-primary">
        </div>

        <!-- Description -->
        <div class="mb-6">
          <label class="text-sm font-medium text-wabi-text-primary mb-2 block">${t('common:common.note')}</label>
             <input type="text" id="debt-description" value="${escAttr(debtToEdit?.description || '')}" placeholder="${t('debts:addDebt.descriptionPlaceholder')}"
                 class="w-full p-3 bg-wabi-surface border border-wabi-border rounded-lg text-wabi-text-primary">
        </div>

        <!-- Buttons -->
        <div class="flex space-x-3">
          <button id="save-debt-btn" class="flex-1 bg-wabi-primary hover:bg-wabi-primary/90 text-wabi-surface font-bold py-3 rounded-lg transition-colors">
            ${isEdit ? t('common:buttons.save') : t('common:buttons.add')}
          </button>
          <button id="cancel-debt-btn" class="px-6 bg-wabi-border hover:bg-wabi-border text-wabi-text-primary py-3 rounded-lg transition-colors">
            ${t('common:buttons.cancel')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    let selectedType = debtToEdit?.type || 'receivable';

    // Type toggle
    modal.querySelectorAll('.debt-type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        selectedType = btn.id === 'debt-type-receivable' ? 'receivable' : 'payable';
        modal.querySelectorAll('.debt-type-btn').forEach(b => {
          b.classList.remove('bg-wabi-income', 'bg-wabi-expense', 'text-wabi-surface');
          b.classList.add('text-wabi-text-secondary');
        });
        if (selectedType === 'receivable') {
          btn.classList.add('bg-wabi-income', 'text-wabi-surface');
        } else {
          btn.classList.add('bg-wabi-expense', 'text-wabi-surface');
        }
        btn.classList.remove('text-wabi-text-secondary');
      });
    });

    const closeModal = () => modal.remove();

    modal.querySelector('#cancel-debt-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    modal.querySelector('#save-debt-btn').addEventListener('click', async () => {
      const contactId = parseInt(modal.querySelector('#debt-contact').value);
      const amount = parseFloat(modal.querySelector('#debt-amount').value);
      const date = modal.querySelector('#debt-date').value;
      const description = modal.querySelector('#debt-description').value;

      if (!contactId || !amount || amount <= 0 || !date) {
        customAlert(t('debts:addDebt.requiredFields'));
        return;
      }

      const debtData = {
        type: selectedType,
        contactId,
        amount,
        date,
        description
      };

      if (isEdit) {
        // 編輯模式下，同步更新 originalAmount 並根據已還金額重新計算 remainingAmount
        debtData.originalAmount = amount;
        const paidAmount = (debtToEdit.payments || []).reduce((sum, p) => sum + p.amount, 0);
        const newRemaining = Math.max(0, amount - paidAmount);
        debtData.remainingAmount = newRemaining;
        
        // 如果金額調整後導致餘額為 0，改為已結清；若餘額 > 0 且原本已結清則恢復為未結清
        if (newRemaining === 0 && !debtToEdit.settled) {
          debtData.settled = true;
          debtData.settledAt = Date.now();
        } else if (newRemaining > 0 && debtToEdit.settled) {
          debtData.settled = false;
          debtData.settledAt = null;
        }

        await this.dataService.updateDebt(debtToEdit.id, debtData);
        showToast(t('debts:toast.updated'), 'success');
      } else {
        await this.dataService.addDebt(debtData);
        showToast(t('debts:toast.added'), 'success');
      }

      closeModal();
      // Maintain current filter state instead of full re-render
      await this.updateSummaryCards();
      await this.loadDebtList();
    });
  }

  async showReminderModal(debtId) {
    const debt = await this.dataService.getDebt(debtId);
    const contact = await this.dataService.getContact(debt.contactId);
    const contactName = contact?.name || t('debts:defaultContactName');

    const isReceivable = debt.type === 'receivable';
    // Use remainingAmount for reminder message
    const remainingAmount = debt.remainingAmount ?? debt.originalAmount ?? debt.amount ?? 0;
    const descText = debt.description ? `「${debt.description}」` : '';

    if (isReceivable) {
      message = t('debts:reminder.messageReceivable', { name: contactName, date: debt.date, description: descText, amount: formatCurrency(remainingAmount, debt.currency) });
    } else {
      message = t('debts:reminder.messagePayable', { name: contactName, date: debt.date, description: descText, amount: formatCurrency(remainingAmount, debt.currency) });
    }

    const modal = document.createElement('div');
    modal.id = 'reminder-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';

    modal.innerHTML = `
      <div class="bg-wabi-bg rounded-lg max-w-md w-full p-6">
        <h3 class="text-lg font-semibold mb-4 text-wabi-primary">${t('debts:reminder.title')}</h3>
        <textarea id="reminder-text" class="w-full h-32 p-3 bg-wabi-surface border border-wabi-border rounded-lg text-wabi-text-primary resize-none mb-4">${escAttr(message)}</textarea>
        <div class="flex space-x-3">
          <button id="copy-reminder-btn" class="flex-1 bg-wabi-primary hover:bg-wabi-primary/90 text-wabi-surface font-bold py-3 rounded-lg transition-colors">
            <i class="fa-solid fa-copy mr-2"></i>${t('debts:button.copy')}
          </button>
          <button id="share-reminder-btn" class="flex-1 bg-wabi-income hover:bg-wabi-income/90 text-wabi-surface font-bold py-3 rounded-lg transition-colors">
            <i class="fa-solid fa-share-nodes mr-2"></i>${t('common:buttons.share')}
          </button>
          <button id="close-reminder-btn" class="px-4 bg-wabi-border hover:bg-wabi-border text-wabi-text-primary py-3 rounded-lg transition-colors">
            ${t('common:buttons.close')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();

    modal.querySelector('#close-reminder-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    modal.querySelector('#copy-reminder-btn').addEventListener('click', async () => {
      const text = modal.querySelector('#reminder-text').value;
      try {
        await navigator.clipboard.writeText(text);
        customAlert(t('debts:reminder.copied'));
        closeModal();
      } catch (err) {
        modal.querySelector('#reminder-text').select();
        document.execCommand('copy');
        customAlert(t('debts:reminder.copiedFallback'));
        closeModal();
      }
    });

    modal.querySelector('#share-reminder-btn')?.addEventListener('click', async () => {
      const text = modal.querySelector('#reminder-text').value;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: t('debts:reminder.shareTitle'),
            text: text
          });
          closeModal();
        } catch (err) {
          if (err.name !== 'AbortError') {
            customAlert(t('debts:reminder.shareFailed'));
          }
        }
      } else {
        try {
          await navigator.clipboard.writeText(text);
          customAlert(t('debts:reminder.shareNotSupported'));
        } catch (err) {
          customAlert(t('debts:reminder.shareFallbackFailed'));
        }
      }
    });
  }

  // 渲染聯絡人管理頁面
  async renderContactsPage(container) {
    this.container = container;
    const contacts = await this.dataService.getContacts();

    container.innerHTML = `
      <div class="page active p-4 pb-24 md:pb-8 max-w-3xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <a href="#debts" class="text-wabi-text-secondary hover:text-wabi-primary">
            <i class="fa-solid fa-chevron-left text-xl"></i>
          </a>
          <h1 class="text-xl font-bold text-wabi-primary">${t('debts:contacts.pageTitle')}</h1>
          <button id="add-contact-btn" class="bg-wabi-primary text-wabi-surface rounded-full w-8 h-8 flex items-center justify-center">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>

        <!-- Contact List -->
        <div id="contact-list-container" class="space-y-2">
          ${contacts.length === 0 ? `
            <div class="text-center py-8 text-wabi-text-secondary">
              <i class="fa-solid fa-user-plus text-4xl mb-3"></i>
              <p>${t('debts:contacts.empty')}</p>
            </div>
          ` : contacts.map(contact => `
            <div class="flex items-center justify-between bg-wabi-surface p-4 rounded-lg border border-wabi-border" data-contact-id="${contact.id}">
              <div class="flex items-center gap-3">
                <div class="contact-avatar flex items-center justify-center rounded-full bg-wabi-primary/20 text-wabi-primary size-10 overflow-hidden" data-avatar-id="${contact.avatarFileId || ''}">
                  <i class="fa-solid fa-user"></i>
                </div>
                <span class="font-medium text-wabi-text-primary">${escAttr(contact.name)}</span>
              </div>
              <div class="flex gap-2">
                <button class="edit-contact-btn p-2" data-id="${contact.id}">
                  <i class="fa-solid fa-pen text-wabi-text-secondary"></i>
                </button>
                <button class="delete-contact-btn p-2" data-id="${contact.id}">
                  <i class="fa-solid fa-trash-can text-wabi-expense"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Async load avatars
    this.loadContactAvatars();

    // Add contact button
    container.querySelector('#add-contact-btn').addEventListener('click', () => {
      this.showContactModal();
    });

    // Edit buttons
    container.querySelectorAll('.edit-contact-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const contactId = parseInt(btn.dataset.id);
        const contact = await this.dataService.getContact(contactId);
        this.showContactModal(contact);
      });
    });

    // Delete buttons
    container.querySelectorAll('.delete-contact-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const contactId = parseInt(btn.dataset.id);
        // Check if contact has debts
        const debts = await this.dataService.getDebts({ contactId });
        if (debts.length > 0) {
          customAlert(t('debts:contacts.hasDebts'));
          return;
        }
        if (await customConfirm(t('debts:confirm.deleteContact'))) {
          await this.dataService.deleteContact(contactId);
          await this.renderContactsPage(container);
        }
      });
    });
  }

  async showContactModal(contactToEdit = null) {
    const isEdit = !!contactToEdit;
    const avatarFileId = contactToEdit?.avatarFileId || null;
    let avatarPreviewUrl = null;

    // Load existing avatar if editing
    if (avatarFileId) {
      const file = await this.dataService.getFile(avatarFileId);
      if (file && file.data) {
        avatarPreviewUrl = URL.createObjectURL(file.data);
      }
    }

    const modal = document.createElement('div');
    modal.id = 'contact-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';

    modal.innerHTML = `
      <div class="bg-wabi-bg rounded-lg max-w-sm w-full p-6">
        <h3 class="text-lg font-semibold mb-4 text-wabi-primary">${isEdit ? t('debts:contacts.modalTitleEdit') : t('debts:contacts.modalTitleAdd')}</h3>
        
        <!-- Avatar Upload -->
        <div class="flex justify-center mb-4">
          <label class="cursor-pointer">
            <div id="avatar-preview" class="relative size-20 rounded-full bg-wabi-primary/20 flex items-center justify-center overflow-hidden border-2 border-dashed border-wabi-primary/50 hover:border-wabi-primary">
              ${avatarPreviewUrl 
                ? `<img src="${avatarPreviewUrl}" class="w-full h-full object-cover">`
                : `<i class="fa-solid fa-camera text-2xl text-wabi-primary/50"></i>`}
              <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <i class="fa-solid fa-pen text-wabi-surface"></i>
              </div>
            </div>
            <input type="file" id="avatar-input" accept="image/*" class="hidden">
          </label>
        </div>
        <p class="text-xs text-center text-wabi-text-secondary mb-4">${t('debts:contacts.uploadHint')}</p>
        
        <div class="mb-6">
          <label class="text-sm font-medium text-wabi-text-primary mb-2 block">${t('common:common.name')}</label>
             <input type="text" id="contact-name" value="${escAttr(contactToEdit?.name || '')}" placeholder="${t('debts:contacts.namePlaceholder')}"
                 class="w-full p-3 bg-wabi-surface border border-wabi-border rounded-lg text-wabi-text-primary">
        </div>

        <div class="flex space-x-3">
          <button id="save-contact-btn" class="flex-1 bg-wabi-primary hover:bg-wabi-primary/90 text-wabi-surface font-bold py-3 rounded-lg transition-colors">
            ${isEdit ? t('common:buttons.save') : t('common:buttons.add')}
          </button>
          <button id="cancel-contact-btn" class="px-6 bg-wabi-border hover:bg-wabi-border text-wabi-text-primary py-3 rounded-lg transition-colors">
            ${t('common:buttons.cancel')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    let newAvatarBlob = null;

    // Handle avatar file input
    const avatarInput = modal.querySelector('#avatar-input');
    const avatarPreview = modal.querySelector('#avatar-preview');
    
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        newAvatarBlob = file;
        const url = URL.createObjectURL(file);
        avatarPreview.innerHTML = `
          <img src="${url}" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <i class="fa-solid fa-pen text-wabi-surface"></i>
          </div>
        `;
      }
    });

    const closeModal = () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
      modal.remove();
    };

    modal.querySelector('#cancel-contact-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Focus input
    setTimeout(() => {
      modal.querySelector('#contact-name').focus();
    }, 100);

    modal.querySelector('#save-contact-btn').addEventListener('click', async () => {
      const name = modal.querySelector('#contact-name').value.trim();

      if (!name) {
        customAlert(t('debts:contacts.nameRequired'));
        return;
      }

      let newAvatarFileId = avatarFileId;

      // Upload new avatar if selected
      if (newAvatarBlob) {
        newAvatarFileId = await this.dataService.addFile({
          name: newAvatarBlob.name,
          type: newAvatarBlob.type,
          data: newAvatarBlob
        });

        // Delete old avatar if exists
        if (avatarFileId && avatarFileId !== newAvatarFileId) {
          await this.dataService.deleteFile(avatarFileId);
        }
      }

      if (isEdit) {
        await this.dataService.updateContact(contactToEdit.id, { 
          name, 
          avatarFileId: newAvatarFileId 
        });
      } else {
        await this.dataService.addContact({ 
          name, 
          avatarFileId: newAvatarFileId 
        });
      }

      closeModal();
      await this.renderContactsPage(this.container);
    });
  }

  // Helper to get avatar URL for a contact
  async getContactAvatarUrl(contact) {
    if (contact.avatarFileId) {
      const file = await this.dataService.getFile(contact.avatarFileId);
      if (file && file.data) {
        return URL.createObjectURL(file.data);
      }
    }
    return null;
  }

  // Async load avatars for contact list
  async loadContactAvatars() {
    const avatarElements = this.container.querySelectorAll('.contact-avatar[data-avatar-id]');
    for (const el of avatarElements) {
      const avatarId = el.dataset.avatarId;
      if (avatarId) {
        const file = await this.dataService.getFile(parseInt(avatarId));
        if (file && file.data) {
          const url = URL.createObjectURL(file.data);
          el.innerHTML = `<img src="${url}" class="w-full h-full object-cover" style="dynamic-range-limit: standard;">`;
        }
      }
    }
  }
}
