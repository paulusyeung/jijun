import { t, getCurrentLanguage } from '../i18n.js';
import { showToast, customConfirm, escAttr } from '../utils.js';

export class SyncSettingsPage {
    constructor(app) {
        this.app = app;
    }

    async render() {
        const isSignedIn = this.app.syncService.isSignedIn();
        const userInfo = this.app.syncService.userInfo;
        const serverUrl = this.app.syncService.getServerUrl();
        const lastBackup = await this.app.dataService.getSetting('sync_last_backup');
        const lastSync = await this.app.dataService.getSetting('sync_last_sync');
        const autoSyncEnabled = await this.app.dataService.getSetting('sync_auto_enabled');
        const autoBackupEnabled = await this.app.dataService.getSetting('sync_auto_backup_enabled');
        const autoBackupInterval = await this.app.dataService.getSetting('sync_auto_backup_interval');
        const backupIntervalValue = autoBackupInterval?.value || 'daily';
        const locale = { 'zh-TW': 'zh-TW', 'zh-CN': 'zh-CN' }[getCurrentLanguage()] || 'en-US';

        this.app.appContainer.innerHTML = `
            <div class="page active max-w-3xl mx-auto">
                <div class="flex items-center p-4 pb-2 justify-between bg-wabi-bg sticky top-0 z-10">
                    <a href="#settings" class="text-wabi-text-secondary hover:text-wabi-primary">
                        <i class="fa-solid fa-chevron-left text-xl"></i>
                    </a>
                    <h2 class="text-wabi-primary text-lg font-bold flex-1 text-center">${t('sync:title')}</h2>
                    <div class="w-8"></div>
                </div>
                <div class="p-4 space-y-6 pb-24">

                    <!-- Server Settings -->
                    <div class="bg-wabi-surface rounded-xl p-4 space-y-3">
                        <h3 class="text-wabi-primary text-base font-bold">${t('sync:server_settings_title')}</h3>
                        <div class="space-y-2">
                            <label class="text-sm text-wabi-text-secondary">${t('sync:server_url_label')}</label>
                            <div class="flex flex-wrap gap-2">
                                <input type="url" id="sync-server-url-input"
                                    class="flex-1 min-w-0 px-3 py-2 rounded-lg border border-wabi-border bg-wabi-surface text-sm focus:ring-wabi-primary focus:border-wabi-primary"
                                    value="${escAttr(serverUrl)}"
                                    placeholder="https://jijun-server.the-walking-fish.com" />
                                <button id="sync-server-save-btn" class="px-3 py-2 bg-wabi-primary text-wabi-surface rounded-lg text-sm font-medium hover:bg-wabi-primary/90 shrink-0">
                                    ${t('common:buttons.save')}
                                </button>
                                <button id="sync-server-reset-btn" class="px-3 py-2 bg-wabi-bg text-wabi-text-secondary rounded-lg text-sm font-medium hover:bg-wabi-bg shrink-0" title="${t('sync:server_url_reset')}">
                                    <i class="fa-solid fa-rotate-left"></i>
                                </button>
                            </div>
                            <p class="text-xs text-wabi-text-secondary">${t('sync:server_url_description')}</p>
                        </div>
                    </div>

                    <!-- Google Account -->
                    <div class="bg-wabi-surface rounded-xl p-4 space-y-3">
                        <h3 class="text-wabi-primary text-base font-bold">${t('sync:google_account_title')}</h3>
                        ${isSignedIn && userInfo ? `
                            <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                ${userInfo.picture ? `<img src="${userInfo.picture}" class="w-10 h-10 rounded-full" alt="avatar" />` : '<div class="w-10 h-10 rounded-full bg-wabi-primary/20 flex items-center justify-center"><i class="fa-solid fa-user text-wabi-primary"></i></div>'}
                                <div class="flex-1">
                                    <p class="font-medium text-wabi-text-primary">${userInfo.name || 'Google User'}</p>
                                    <p class="text-xs text-wabi-text-secondary">${userInfo.email || ''}</p>
                                </div>
                                <span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">${t('sync:connected_badge')}</span>
                            </div>
                            <button id="sync-sign-out-btn" class="w-full py-2 text-red-500 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50">
                                <i class="fa-solid fa-right-from-bracket mr-1"></i> ${t('sync:sign_out')}
                            </button>
                        ` : `
                            <div class="text-center py-4">
                                <p class="text-sm text-wabi-text-secondary mb-3">${t('sync:sign_in_prompt')}</p>
                                <button id="sync-sign-in-btn" class="px-6 py-2.5 bg-wabi-surface border border-wabi-border rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center justify-center gap-2 mx-auto">
                                    <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
<span class="text-sm font-medium text-gray-700">${t('sync:sign_in_button')}</span>
                                </button>
                            </div>
                        `}
                    </div>

                    ${isSignedIn ? `
                    <!-- Backup -->
                    <div class="bg-wabi-surface rounded-xl p-4 space-y-3">
                        <h3 class="text-wabi-primary text-base font-bold">${t('sync:backup_title')}</h3>
                        <p class="text-xs text-wabi-text-secondary">
                            ${lastBackup?.value?.timestamp ? t('sync:last_backup', { date: new Date(lastBackup.value.timestamp).toLocaleString(locale) }) : t('sync:never_backed_up')}
                        </p>
                        <div class="grid grid-cols-2 gap-3">
                            <button id="sync-backup-btn" class="py-2.5 bg-wabi-primary text-wabi-surface rounded-lg text-sm font-medium hover:bg-wabi-primary/90 flex items-center justify-center gap-1">
<i class="fa-solid fa-cloud-arrow-up"></i> ${t('sync:backup_now')}
                            </button>
                            <button id="sync-restore-btn" class="py-2.5 border border-wabi-primary text-wabi-primary rounded-lg text-sm font-medium hover:bg-wabi-primary/10 flex items-center justify-center gap-1">
                                <i class="fa-solid fa-cloud-arrow-down"></i> ${t('sync:restore_backup')}
                            </button>
                        </div>

                        <!-- Auto Backup -->
                        <div class="border-t border-wabi-border pt-3 space-y-3">
                            <div class="flex items-center justify-between">
                                <div>
<p class="text-sm text-wabi-text-primary">${t('sync:auto_backup')}</p>
                                     <p class="text-xs text-wabi-text-secondary">${t('sync:auto_backup_desc')}</p>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="sync-auto-backup-toggle" class="sr-only peer" ${autoBackupEnabled?.value ? 'checked' : ''}>
                                <div class="w-11 h-6 bg-wabi-bg border border-wabi-border rounded-full peer peer-focus:ring-4 peer-focus:ring-wabi-accent/30 peer-checked:bg-wabi-primary peer-checked:border-wabi-primary transition-colors"></div>
                                    <span class="absolute left-1 top-1 w-4 h-4 bg-wabi-surface rounded-full transition-transform peer-checked:translate-x-full"></span>
                                </label>
                            </div>
                            <div id="auto-backup-interval-container" class="${autoBackupEnabled?.value ? '' : 'hidden'}">
                                <label class="text-xs text-wabi-text-secondary mb-1 block">${t('sync:backup_frequency')}</label>
                                <div class="flex gap-2">
<button data-interval="daily" class="auto-backup-interval-btn flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${backupIntervalValue === 'daily' ? 'bg-wabi-primary text-wabi-surface border-wabi-primary' : 'bg-wabi-surface text-wabi-text-primary border-wabi-border hover:border-wabi-primary'}">${t('sync:frequency_daily')}</button>
                                     <button data-interval="3days" class="auto-backup-interval-btn flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${backupIntervalValue === '3days' ? 'bg-wabi-primary text-wabi-surface border-wabi-primary' : 'bg-wabi-surface text-wabi-text-primary border-wabi-border hover:border-wabi-primary'}">${t('sync:frequency_3days')}</button>
                                     <button data-interval="weekly" class="auto-backup-interval-btn flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${backupIntervalValue === 'weekly' ? 'bg-wabi-primary text-wabi-surface border-wabi-primary' : 'bg-wabi-surface text-wabi-text-primary border-wabi-border hover:border-wabi-primary'}">${t('sync:frequency_weekly')}</button>
                                </div>
                            </div>
                            <p class="text-xs text-wabi-text-secondary">
                                <i class="fa-solid fa-circle-info mr-1"></i>
                                ${t('sync:backup_retention_policy')}
                            </p>
                        </div>
                    </div>

                    <!-- Multi-device Sync -->
                    <div class="bg-wabi-surface rounded-xl p-4 space-y-3">
                        <h3 class="text-wabi-primary text-base font-bold">${t('sync:sync_title')}</h3>
                        <div class="flex items-center justify-between">
                            <div>
<p class="text-sm text-wabi-text-primary">${t('sync:auto_sync')}</p>
                                 <p class="text-xs text-wabi-text-secondary">
                                     ${lastSync?.value ? t('sync:last_sync', { date: new Date(lastSync.value).toLocaleString(locale) }) : t('sync:never_synced')}
                                 </p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="sync-auto-toggle" class="sr-only peer" ${autoSyncEnabled?.value ? 'checked' : ''}>
                                <div class="w-11 h-6 bg-wabi-bg border border-wabi-border rounded-full peer peer-focus:ring-4 peer-focus:ring-wabi-accent/30 peer-checked:bg-wabi-primary peer-checked:border-wabi-primary transition-colors"></div>
                                <span class="absolute left-1 top-1 w-4 h-4 bg-wabi-surface rounded-full transition-transform peer-checked:translate-x-full"></span>
                            </label>
                        </div>
                        <button id="sync-now-btn" class="w-full py-2.5 border border-wabi-border text-wabi-text-primary rounded-lg text-sm font-medium hover:bg-wabi-bg flex items-center justify-center gap-1">
<i class="fa-solid fa-rotate"></i> ${t('sync:sync_now')}
                        </button>
                        <p class="text-xs text-wabi-text-secondary">
                            ${t('sync:device_id', { id: this.app.syncService.deviceId })}
                        </p>
                    </div>
                    ` : ''}

                </div>
            </div>
        `;
        this.setupSyncSettingsListeners();
    }

