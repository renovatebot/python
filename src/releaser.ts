import log from './utils/logger';
import shell from 'shelljs';
import { preparePages, SimpleGit, git } from './utils/git';
import { existsSync, ensureDir } from 'fs-extra';

const verRe = /\/(?<name>(?<release>\d+\.\d+)\/python-(?<version>\d+\.\d+\.\d+)\.tar\.xz)$/;

async function prepare(ws: string): Promise<SimpleGit> {
  const repo = await preparePages(ws, true);

  await repo.addConfig('user.name', 'Renovate Bot');
  await repo.addConfig('user.email', 'bot@renovateapp.com');

  return git(`${ws}/data`);
}

(async () => {
  try {
    log.info('Releaser started');
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

    await git.add('.');
    const status = await git.status();
    if (!status.isClean()) {
      log('Commiting files');
      git.commit('updated builds');
      git.push('origin', 'gh-pages:gh-pages', { '--force': true });
    }

    for (const version of versions) {
      log('Add tag', version);
      git.addTag(version);
    }

    log('Push tags');
    git.pushTags();
  } catch (e) {
    log.error(e.message);
    process.exit(1);
  }
})();
