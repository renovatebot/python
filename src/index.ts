import { exec } from './util';
import { init as cacheInit } from 'renovate/dist/workers/global/cache';
import os from 'os';

cacheInit(os.tmpdir());

async function docker(...args: string[]): Promise<void> {
  await exec('docker', [...args]);
}
async function dockerRun(...args: string[]): Promise<void> {
  await docker('run', '--rm', ...args);
}

async function dockerBuilder(ws: string, ...args: string[]): Promise<void> {
  await dockerRun(
    '-u',
    'root',
    '-v',
    `${ws}/.cache/python:/usr/local/python`,
    'builder',
    ...args
  );
}

// async function dockerBuildx(...args: string[]): Promise<void> {
//   await docker('buildx', ...args);
// }

(async () => {
  const ws = process.cwd();

  // const github = new GitHub(process.env.GITHUB_TOKEN);

  // // Get owner and repo from context of payload that triggered the action
  // const { owner, repo } = context.repo;

  exec('mkdir', ['-p', `.cache/python`]);

  for (const version of ['3.7.2']) {
    await dockerBuilder(
      ws,
      'python-build',
      version,
      `/usr/local/python/${version}`
    );

    await exec('tar', [
      '-cJf',
      `./.cache/python-${version}.tar.xz`,
      '-C',
      '.cache/python',
      version,
    ]);
  }
})();
