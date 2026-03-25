const inquirer = require('inquirer');
const chalk = require('chalk');

/**
 * Ask the user questions based on what was detected.
 * Returns an answers object used by the generator.
 */
async function askQuestions(detected, forcedStack) {
  const questions = [];

  // ── Template selection ─────────────────────────────────────────
  if (!forcedStack) {
    const templateChoices = getTemplateChoices(detected);

    questions.push({
      type: 'list',
      name: 'template',
      message: 'Which workflow template do you want?',
      choices: templateChoices,
      default: detected.suggestedTemplate,
    });
  }

  // ── Common questions ───────────────────────────────────────────
  questions.push({
    type: 'input',
    name: 'branch',
    message: 'Which branch should trigger deployments?',
    default: 'main',
  });

  questions.push({
    type: 'input',
    name: 'projectName',
    message: 'Project / app name (used in workflow labels):',
    default: 'my-app',
    validate: (val) => val.trim().length > 0 || 'Project name cannot be empty',
  });

  // ── GCP-specific questions ─────────────────────────────────────
  const answers = await inquirer.prompt(questions);
  const template = forcedStack || answers.template;

  if (template === 'dotnet-gcp') {
    const gcpAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'gcpProjectId',
        message: 'GCP Project ID:',
        default: 'my-gcp-project',
        validate: (val) => val.trim().length > 0 || 'GCP Project ID is required',
      },
      {
        type: 'list',
        name: 'gcpService',
        message: 'Which GCP service are you deploying to?',
        choices: [
          { name: 'Cloud Run (recommended for APIs)', value: 'cloud-run' },
          { name: 'Cloud Functions (for event-driven/scheduled)', value: 'cloud-functions' },
          { name: 'GCS + App Engine', value: 'app-engine' },
        ],
      },
      {
        type: 'input',
        name: 'gcpRegion',
        message: 'GCP Region:',
        default: 'us-central1',
      },
      {
        type: 'input',
        name: 'artifactRepo',
        message: 'Artifact Registry repo name (for Docker images):',
        default: 'my-repo',
      },
    ]);

    console.log('\n' + chalk.yellow('📌 You will need these GitHub Secrets:'));
    console.log(chalk.gray('   GCP_PROJECT_ID        — your GCP project ID'));
    console.log(chalk.gray('   GCP_SA_KEY            — base64-encoded GCP service account JSON key'));
    console.log(chalk.gray('   GCP_REGION            — e.g. us-central1\n'));

    return { ...answers, template, ...gcpAnswers };
  }

  if (template === 'node-docker') {
    const dockerAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'registry',
        message: 'Docker registry to push to?',
        choices: [
          { name: 'GitHub Container Registry (ghcr.io) — free', value: 'ghcr' },
          { name: 'Docker Hub', value: 'dockerhub' },
          { name: 'GCP Artifact Registry', value: 'gcp-ar' },
        ],
      },
      {
        type: 'input',
        name: 'imageName',
        message: 'Docker image name:',
        default: 'my-app',
      },
    ]);

    if (dockerAnswers.registry === 'dockerhub') {
      console.log('\n' + chalk.yellow('📌 You will need these GitHub Secrets:'));
      console.log(chalk.gray('   DOCKERHUB_USERNAME'));
      console.log(chalk.gray('   DOCKERHUB_TOKEN\n'));
    }

    return { ...answers, template, ...dockerAnswers };
  }

  if (template === 'terraform') {
    const tfAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'tfCloud',
        message: 'Which cloud provider are you managing?',
        choices: [
          { name: 'GCP', value: 'gcp' },
          { name: 'AWS', value: 'aws' },
          { name: 'Azure', value: 'azure' },
        ],
      },
      {
        type: 'confirm',
        name: 'autoApply',
        message: 'Auto-apply on merge to main? (if no, pipeline will only plan)',
        default: false,
      },
    ]);

    return { ...answers, template, ...tfAnswers };
  }

  return { ...answers, template };
}

function getTemplateChoices(detected) {
  const all = [
    { name: 'dotnet-basic  — .NET build + test',                  value: 'dotnet-basic' },
    { name: 'dotnet-gcp    — .NET build + deploy to GCP',         value: 'dotnet-gcp' },
    { name: 'node-basic    — Node.js install + test',              value: 'node-basic' },
    { name: 'node-docker   — Node.js + Docker image push',        value: 'node-docker' },
    { name: 'terraform     — Terraform plan / apply',              value: 'terraform' },
  ];

  // Sort: put the suggested one first
  return all.sort((a, b) =>
    a.value === detected.suggestedTemplate ? -1 :
    b.value === detected.suggestedTemplate ? 1 : 0
  );
}

module.exports = { askQuestions };
