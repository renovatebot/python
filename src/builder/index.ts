import {
  exec,
  getEnv,
  isDryRun,
  getArg,
  readFile,
  getWorkspace,
} from '../util';
import { init as cacheInit } from 'renovate/dist/workers/global/cache';
import os from 'os';
import { existsSync } from 'fs';
import log from '../utils/logger';
import { preparePages } from '../utils/git';
import { getPkgReleases, ReleaseResult } from 'renovate/dist/datasource';
import { get as getVersioning } from 'renovate/dist/versioning';
import { readJSON } from 'fs-extra';
import { Config, ConfigFile } from '../types/builder';
import chalk from 'chalk';
import is from '@sindresorhus/is';
import { setFailed } from '@actions/core';
import shell from 'shelljs';

cacheInit(os.tmpdir());

async function docker(...args: string[]): Promise<void> {
  await exec('docker', [...args]);
}
async function dockerRun(...args: string[]): Promise<void> {
  await docker('run', '--rm', ...args);
}

async function pythonBuilder(ws: string, version: string): Promise<void> {
  await dockerRun(
    '-u',
    'root',
    '-v',
    `${ws}/.cache/python:/usr/local/python`,
    'builder',
    version,
    `/usr/local/python/${version}`
  );
}
let latestStable: string | undefined;

function getVersions(versions: string[]): ReleaseResult {
  return {
    releases: versions.map((version) => ({
      version,
    })),
  };
}

async function getBuildList({
  datasource,
  depName,
  versioning,
  startVersion,
  ignoredVersions,
  lastOnly,
  forceUnstable,
  versions,
  latestVersion,
}: Config): Promise<string[]> {
  log('Looking up versions');
  const ver = getVersioning(versioning as never);
  const pkgResult = versions
    ? getVersions(versions)
    : await getPkgReleases({
        datasource,
        depName,
        versioning,
      });
  if (!pkgResult) {
    return [];
  }
  let allVersions = pkgResult.releases
    .map((v) => v.version)
    .filter((v) => ver.isVersion(v) && ver.isCompatible(v, startVersion));
  log(`Found ${allVersions.length} total versions`);
  if (!allVersions.length) {
    return [];
  }
  allVersions = allVersions
    .filter(
      (v) => /* istanbul ignore next */ !ver.isLessThanRange?.(v, startVersion)
    )
    .filter((v) => !ignoredVersions.includes(v));

  if (!forceUnstable) {
    log('Filter unstable versions');
    allVersions = allVersions.filter((v) => ver.isStable(v));
  }

  log(`Found ${allVersions.length} versions within our range`);
  log(`Candidates:`, allVersions.join(', '));

  latestStable =
    latestVersion ||
    pkgResult.latestVersion ||
    allVersions.filter((v) => ver.isStable(v)).pop();
  log('Latest stable version is ', latestStable);

  if (latestStable && !allVersions.includes(latestStable)) {
    log.warn(
      `LatestStable '${latestStable}' not buildable, candidates: `,
      allVersions.join(', ')
    );
  }

  const lastVersion = allVersions[allVersions.length - 1];
  log('Most recent version is ', lastVersion);

  if (lastOnly) {
    log('Building last version only');
    allVersions = [latestStable && !forceUnstable ? latestStable : lastVersion];
  }

  if (allVersions.length) {
    log('Build list: ', allVersions.join(', '));
  } else {
    log('Nothing to build');
  }
  return allVersions;
}

const keys: (keyof ConfigFile)[] = [
  'datasource',
  'depName',
  'versioning',
  'latestVersion',
];

function checkArgs(
  cfg: ConfigFile,
  groups: Record<string, string | undefined>
): void {
  for (const key of keys) {
    if (!is.string(cfg[key]) && is.nonEmptyString(groups[key])) {
      cfg[key] = groups[key] as never;
    }
  }
}

async function readDockerConfig(cfg: ConfigFile): Promise<void> {
  const dockerFileRe = new RegExp(
    '# renovate: datasource=(?<datasource>.*?) depName=(?<depName>.*?)( versioning=(?<versioning>.*?))?\\s' +
      `(?:ENV|ARG) PYTHON_VERSION=(?<latestVersion>.*)\\s`,
    'g'
  );
  const dockerfile = await readFile('Dockerfile');
  const m = dockerFileRe.exec(dockerfile);
  if (m && m.groups) {
    checkArgs(cfg, m.groups);
  }
}

async function getConfig(ws: string): Promise<Config> {
  const cfg: ConfigFile = await readJSON(`${ws}/builder.json`);

  await readDockerConfig(cfg);

  return {
    ...cfg,
    ignoredVersions: cfg.ignoredVersions ?? [],
    dryRun: isDryRun(),
    lastOnly: getArg('last-only') == 'true',
  };
}

const DefaultUbuntuRelease = '18.04';
(async () => {
  try {
    log.info('Builder started');
    const ws = getWorkspace();
    const data = `${ws}/data/${
      getEnv('UBUNTU_VERSION') || DefaultUbuntuRelease
    }`;

    await preparePages(ws);

    const cfg = await getConfig(ws);

    if (cfg.dryRun) {
      log.warn(chalk.yellow('[DRY_RUN] detected'));
      cfg.lastOnly = true;
    }

    log('config:', JSON.stringify(cfg));

    const versions = await getBuildList(cfg);

    shell.mkdir('-p', `${ws}/.cache/python`);

    for (const version of versions) {
      if (existsSync(`${data}/python-${version}.tar.xz`)) {
        log('Skipping existing version:', version);
        continue;
      }

      log('Building version:', version);
      await pythonBuilder(ws, version);

      log('Compressing version:', version);
      await exec('tar', [
        '-cJf',
        `./.cache/python-${version}.tar.xz`,
        '-C',
        '.cache/python',
        version,
      ]);
    }
  } catch (error) {
    setFailed(error.message);
  }
})();
