// ==================== 帳本管理頁面 ====================
import { showToast, escapeHTML, escAttr, customConfirm, CURRENCIES, getCurrencySymbol } from '../utils.js';
import { FONT_AWESOME_ICONS } from '../fontAwesomeIcons.js';
import { t } from '../i18n.js';

export class LedgersPage {
    constructor(app) {
        this.app = app;
    }

    async render() {
        const ledgers = this.app.ledgerManager.getAllLedgers();
        const activeLedgerId = this.app.dataService.activeLedgerId;

        this.app.appContainer.innerHTML = `
            <div class="page active max-w-3xl mx-auto">
                <div class="flex items-center p-4 pb-2 justify-between bg-wabi-bg sticky top-0 z-10">
                    <a href="#settings" class="text-wabi-text-secondary hover:text-wabi-primary">
                        <i class="fa-solid fa-chevron-left text-xl"></i>
                    </a>
                    <h2 class="text-wabi-primary text-lg font-bold flex-1 text-center">${t('ledger:pageTitle')}</h2>
                    <button id="add-ledger-btn" class="text-wabi-primary hover:text-wabi-accent">
                        <i class="fa-solid fa-plus text-xl"></i>
                    </button>
                </div>
                <div class="p-4 space-y-3 pb-24">
                    <p class="text-xs text-wabi-text-secondary mb-2">
                        <i class="fa-solid fa-circle-info mr-1"></i>
                        ${t('ledger:description')}
                    </p>
                    <button id="join-ledger-btn" class="w-full py-3 bg-wabi-primary/10 text-wabi-primary font-medium rounded-xl border border-wabi-primary/30 hover:bg-wabi-primary/20 transition-colors mb-4">
                        <i class="fa-solid fa-cloud-arrow-down mr-2"></i>${t('ledger:joinSharedLedger')}
                    </button>
                    ${ledgers.map(ledger => this._renderLedgerCard(ledger, ledger.id === activeLedgerId)).join('')}
                </div>
            </div>
        `;
        this._setupListeners();
    }

