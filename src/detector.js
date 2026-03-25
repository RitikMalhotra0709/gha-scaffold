const fs = require('fs');
const path = require('path');

/**
 * Scans a directory and returns a detected stack object.
 * @param {string} dirPath - Absolute path to scan
 * @returns {object} detected stack info
 */
function detectStack(dirPath) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  const files = fs.readdirSync(dirPath);
  const allFiles = getAllFiles(dirPath, 2); // scan 2 levels deep

  const result = {
    language: null,
    runtime: null,
    hasDocker: false,
    hasTerraform: false,
    hasTests: false,
    suggestedTemplate: 'node-basic', // default fallback
    raw: files,
  };

  // ── Language / Runtime detection ───────────────────────────────

  // .NET Core — look for .csproj or .sln
  const hasCsproj = allFiles.some(f => f.endsWith('.csproj'));
  const hasSln    = allFiles.some(f => f.endsWith('.sln'));
  if (hasCsproj || hasSln) {
    result.language = 'C#';
    result.runtime  = '.NET Core';
  }

  // Node.js — look for package.json (but not if it's just our own tool)
  const hasPackageJson = files.includes('package.json');
  if (hasPackageJson && !result.language) {
    result.language = 'JavaScript';
    result.runtime  = 'Node.js';

    // try to read the package.json for more info
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(dirPath, 'package.json'), 'utf8'));
      if (pkg.dependencies?.typescript || pkg.devDependencies?.typescript) {
        result.language = 'TypeScript';
      }
    } catch (_) {}
  }

  // Python
  const hasPython = files.includes('requirements.txt') || files.includes('pyproject.toml') || files.includes('setup.py');
  if (hasPython && !result.language) {
    result.language = 'Python';
    result.runtime  = 'Python 3';
  }

  // Java / Kotlin
  const hasMaven  = files.includes('pom.xml');
  const hasGradle = files.includes('build.gradle') || files.includes('build.gradle.kts');
  if ((hasMaven || hasGradle) && !result.language) {
    result.language = hasGradle && allFiles.some(f => f.endsWith('.kt')) ? 'Kotlin' : 'Java';
    result.runtime  = 'JVM';
  }

  // Go
  const hasGo = files.includes('go.mod');
  if (hasGo && !result.language) {
    result.language = 'Go';
    result.runtime  = 'Go';
  }

  // ── Infrastructure detection ───────────────────────────────────

  result.hasDocker    = files.includes('Dockerfile') || files.includes('docker-compose.yml');
  result.hasTerraform = allFiles.some(f => f.endsWith('.tf'));

  // ── Test detection ─────────────────────────────────────────────

  // .NET tests
  if (result.runtime === '.NET Core') {
    result.hasTests = allFiles.some(f => f.endsWith('Tests.csproj') || f.endsWith('.Tests.csproj') || f.includes('Test'));
  }

  // Node tests
  if (result.runtime === 'Node.js' || result.runtime === 'TypeScript') {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(dirPath, 'package.json'), 'utf8'));
      result.hasTests = !!(pkg.scripts?.test && pkg.scripts.test !== 'echo "Error: no test specified" && exit 1');
    } catch (_) {}
    result.hasTests = result.hasTests || allFiles.some(f => f.includes('.test.') || f.includes('.spec.'));
  }

  // Python tests
  if (result.runtime === 'Python 3') {
    result.hasTests = allFiles.some(f => f.startsWith('test_') || f.endsWith('_test.py'));
  }

  // ── Suggest best template ──────────────────────────────────────

  result.suggestedTemplate = suggestTemplate(result);

  return result;
}

/**
 * Based on detection, suggest the best starting template.
 */
function suggestTemplate(detected) {
  const { runtime, hasDocker, hasTerraform } = detected;

  if (hasTerraform) return 'terraform';

  if (runtime === '.NET Core') {
    return hasDocker ? 'dotnet-gcp' : 'dotnet-basic';
  }

  if (runtime === 'Node.js' || runtime === 'TypeScript') {
    return hasDocker ? 'node-docker' : 'node-basic';
  }

  if (runtime === 'Python 3') return 'python-basic';
  if (runtime === 'Go')       return 'go-basic';

  return 'node-basic'; // safe fallback
}

/**
 * Recursively get all file names up to maxDepth levels deep.
 */
function getAllFiles(dirPath, maxDepth, currentDepth = 0) {
  if (currentDepth >= maxDepth) return [];

  let results = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'bin' || entry.name === 'obj') {
        continue; // skip hidden dirs and build artifacts
      }
      results.push(entry.name);
      if (entry.isDirectory()) {
        const sub = getAllFiles(path.join(dirPath, entry.name), maxDepth, currentDepth + 1);
        results = results.concat(sub);
      }
    }
  } catch (_) {}
  return results;
}

module.exports = { detectStack };
