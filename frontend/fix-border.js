const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Regex to match <input ... className="... rounded-xl ..." ... >
  let newContent = content.replace(/<(input|textarea|select)([^>]*?)className=(['"])(.*?)\3([^>]*?)>/gs, (match, p1, p2, p3, p4, p5) => {
    let newClass = p4.replace(/\brounded-3xl\b/g, 'rounded-2xl')
                     .replace(/\brounded-2xl\b/g, 'rounded-xl')
                     .replace(/\brounded-xl\b/g, 'rounded-lg')
                     .replace(/\brounded-lg\b/g, 'rounded-md');
    return '<' + p1 + p2 + 'className=' + p3 + newClass + p3 + p5 + '>';
  });
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    modifiedCount++;
  }
});
console.log('Modified files:', modifiedCount);
