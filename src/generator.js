const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');

/**
 * Generate the workflow YAML from answers.
 * Writes to .github/workflows/ci.yml unless dry-run.
 *
 * @param {object} answers - from prompts.js
 * @param {string} projectPath - project root
 * @param {boolean} dryRun - if true, return content without writing
 * @returns {string} generated YAML content
 */
function generate(answers, projectPath, dryRun = false) {
  const templatePath = path.join(__dirname, '..', 'templates', `${answers.template}.yml`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${answers.template}. Run 'gha-scaffold list' to see available templates.`);
  }

  const raw = fs.readFileSync(templatePath, 'utf8');
  const compiled = Handlebars.compile(raw);
  const content = compiled(answers);

  if (!dryRun) {
    const outputDir = path.join(projectPath, '.github', 'workflows');
    fs.ensureDirSync(outputDir);
    fs.writeFileSync(path.join(outputDir, 'ci.yml'), content, 'utf8');
  }

  return content;
}

module.exports = { generate };
