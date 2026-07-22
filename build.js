const fs = require('fs');
const path = require('path');

// Crear carpeta dist
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Copiar archivos
const filesToCopy = [
  'index.html',
  'css',
  'javascript'
];

filesToCopy.forEach(item => {
  const sourcePath = path.join(__dirname, item);
  const destPath = path.join(distPath, item);

  if (fs.existsSync(sourcePath)) {
    const stats = fs.statSync(sourcePath);
    
    if (stats.isDirectory()) {
      // Copiar directorio recursivamente
      copyDirectory(sourcePath, destPath);
    } else {
      // Copiar archivo
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copiado: ${item}`);
    }
  } else {
    console.log(`⚠️  No encontrado: ${item}`);
  }
});

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });

  console.log(`✅ Copiado directorio: ${path.basename(src)}`);
}

console.log('\n🚀 Build completado. Carpeta dist creada.');
