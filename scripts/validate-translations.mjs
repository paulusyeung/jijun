import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOCALES_DIR = join(ROOT, 'public', 'locales');
const SRC_DIR = join(ROOT, 'src');

const LANGUAGES = ['en', 'zh-TW', 'zh-CN'];
const NAMESPACES = ['common', 'categories', 'errors', 'home', 'add', 'settings', 'records', 'stats', 'ledger', 'accounts', 'debts', 'recurring', 'amortizations', 'plugins', 'sync'];
const NAMESPACE_PATTERN = new RegExp(`(${NAMESPACES.join('|')})`);

const usedKeys = new Map(); // namespace -> Set of keys
const localeKeys = new Map(); // lang -> namespace -> Set of keys

function collectTranslationKeys(filePath, content) {
  // Match t('namespace:key') or t("namespace:key") with optional options
  const pattern = /t\s*\(\s*['"](([a-z-]+):([a-zA-Z0-9_.]+))['"]/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const ns = match[2];
    const key = match[3];
    if (!usedKeys.has(ns)) usedKeys.set(ns, new Set());
    usedKeys.get(ns).add(key);
  }
}

function collectNestedKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      keys = keys.concat(collectNestedKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function loadLocaleKeys() {
  for (const lang of LANGUAGES) {
    localeKeys.set(lang, new Map());
    for (const ns of NAMESPACES) {
      const filePath = join(LOCALES_DIR, lang, `${ns}.json`);
      if (!existsSync(filePath)) continue;
      const content = JSON.parse(readFileSync(filePath, 'utf-8'));
      const keys = collectNestedKeys(content);
      if (!localeKeys.get(lang).has(ns)) localeKeys.get(lang).set(ns, new Set());
      keys.forEach(k => localeKeys.get(lang).get(ns).add(k));
    }
  }
}

function walkDir(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && !['node_modules', 'dist'].includes(entry.name)) {
      walkDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const content = readFileSync(fullPath, 'utf-8');
      collectTranslationKeys(fullPath, content);
    }
  }
}

let errors = 0;

function validateKeys() {
  for (const [ns, keys] of usedKeys) {
    for (const lang of LANGUAGES) {
      const langKeys = localeKeys.get(lang).get(ns);
      if (!langKeys) {
        console.error(`ERROR: Missing locale file for ${lang}/${ns}.json`);
        errors++;
        continue;
      }
      for (const key of keys) {
        if (!langKeys.has(key)) {
          // Check if this is a dynamic key pattern (e.g. day0..day6)
          // Look for locale keys that start with the partial key + digit
          const isDynamic = [...langKeys].some(lk => lk.startsWith(key) && /^\d+$/.test(lk.slice(key.length)));
          if (!isDynamic) {
            console.error(`ERROR: Missing key "${ns}:${key}" in ${lang}/${ns}.json`);
            errors++;
          }
        }
      }
    }
  }
}

function validateUnusedKeys() {
  for (const lang of LANGUAGES) {
    for (const [ns, keys] of localeKeys.get(lang)) {
      const used = usedKeys.get(ns);
      if (!used) continue;
      for (const key of keys) {
        if (!used.has(key)) {
          // Allow nested keys whose parent is used (e.g. types.installment when lookup uses t(type.nameKey))
          const parts = key.split('.');
          if (parts.length > 1) {
            const parentUsed = parts.slice(0, -1).some((_, i) => used.has(parts.slice(0, i + 1).join('.')));
            if (parentUsed) continue;
          }
          console.warn(`WARNING: Unused key "${ns}:${key}" in ${lang}/${ns}.json`);
        }
      }
    }
  }
}

walkDir(SRC_DIR);
loadLocaleKeys();
validateKeys();
validateUnusedKeys();

if (errors > 0) {
  console.error(`\n❌ Found ${errors} missing translation key(s).`);
  process.exit(1);
} else {
  console.log('\n✅ All translation keys are present in all locale files!');
}
