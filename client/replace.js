const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir('./src');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('http://localhost:5000')) {
    // Replace single quotes
    content = content.replace(/'http:\/\/localhost:5000\/([^']+)'/g, '`${process.env.NEXT_PUBLIC_API_URL || \'http://localhost:5000\'}/$1`');
    // Replace double quotes
    content = content.replace(/"http:\/\/localhost:5000\/([^"]+)"/g, '`${process.env.NEXT_PUBLIC_API_URL || \'http://localhost:5000\'}/$1`');
    // Replace in existing template literals
    content = content.replace(/http:\/\/localhost:5000\//g, '${process.env.NEXT_PUBLIC_API_URL || \'http://localhost:5000\'}/');
    
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
  }
});

console.log('Modified files:', changedCount);
