import log from './utils/logger';
import shell from 'shelljs';
import { preparePages, SimpleGit, git } from './utils/git';
import { existsSync, ensureDir, writeFile } from 'fs-extra';
import { get as getVersioning } from 'renovate/dist/versioning';
import { setFailed } from '@actions/core';
import { isDryRun } from './util';
import chalk from 'chalk';

const verRe = /\/(?<name>(?<release>\d+\.\d+)\/python-(?<version>\d+\.\d+\.\d+)\.tar\.xz)$/;

async function prepare(ws: string): Promise<SimpleGit> {
  const repo = await preparePages(ws, true);

  await repo.addConfig('user.name', 'Renovate Bot');
  await repo.addConfig('user.email', 'bot@renovateapp.com');

  return git(`${ws}/data`);
}
async function updateReadme(path: string): Promise<void> {
  const files = shell.find(`${path}/**/*.tar.xz`);
  log('Processing files:', files.length);
  const releases: Record<string, Record<string, string>> = Object.create(null);

  for (const file of files) {
    const m = verRe.exec(file);

    if (!m?.groups) {
      log.warn('Invalid file:', file);
      continue;
    }

    const { name, version, release } = m.groups;

    if (!releases[release]) {
      releases[release] = Object.create(null);
    }

    releases[release][version] = name;
  }

  const dockerVer = getVersioning('docker');
  const semver = getVersioning('semver');

  let md = `# python releases\n\n` + `Prebuild python builds for ubuntu\n\n`;
  for (const release of Object.keys(releases).sort(dockerVer.sortVersions)) {
    md += `\n\n## ubuntu ${release}\n\n`;

    const data = releases[release];

    for (const version of Object.keys(data).sort(semver.sortVersions)) {
      md += `* [${version}](${data[version]})\n`;
    }
  }

  await writeFile(`${path}/README.md`, md);
}

(async () => {
  try {
    log.info('Releaser started');
    const dryRun = isDryRun();
    const ws = process.cwd();
    const data = `${ws}/data`;
    const cache = `${ws}/.cache`;

    log('Prepare worktree');
    const git = await prepare(ws);

    const versions = new Set<string>();
    const tags = new Set((await git.tags()).all);

    if (existsSync(cache)) {
      const files = shell.find(`${cache}/**/*.tar.xz`);
      log('Processing files:', files.length);

      for (const file of files) {
        const m = verRe.exec(file);

        if (!m?.groups) {
          log.warn('Invalid file:', file);
          continue;
        }
        log('Processing file:', file);

        const name = m.groups.name;
        const version = m.groups.version;

        await ensureDir(`${data}/${m.groups.release}`);

        shell.cp('-r', file, `${data}/${name}`);

        if (tags.has(version)) {
          log('Skipping existing version:', version);
          continue;
        }

        versions.add(version);
      }
    }

    await updateReadme(data);

    await git.add('.');
    const status = await git.status();
    if (!status.isClean()) {
      log('Commiting files');
      git.commit('updated files');
      if (dryRun) {
        log.warn(
          chalk.yellow('[DRY_RUN]'),
          chalk.blue('Would push:'),
          'gh-pages'
        );
      } else {
        git.push('origin', 'gh-pages', { '--force': true });
      }
    }

    for (const version of versions) {
      log('Add tag', version);
      git.addTag(version);
    }

    log('Push tags');
    if (dryRun) {
      log.warn(chalk.yellow('[DRY_RUN]'), chalk.blue('Would push tags'));
    } else {
      git.pushTags();
    }
  } catch (error) {
    setFailed(error.message);
  }
})();