    _renderLedgerCard(ledger, isActive) {
        const isDefault = ledger.id === 1;
        return `
            <div class="bg-wabi-surface rounded-xl p-4 border-2 transition-colors ${isActive ? 'border-wabi-primary shadow-md' : 'border-wabi-border'}" data-ledger-id="${ledger.id}">
                <div class="flex items-center gap-4">
                    <div class="flex items-center justify-center rounded-xl text-white shrink-0 size-12" style="background-color: ${ledger.color || '#334A52'}">
                        <i class="${ledger.icon || 'fa-solid fa-book'} text-2xl"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <p class="font-bold text-wabi-text-primary truncate">${escapeHTML(ledger.name)}</p>
                            ${isActive ? `<span class="text-xs px-2 py-0.5 bg-wabi-primary/10 text-wabi-primary rounded-full font-medium shrink-0">${t('ledger:inUse')}</span>` : ''}
                            ${isDefault ? `<span class="text-xs px-2 py-0.5 bg-wabi-bg text-wabi-text-secondary rounded-full shrink-0">${t('ledger:default')}</span>` : ''}
                        </div>
                        <p class="text-xs text-wabi-text-secondary mt-0.5">
                            ${ledger.isShared ? `<i class="fa-solid fa-users mr-1"></i>${t('ledger:sharedLedger')}` : `<i class="fa-solid fa-user mr-1"></i>${t('ledger:personalLedger')}`}
                        </p>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        ${!isActive ? `<button class="switch-ledger-btn p-2 text-wabi-primary hover:bg-wabi-primary/10 rounded-lg transition-colors" data-id="${ledger.id}" title="${t('ledger:switchToThis')}"><i class="fa-solid fa-arrow-right-to-bracket"></i></button>` : ''}
                        ${!isDefault ? `<button class="share-ledger-btn p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 rounded-lg transition-colors" data-id="${ledger.id}" title="${t('ledger:shareThis')}"><i class="fa-solid fa-share-nodes"></i></button>` : ''}
                        <button class="edit-ledger-btn p-2 text-wabi-text-secondary hover:text-wabi-primary hover:bg-wabi-primary/10 rounded-lg transition-colors" data-id="${ledger.id}" title="${t('common:buttons.edit')}"><i class="fa-solid fa-pen"></i></button>
                        ${!isDefault ? `<button class="delete-ledger-btn p-2 text-wabi-text-secondary hover:text-wabi-expense hover:bg-wabi-expense/10 rounded-lg transition-colors" data-id="${ledger.id}" title="${t('common:buttons.delete')}"><i class="fa-solid fa-trash"></i></button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    _setupListeners() {
        // 新增帳本
        document.getElementById('add-ledger-btn')?.addEventListener('click', () => this._showEditModal(null));

        // 加入共用帳本
        document.getElementById('join-ledger-btn')?.addEventListener('click', () => {
            if (!this.app.syncService || !this.app.syncService.isSignedIn()) {
                showToast(t('ledger:requireLogin'), 'error');
                return;
            }
            this._showJoinModal();
        });

        // 切換帳本
        document.querySelectorAll('.switch-ledger-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                await this.app.ledgerManager.switchLedger(id);
            });
        });

        // 編輯帳本
        document.querySelectorAll('.edit-ledger-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const ledger = this.app.ledgerManager.getAllLedgers().find(l => l.id === id);
                if (ledger) this._showEditModal(ledger);
            });
        });

        // 分享帳本
        document.querySelectorAll('.share-ledger-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const ledger = this.app.ledgerManager.getAllLedgers().find(l => l.id === id);
                if (ledger) this._showShareModal(ledger);
            });
        });

        // 刪除帳本
        document.querySelectorAll('.delete-ledger-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                const ledger = this.app.ledgerManager.getAllLedgers().find(l => l.id === id);
                if (!ledger) return;
                if (!(await customConfirm(t('ledger:deleteConfirm', { name: ledger.name })))) return;
                try {
                    const wasActive = this.app.dataService.activeLedgerId === id;
                    await this.app.ledgerManager.deleteLedger(id);
                    if (wasActive) {
                        await this.app.ledgerManager.switchLedger(1);
                    }
                    showToast(t('ledger:deleteSuccess', { name: ledger.name }), 'success');
                    await this.render();
                } catch (e) {
                    showToast(t('ledger:deleteFailed') + e.message, 'error');
                }
            });
        });
    }

    /**
     * 帳本新增/編輯 Modal
     * @param {object|null} ledger  null = 新增
     */
    _showEditModal(ledger) {
        const isEdit = !!ledger;
        const colors = this.app.ledgerManager.getColorOptions();
        const defaultIcons = this.app.ledgerManager.getIconOptions();
        const selectedColor = ledger?.color || colors[0];
        const selectedIcon = ledger?.icon || defaultIcons[0];

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]';
        modal.innerHTML = `
            <div class="bg-wabi-bg rounded-xl max-w-sm w-full p-6 shadow-xl max-h-[85vh] overflow-y-auto">
                <h3 class="text-lg font-bold text-wabi-primary mb-4">${isEdit ? t('ledger:editModalTitle') : t('ledger:addModalTitle')}</h3>

                <!-- 名稱 -->
                <div class="mb-4">
                    <label class="text-sm font-medium text-wabi-text-primary block mb-1">${t('ledger:nameLabel')}</label>
                    <input type="text" id="ledger-name-input" maxlength="20"
                        class="w-full px-3 py-2.5 rounded-lg border border-wabi-border bg-wabi-surface text-sm focus:ring-wabi-primary focus:border-wabi-primary outline-none"
                        value="${isEdit ? escapeHTML(ledger.name) : ''}" placeholder="${t('ledger:namePlaceholder')}" />
                </div>

                <!-- 顏色 -->
                <div class="mb-4">
                    <label class="text-sm font-medium text-wabi-text-primary block mb-2">${t('ledger:themeColorLabel')}</label>
                    <div id="color-picker" class="flex flex-wrap gap-2">
                        ${colors.map(c => `
                            <button class="color-option size-8 rounded-full border-2 transition-all ${c === selectedColor ? 'border-wabi-primary scale-110 ring-2 ring-wabi-primary/30' : 'border-transparent hover:scale-110'}" data-color="${escAttr(c)}" style="background-color: ${escAttr(c)}"></button>
                        `).join('')}
                        <button id="custom-color-trigger" class="size-8 rounded-full border-2 border-dashed border-wabi-border flex items-center justify-center hover:border-wabi-primary hover:scale-110 transition-all relative overflow-hidden" title="${t('ledger:customColor')}">
                            <i class="fa-solid fa-palette text-xs text-wabi-text-secondary"></i>
                            <input type="color" id="custom-color-input" value="${escAttr(selectedColor)}" class="absolute inset-0 opacity-0 cursor-pointer" />
                        </button>
                    </div>
                    <input type="hidden" id="ledger-color-input" value="${selectedColor}" />
                </div>

                <!-- 圖示 -->
                <div class="mb-6">
                    <label class="text-sm font-medium text-wabi-text-primary block mb-2">${t('ledger:iconLabel')}</label>
                    <div class="relative mb-2">
                        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-wabi-text-secondary text-sm"></i>
                        <input type="text" id="ledger-icon-search"
                            class="w-full pl-9 pr-3 py-2 rounded-lg border border-wabi-border bg-wabi-surface text-sm focus:ring-wabi-primary focus:border-wabi-primary outline-none"
                            placeholder="${t('ledger:searchIconPlaceholder')}" />
                    </div>
                    <div id="icon-picker" class="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                        ${defaultIcons.map(ic => `
                            <button class="icon-option size-10 rounded-lg flex items-center justify-center text-lg transition-all
                                ${ic === selectedIcon ? 'bg-wabi-primary text-wabi-surface shadow-sm' : 'bg-wabi-bg text-wabi-text-secondary hover:bg-wabi-bg'}"
                                data-icon="${escAttr(ic)}">
                                <i class="${escAttr(ic)}"></i>
                            </button>
                        `).join('')}
                    </div>
                    <div class="mt-2 flex gap-2">
                        <input type="text" id="ledger-custom-icon-input"
                            class="flex-1 px-3 py-1.5 rounded-lg border border-wabi-border bg-wabi-surface text-xs focus:ring-wabi-primary focus:border-wabi-primary outline-none"
                            placeholder="${t('ledger:customIconPlaceholder')}" />
                        <button id="apply-custom-icon-btn" class="px-3 py-1.5 bg-wabi-primary/10 text-wabi-primary rounded-lg text-xs font-medium hover:bg-wabi-primary/20 transition-colors shrink-0">${t('common:buttons.apply')}</button>
                    </div>
                    <input type="hidden" id="ledger-icon-input" value="${escAttr(selectedIcon)}" />
                </div>

                <!-- Base Currency -->
                <div class="mb-4">
                    <label class="text-sm font-medium text-wabi-text-primary block mb-1">${t('ledger:baseCurrency')}</label>
                    <select id="ledger-base-currency-select" class="w-full px-3 py-2.5 rounded-lg border border-wabi-border bg-wabi-surface text-sm focus:ring-wabi-primary focus:border-wabi-primary outline-none">
                        ${CURRENCIES.map(c => `<option value="${c.code}">${c.code} (${c.symbol}) - ${t('common:currency.' + c.code)}</option>`).join('')}
                    </select>
                </div>

                <!-- Preview -->
                <div class="mb-6 p-3 bg-wabi-bg rounded-lg">
                    <p class="text-xs text-wabi-text-secondary mb-2">${t('ledger:previewLabel')}</p>
                    <div class="flex items-center gap-3">
                        <div id="preview-icon" class="flex items-center justify-center rounded-xl text-white shrink-0 size-12" style="background-color: ${escAttr(selectedColor)}">
                            <i class="${escAttr(selectedIcon)} text-2xl"></i>
                        </div>
                        <p id="preview-name" class="font-bold text-wabi-text-primary">${isEdit ? escapeHTML(ledger.name) : t('ledger:newLedgerName')}</p>
                    </div>
                </div>

                <!-- 按鈕 -->
                <div class="flex space-x-3">
                    <button id="ledger-save-btn" class="flex-1 bg-wabi-primary hover:bg-wabi-primary/90 text-wabi-surface font-bold py-3 rounded-lg transition-colors shadow-sm">
                        ${isEdit ? t('common:buttons.save') : t('ledger:createButton')}
                    </button>
                    <button id="ledger-cancel-btn" class="px-6 bg-wabi-surface border border-wabi-border hover:bg-wabi-bg text-wabi-text-primary py-3 rounded-lg transition-colors">
                        ${t('common:buttons.cancel')}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const nameInput = modal.querySelector('#ledger-name-input');
        const colorInput = modal.querySelector('#ledger-color-input');
        const iconInput = modal.querySelector('#ledger-icon-input');
        const baseCurrencySelect = modal.querySelector('#ledger-base-currency-select');
        if (isEdit && ledger.baseCurrency) {
            baseCurrencySelect.value = ledger.baseCurrency;
        }
        const previewIcon = modal.querySelector('#preview-icon');
        const previewName = modal.querySelector('#preview-name');
        const iconPicker = modal.querySelector('#icon-picker');
        const iconSearchInput = modal.querySelector('#ledger-icon-search');
        const customColorInput = modal.querySelector('#custom-color-input');
        const customColorTrigger = modal.querySelector('#custom-color-trigger');
        const customIconInput = modal.querySelector('#ledger-custom-icon-input');

        // ==================== 預覽更新 ====================
        const updatePreview = () => {
            previewIcon.style.backgroundColor = colorInput.value;
            previewIcon.innerHTML = `<i class="${escAttr(iconInput.value)} text-xl"></i>`;
            previewName.textContent = nameInput.value || t('ledger:newLedgerName');
        };

        nameInput.addEventListener('input', updatePreview);

        // ==================== 顏色選擇 ====================
        const selectColor = (color) => {
            modal.querySelectorAll('.color-option').forEach(b => {
                b.classList.remove('border-wabi-primary', 'scale-110', 'ring-2', 'ring-wabi-primary/30');
                b.classList.add('border-transparent');
            });
            // 嘗試高亮匹配的預設色
            const matched = modal.querySelector(`.color-option[data-color="${color}"]`);
            if (matched) {
                matched.classList.remove('border-transparent');
                matched.classList.add('border-wabi-primary', 'scale-110', 'ring-2', 'ring-wabi-primary/30');
            }
            colorInput.value = color;
            updatePreview();
        };

        modal.querySelectorAll('.color-option').forEach(btn => {
            btn.addEventListener('click', () => selectColor(btn.dataset.color));
        });

        customColorInput.addEventListener('input', (e) => {
            selectColor(e.target.value);
            // 自訂色按鈕本身也顯示選中色
            customColorTrigger.style.backgroundColor = e.target.value;
            customColorTrigger.querySelector('i').style.display = 'none';
        });

        // ==================== 圖示選擇 ====================
        const selectIcon = (iconClass) => {
            iconInput.value = iconClass;
            // 更新圖示選中狀態
            modal.querySelectorAll('.icon-option').forEach(b => {
                if (b.dataset.icon === iconClass) {
                    b.classList.remove('bg-wabi-bg', 'text-wabi-text-secondary');
                    b.classList.add('bg-wabi-primary', 'text-wabi-surface', 'shadow-sm');
                } else {
                    b.classList.remove('bg-wabi-primary', 'text-wabi-surface', 'shadow-sm');
                    b.classList.add('bg-wabi-bg', 'text-wabi-text-secondary');
                }
            });
            updatePreview();
        };

        // 圖示格線點擊代理
        iconPicker.addEventListener('click', (e) => {
            const btn = e.target.closest('.icon-option');
            if (btn) selectIcon(btn.dataset.icon);
        });

        // ==================== 圖示搜尋 ====================
        let searchTimeout = null;
        iconSearchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const keyword = iconSearchInput.value.trim().toLowerCase();
                if (!keyword) {
                    // 重置為預設圖示
                    iconPicker.innerHTML = defaultIcons.map(ic => `
                        <button class="icon-option size-10 rounded-lg flex items-center justify-center text-lg transition-all
                            ${ic === iconInput.value ? 'bg-wabi-primary text-wabi-surface shadow-sm' : 'bg-wabi-bg text-wabi-text-secondary hover:bg-wabi-bg'}"
                            data-icon="${ic}">
                            <i class="${ic}"></i>
                        </button>
                    `).join('');
                    return;
                }

                const results = FONT_AWESOME_ICONS.filter(i => i.includes(keyword)).slice(0, 100);
                if (results.length === 0) {
                    iconPicker.innerHTML = `<p class="text-xs text-wabi-text-secondary col-span-6 text-center py-4">${t('ledger:noMatchIcon')}</p>`;
                } else {
                    iconPicker.innerHTML = results.map(ic => `
                        <button class="icon-option size-10 rounded-lg flex items-center justify-center text-lg transition-all
                            ${ic === iconInput.value ? 'bg-wabi-primary text-wabi-surface shadow-sm' : 'bg-wabi-bg text-wabi-text-secondary hover:bg-wabi-bg'}"
                            data-icon="${ic}">
                            <i class="${ic}"></i>
                        </button>
                    `).join('');
                }
            }, 250);
        });

        // ==================== 自訂圖示 class ====================
        modal.querySelector('#apply-custom-icon-btn').addEventListener('click', () => {
            const customClass = customIconInput.value.trim();
            if (customClass) {
                selectIcon(customClass);
                customIconInput.value = '';
            }
        });

        // ==================== 儲存 ====================
        modal.querySelector('#ledger-save-btn').addEventListener('click', async () => {
            const name = nameInput.value.trim();
            if (!name) { showToast(t('ledger:nameRequiredError'), 'error'); return; }

            const baseCurrency = document.getElementById('ledger-base-currency-select').value;

            try {
                if (isEdit) {
                    await this.app.ledgerManager.updateLedger(ledger.id, {
                        name,
                        color: colorInput.value,
                        icon: iconInput.value,
                        baseCurrency,
                    });
                    showToast(t('ledger:updateSuccess'), 'success');
                } else {
                    await this.app.ledgerManager.createLedger({
                        name,
                        color: colorInput.value,
                        icon: iconInput.value,
                        baseCurrency,
                    });
                    showToast(t('ledger:createSuccess', { name }), 'success');
                }
                modal.remove();
                await this.render();
            } catch (e) {
                showToast(e.message, 'error');
            }
        });

        // 取消
        modal.querySelector('#ledger-cancel-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        // 自動聚焦
        nameInput.focus();
    }

    /**
     * 分享帳本 Modal
     * @param {object} ledger 
     */
    async _showShareModal(ledger) {
        if (!this.app.syncService || !this.app.syncService.isSignedIn()) {
            showToast(t('ledger:requireLogin'), 'error');
            return;
        }

        // 先判斷是否為擁有者（已共用帳本才需要）
        let isOwner = true;
        if (ledger.sharedFileId) {
            try {
                isOwner = await this.app.ledgerManager.isLedgerOwner(ledger.id);
            } catch { isOwner = false; }
        }

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]';
        
        const contentHtml = `
            <div class="bg-wabi-bg rounded-xl max-w-sm w-full p-6 shadow-xl relative max-h-[85vh] overflow-y-auto">
                <button class="close-btn absolute top-4 right-4 text-wabi-text-secondary hover:text-wabi-primary p-2">
                    <i class="fa-solid fa-times"></i>
                </button>
                <h3 class="text-lg font-bold text-wabi-primary mb-2">${t('ledger:shareTitle', { name: escapeHTML(ledger.name) })}</h3>
                
                <!-- 權限提示 -->
                <div class="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p class="text-[11px] text-amber-700 leading-relaxed">
                        <i class="fa-solid fa-triangle-exclamation mr-1"></i>
                        ${t('ledger:sharePermissionNoteHtml')}
                    </p>
                </div>

                ${isOwner ? `
                <div class="mb-4">
                    <p class="text-sm text-wabi-text-secondary mb-3">${t('ledger:shareDescription')}</p>
                    <label class="text-sm font-medium text-wabi-text-primary block mb-1">${t('ledger:emailLabel')}</label>
                    <input type="email" id="share-email-input" 
                        class="w-full px-3 py-2.5 rounded-lg border border-wabi-border bg-wabi-surface text-sm focus:ring-wabi-primary focus:border-wabi-primary outline-none"
                        placeholder="${t('ledger:emailPlaceholder')}" />
                </div>
                <div class="flex space-x-3 mt-6">
                    <button id="share-submit-btn" class="flex-1 bg-wabi-primary hover:bg-wabi-primary/90 text-wabi-surface font-bold py-3 rounded-lg transition-colors shadow-sm flex justify-center items-center">
                        ${t('ledger:generateBtn')}
                    </button>
                </div>
                ` : `
                <div class="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p class="text-sm text-blue-700"><i class="fa-solid fa-circle-info mr-1"></i>${t('ledger:participantNote')}</p>
                </div>
                `}
                
                ${ledger.sharedFileId ? `
                <div class="mt-6 p-4 bg-wabi-bg rounded-lg border border-wabi-border">
                    <p class="text-xs text-wabi-text-secondary mb-1">${t('ledger:existingCodeLabel')}</p>
                    <div class="flex items-center gap-2 mb-3">
                        <input type="text" readonly value="${ledger.sharedFileId}" class="flex-1 bg-wabi-surface border border-wabi-border rounded px-2 py-1 text-xs text-wabi-text-primary outline-none" />
                        <button class="copy-code-btn px-3 py-1 bg-wabi-bg hover:bg-wabi-border rounded text-xs transition-colors shrink-0">${t('ledger:copyBtn')}</button>
                    </div>
                    
                    <div class="flex justify-center mb-4">
                        <div id="qrcode-container" class="bg-wabi-surface p-2 border border-wabi-border rounded-lg shadow-sm"></div>
                    </div>

                    <p class="text-xs font-bold text-wabi-text-primary mb-2">${t('ledger:authorizedUsers')}</p>
                    <div id="shared-users-list" class="space-y-2 max-h-40 overflow-y-auto pr-1">
                        <div class="text-center text-gray-400 py-3 text-xs"><i class="fa-solid fa-spinner fa-spin"></i> ${t('common:messages.loading')}</div>
                    </div>

                    ${isOwner ? `
                    <div class="mt-4 pt-4 border-t border-wabi-border">
                        <button id="unshare-btn" class="w-full py-2.5 bg-red-50 text-red-600 font-medium rounded-lg border border-red-200 hover:bg-red-100 transition-colors text-sm flex items-center justify-center gap-2">
                            <i class="fa-solid fa-link-slash"></i> ${t('ledger:cancelShareBtn')}
                        </button>
                        <p class="text-[10px] text-gray-400 mt-1 text-center">${t('ledger:cancelShareDesc')}</p>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
            </div>
        `;
        
        modal.innerHTML = contentHtml;
        document.body.appendChild(modal);

        modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        if (ledger.sharedFileId) {
            // == 複製代碼 ==
            modal.querySelector('.copy-code-btn')?.addEventListener('click', () => {
                navigator.clipboard.writeText(ledger.sharedFileId).then(() => {
                    showToast(t('ledger:copySuccess'), 'success');
                }).catch(() => {
                    showToast(t('ledger:copyFailed'), 'error');
                });
            });

            // == QR Code ==
            const qrContainer = modal.querySelector('#qrcode-container');
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: ledger.sharedFileId,
                    width: 120,
                    height: 120,
                    colorDark : "#2D3748",
                    colorLight : "#ffffff",
                });
            } else {
                qrContainer.innerHTML = `<span class="text-xs text-gray-400 p-2">${t('ledger:qrLoadFailed')}</span>`;
            }

            // == 讀取分享名單 ==
            const usersListEl = modal.querySelector('#shared-users-list');
            this.app.ledgerManager.getSharedUsers(ledger.id).then(users => {
                usersListEl.innerHTML = '';
                users.forEach(u => {
                    const el = document.createElement('div');
                    el.className = 'flex justify-between items-center bg-wabi-surface p-2 rounded-lg border border-wabi-border shadow-sm';
                    el.innerHTML = `
                        <div class="truncate flex-1 min-w-0 mr-2">
                            <p class="text-sm font-medium text-wabi-text-primary truncate">${escapeHTML(u.displayName || t('ledger:unknownUser'))}</p>
                            <p class="text-xs text-gray-500 truncate">${escapeHTML(u.emailAddress || '---')}</p>
                        </div>
                        ${u.role === 'owner' ? `<span class="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded shrink-0">${t('ledger:ownerRole')}</span>` : 
                          (isOwner ? `<button class="remove-user-btn text-red-500 hover:bg-red-50 size-7 flex items-center justify-center rounded transition-colors shrink-0" title="${t('ledger:removeUserTitle')}"><i class="fa-solid fa-user-minus"></i></button>` :
                          `<span class="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded shrink-0">${t('ledger:participantRole')}</span>`)}
                    `;
                    
                    if (isOwner && u.role !== 'owner') {
                        el.querySelector('.remove-user-btn')?.addEventListener('click', async () => {
                            if (!(await customConfirm(t('ledger:removeUserConfirm', { email: u.emailAddress || u.displayName })))) return;
                            try {
                                el.style.opacity = '0.5';
                                await this.app.ledgerManager.removeSharedUser(ledger.id, u.id);
                                el.remove();
                                showToast(t('ledger:userRemoved'), 'success');
                            } catch (e) {
                                showToast(t('ledger:removeFailed') + e.message, 'error');
                                el.style.opacity = '1';
                            }
                        });
                    }
                    usersListEl.appendChild(el);
                });
            }).catch(e => {
                usersListEl.innerHTML = `<div class="text-red-500 text-center py-2 text-xs">${t('ledger:loadFailed')}${escAttr(e.message)}</div>`;
            });

            // == 取消共用 (擁有者專用) ==
            if (isOwner) {
                modal.querySelector('#unshare-btn')?.addEventListener('click', async () => {
                    if (!(await customConfirm(t('ledger:unshareConfirm', { name: ledger.name })))) return;
                    
                    const btn = modal.querySelector('#unshare-btn');
                    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i>${t('ledger:processing')}`;
                    btn.disabled = true;

                    try {
                        await this.app.ledgerManager.unshareLedger(ledger.id);
                        showToast(t('ledger:unshareSuccess'), 'success');
                        modal.remove();
                        await this.render();
                    } catch (e) {
                        showToast(t('ledger:unshareFailed') + e.message, 'error');
                        btn.innerHTML = `<i class="fa-solid fa-link-slash"></i> ${t('ledger:cancelShareBtn')}`;
                        btn.disabled = false;
                    }
                });
            }
        }

        // == 擁有者才可邀請新成員 ==
        if (isOwner) {
            const submitBtn = modal.querySelector('#share-submit-btn');
            const emailInput = modal.querySelector('#share-email-input');

            submitBtn?.addEventListener('click', async () => {
                const email = emailInput.value.trim();
                if (!email || !email.includes('@')) {
                    showToast(t('ledger:invalidEmailError'), 'error');
                    return;
                }

                const originalHTML = submitBtn.innerHTML;
                submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>${t('ledger:processing')}`;
                submitBtn.disabled = true;

                try {
                    const fileId = await this.app.ledgerManager.shareLedger(ledger.id, email);
                    showToast(t('ledger:shareSuccess'), 'success');
                    modal.remove();
                    this._showShareModal(await this.app.dataService.getLedger(ledger.id));
                } catch (e) {
                    showToast(t('ledger:shareFailed') + e.message, 'error');
                    submitBtn.innerHTML = originalHTML;
                    submitBtn.disabled = false;
                }
            });
        }
    }

    /**
     * 加入共用帳本 Modal
     */
    _showJoinModal() {
        if (!this.app.syncService || !this.app.syncService.isSignedIn()) {
            showToast(t('ledger:requireLoginDetail'), 'error');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]';
        
        modal.innerHTML = `
            <div class="bg-wabi-bg rounded-xl max-w-sm w-full p-6 shadow-xl relative">
                <button class="close-btn absolute top-4 right-4 text-wabi-text-secondary hover:text-wabi-primary p-2">
                    <i class="fa-solid fa-times"></i>
                </button>
                <h3 class="text-lg font-bold text-wabi-primary mb-2">${t('ledger:joinTitle')}</h3>
                
                <!-- 權限提示 -->
                <div class="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p class="text-[11px] text-amber-700 leading-relaxed">
                        <i class="fa-solid fa-triangle-exclamation mr-1"></i>
                        ${t('ledger:joinPermissionNoteHtml')}
                    </p>
                </div>

                <div class="mb-4">
                    <p class="text-sm text-wabi-text-secondary mb-3">
                        ${t('ledger:pickerRecommendLabel')}
                    </p>
                    
                    <button id="picker-btn" class="w-full py-2.5 mb-4 bg-blue-50 text-blue-600 font-medium rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors flex justify-center items-center gap-2">
                        <i class="fa-brands fa-google-drive"></i> ${t('ledger:pickerButton')}
                    </button>

                    <div class="flex items-center gap-2 mb-4">
                        <div class="h-px bg-wabi-bg flex-1"></div>
                        <span class="text-xs text-gray-400">${t('ledger:orEnterCode')}</span>
                        <div class="h-px bg-wabi-bg flex-1"></div>
                    </div>

                    <label class="text-sm font-medium text-wabi-text-primary block mb-1">${t('ledger:shareCodeLabel')}</label>
                    <div class="flex gap-2">
                        <input type="text" id="join-code-input" 
                            class="flex-1 px-3 py-2.5 rounded-lg border border-wabi-border bg-wabi-surface text-sm focus:ring-wabi-primary focus:border-wabi-primary outline-none"
                            placeholder="${t('ledger:codePlaceholder')}" />
                        <button id="scan-qr-btn" class="bg-wabi-bg w-11 hover:bg-wabi-bg text-wabi-text-primary rounded-lg flex items-center justify-center transition-colors" title="${t('ledger:scanQRTitle')}">
                            <i class="fa-solid fa-qrcode text-lg"></i>
                        </button>
                    </div>

                    <!-- 隱藏的掃描區塊 -->
                    <div id="qr-reader-container" class="hidden mt-3 rounded-lg overflow-hidden border border-wabi-border w-full">
                        <div id="qr-reader" class="w-full bg-black"></div>
                        <button id="close-scanner-btn" class="w-full py-2 bg-wabi-bg text-wabi-text-primary text-sm font-medium hover:bg-wabi-bg transition-colors">
                            ${t('ledger:closeCamera')}
                        </button>
                    </div>
                </div>

                <div class="flex space-x-3 mt-6">
                    <button id="join-submit-btn" class="flex-1 bg-wabi-primary hover:bg-wabi-primary/90 text-wabi-surface font-bold py-3 rounded-lg transition-colors shadow-sm flex justify-center items-center">
                        ${t('ledger:joinButton')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

        let html5QrCode = null;
        const closeScanner = async () => {
            if (html5QrCode) {
                try {
                    await html5QrCode.stop();
                } catch(e){console.warn('Silenced error:', e);}
                html5QrCode = null;
            }
            modal.querySelector('#qr-reader-container').classList.add('hidden');
        };

        const closeModal = async () => {
            await closeScanner();
            modal.remove();
        };

        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        const submitBtn = modal.querySelector('#join-submit-btn');
        const codeInput = modal.querySelector('#join-code-input');
        const pickerBtn = modal.querySelector('#picker-btn');
        const scanBtn = modal.querySelector('#scan-qr-btn');
        const scannerContainer = modal.querySelector('#qr-reader-container');
        const closeScannerBtn = modal.querySelector('#close-scanner-btn');

        let authorizedCode = null;

        // ==== 掃描 QR Code 邏輯 ====
        scanBtn.addEventListener('click', () => {
            if (typeof Html5Qrcode === 'undefined') {
                showToast(t('ledger:qrScannerFailed'), 'error');
                return;
            }
            
            if (scannerContainer.classList.contains('hidden')) {
                scannerContainer.classList.remove('hidden');
                
                Html5Qrcode.getCameras().then(devices => {
                    if (devices && devices.length) {
                        // 優先尋找後置鏡頭，沒有就預設最後一顆（通常是主鏡頭），如果只有一顆就用第一顆
                        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment') || d.label.toLowerCase().includes('rear'));
                        const cameraId = backCamera ? backCamera.id : devices[devices.length - 1].id;

                        html5QrCode = new Html5Qrcode("qr-reader");
                        html5QrCode.start(
                            cameraId,
                            {
                                fps: 10,
                                qrbox: { width: 250, height: 250 }
                            },
                            (decodedText) => {
                                codeInput.value = decodedText;
                                showToast(t('ledger:qrScanSuccess'), 'success');
                                closeScanner();
                            },
                            (errorMessage) => {
                                // ignore background scan errors
                            }
                        ).catch((err) => {
                            showToast(t('ledger:cameraAccessDenied'), "error");
                            closeScanner();
                        });
                    } else {
                        showToast(t('ledger:noCameraFound'), "error");
                        closeScanner();
                    }
                }).catch(err => {
                    showToast(t('ledger:cameraAccessFailed'), "error");
                    closeScanner();
                });
            } else {
                closeScanner();
            }
        });

        closeScannerBtn.addEventListener('click', closeScanner);

        // ==== Picker 邏輯 ====
        pickerBtn.addEventListener('click', async () => {
            const originalHTML = pickerBtn.innerHTML;
            pickerBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>${t('ledger:loadingWindow')}`;
            pickerBtn.disabled = true;

            try {
                const selectedFileId = await this.app.syncService.openSharedLedgerPicker();
                codeInput.value = selectedFileId;
                authorizedCode = selectedFileId;
                showToast(t('ledger:fileSelected'), 'success');
                // 自動觸發送出
                submitBtn.click();
            } catch (err) {
                if (err.message !== '使用者取消選擇') {
                    showToast(err.message, 'error');
                }
            } finally {
                pickerBtn.innerHTML = originalHTML;
                pickerBtn.disabled = false;
            }
        });

        // ==== 提交邏輯 ====
        submitBtn.addEventListener('click', async () => {
            let code = codeInput.value.trim();
            if (!code) {
                showToast(t('ledger:codeRequiredError'), 'error');
                return;
            }

            const originalHTML = submitBtn.innerHTML;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>${t('ledger:processing')}`;
            submitBtn.disabled = true;

            try {
                // 如果是手動輸入，強制透過 Picker 確認一次授權
                if (code !== authorizedCode) {
                    showToast(t('ledger:confirmPicker'), 'info');
                    code = await this.app.syncService.openSharedLedgerPicker(code);
                    authorizedCode = code;
                    codeInput.value = code;
                }

                submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>${t('ledger:syncing')}`;
                
                const newLedgerId = await this.app.ledgerManager.joinSharedLedger(code);
                showToast(t('ledger:joinSuccess'), 'success');
                modal.remove();
                await this.app.ledgerManager.switchLedger(newLedgerId); // 自動切換過去
            } catch (e) {
                if (e.message !== '使用者取消選擇') {
                    showToast(t('ledger:joinFailed') + e.message, 'error');
                }
                submitBtn.innerHTML = originalHTML;
                submitBtn.disabled = false;
            }
        });
        
        codeInput.focus();
    }
}
