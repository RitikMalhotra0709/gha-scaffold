const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');

// Register custom Handlebars helpers
Handlebars.registerHelper('if_eq', function(a, b, options) {
  return a === b ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('if', function(condition, options) {
  return condition ? options.fn(this) : options.inverse(this);
});

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

  const outputDir = path.join(projectPath, '.github', 'workflows');
  const outputPath = path.join(outputDir, 'ci.yml');

  if (!dryRun) {
    fs.ensureDirSync(outputDir);
    fs.writeFileSync(outputPath, content, 'utf8');
  }

  return { content, outputPath };
}

module.exports = { generate };
