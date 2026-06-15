import { t, changeLanguage, getCurrentLanguage } from '../i18n.js';
import { showToast, nativeShare, nativeFilePicker, nativeSaveFile, setHapticEnabled, escAttr } from '../utils.js';
import { DARK_THEME_ID } from '../themeManager.js';

export class SettingsPage {
    constructor(app) {
        this.app = app;
    }

    async render() {
        this.app.appContainer.innerHTML = `
            <div class="page active max-w-3xl mx-auto">
                <div class="flex items-center p-4 pb-2 justify-between bg-wabi-bg sticky top-0 z-10">
                    <h2 class="text-wabi-primary text-lg font-bold flex-1 text-center">${t('common:nav.settings')}</h2>
                </div>
                <div class="p-4 space-y-6">
                    <!-- Settings -->
                    <div class="bg-wabi-surface rounded-xl">
                        <h3 class="text-wabi-primary text-base font-bold px-4 pb-2 pt-4">${t('settings:sectionApp')}</h3>

                        ${this.createSettingItem('fa-solid fa-cloud-arrow-down', t('settings:forceUpdate'), 'force-update-btn')}
                        ${this.createSettingItem('fa-solid fa-share-nodes', t('settings:shareApp'), 'share-app-btn')}
                        <div id="install-pwa-btn-container" class="hidden">
                            ${this.createSettingItem('fa-solid fa-mobile-screen-button', t('settings:installApp'), 'install-pwa-btn')}
                        </div>
                        ${this.createSettingItem('fa-solid fa-puzzle-piece', t('settings:plugins'), 'manage-plugins-btn')}
                        ${this.createSettingItem('fa-solid fa-palette', t('settings:themes'), 'manage-themes-btn')}
                    
                        <!-- Language -->
                        <div class="w-full flex items-center gap-4 bg-transparent px-4 min-h-14 justify-between border-b border-wabi-border/30">
                            <div class="flex items-center gap-4">
                                <div class="text-wabi-primary flex items-center justify-center rounded-lg bg-wabi-primary/10 shrink-0 size-10">
                                    <i class="fa-solid fa-language"></i>
                                </div>
                                <div>
                                    <p class="text-wabi-text-primary text-base font-normal">${t('settings:language')}</p>
                                    <p class="text-xs text-wabi-text-secondary">${t('settings:languageSubtitle')}</p>
                                </div>
                            </div>
                            <select id="language-select" class="bg-wabi-surface border border-wabi-border text-wabi-text-primary text-sm rounded-lg focus:ring-wabi-primary focus:border-wabi-primary p-2 outline-none cursor-pointer shrink-0 w-24">
                                <option value="zh-TW">繁體中文</option>
                                <option value="zh-CN">简体中文</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                    
                        <!-- ${t('settings:darkMode')} -->
                        <div class="w-full flex items-center gap-4 bg-transparent px-4 min-h-14 justify-between border-b border-wabi-border/30">
                            <div class="flex items-center gap-4">
                                <div class="text-wabi-primary flex items-center justify-center rounded-lg bg-wabi-primary/10 shrink-0 size-10">
                                    <i class="fa-solid fa-moon"></i>
                                </div>
                                <div>
                                    <p class="text-wabi-text-primary text-base font-normal">${t('settings:darkMode')}</p>
                                    <p class="text-xs text-wabi-text-secondary">${t('settings:darkModeSubtitle')}</p>
                                </div>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="dark-mode-toggle" class="sr-only peer">
                                <div class="w-11 h-6 bg-wabi-bg border border-wabi-border rounded-full peer peer-focus:ring-4 peer-focus:ring-wabi-accent/30 peer-checked:bg-wabi-primary peer-checked:border-wabi-primary transition-colors"></div>
                                <span class="absolute left-1 top-1 w-4 h-4 bg-wabi-surface rounded-full transition-transform peer-checked:translate-x-full"></span>
                            </label>
                        </div>
                        
                        <!-- ${t('settings:hapticFeedback')} -->
                        <div class="w-full flex items-center gap-4 bg-transparent px-4 min-h-14 justify-between border-b border-wabi-border/30">
                            <div class="flex items-center gap-4">
                                <div class="text-wabi-primary flex items-center justify-center rounded-lg bg-wabi-primary/10 shrink-0 size-10">
                                    <i class="fa-solid fa-mobile-button"></i>
                                </div>
                                <div>
                                    <p class="text-wabi-text-primary text-base font-normal">${t('settings:hapticFeedback')}</p>
                                    <p class="text-xs text-wabi-text-secondary">${t('settings:hapticFeedbackSubtitle')}</p>
                                </div>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="haptic-toggle" class="sr-only peer">
                                <div class="w-11 h-6 bg-wabi-bg border border-wabi-border rounded-full peer peer-focus:ring-4 peer-focus:ring-wabi-accent/30 peer-checked:bg-wabi-primary peer-checked:border-wabi-primary transition-colors"></div>
                                <span class="absolute left-1 top-1 w-4 h-4 bg-wabi-surface rounded-full transition-transform peer-checked:translate-x-full"></span>
                            </label>
                        </div>
                    </div>

                    <!-- ${t('settings:sectionData')} -->
                    <div class="bg-wabi-surface rounded-xl">
                        <h3 class="text-wabi-primary text-base font-bold px-4 pb-2 pt-4">${t('settings:sectionData')}</h3>
                        ${this.createSettingItem('fa-solid fa-book-bookmark', t('settings:ledgerManagement'), 'manage-ledgers-btn')}
                        ${this.createSettingItem('fa-solid fa-cloud', t('settings:cloudSync'), 'cloud-sync-btn')}
                        ${this.createSettingItem('fa-solid fa-download', t('settings:exportData'), 'export-data-btn')}
                        ${this.createSettingItem('fa-solid fa-upload', t('settings:importData'), 'import-data-btn')}
                        <input type="file" id="import-file-input" accept=".json" class="hidden">
                    </div>
                    <!-- ${t('settings:sectionAbout')} -->
                    <div class="bg-wabi-surface rounded-xl">
                        <h3 class="text-wabi-primary text-base font-bold px-4 pb-2 pt-4">${t('settings:sectionAbout')}</h3>
                        ${this.createSettingItem('fa-solid fa-arrows-rotate', t('settings:checkUpdate'), 'check-update-btn')}
                        ${this.createSettingItem('fa-solid fa-file-lines', t('settings:changelog'), 'changelog-btn')}
                        ${this.createSettingItem('fa-solid fa-shield-halved', t('settings:privacy'), 'privacy-btn')}
                        ${this.createSettingItem('fa-solid fa-scale-balanced', t('settings:license'), 'license-btn')}
                        <a id="github-repo-link" href="https://github.com/ADT109119/jijun" target="_blank" rel="noopener noreferrer" class="w-full flex items-center gap-4 bg-transparent px-4 min-h-14 justify-between hover:bg-wabi-bg/50">
                            <div class="flex items-center gap-4">
                                <div class="text-wabi-primary flex items-center justify-center rounded-lg bg-wabi-primary/10 shrink-0 size-10">
                                    <i class="fa-brands fa-github"></i>
                                </div>
                                <p class="text-wabi-text-primary text-base font-normal">${t('settings:githubRepo')}</p>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                                <span id="github-stars" class="flex items-center gap-1 text-wabi-text-secondary text-sm">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>
                                    <span id="star-count">${t('common:messages:loading')}</span>
                                </span>
                                <i class="fa-solid fa-chevron-right text-wabi-text-secondary"></i>
                            </div>
                        </a>
                        <div class="pl-16 pr-4"><hr class="border-wabi-border"/></div>
                        <div id="version-info" class="px-4 py-3 text-xs text-center text-wabi-text-secondary"></div>
                    </div>

                    <!-- ${t('settings:sectionSponsor')} -->
                    <div class="bg-wabi-surface rounded-xl">
                        <h3 class="text-wabi-primary text-base font-bold px-4 pb-2 pt-4">${t('settings:sectionSponsor')}</h3>
                        <a href="https://buymeacoffee.com/thewalkingfish" target="_blank" rel="noopener noreferrer" class="w-full flex items-center gap-4 bg-transparent px-4 min-h-14 justify-between hover:bg-wabi-bg/50">
                            <div class="flex items-center gap-4">
                                <div class="text-wabi-primary flex items-center justify-center rounded-lg bg-wabi-primary/10 shrink-0 size-10">
                                    <i class="fa-solid fa-mug-hot"></i>
                                </div>
                                <p class="text-wabi-text-primary text-base font-normal">${t('settings:buyMeACoffee')}</p>
                            </div>
                            <div class="shrink-0 text-wabi-text-secondary">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            </div>
                        </a>
                    </div>

                    <!-- ${t('settings:sectionExperimental')} -->
                    <div class="bg-wabi-surface rounded-xl">
                        <h3 class="text-wabi-primary text-base font-bold px-4 pb-2 pt-4">${t('settings:sectionExperimental')}</h3>
                        <div class="w-full flex items-center gap-4 bg-transparent px-4 min-h-14 justify-between">
                            <div class="flex items-center gap-4">
                                <div class="text-wabi-primary flex items-center justify-center rounded-lg bg-wabi-primary/10 shrink-0 size-10">
                                    <i class="fa-solid fa-wallet"></i>
                                </div>
                                <p class="text-wabi-text-primary text-base font-normal">${t('settings:experimentalAdvancedMode')}</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="advanced-account-mode-toggle" class="sr-only peer">
                                <div class="w-11 h-6 bg-wabi-bg border border-wabi-border rounded-full peer peer-focus:ring-4 peer-focus:ring-wabi-accent/30 peer-checked:bg-wabi-primary peer-checked:border-wabi-primary transition-colors"></div>
                                <span class="absolute left-1 top-1 w-4 h-4 bg-wabi-surface rounded-full transition-transform peer-checked:translate-x-full"></span>
                            </label>
                        </div>
                        <div id="manage-accounts-link-container" class="hidden">
                            ${this.createSettingItem('fa-solid fa-credit-card', t('settings:experimentalAccountManagement'), 'manage-accounts-btn')}
                        </div>
                        ${this.createSettingItem('fa-solid fa-repeat', t('settings:experimentalRecurring'), 'manage-recurring-btn')}
                        <!-- ${t('settings:experimentalAmortization')} -->
                        <div class="w-full flex items-center gap-4 bg-transparent px-4 min-h-14 justify-between">
                            <div class="flex items-center gap-4">
                                <div class="text-wabi-primary flex items-center justify-center rounded-lg bg-wabi-primary/10 shrink-0 size-10">
                                    <i class="fa-solid fa-chart-gantt"></i>
                                </div>
                                <p class="text-wabi-text-primary text-base font-normal">${t('settings:experimentalAmortization')}</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="amortization-management-toggle" class="sr-only peer">
                                <div class="w-11 h-6 bg-wabi-bg border border-wabi-border rounded-full peer peer-focus:ring-4 peer-focus:ring-wabi-accent/30 peer-checked:bg-wabi-primary peer-checked:border-wabi-primary transition-colors"></div>
                                <span class="absolute left-1 top-1 w-4 h-4 bg-wabi-surface rounded-full transition-transform peer-checked:translate-x-full"></span>
                            </label>
                        </div>
                        <div id="manage-amortizations-link-container" class="hidden">
                             ${this.createSettingItem('fa-solid fa-chart-gantt', t('settings:experimentalAmortization'), 'manage-amortizations-btn')}
                        </div>
                        <!-- ${t('settings:experimentalDebt')} -->
                        <div class="w-full flex items-center gap-4 bg-transparent px-4 min-h-14 justify-between">
                            <div class="flex items-center gap-4">
                                <div class="text-wabi-primary flex items-center justify-center rounded-lg bg-wabi-primary/10 shrink-0 size-10">
                                    <i class="fa-solid fa-handshake"></i>
                                </div>
                                <p class="text-wabi-text-primary text-base font-normal">${t('settings:experimentalDebt')}</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="debt-management-toggle" class="sr-only peer">
                                <div class="w-11 h-6 bg-wabi-bg border border-wabi-border rounded-full peer peer-focus:ring-4 peer-focus:ring-wabi-accent/30 peer-checked:bg-wabi-primary peer-checked:border-wabi-primary transition-colors"></div>
                                <span class="absolute left-1 top-1 w-4 h-4 bg-wabi-surface rounded-full transition-transform peer-checked:translate-x-full"></span>
                            </label>
                        </div>
                        <div id="manage-debts-link-container" class="hidden">
                             ${this.createSettingItem('fa-solid fa-receipt', t('settings:experimentalDebt'), 'manage-debts-btn')}
                        </div>

                        <!-- Default Records Period -->
                        <div class="w-full flex items-center gap-4 bg-transparent px-4 min-h-14 justify-between border-b border-wabi-border/50">
                            <div class="flex items-center gap-4">
                                <div class="text-wabi-primary flex items-center justify-center rounded-lg bg-wabi-primary/10 shrink-0 size-10">
                                    <i class="fa-solid fa-clock-rotate-left"></i>
                                </div>
                                <div>
                                    <p class="text-wabi-text-primary text-base font-normal">${t('settings:defaultPeriodLabel')}</p>
                                    <p class="text-xs text-wabi-text-secondary">${t('settings:defaultPeriodSubtitle')}</p>
                                </div>
                            </div>
                        </div>
                        <div id="default-period-container" class="px-4 pb-4 border-b border-wabi-border/50 bg-wabi-bg/30">
                            <div class="mt-2">
                                <select id="default-period-select" class="bg-wabi-surface border border-wabi-border text-wabi-text-primary text-sm rounded-lg focus:ring-wabi-primary focus:border-wabi-primary w-full p-2 outline-none appearance-none">
                                    <option value="week">${t('common:time.thisWeek')}</option>
                                    <option value="month">${t('common:time.thisMonth')}</option>
                                    <option value="today">${t('common:time.today')}</option>
                                    <option value="last7days">${t('settings:periodLast7Days')}</option>
                                    <option value="last">${t('settings:periodLastRange')}</option>
                                </select>
                            </div>
                        </div>

                        
                        <!-- Daily Reminder Feature -->
                        <div class="w-full flex items-center gap-4 bg-transparent px-4 py-3 justify-between border-b border-wabi-border/50">
                            <div class="flex items-center gap-4">
                                <div class="text-wabi-primary flex items-center justify-center rounded-lg bg-wabi-primary/10 shrink-0 size-10">
                                    <i class="fa-solid fa-bell"></i>
                                </div>
                                <div>
                                    <p class="text-wabi-text-primary text-base font-normal">${t('settings:dailyReminder')}</p>
                                    <p class="text-xs text-wabi-text-secondary">${t('settings:dailyReminderSubtitle')}</p>
                                </div>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="reminder-toggle" class="sr-only peer">
                                <div class="w-11 h-6 bg-wabi-bg border border-wabi-border rounded-full peer peer-focus:ring-4 peer-focus:ring-wabi-accent/30 peer-checked:bg-wabi-primary peer-checked:border-wabi-primary transition-colors"></div>
                                <span class="absolute left-1 top-1 w-4 h-4 bg-wabi-surface rounded-full transition-transform peer-checked:translate-x-full"></span>
                            </label>
                        </div>
                        <div id="reminder-settings-container" class="hidden px-4 pb-4 border-b border-wabi-border/50 bg-wabi-bg/30">
                            <div class="mt-4 flex items-center justify-between">
                                <label class="text-sm font-medium text-wabi-text-primary">${t('settings:reminderTimeLabel')}</label>
                                <input type="time" id="reminder-time" class="bg-wabi-surface border border-wabi-border text-wabi-text-primary text-sm rounded-lg focus:ring-wabi-primary focus:border-wabi-primary p-2 outline-none">
                            </div>
                            <div class="mt-4">
                                <label class="text-sm font-medium text-wabi-text-primary block mb-2">${t('settings:reminderConditionLabel')}</label>
                                <select id="reminder-condition" class="bg-wabi-surface border border-wabi-border text-wabi-text-primary text-sm rounded-lg focus:ring-wabi-primary focus:border-wabi-primary w-full p-2 outline-none appearance-none">
                                    <option value="always">${t('settings:remindAlways')}</option>
                                    <option value="no_records">${t('settings:remindNoRecords')}</option>
                                </select>
                            </div>
                        </div>

                        ${this.createSettingItem('fa-solid fa-rectangle-ad', t('settings:rewardAd'), 'sponsor-reward-ad-btn')}

                    </div>

                    <!-- Banner Ad -->
                    <div id="settings-banner-ad" class="rounded-xl overflow-hidden"></div>

                    <div class="pb-24"></div>
                </div>
            </div>
        `;
        await this.setupSettingsPageListeners();
        // Add listener for plugin manager button
        const managePluginsBtn = document.getElementById('manage-plugins-btn');
        if (managePluginsBtn) {
            managePluginsBtn.addEventListener('click', () => {
                window.location.hash = '#plugins';
            });
        }
        // Themes manager button
        const manageThemesBtn = document.getElementById('manage-themes-btn');
        if (manageThemesBtn) {
            manageThemesBtn.addEventListener('click', () => {
                window.location.hash = '#themes';
            });
        }
        // Ledger management button
        const manageLedgersBtn = document.getElementById('manage-ledgers-btn');
        if (manageLedgersBtn) {
            manageLedgersBtn.addEventListener('click', () => {
                window.location.hash = '#ledgers';
            });
        }
        // Cloud sync button
        const cloudSyncBtn = document.getElementById('cloud-sync-btn');
        if (cloudSyncBtn) {
            cloudSyncBtn.addEventListener('click', () => {
                window.location.hash = '#sync-settings';
            });
        }
        // ${t('settings:rewardAd')}
        const rewardAdBtn = document.getElementById('sponsor-reward-ad-btn');
        if (rewardAdBtn) {
            rewardAdBtn.addEventListener('click', async () => {
                try {
                    const granted = await this.app.rewardService.showRewardedAd();
                    if (granted) {
                        this.render();
                    }
                } catch (e) {
                    console.warn(t('settings:rewardAdFailed'), e);
                }
            });
        }
        // 渲染底部橫幅廣告
        this.app.rewardService.renderBannerAd(document.getElementById('settings-banner-ad')).catch(() => {});

        // PWA install button visibility
        if (this.app.deferredInstallPrompt) {
            const installBtnContainer = document.getElementById('install-pwa-btn-container');
            if (installBtnContainer) {
                installBtnContainer.classList.remove('hidden');
            }
        }
    }

