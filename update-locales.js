const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const replacements = [
  // LogintoEnatega
  { from: /"LogintoEnatega"\s*:\s*"[^"]*Enatega[^"]*"/g, to: '"LogintoEnatega": "Login to Ariiti Market"' },
  // PHEnatega
  { from: /"PHEnatega"\s*:\s*"[^"]*Enatega[^"]*"/g, to: '"PHEnatega": "e.g. Ariiti Market"' },
  // EnategaMultivendor
  { from: /"EnategaMultivendor"\s*:\s*"[^"]*Enatega[^"]*"/g, to: '"EnategaMultivendor": "Ariiti Market Multivendor"' },
  // EnategaDashboard
  { from: /"EnategaDashboard"\s*:\s*"[^"]*Enatega[^"]*"/g, to: '"EnategaDashboard": "Ariiti Market Dashboard"' },
  // "First, let's create your Enatega account"
  { from: /"First, let's create your Enatega account"\s*:\s*"[^"]*"/g, to: '"First, let\'s create your Enatega account": "First, let\'s create your Ariiti Market account"' },
];

for (const file of files) {
  if (file === 'en.json') continue; // Already updated
  
  const filePath = path.join(localesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  for (const rep of replacements) {
    const newContent = content.replace(rep.from, rep.to);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${file}`);
  } else {
    console.log(`No changes: ${file}`);
  }
}

console.log('Done!');