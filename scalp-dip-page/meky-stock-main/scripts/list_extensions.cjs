const fs = require('fs');
const path = require('path');

const localAppData = process.env.LOCALAPPDATA;
const baseDir = path.join(localAppData, 'Google', 'Chrome', 'User Data');

// Check Default and other profiles
function checkProfile(profileName) {
  const prefPath = path.join(baseDir, profileName, 'Preferences');
  const secPrefPath = path.join(baseDir, profileName, 'Secure Preferences');
  const fileToRead = fs.existsSync(secPrefPath) ? secPrefPath : (fs.existsSync(prefPath) ? prefPath : null);

  if (!fileToRead) return;

  try {
    const raw = fs.readFileSync(fileToRead, 'utf8');
    const json = JSON.parse(raw);
    const settings = json?.extensions?.settings || {};

    console.log(`\n=== Profile: ${profileName} ===`);
    for (const [id, ext] of Object.entries(settings)) {
      if (ext.path || ext.manifest?.name?.toLowerCase().includes('thunder') || ext.manifest?.name?.toLowerCase().includes('meky')) {
        console.log(`ID: ${id}`);
        console.log(`  Name: ${ext.manifest?.name}`);
        console.log(`  Version: ${ext.manifest?.version}`);
        console.log(`  Path: ${ext.path}`);
        console.log(`  State: ${ext.state === 1 ? 'ENABLED' : 'DISABLED'}`);
      }
    }
  } catch (e) {
    console.error(`Error reading ${profileName}:`, e.message);
  }
}

if (fs.existsSync(baseDir)) {
  const dirs = fs.readdirSync(baseDir);
  dirs.filter(d => d === 'Default' || d.startsWith('Profile')).forEach(checkProfile);
}
