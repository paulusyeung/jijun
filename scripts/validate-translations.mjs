import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOCALES_DIR = join(ROOT, 'public', 'locales');
const SRC_DIR = join(ROOT, 'src');

const LANGUAGES = ['en', 'zh-TW', 'zh-CN'];
const NAMESPACES = ['common', 'categories', 'errors', 'home', 'add', 'settings', 'records', 'stats', 'ledger', 'accounts', 'debts', 'recurring', 'amortizations', 'plugins', 'sync'];

const usedKeys = new Map(); // namespace -> Set of keys
const usedInterpolations = new Map(); // key -> Set of variable names
const localeKeys = new Map(); // lang -> namespace -> Set of keys
const localeData = new Map(); // lang -> namespace -> JSON object

function collectTranslationKeys(filePath, content) {
  // Match t('namespace:key') or t("namespace:key") with optional options
  const keyPattern = /(?<!\w)t\s*\(\s*['"](([a-z-]+):([a-zA-Z0-9_.]+))['"]/g;
  let match;
  while ((match = keyPattern.exec(content)) !== null) {
    const fullKey = match[1];
    const ns = match[2];
    const key = match[3];
    if (!usedKeys.has(ns)) usedKeys.set(ns, new Set());
    usedKeys.get(ns).add(key);

    // Try to extract interpolation variables from t() calls with options objects
    const rest = content.slice(match.index + match[0].length).trim();
    const interpMatch = rest.match(/^,\s*\{([^}]*)\}\s*\)/);
    if (interpMatch) {
      let varsStr = interpMatch[1];
      // Remove string literals to avoid false positives from nested t() calls
      varsStr = varsStr.replace(/['"][^'"]*['"]/g, '');
      // Remove key: value pairs entirely, leaving only shorthand props
      const withoutKeyValues = varsStr.replace(/\w+\s*:\s*[^,]+/g, '');
      // Now match shorthand properties in the remaining text
      const shorthandPattern = /(\w+)/g;
      let vMatch;
      while ((vMatch = shorthandPattern.exec(withoutKeyValues)) !== null) {
        const varName = vMatch[1].trim();
        if (['ns', 'key', 'defaultValue', 'count', 'context', 'lngs', 'postProcess', 'separator', 'joinArrays'].includes(varName)) continue;
        if (!usedInterpolations.has(fullKey)) usedInterpolations.set(fullKey, new Set());
        usedInterpolations.get(fullKey).add(varName);
      }
      // Also extract keys from key:value pairs (the words before ':')
      const keyPattern = /(\w+)\s*:/g;
      while ((vMatch = keyPattern.exec(varsStr)) !== null) {
        const varName = vMatch[1].trim();
        if (['ns', 'key', 'defaultValue', 'count', 'context', 'lngs', 'postProcess', 'separator', 'joinArrays'].includes(varName)) continue;
        if (!usedInterpolations.has(fullKey)) usedInterpolations.set(fullKey, new Set());
        usedInterpolations.get(fullKey).add(varName);
      }
    }
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

function getValueByPath(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function loadLocaleKeys() {
  for (const lang of LANGUAGES) {
    localeKeys.set(lang, new Map());
    localeData.set(lang, new Map());
    for (const ns of NAMESPACES) {
      const filePath = join(LOCALES_DIR, lang, `${ns}.json`);
      if (!existsSync(filePath)) continue;
      const content = JSON.parse(readFileSync(filePath, 'utf-8'));
      localeData.get(lang).set(ns, content);
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

function validateInterpolations() {
  for (const [fullKey, vars] of usedInterpolations) {
    const colonIdx = fullKey.indexOf(':');
    const ns = fullKey.slice(0, colonIdx);
    const key = fullKey.slice(colonIdx + 1);
    for (const lang of LANGUAGES) {
      const data = localeData.get(lang)?.get(ns);
      if (!data) continue;
      const translation = getValueByPath(data, key);
      if (typeof translation !== 'string') continue;
      for (const varName of vars) {
        const placeholder = `{{${varName}}}`;
        if (!translation.includes(placeholder)) {
          console.warn(`WARNING: Interpolation variable "${varName}" not found in translation for "${fullKey}" (${lang})`);
          console.warn(`         Translation: "${translation}"`);
          console.warn(`         Expected placeholder: ${placeholder}`);
        }
      }
    }
  }
}

function reportCompleteness() {
  const enKeys = new Map();
  for (const [ns, keys] of localeKeys.get('en')) {
    enKeys.set(ns, keys);
  }
  console.log('\n--- Translation Completeness Report ---');
  for (const lang of LANGUAGES) {
    if (lang === 'en') continue;
    let totalKeys = 0;
    let translatedKeys = 0;
    for (const [ns, enNsKeys] of enKeys) {
      const langNsKeys = localeKeys.get(lang).get(ns);
      if (!langNsKeys) continue;
      for (const key of enNsKeys) {
        totalKeys++;
        if (langNsKeys.has(key)) translatedKeys++;
      }
    }
    const pct = totalKeys > 0 ? ((translatedKeys / totalKeys) * 100).toFixed(1) : 'N/A';
    console.log(`  ${lang}: ${translatedKeys}/${totalKeys} keys (${pct}%)`);
  }
  console.log('--------------------------------------\n');
}

function validateUnusedKeys() {
  for (const lang of LANGUAGES) {
    for (const [ns, keys] of localeKeys.get(lang)) {
      const used = usedKeys.get(ns);
      if (!used) continue;
      for (const key of keys) {
        if (!used.has(key)) {
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
validateInterpolations();
reportCompleteness();
validateUnusedKeys();

if (errors > 0) {
  console.error(`\n❌ Found ${errors} missing translation key(s).`);
  process.exit(1);
} else {
  console.log('\n✅ All translation keys are present in all locale files!');
}
