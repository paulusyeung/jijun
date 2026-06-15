import { t } from '../i18n.js';

export class LicensePage {
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
                    <h1 class="text-xl font-bold text-wabi-primary">${t('common:license.title')}</h1>
                    <div class="w-6"></div>
                </div>
                
                <div class="bg-wabi-surface rounded-xl shadow-sm border border-wabi-border p-6 mb-8 text-wabi-text-primary space-y-4">
                    <h2 class="text-lg font-bold text-wabi-primary">${t('common:license.project_name')}</h2>
                    <p>${t('common:license.copyright')}</p>
                    <hr class="border-wabi-border my-4">
                    
                    <h3 class="text-md font-bold text-wabi-primary">${t('common:license.source_license_title')}</h3>
                    <div class="bg-wabi-bg p-4 rounded-lg text-sm text-wabi-text-secondary font-mono overflow-auto border border-wabi-border">
                        ${t('common:license.source_license_body')}
                    </div>

                    <h3 class="text-md font-bold text-wabi-primary mt-6">${t('common:license.visual_assets_title')}</h3>
                    <div class="bg-wabi-bg p-4 rounded-lg text-sm text-wabi-text-secondary border border-wabi-border">
                        ${t('common:license.visual_assets_body')}<br><br>
                        ${t('common:license.visual_assets_warning')}
                    </div>

                    <hr class="border-wabi-border my-6">

                    <h2 class="text-lg font-bold text-wabi-primary mt-6 mb-4">${t('common:license.third_party_title')}</h2>
                    <ul class="space-y-4">
                        <li>
                            <strong class="text-wabi-text-primary">${t('common:license.tp_tailwind')}</strong> (MIT License)<br>
                            Copyright (c) Tailwind Labs, Inc.<br>
                            <a href="https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE" target="_blank" class="text-wabi-accent text-sm underline">License</a>
                        </li>
                        <li>
                            <strong class="text-wabi-text-primary">${t('common:license.tp_fontawesome')}</strong> (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)<br>
                            Copyright (c) Fonticons, Inc.<br>
                            <a href="https://fontawesome.com/license/free" target="_blank" class="text-wabi-accent text-sm underline">License</a>
                        </li>
                        <li>
                            <strong class="text-wabi-text-primary">${t('common:license.tp_chartjs')}</strong> (MIT License)<br>
                            Copyright (c) 2014-2022 Chart.js Contributors<br>
                            <a href="https://github.com/chartjs/Chart.js/blob/master/LICENSE.md" target="_blank" class="text-wabi-accent text-sm underline">License</a>
                        </li>
                        <li>
                            <strong class="text-wabi-text-primary">${t('common:license.tp_datefns')}</strong> (MIT License)<br>
                            Copyright (c) 2021 Sasha Koss and Lesha Koss; Copyright (c) 2019 chartjs-adapter-date-fns Contributors<br>
                            <a href="https://github.com/date-fns/date-fns/blob/master/LICENSE.md" target="_blank" class="text-wabi-accent text-sm underline">License</a>
                        </li>
                        <li>
                            <strong class="text-wabi-text-primary">${t('common:license.tp_idb')}</strong> (ISC License)<br>
                            Copyright (c) 2016, Jake Archibald<br>
                            <a href="https://github.com/jakearchibald/idb/blob/main/LICENSE" target="_blank" class="text-wabi-accent text-sm underline">License</a>
                        </li>
                        <li>
                            <strong class="text-wabi-text-primary">${t('common:license.tp_capacitor')}</strong> (MIT License)<br>
                            Copyright (c) 2017-present Drifty Co.<br>
                            <a href="https://github.com/ionic-team/capacitor/blob/main/LICENSE" target="_blank" class="text-wabi-accent text-sm underline">License</a>
                        </li>
                        <li>
                            <strong class="text-wabi-text-primary">${t('common:license.tp_google_auth')}</strong> (MIT License)<br>
                            Copyright (c) 2021 Codetrix Studio<br>
                            <a href="https://github.com/CodetrixStudio/CapacitorGoogleAuth/blob/master/LICENSE" target="_blank" class="text-wabi-accent text-sm underline">License</a>
                        </li>
                        <li>
                            <strong class="text-wabi-text-primary">${t('common:license.tp_gis')}</strong><br>
                            ${t('common:license.tp_gis_desc')} <a href="https://developers.google.com/terms" target="_blank" class="text-wabi-accent text-sm underline">Google APIs Terms of Service</a>.
                        </li>
                    </ul>
                </div>
            </div>
        `;
    }
}