    setupSyncSettingsListeners() {
        // Server URL save
        const serverSaveBtn = document.getElementById('sync-server-save-btn');
        if (serverSaveBtn) {
            serverSaveBtn.addEventListener('click', async () => {
                const input = document.getElementById('sync-server-url-input');
                const url = input.value.trim();
                if (!url) { showToast(t('sync:server_url_required'), 'error'); return; }
                await this.app.syncService.setServerUrl(url);
                showToast(t('sync:server_url_saved'), 'success');
            });
        }

        // Server URL reset
        const serverResetBtn = document.getElementById('sync-server-reset-btn');
        if (serverResetBtn) {
            serverResetBtn.addEventListener('click', async () => {
                const defaultUrl = 'https://jijun-server.the-walking-fish.com';
                const input = document.getElementById('sync-server-url-input');
                if (input) input.value = defaultUrl;
                await this.app.syncService.setServerUrl(defaultUrl);
                showToast(t('sync:server_url_reset'), 'success');
            });
        }

        // Sign in
        const signInBtn = document.getElementById('sync-sign-in-btn');
        if (signInBtn) {
            signInBtn.addEventListener('click', async () => {
                try {
                    signInBtn.disabled = true;
                    signInBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t('sync:signing_in')}`;
                    await this.app.syncService.signIn();
                    showToast(t('sync:sign_in_success'), 'success');
                    await this.render();
                } catch (err) {
                    console.error('Sign in error:', err);
                    showToast(t('sync:sign_in_failed', { message: err.message }), 'error');
                    signInBtn.disabled = false;
                    signInBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/></svg> <span class="text-sm font-medium text-gray-700">${t('sync:sign_in_button')}</span>`;
                }
            });
        }