    createSettingItem(icon, text, id) {
        return `
            <button id="${id}" class="w-full flex items-center gap-4 bg-transparent px-4 min-h-14 justify-between hover:bg-wabi-bg/50">
                <div class="flex items-center gap-4">
                    <div class="text-wabi-primary flex items-center justify-center rounded-lg bg-wabi-primary/10 shrink-0 size-10">
                        <i class="${icon}"></i>
                    </div>
                    <p class="text-wabi-text-primary text-base font-normal">${text}</p>
                </div>
                <div class="shrink-0 text-wabi-text-secondary">
                    <i class="fa-solid fa-chevron-right"></i>
                </div>
            </button>
            <div class="pl-16 pr-4"><hr class="border-wabi-border"/></div>
        `.trim();
    }

    async setupSettingsPageListeners() {
        document.getElementById('export-data-btn').addEventListener('click', async () => {
            await this.showExportOptionsModal();
        });

        document.getElementById('import-data-btn').addEventListener('click', async () => {
            const file = await nativeFilePicker({ accept: '.json' });
            if (!file) return;

            this.showConfirmModal(t('settings:importConfirm'), async () => {
                try {
                    await this.app.dataService.importData(file);
                    showToast(t('settings:importSuccess'), 'success');
                    setTimeout(() => window.location.reload(), 2000);
                } catch (error) {
                    console.error(t('settings:importFailed'), error);
                    showToast(t('settings:importFailed'), 'error');
                }
            });
        });

        const importFileInput = document.getElementById('import-file-input');
        importFileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            this.showConfirmModal(t('settings:importConfirm'), async () => {
                try {
                    await this.app.dataService.importData(file);
                    showToast(t('settings:importSuccess'), 'success');
                    setTimeout(() => window.location.reload(), 2000);
                } catch (error) {
                    console.error(t('settings:importFailed'), error);
                    showToast(t('settings:importFailed'), 'error');
                }
            });
            importFileInput.value = ''; // Reset input
        });

        document.getElementById('check-update-btn').addEventListener('click', () => this.checkForUpdates());
        document.getElementById('changelog-btn').addEventListener('click', () => this.app.changelogManager.showChangelogModal());
        document.getElementById('privacy-btn').addEventListener('click', () => { window.location.hash = '#privacy'; });
        document.getElementById('license-btn').addEventListener('click', () => { window.location.hash = '#license'; });

        // New Listeners
        document.getElementById('force-update-btn').addEventListener('click', () => this.forceUpdate());

        const installBtn = document.getElementById('install-pwa-btn');
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (this.app.deferredInstallPrompt) {
                    this.app.deferredInstallPrompt.prompt();
                    const { outcome } = await this.app.deferredInstallPrompt.userChoice;
                    console.log(`User response to the install prompt: ${outcome}`);
                    this.app.deferredInstallPrompt = null;
                    document.getElementById('install-pwa-btn-container').classList.add('hidden');
                }
            });
        }

        const shareBtn = document.getElementById('share-app-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                nativeShare({
                    title: t('common:appName'),
                    text: t('settings:shareText'),
                    url: window.location.origin,
                });
            });
        }

        const versionInfo = document.getElementById('version-info');
        if (versionInfo) {
            const latestVersion = this.app.changelogManager.getAllVersions()[0];
            versionInfo.textContent = t('settings:version', { version: latestVersion.version });
        }

        // GitHub Star 數量 (透過 GitHub API 動態取得)
        const starCount = document.getElementById('star-count');
        if (starCount) {
            fetch('https://api.github.com/repos/ADT109119/jijun')
                .then(res => res.json())
                .then(data => {
                    starCount.textContent = data.stargazers_count || 0;
                })
                .catch(() => {
                    starCount.textContent = '';
                });
        }

        // 深色模式快速切換
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            // 標記目前是否已是深色主題
            const activeSetting = await this.app.dataService.getSetting('activeThemeId');
            darkModeToggle.checked = activeSetting?.value === DARK_THEME_ID;

            darkModeToggle.addEventListener('change', async (e) => {
                if (e.target.checked) {
                    // 套用深色主題
                    const darkTheme = await this.app.dataService.getTheme(DARK_THEME_ID);
                    if (darkTheme) {
                        await this.app.themeManager.applyTheme(darkTheme);
                        showToast(t('settings:darkModeEnabled'), 'success');
                    } else {
                        showToast(t('settings:darkThemeNotInstalled'), 'error');
                        e.target.checked = false;
                    }
                } else {
                    // ${t('settings:darkModeDisabled')}
                    await this.app.themeManager.clearTheme();
                    showToast(t('settings:darkModeDisabled'), 'success');
                }
            });
        }

        // 按鍵震動回饋切換
        const hapticToggle = document.getElementById('haptic-toggle');
        if (hapticToggle) {
            this.app.dataService.getSetting('enableHapticFeedback').then(setting => {
                const isEnabled = setting?.value !== false;
                hapticToggle.checked = isEnabled;
                setHapticEnabled(isEnabled);
            });

            hapticToggle.addEventListener('change', async (e) => {
                const isEnabled = e.target.checked;
                await this.app.dataService.saveSetting({ key: 'enableHapticFeedback', value: isEnabled });
                setHapticEnabled(isEnabled);
                showToast(t('settings:hapticToggled', { state: isEnabled ? t('common:enabled') : t('common:disabled') }));
            });
        }

        const advancedModeToggle = document.getElementById('advanced-account-mode-toggle');
        if (advancedModeToggle) {
            this.app.dataService.getSetting('advancedAccountModeEnabled').then(setting => {
                const isEnabled = !!setting?.value;
                advancedModeToggle.checked = isEnabled;
                if (isEnabled) {
                    document.getElementById('manage-accounts-link-container').classList.remove('hidden');
                }
            });

            advancedModeToggle.addEventListener('change', async (e) => {
                const isEnabled = e.target.checked;
                await this.app.dataService.saveSetting({ key: 'advancedAccountModeEnabled', value: isEnabled });
                if (isEnabled) {
                    await this.handleAdvancedModeActivation();
                }
                showToast(t('settings:advancedModeToggled', { state: isEnabled ? t('common:enabled') : t('common:disabled') }));
                setTimeout(() => window.location.reload(), 1500);
            });
        }

        const manageAccountsBtn = document.getElementById('manage-accounts-btn');
        if (manageAccountsBtn) {
            manageAccountsBtn.addEventListener('click', () => {
                window.location.hash = '#accounts';
            });
        }

        const manageRecurringBtn = document.getElementById('manage-recurring-btn');
        if (manageRecurringBtn) {
            manageRecurringBtn.addEventListener('click', () => {
                window.location.hash = '#recurring';
            });
        }

        // Amortization Management Toggle
        const amortizationManagementToggle = document.getElementById('amortization-management-toggle');
        if (amortizationManagementToggle) {
            this.app.dataService.getSetting('amortizationEnabled').then(setting => {
                const isEnabled = !!setting?.value;
                amortizationManagementToggle.checked = isEnabled;
                if (isEnabled) {
                    document.getElementById('manage-amortizations-link-container').classList.remove('hidden');
                }
            });

            amortizationManagementToggle.addEventListener('change', async (e) => {
                const isEnabled = e.target.checked;
                await this.app.dataService.saveSetting({ key: 'amortizationEnabled', value: isEnabled });
                if (isEnabled) {
                    document.getElementById('manage-amortizations-link-container').classList.remove('hidden');
                } else {
                    document.getElementById('manage-amortizations-link-container').classList.add('hidden');
                }
                showToast(t('settings:amortizationToggled', { state: isEnabled ? t('common:enabled') : t('common:disabled') }));
            });
        }

        const manageAmortizationsBtn = document.getElementById('manage-amortizations-btn');
        if (manageAmortizationsBtn) {
            manageAmortizationsBtn.addEventListener('click', () => {
                window.location.hash = '#amortizations';
            });
        }

        // Debt Management Toggle
        const debtManagementToggle = document.getElementById('debt-management-toggle');
        if (debtManagementToggle) {
            this.app.dataService.getSetting('debtManagementEnabled').then(setting => {
                const isEnabled = !!setting?.value;
                debtManagementToggle.checked = isEnabled;
                if (isEnabled) {
                    document.getElementById('manage-debts-link-container').classList.remove('hidden');
                }
            });

            debtManagementToggle.addEventListener('change', async (e) => {
                const isEnabled = e.target.checked;
                await this.app.dataService.saveSetting({ key: 'debtManagementEnabled', value: isEnabled });
                if (isEnabled) {
                    document.getElementById('manage-debts-link-container').classList.remove('hidden');
                } else {
                    document.getElementById('manage-debts-link-container').classList.add('hidden');
                }
                showToast(t('settings:debtToggled', { state: isEnabled ? t('common:enabled') : t('common:disabled') }));
            });
        }

        const manageDebtsBtn = document.getElementById('manage-debts-btn');
        if (manageDebtsBtn) {
            manageDebtsBtn.addEventListener('click', () => {
                window.location.hash = '#debts';
            });
        }

        // Default Records Period Setting
        const defaultPeriodSelect = document.getElementById('default-period-select');
        if (defaultPeriodSelect) {
            this.app.dataService.getSetting('defaultRecordsPeriod').then(setting => {
                const periodValue = setting?.value || 'month';
                defaultPeriodSelect.value = periodValue;
            });

            defaultPeriodSelect.addEventListener('change', async (e) => {
                await this.app.dataService.saveSetting({ key: 'defaultRecordsPeriod', value: e.target.value });
                showToast(t('settings:defaultPeriodSet'));
            });
        }

        // Daily Reminder UI Setup
        const reminderToggle = document.getElementById('reminder-toggle');
        const reminderSettingsContainer = document.getElementById('reminder-settings-container');
        const reminderTimeInput = document.getElementById('reminder-time');
        const reminderConditionSelect = document.getElementById('reminder-condition');

        if (reminderToggle) {
            Promise.all([
                this.app.dataService.getSetting('reminderEnabled'),
                this.app.dataService.getSetting('reminderTime'),
                this.app.dataService.getSetting('reminderCondition')
            ]).then(([enabledSetting, timeSetting, conditionSetting]) => {
                const isEnabled = !!enabledSetting?.value;
                reminderToggle.checked = isEnabled;
                reminderTimeInput.value = timeSetting?.value || '20:00';
                reminderConditionSelect.value = conditionSetting?.value || 'no_records';
                
                if (isEnabled) {
                    reminderSettingsContainer.classList.remove('hidden');
                }
            });

            const updateReminderLogic = async () => {
                const isEnabled = reminderToggle.checked;
                const timeStr = reminderTimeInput.value || '20:00';
                const condition = reminderConditionSelect.value || 'always';

                await this.app.dataService.saveSetting({ key: 'reminderEnabled', value: isEnabled });
                await this.app.dataService.saveSetting({ key: 'reminderTime', value: timeStr });
                await this.app.dataService.saveSetting({ key: 'reminderCondition', value: condition });

                if (isEnabled) {
                    const hasPerm = await this.app.notificationService.requestPermission();
                    if (!hasPerm) {
                        showToast(t('settings:reminderPermissionRequired'), 'warning');
                        reminderToggle.checked = false;
                        reminderSettingsContainer.classList.add('hidden');
                        await this.app.dataService.saveSetting({ key: 'reminderEnabled', value: false });
                        return;
                    }
                }
                
                await this.app.notificationService.applyCurrentSettings();
            };

            reminderToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    reminderSettingsContainer.classList.remove('hidden');
                } else {
                    reminderSettingsContainer.classList.add('hidden');
                }
                updateReminderLogic();
            });

            reminderTimeInput.addEventListener('change', updateReminderLogic);
            reminderConditionSelect.addEventListener('change', updateReminderLogic);
        }

        // Language selector
        const langSelect = document.getElementById('language-select');
        if (langSelect) {
            langSelect.value = getCurrentLanguage();
            langSelect.addEventListener('change', (e) => {
                changeLanguage(e.target.value);
            });
        }
    }

    async showExportOptionsModal() {
        const debtEnabled = await this.app.dataService.getSetting('debtManagementEnabled');
        const showDebtOption = !!debtEnabled?.value;
        const advancedModeEnabled = await this.app.dataService.getSetting('advancedAccountModeEnabled');
        const showAccountOption = !!advancedModeEnabled?.value;

        const modal = document.createElement('div');
        modal.id = 'export-options-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-wabi-bg rounded-lg max-w-sm w-full p-6">
                <h3 class="text-lg font-bold text-wabi-primary mb-4">${t('settings:exportTitle')}</h3>
                <div class="space-y-3 mb-6">
                    <label class="flex items-center gap-3 p-3 bg-wabi-surface rounded-lg border border-wabi-border cursor-pointer">
                        <input type="checkbox" id="export-records" checked class="w-5 h-5 rounded border-wabi-border text-wabi-primary focus:ring-wabi-primary">
                        <div>
                            <p class="font-medium text-wabi-text-primary">${t('settings:exportRecords')}</p>
                            <p class="text-xs text-wabi-text-secondary">${t('settings:exportRecordsSubtitle')}</p>
                        </div>
                    </label>
                    ${showAccountOption ? `
                    <label class="flex items-center gap-3 p-3 bg-wabi-surface rounded-lg border border-wabi-border cursor-pointer">
                        <input type="checkbox" id="export-accounts" checked class="w-5 h-5 rounded border-wabi-border text-wabi-primary focus:ring-wabi-primary">
                        <div>
                            <p class="font-medium text-wabi-text-primary">${t('settings:exportAccounts')}</p>
                            <p class="text-xs text-wabi-text-secondary">${t('settings:exportAccountsSubtitle')}</p>
                        </div>
                    </label>
                    ` : ''}
                    ${showDebtOption ? `
                    <label class="flex items-center gap-3 p-3 bg-wabi-surface rounded-lg border border-wabi-border cursor-pointer">
                        <input type="checkbox" id="export-debts" checked class="w-5 h-5 rounded border-wabi-border text-wabi-primary focus:ring-wabi-primary">
                        <div>
                            <p class="font-medium text-wabi-text-primary">${t('settings:exportDebts')}</p>
                            <p class="text-xs text-wabi-text-secondary">${t('settings:exportDebtsSubtitle')}</p>
                        </div>
                    </label>
                    ` : ''}
                    <label class="flex items-center gap-3 p-3 bg-wabi-surface rounded-lg border border-wabi-border cursor-pointer">
                        <input type="checkbox" id="export-categories" checked class="w-5 h-5 rounded border-wabi-border text-wabi-primary focus:ring-wabi-primary">
                        <div>
                            <p class="font-medium text-wabi-text-primary">${t('settings:exportCategories')}</p>
                            <p class="text-xs text-wabi-text-secondary">${t('settings:exportCategoriesSubtitle')}</p>
                        </div>
                    </label>
                </div>
                <div class="flex space-x-3">
                    <button id="confirm-export-btn" class="flex-1 bg-wabi-primary hover:bg-wabi-primary-hover text-wabi-surface font-bold py-3 rounded-lg transition-colors shadow-sm">
                        <i class="fa-solid fa-download mr-2"></i>${t('settings:exportButton')}
                    </button>
                    <button id="cancel-export-btn" class="px-6 bg-wabi-surface border border-wabi-border hover:bg-wabi-bg text-wabi-text-primary py-3 rounded-lg transition-colors">
                        ${t('common:buttons.cancel')}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();

        modal.querySelector('#cancel-export-btn').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        modal.querySelector('#confirm-export-btn').addEventListener('click', async () => {
            const options = {
                includeRecords: modal.querySelector('#export-records')?.checked ?? true,
                includeAccounts: modal.querySelector('#export-accounts')?.checked ?? true,
                includeDebts: modal.querySelector('#export-debts')?.checked ?? true,
                includeCategories: modal.querySelector('#export-categories')?.checked ?? true,
            };

            try {
                const exportData = await this.app.dataService.exportData(options);
                if (exportData) {
                    const content = typeof exportData === 'string' ? exportData : JSON.stringify(exportData, null, 2);
                    const fileName = `${t('settings:exportFileName')}_${new Date().toISOString().split('T')[0]}.json`;
                    await nativeSaveFile(fileName, content);
                }
                showToast(t('settings:exportSuccess'), 'success');
                closeModal();
            } catch (error) {
                console.error(t('settings:exportFailed'), error);
                showToast(t('settings:exportFailed'), 'error');
            }
        });
    }

    async checkForUpdates() {
        if (!('serviceWorker' in navigator)) {
            showToast(t('settings:swNotSupported'), 'warning');
            return;
        }
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
            showToast(t('settings:swNotRegistered'), 'error');
            return;
        }

        showToast(t('settings:swChecking'));
        await registration.update();

        if (registration.waiting) {
            this.showUpdateAvailable(registration);
        } else {
            showToast(t('settings:swUpToDate'), 'success');
        }
    }

    async forceUpdate() {
        this.showConfirmModal(t('settings:forceUpdateConfirm'), async () => {
            showToast(t('settings:forceUpdateProgress'));
            try {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
                window.location.reload(true);
            } catch (error) {
                console.error(t('settings:forceUpdateFailed'), error);
                showToast(t('settings:forceUpdateFailed'), 'error');
            }
        });
    }

    showConfirmModal(message, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 backdrop-blur-[2px]';
        modal.innerHTML = `
            <div class="bg-wabi-bg rounded-lg max-w-sm w-full p-6 text-center shadow-xl">
                <div class="size-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fa-solid fa-triangle-exclamation text-2xl text-wabi-expense"></i>
                </div>
                <h3 class="text-xl font-bold text-wabi-expense mb-2">${t('settings:confirmTitle')}</h3>
                <p class="text-wabi-text-primary font-medium mb-6">${escAttr(message)}</p>
                <div class="flex space-x-3">
                    <button id="settings-confirm-ok" class="flex-1 bg-wabi-expense hover:bg-red-600 text-wabi-surface font-bold py-3 rounded-lg transition-colors shadow-sm">
                        ${t('settings:confirmOk')}
                    </button>
                    <button id="settings-confirm-cancel" class="px-6 bg-wabi-surface border border-wabi-border hover:bg-wabi-bg text-wabi-text-primary py-3 rounded-lg transition-colors">
                        ${t('common:buttons.cancel')}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#settings-confirm-cancel').addEventListener('click', () => modal.remove());
        modal.querySelector('#settings-confirm-ok').addEventListener('click', () => {
            modal.remove();
            onConfirm();
        });
    }

    showAlertModal(title, message, icon = 'fa-solid fa-circle-info', iconColor = 'text-wabi-primary') {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 backdrop-blur-[2px]';
        modal.innerHTML = `
            <div class="bg-wabi-bg rounded-lg max-w-sm w-full p-6 text-center shadow-xl">
                <div class="size-12 bg-wabi-bg rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="${escAttr(icon)} text-2xl ${escAttr(iconColor)}"></i>
                </div>
                <h3 class="text-xl font-bold text-wabi-primary mb-2">${escAttr(title)}</h3>
                <p class="text-wabi-text-primary font-medium mb-6">${escAttr(message)}</p>
                <button id="settings-alert-ok" class="w-full bg-wabi-primary hover:bg-wabi-primary-hover text-wabi-surface font-bold py-3 rounded-lg transition-colors shadow-sm">
                    ${t('settings:alertOk')}
                </button>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#settings-alert-ok').addEventListener('click', () => modal.remove());
    }

    showUpdateAvailable(registration) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.innerHTML = `
            <span>${t('settings:swNewVersion')}</span>
            <button id="update-now-btn" class="ml-4 font-bold underline">${t('settings:swUpdateNow')}</button>
        `;
        toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg opacity-0 transition-opacity duration-300 z-[100] text-wabi-surface bg-wabi-primary toast-show';

        document.getElementById('update-now-btn').addEventListener('click', () => {
            if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            toast.classList.replace('toast-show', 'toast-hide');
            // reset toast inner HTML for subsequent uses
            setTimeout(() => {
                toast.innerHTML = '<span id="toast-message"></span>';
            }, 300);
        });
    }

    async handleAdvancedModeActivation() {
        const accounts = await this.app.dataService.getAccounts();
        let defaultAccount;

        if (accounts.length === 0) {
            console.log('No accounts found, creating a default account.');
            const newAccount = {
            name: t('settings:defaultAccountName'),
            balance: 0,
            type: 'cash',
            icon: 'fa-solid fa-money-bill-wave',
            color: 'bg-green-500'
        };
        const newAccountId = await this.app.dataService.addAccount(newAccount);
        defaultAccount = await this.app.dataService.getAccount(newAccountId);
        showToast(t('settings:defaultAccountCreated', { accountName: t('settings:defaultAccountName') }));
        } else {
            defaultAccount = accounts[0];
        }

        if (!defaultAccount) {
            console.error('Failed to get or create a default account.');
            return;
        }

        const allRecords = await this.app.dataService.getRecords();
        const recordsToUpdate = allRecords.filter(r => r.accountId === undefined);

        if (recordsToUpdate.length > 0) {
            console.log(`Migrating ${recordsToUpdate.length} records to default account...`);
            for (const record of recordsToUpdate) {
                await this.app.dataService.updateRecord(record.id, { ...record, accountId: defaultAccount.id });
            }
            console.log('Record migration complete.');
            showToast(t('settings:recordsMigrated', { count: recordsToUpdate.length }));
        }
    }
}
