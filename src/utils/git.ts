// eslint-disable-next-line import/default
import simleGit from 'simple-git/promise';
import { existsSync } from 'fs-extra';
import log from './logger';

export { simleGit as git };

export type SimpleGit = simleGit.SimpleGit;

export async function preparePages(
  ws: string,
  tags?: boolean
): Promise<SimpleGit> {
  const git = simleGit(ws);

  await git.fetch('origin', 'gh-pages', { '--tags': tags });

  if (!existsSync(`${ws}/data`)) {
    log('creating worktree:');
    await git.raw([
      'worktree',
      'add',
      ' --track',
      '-b',
      'gh-pages',
      './data',
      'origin/gh-pages',
    ]);
  }

  return git;
}
