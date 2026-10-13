const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hashFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

const dirF = 'F:\\thunder-extension-v4.6.2';
const dirD = 'D:\\meky-stock-main\\meky-stock-main\\extension\\extension';
const dirMain = 'D:\\meky-stock-main\\meky-stock-main\\extension';

const files = fs.readdirSync(dirF).filter(f => fs.statSync(path.join(dirF, f)).isFile());

console.log('Comparison between F and D:');
for (const file of files) {
  const hF = hashFile(path.join(dirF, file));
  const hD = hashFile(path.join(dirD, file));
  const hMain = hashFile(path.join(dirMain, file));
  const match = (hF === hD && hF === hMain);
  console.log(`${file.padEnd(20)}: ${match ? 'MATCH (100% IDENTICAL)' : 'DIFFERENT'}`);
}
