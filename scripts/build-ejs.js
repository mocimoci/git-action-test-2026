const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/views');
const distDir = path.join(__dirname, '../dist');

// distディレクトリが存在しない場合は作成
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// srcディレクトリ内のEJSファイルを再帰的に取得（partialsを除く）
function getEjsFiles(dir, baseDir) {
  const results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // partialsディレクトリはスキップ
      if (file !== 'partials') {
        results.push(...getEjsFiles(fullPath, baseDir));
      }
    } else if (file.endsWith('.ejs')) {
      results.push(fullPath);
    }
  }

  return results;
}

const ejsFiles = getEjsFiles(srcDir, srcDir);

for (const filePath of ejsFiles) {
  const relativePath = path.relative(srcDir, filePath);
  const outputPath = path.join(distDir, relativePath.replace(/\.ejs$/, '.html'));
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const html = ejs.render(
    fs.readFileSync(filePath, 'utf-8'),
    {},
    { filename: filePath }  // includeのパス解決に必要
  );

  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`Built: ${relativePath} → ${path.relative(process.cwd(), outputPath)}`);
}

console.log(`\nEJS build complete. ${ejsFiles.length} file(s) generated.`);