import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenCC from 'opencc-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOCALES_DIR = join(ROOT, 'public', 'locales');
const TW_DIR = join(LOCALES_DIR, 'zh-TW');
const CN_DIR = join(LOCALES_DIR, 'zh-CN');

async function main() {
  if (!existsSync(TW_DIR)) {
    console.error('zh-TW directory not found');
    process.exit(1);
  }

  if (!existsSync(CN_DIR)) {
    mkdirSync(CN_DIR, { recursive: true });
  }

  const converter = OpenCC.Converter({ from: 'tw', to: 'cn' });

  const files = readdirSync(TW_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const twPath = join(TW_DIR, file);
    const cnPath = join(CN_DIR, file);
    
    const content = readFileSync(twPath, 'utf-8');
    const cnContent = converter(content);
    
    writeFileSync(cnPath, cnContent, 'utf-8');
    console.log(`✓ ${file}`);
  }

  console.log(`\n✅ Converted ${files.length} files from zh-TW to zh-CN`);
}

main().catch(console.error);
