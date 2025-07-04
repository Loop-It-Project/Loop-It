const fs = require('fs');
const path = require('path');

const replacements = {
  'bg-white': 'bg-card',
  'bg-gray-50': 'bg-secondary',
  'bg-gray-100': 'bg-hover',
  'bg-gray-200': 'bg-tertiary',
  'text-gray-900': 'text-primary',
  'text-gray-800': 'text-primary',
  'text-gray-700': 'text-secondary',
  'text-gray-600': 'text-secondary',
  'text-gray-500': 'text-tertiary',
  'text-gray-400': 'text-muted',
  'border-gray-200': 'border-primary',
  'border-gray-300': 'border-secondary'
};

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [oldClass, newClass] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${oldClass}\\b`, 'g');
    if (content.match(regex)) {
      content = content.replace(regex, newClass);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
  }
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      updateFile(fullPath);
    }
  });
}

// Starte von src/components
processDirectory('./src/components');
console.log('🎉 Theme class updates completed!');