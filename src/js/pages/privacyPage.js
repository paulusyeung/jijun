import { t } from '../i18n.js';

export class PrivacyPage {
    constructor(app) {
        this.app = app;
    }

    async render() {
        this.app.appContainer.innerHTML = `
            <div class="page active p-4 pb-24 md:pb-8 max-w-3xl mx-auto">
                <div class="flex items-center justify-between mb-6">
                    <a href="#settings" class="text-wabi-text-secondary hover:text-wabi-primary">
                        <i class="fa-solid fa-chevron-left text-xl"></i>
                    </a>
                    <h1 class="text-xl font-bold text-wabi-primary">${t('common:privacy.title')}</h1>
                    <div class="w-6"></div>
                </div>
                <div class="bg-wabi-surface rounded-xl shadow-sm border border-wabi-border p-6 mb-8 text-wabi-text-primary space-y-4 leading-relaxed">
                    <p>${t('common:privacy.intro')}</p>
                    
                    <h2 class="text-lg font-bold text-wabi-primary mt-6">${t('common:privacy.section1_title')}</h2>
                    <p>${t('common:privacy.section1_body')}</p>
                    
                    <h2 class="text-lg font-bold text-wabi-primary mt-6">${t('common:privacy.section2_title')}</h2>
                    <p>${t('common:privacy.section2_body')}</p>
                    
                    <h2 class="text-lg font-bold text-wabi-primary mt-6">${t('common:privacy.section3_title')}</h2>
                    <p>${t('common:privacy.section3_body_before')}<a href="https://policies.google.com/privacy" target="_blank" class="text-wabi-accent underline">${t('common:privacy.section3_link_text')}</a>${t('common:privacy.section3_body_after')}</p>

                    <h2 class="text-lg font-bold text-wabi-primary mt-6">${t('common:privacy.section4_title')}</h2>
                    <p>${t('common:privacy.section4_intro')}<br>
                    (1) ${t('common:privacy.section4_option1')}<br>
                    (2) ${t('common:privacy.section4_option2')}</p>

                    <h2 class="text-lg font-bold text-wabi-primary mt-6">${t('common:privacy.section5_title')}</h2>
                    <p>${t('common:privacy.section5_body')}</p>
                </div>
            </div>
        `;
    }
}
