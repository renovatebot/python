// eslint-disable-next-line import/default
import simleGit from 'simple-git/promise';
import { existsSync } from 'fs-extra';
import log from './logger';

export { simleGit as git };

export type SimpleGit = simleGit.SimpleGit;

export const ReleaseBranch = 'releases';

export async function prepareWorkspace(
  ws: string,
  tags?: boolean
): Promise<SimpleGit> {
  const git = simleGit(ws);

  await git.fetch('origin', ReleaseBranch, tags ? { '--tags': null } : {});

  if (!existsSync(`${ws}/data`)) {
    log('creating worktree');
    await git.raw([
      'worktree',
      'add',
      '--force',
      '--track',
      '-B',
      ReleaseBranch,
      './data',
      `origin/${ReleaseBranch}`,
    ]);
  }

  return git;
}
