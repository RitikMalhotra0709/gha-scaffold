const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { detect } = require('../src/detector');

// Helper: create a temp dir with given files
function makeTempProject(files) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gha-test-'));
  files.forEach(f => fs.writeFileSync(path.join(tmpDir, f), ''));
  return tmpDir;
}

afterEach(() => {
  // cleanup handled per test
});

describe('detect()', () => {
  test('detects .NET project from .csproj', () => {
    const dir = makeTempProject(['MyApp.csproj']);
    const result = detect(dir);
    expect(result.stacks).toContain('.NET Core / C#');
    fs.removeSync(dir);
  });

  test('detects Node.js project from package.json', () => {
    const dir = makeTempProject(['package.json']);
    const result = detect(dir);
    expect(result.stacks).toContain('Node.js');
    fs.removeSync(dir);
  });

  test('detects Docker from Dockerfile', () => {
    const dir = makeTempProject(['Dockerfile']);
    const result = detect(dir);
    expect(result.stacks).toContain('Docker');
    fs.removeSync(dir);
  });

  test('detects Terraform from .tf file', () => {
    const dir = makeTempProject(['main.tf']);
    const result = detect(dir);
    expect(result.stacks).toContain('Terraform');
    fs.removeSync(dir);
  });

  test('detects multiple stacks in same project', () => {
    const dir = makeTempProject(['MyApp.csproj', 'Dockerfile', 'main.tf']);
    const result = detect(dir);
    expect(result.stacks).toContain('.NET Core / C#');
    expect(result.stacks).toContain('Docker');
    expect(result.stacks).toContain('Terraform');
    fs.removeSync(dir);
  });

  test('detects Python from requirements.txt', () => {
    const dir = makeTempProject(['requirements.txt']);
    const result = detect(dir);
    expect(result.stacks).toContain('Python');
    fs.removeSync(dir);
  });

  test('returns unknown for empty project', () => {
    const dir = makeTempProject([]);
    const result = detect(dir);
    expect(result.stacks[0]).toMatch(/Unknown/);
    fs.removeSync(dir);
  });

  test('throws on non-existent path', () => {
    expect(() => detect('/this/path/does/not/exist')).toThrow();
  });

  test('detects GCP signal from app.yaml', () => {
    const dir = makeTempProject(['app.yaml', 'MyApp.csproj']);
    const result = detect(dir);
    expect(result.raw.hasGcpFiles).toBe(true);
    fs.removeSync(dir);
  });

  test('deploy targets includes Docker when Dockerfile present', () => {
    const dir = makeTempProject(['Dockerfile']);
    const result = detect(dir);
    expect(result.deployTargets.some(t => t.includes('Docker'))).toBe(true);
    fs.removeSync(dir);
  });
});
