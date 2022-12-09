import { config } from './config.mjs'
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { join, dirname } from 'path'
import mustache from 'mustache'
import rdir from 'recursive-readdir'
import chalk from 'chalk'
import prompts from 'prompts'
import { oraPromise } from 'ora'
import { execa } from 'execa'
import axios from 'axios'
import { fileURLToPath } from 'url'

// Current working directory
let cwd
try {
  cwd = __dirname
} catch {
  cwd = dirname(fileURLToPath(import.meta.url))
}

const nl = '\n'
const tab = '  '
const nlt = nl + tab

// Checks for node 16 or higher
export const checkNodeVersion = () => {
  const node_version = process.version.slice(1).split('.')[0]
  if (parseInt(node_version) < config.node) {
    console.log(
      chalk.yellow(nlt + `⚠️  FreeSewing requires Node v${config.node} or newer`) +
        nl +
        nlt +
        'We hightly recommend using NVM to manage your Node versions:' +
        nlt +
        chalk.blue('https://github.com/nvm-sh/nvm') +
        nl +
        nlt +
        'When in doubt, pick an active LTS version:' +
        nlt +
        chalk.blue('https://nodejs.org/en/about/releases/') +
        nl +
        nl
    )
    process.exit(1)
  }
}

// Helper method to validate the design name
const validateDesignName = (name) => {
  if (/^([a-z]+)$/.test(name)) return true
  else return ' 🙈 Please use only [a-z], no spaces, no capitals, no nothing 🤷'
}

// Gets user input to figure out what to do
export const getChoices = async () => {
  const { template } = await prompts({
    type: 'select',
    name: 'template',
    message: 'What template would you like to use? 📑',
    choices: [
      { title: 'Tutorial', value: 'tutorial', description: 'Setup the pattern design tutorial' },
      { title: 'From Scratch', value: 'scratch', description: 'Create a design from scratch' },
      {
        title: 'Extend Brian',
        value: 'brian',
        description: 'Extend the Brian design (basic torso block for menswear)',
      },
      {
        title: 'Extend Bent',
        value: 'bent',
        description: 'Extend the Bent design (like brian with added two-part sleeve)',
      },
      {
        title: 'Extend Bella',
        value: 'bella',
        description: 'Extend the Bella design (womenswear torso block)',
      },
      {
        title: 'Extend Breanna',
        value: 'breanna',
        description: 'Extend the Breanna design (womenswear torso block - YMMV)',
      },
      {
        title: 'Extend Titan',
        value: 'titan',
        description: 'Extend the Titan design (gender-neutral trouser block)',
      },
    ],
    initial: 0,
  })

  const { name } =
    template === 'tutorial'
      ? { name: 'tutorial' }
      : await prompts({
          type: 'text',
          name: 'name',
          message: 'What name would you like the design to have? 🏷️ ([a-z] only)',
          validate: validateDesignName,
        })

  const { manager } = await prompts({
    type: 'select',
    name: 'manager',
    message: 'What package manager should we use? 📦',
    choices: [
      { title: 'yarn', value: 'yarn', description: 'Yarn - Nice if you have it' },
      { title: 'npm', value: 'npm', description: 'NPM - Comes with NodeJS' },
    ],
    initial: 0,
  })

  return { template, name, manager }
}

// Keep track of directories that need to be created
const dirs = {}
const ensureDir = async (file, suppress = false) => {
  const dir = suppress ? dirname(file.replace(suppress)) : dirname(file)
  if (!dirs[dir]) {
    await mkdir(dir, { recursive: true })
    dirs[dir] = true
  }
}

// Helper method to copy template files
const copyTemplate = async (config, choices) => {
  // Copy files in parallel rather than using await
  const promises = []

  // Copy shared files
  for (const from of config.files.shared) {
    // FIXME: Explain the -7
    const to = join(config.dest, from.slice(config.source.shared.length - 7))
    if (!dirs[to]) await ensureDir(to)
    promises.push(copyFile(from, to))
  }

  // Template files
  for (const from of config.files.template) {
    let to = join(config.dest, from.slice(config.source.template.length - 7))
    if (to.slice(-9) === '.mustache') to = to.slice(0, -9)
    if (!dirs[to]) await ensureDir(to)
    // Template out file
    const src = await readFile(from, 'utf-8')
    promises.push(writeFile(to, mustache.render(src, { name: choices.name, tag: config.tag })))
  }

  await Promise.all(promises)

  return
}

// Helper method to run [yarn|npm] install
const installDependencies = async (config, choices) =>
  await execa(`${choices.manager} install`, {
    cwd: config.dest,
    shell: true,
  })

// Helper method to download web environment
const downloadLabFiles = async (config) => {
  const promises = []
  for (const dir in config.fetch) {
    for (const file of config.fetch[dir]) {
      const to = typeof file === 'string' ? join(config.dest, file) : join(config.dest, file.to)
      if (!dirs[to]) await ensureDir(to)
      promises.push(
        axios
          .get(
            `${config.fileUri}/${config.repo}/${config.branch}/${dir}/${
              typeof file === 'string' ? file : file.from
            }`
          )
          .catch((err) => console.log(err))
          .then((res) => promises.push(writeFile(to, res.data)))
      )
    }
  }

  await Promise.all(promises)

  return
}