        // Sign out
        const signOutBtn = document.getElementById('sync-sign-out-btn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', async () => {
                if (!(await customConfirm(t('sync:confirm_sign_out')))) return;
                await this.app.syncService.signOut();
                showToast(t('sync:sign_out_success'), 'success');
                await this.render();
            });
        }

        // Backup
        const backupBtn = document.getElementById('sync-backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', async () => {
                try {
                    backupBtn.disabled = true;
                    backupBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t('sync:backing_up')}`;
                    await this.app.syncService.backupToDrive();
                    showToast(t('sync:backup_success'), 'success');
                    await this.render();
                } catch (err) {
                    console.error('Backup error:', err);
                    showToast(t('sync:backup_failed', { message: err.message }), 'error');
                    backupBtn.disabled = false;
                    backupBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> ${t('sync:backup_now')}`;
                }
            });
        }

        // Restore
        const restoreBtn = document.getElementById('sync-restore-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', async () => {
                try {
                    const backups = await this.app.syncService.listBackups();
                    if (backups.length === 0) {
                        showToast(t('sync:no_backups'), 'info');
                        return;
                    }
                    // Show backup selection
                    const listHtml = backups.map((b, i) => {
                        const locale = { 'zh-TW': 'zh-TW', 'zh-CN': 'zh-CN' }[getCurrentLanguage()] || 'en-US';
                        const date = new Date(b.createdTime).toLocaleString(locale);
                        const sizeKB = b.size ? (parseInt(b.size) / 1024).toFixed(1) : '?';
                        return `<button class="restore-backup-item w-full text-left p-3 hover:bg-wabi-bg rounded-lg border border-wabi-border" data-file-id="${b.id}">
                            <p class="text-sm font-medium text-wabi-text-primary">${b.name}</p>
                            <p class="text-xs text-wabi-text-secondary">${date} · ${sizeKB} KB</p>
                        </button>`;
                    }).join('');

                    const modal = document.createElement('div');
                    modal.className = 'fixed inset-0 z-50 flex items-end justify-center bg-black/40';
                    modal.innerHTML = `
                        <div class="bg-wabi-surface w-full max-w-lg rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto animate-slide-up">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-bold text-wabi-primary">${t('sync:restore_select_title')}</h3>
                                <button id="close-restore-modal" class="p-2 text-wabi-text-secondary hover:text-wabi-primary">
                                    <i class="fa-solid fa-xmark text-xl"></i>
                                </button>
                            </div>
                            <div class="space-y-2">${listHtml}</div>
                        </div>
                    `;
                    document.body.appendChild(modal);

                    modal.querySelector('#close-restore-modal').addEventListener('click', () => modal.remove());
                    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

                    modal.querySelectorAll('.restore-backup-item').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            if (!(await customConfirm(t('sync:confirm_restore')))) return;
                            const fileId = btn.dataset.fileId;
                            modal.remove();
                            try {
                                const backupData = await this.app.syncService.restoreFromDrive(fileId);
                                // Use the import logic — create a temporary blob
                                const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
                                const file = new File([blob], 'restore.json', { type: 'application/json' });
                                const result = await this.app.dataService.importData(file);
                                showToast(result.message, result.success ? 'success' : 'error');
                                if (result.success) {
                                    // Reset sync history to avoid replaying old changes
                                    await this.app.syncService.markAllRemoteChangesAsPulled();
                                    this.app.currentHash = null;
                                    window.location.hash = '#home';
                                }
                            } catch (err) {
                                showToast(t('sync:restore_failed', { message: err.message }), 'error');
                            }
                        });
                    });
                } catch (err) {
                    showToast(t('sync:load_backups_failed', { message: err.message }), 'error');
                }
            });
        }

        // Auto backup toggle
        const autoBackupToggle = document.getElementById('sync-auto-backup-toggle');
        if (autoBackupToggle) {
            autoBackupToggle.addEventListener('change', async (e) => {
                const enabled = e.target.checked;
                await this.app.dataService.saveSetting({ key: 'sync_auto_backup_enabled', value: enabled });
                const intervalContainer = document.getElementById('auto-backup-interval-container');
                if (enabled) {
                    const intervalSetting = await this.app.dataService.getSetting('sync_auto_backup_interval');
                    const interval = intervalSetting?.value || 'daily';
                    this.app.syncService.startAutoBackup(interval);
                    if (intervalContainer) intervalContainer.classList.remove('hidden');
                    showToast(t('sync:auto_backup_enabled'), 'success');
                } else {
                    this.app.syncService.stopAutoBackup();
                    if (intervalContainer) intervalContainer.classList.add('hidden');
                    showToast(t('sync:auto_backup_disabled'), 'info');
                }
            });
        }

        // Auto backup interval buttons
        document.querySelectorAll('.auto-backup-interval-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const interval = btn.dataset.interval;
                await this.app.dataService.saveSetting({ key: 'sync_auto_backup_interval', value: interval });
                // Update button styles
                document.querySelectorAll('.auto-backup-interval-btn').forEach(b => {
                    b.className = b.className.replace(/bg-wabi-primary text-wabi-surface border-wabi-primary/g, 'bg-wabi-surface text-wabi-text-primary border-wabi-border hover:border-wabi-primary');
                });
                btn.className = btn.className.replace(/bg-wabi-surface text-wabi-text-primary border-wabi-border hover:border-wabi-primary/g, 'bg-wabi-primary text-wabi-surface border-wabi-primary');
                // Restart auto backup with new interval
                const autoBackupSetting = await this.app.dataService.getSetting('sync_auto_backup_enabled');
                if (autoBackupSetting?.value) {
                    this.app.syncService.startAutoBackup(interval);
                }
                const labels = { daily: t('sync:frequency_daily'), '3days': t('sync:frequency_3days'), weekly: t('sync:frequency_weekly') };
                showToast(t('sync:frequency_set', { label: labels[interval] }), 'success');
            });
        });

        // Auto sync toggle
        const autoSyncToggle = document.getElementById('sync-auto-toggle');
        if (autoSyncToggle) {
            autoSyncToggle.addEventListener('change', async (e) => {
                const enabled = e.target.checked;
                await this.app.dataService.saveSetting({ key: 'sync_auto_enabled', value: enabled });
                if (enabled) {
                    this.app.syncService.startAutoSync(24 * 60 * 60 * 1000);
                    showToast(t('sync:auto_sync_enabled'), 'success');
                } else {
                    this.app.syncService.stopAutoSync();
                    showToast(t('sync:auto_sync_disabled'), 'info');
                }
            });
        }

        // Sync now
        const syncNowBtn = document.getElementById('sync-now-btn');
        if (syncNowBtn) {
            syncNowBtn.addEventListener('click', async () => {
                try {
                    syncNowBtn.disabled = true;
                    syncNowBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t('sync:syncing')}`;
                    await this.app.syncService.performSync();
                    showToast(t('sync:sync_success'), 'success');
                    await this.render();
                } catch (err) {
                    console.error('Sync error:', err);
                    showToast(t('sync:sync_failed', { message: err.message }), 'error');
                    syncNowBtn.disabled = false;
                    syncNowBtn.innerHTML = `<i class="fa-solid fa-rotate"></i> ${t('sync:sync_now')}`;
                }
            });
        }
    }
}
