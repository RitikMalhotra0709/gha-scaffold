#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const { detectStack } = require('../src/detector');
const { generateWorkflow } = require('../src/generator');
const { askQuestions } = require('../src/prompts');

console.log(chalk.cyan.bold('\n⚡ gha-scaffold — GitHub Actions Workflow Generator\n'));

program
  .name('gha-scaffold')
  .description('Auto-detect your stack and generate production-ready GitHub Actions workflows')
  .version('1.0.0');

// ── DETECT command ──────────────────────────────────────────────
program
  .command('detect')
  .description('Detect the tech stack of the current project')
  .option('-p, --path <path>', 'Path to project directory', process.cwd())
  .action((options) => {
    const spinner = ora('Scanning project...').start();

    try {
      const result = detectStack(options.path);
      spinner.succeed('Scan complete!');

      console.log('\n' + chalk.bold('Detected Stack:'));
      console.log(chalk.green(`  ✔ Language:   ${result.language || 'Unknown'}`));
      console.log(chalk.green(`  ✔ Runtime:    ${result.runtime || 'Unknown'}`));

      if (result.hasDocker)    console.log(chalk.green('  ✔ Docker detected'));
      if (result.hasTerraform) console.log(chalk.green('  ✔ Terraform detected'));
      if (result.hasTests)     console.log(chalk.green('  ✔ Test setup detected'));

      console.log(chalk.gray(`\n  Suggested template: ${chalk.white(result.suggestedTemplate)}\n`));
    } catch (err) {
      spinner.fail('Detection failed');
      console.error(chalk.red(err.message));
      process.exit(1);
    }
  });

// ── GENERATE command ────────────────────────────────────────────
program
  .command('generate')
  .description('Generate a GitHub Actions workflow for this project')
  .option('-p, --path <path>', 'Path to project directory', process.cwd())
  .option('-s, --stack <stack>', 'Force a specific stack (dotnet-basic, dotnet-gcp, node-basic, node-docker, terraform)')
  .option('--dry-run', 'Preview the workflow without writing to disk')
  .action(async (options) => {
    try {
      // Step 1: detect
      const spinner = ora('Scanning project...').start();
      const detected = detectStack(options.path);
      spinner.succeed('Stack detected!');

      // Step 2: ask questions
      const answers = await askQuestions(detected, options.stack);

      // Step 3: generate
      const genSpinner = ora('Generating workflow...').start();
      const { content, outputPath } = generateWorkflow(detected, answers, options.path, options.dryRun);
      genSpinner.succeed('Workflow generated!');

      if (options.dryRun) {
        console.log('\n' + chalk.yellow.bold('── DRY RUN — Preview ──────────────────────────\n'));
        console.log(chalk.gray(content));
        console.log(chalk.yellow('── End of preview (nothing written to disk) ───\n'));
      } else {
        console.log('\n' + chalk.green.bold(`✅ Written to: ${outputPath}`));
        console.log(chalk.gray('   Commit and push to activate your pipeline.\n'));
        console.log(chalk.cyan('Next steps:'));
        console.log(chalk.gray('  1. Review the generated workflow file'));
        console.log(chalk.gray('  2. Add required secrets to GitHub → Settings → Secrets & Variables → Actions'));
        console.log(chalk.gray('  3. git add .github && git commit -m "ci: add github actions workflow"\n'));
      }
    } catch (err) {
      console.error(chalk.red('\n✖ ' + err.message));
      process.exit(1);
    }
  });

// ── LIST command ────────────────────────────────────────────────
program
  .command('list')
  .description('List all available workflow templates')
  .action(() => {
    console.log(chalk.bold('Available Templates:\n'));
    const templates = [
      { name: 'dotnet-basic', desc: '.NET Core — build, test, publish' },
      { name: 'dotnet-gcp',   desc: '.NET Core — build, test, deploy to GCP Cloud Run' },
      { name: 'node-basic',   desc: 'Node.js — install, lint, test' },
      { name: 'node-docker',  desc: 'Node.js — build Docker image, push to registry' },
      { name: 'terraform',    desc: 'Terraform — fmt, validate, plan, apply' },
    ];
    templates.forEach(t => {
      console.log(chalk.green(`  ${t.name.padEnd(18)}`) + chalk.gray(t.desc));
    });
    console.log();
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