// Helper method to initialize a git repository
const initGitRepo = async (config, choices) => {
  await writeFile(join(config.dest, '.gitignore'), config.gitignore, 'utf-8')

  return execa(
    `git init -b main && git add . && git commit -m ":tada: Initialized ${choices.name} repository"`,
    {
      cwd: config.dest,
      shell: true,
    }
  )
}

// Tips
const showTips = (config, choices) => {
  console.log(`
  All done 🤓 Your new design ${chalk.yellow.bold(
    choices.name
  )} was initialized in: ${chalk.green.bold(config.dest)}

  The code for your design is in the ${chalk.yellow.bold('design')} folder.
  The other files and folders are the development environment. You can safely ignore those.

  To start your development environment, follow these three steps:

    1) Start by entering the directory: ${chalk.blue.bold('cd ' + config.dest)}
    2) Then run this command: ${chalk.blue.bold(
      choices.manager === 'yarn' ? 'yarn dev' : 'npm run dev'
    )}
    3) Now open your browser and navigate to ${chalk.green('http://localhost:8000/')}

  ${chalk.bold.yellow('🤔 More info & help')}
  ${chalk.gray('≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡')}`)

  if (choices.template === 'tutorial')
    console.log(`
  Our pattern design tutorial is available at: ${chalk.green(
    'https://freesewing.dev/tutorials/pattern-design'
  )}

  It will walk your through the process step by step.
  If you get stuck, reach out to our community on Discord: ${chalk.green(
    'https://discord.freesewing.dev/'
  )}
  The ${chalk.bold('development-help')} channel is a good place to ask questions

  Don't be shy to reach out. If something is not clear, that's on us, not on you.
  So your feedback really helps us improve our tutorial/documentation.

  Thanks for giving FreeSewing a shot. We hope you'll 💜 it.

  Have fun 🤓
  `)
  else
    console.log(`

  FreeSewing's documentation for developers is available at: ${chalk.green(
    'https://freesewing.dev/'
  )}

  Our community is on Discord: ${chalk.green('https://discord.freesewing.dev/')}
  The ${chalk.bold('development-help')} channel is a good place to ask for help if you get stuck

  Happy hacking 🤓
  `)
}

// Creates the environment based on the user's choices
export const createEnvironment = async (choices) => {
  // Store directories for re-use
  config.cwd = cwd
  config.source = {
    root: cwd,
    template: cwd + `/../templates/from-${choices.template}`,
    shared: cwd + `/../shared`,
  }
  config.dest = join(process.cwd(), choices.name)

  // Create target directory
  await mkdir(config.dest, { recursive: true })

  // Find files
  config.files = {
    template: await rdir(config.source.template),
    shared: await rdir(config.source.shared),
  }

  // Output a linebreak
  console.log()

  // Copy/Template files
  try {
    await oraPromise(copyTemplate(config, choices), {
      text:
        chalk.white.bold('🟨⬜⬜⬜  Copying template files') +
        chalk.white.dim('   |  Just a moment'),
      successText: chalk.white.bold('🟩⬜⬜⬜  Copied template files'),
      failText: chalk.white.bold(
        '🟥⬜⬜⬜  Failed to copy template files  |  Development environment will not function'
      ),
    })
  } catch (err) {
    /* no feedback here */
  }

  // Install dependencies
  try {
    await oraPromise(installDependencies(config, choices), {
      text:
        chalk.white.bold('🟩🟨⬜⬜  Installing dependencies') +
        chalk.white.dim('  |  Please wait, this will take a while'),
      successText: chalk.white.bold('🟩🟩⬜⬜  Installed dependencies'),
      failText: chalk.white.bold(
        '🟩🟥⬜⬜  Failed to install dependencies  |  Development environment will not function'
      ),
    })
  } catch (err) {
    /* no feedback here */
  }

  // Fetch web components
  try {
    await oraPromise(downloadLabFiles(config), {
      text:
        chalk.white.bold('🟩🟩🟨⬜  Downloading web components') +
        chalk.white.dim('  |  Almost there'),
      successText: chalk.white.bold('🟩🟩🟩⬜  Downloaded web components'),
      failText: chalk.white.bold(
        '🟩🟩🟥⬜  Failed to download web components  |  Development environment will not function'
      ),
    })
  } catch (err) {
    /* no feedback here */
  }

  // Initialize git repository
  try {
    await oraPromise(initGitRepo(config, choices), {
      text:
        chalk.white.bold('🟩🟩🟩⬜  Initializing git repository') +
        chalk.white.dim('  |  You have git, right?'),
      successText: chalk.white.bold('🟩🟩🟩🟩  Initialized git repository'),
      failText:
        chalk.white.bold('🟩🟩🟩🟥  Failed to initialize git repository') +
        chalk.white.dim('  |  This does not stop you from developing your design'),
    })
  } catch (err) {
    /* no git no worries */
  }

  // All done. Show tips
  showTips(config, choices)
}
