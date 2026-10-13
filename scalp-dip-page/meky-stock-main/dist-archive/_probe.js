console.log('cwd:', process.cwd());
try { console.log('meta.dir:', import.meta.dir); } catch(e) { console.log('meta.dir: N/A'); }
try { const fs = require('fs'); console.log('env beside exe exists:', fs.existsSync('D:/meky-stock-main/meky-stock-main/dist-archive/.env')); } catch(e) {}
