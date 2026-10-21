// Authoring-only: intentionally not included in the learner Vitest glob.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import semver from 'semver';
const read = relative => JSON.parse(readFileSync(new URL('../../' + relative, import.meta.url), 'utf8'));
const directories = ['', 'reference-solutions/part-00/', 'reference-solutions/part-01/', 'reference-solutions/part-02/', 'reference-solutions/part-03/', 'reference-solutions/part-04/', 'reference-solutions/part-05/', 'reference-solutions/part-06/', 'reference-solutions/part-07/', 'reference-solutions/part-08/', 'reference-solutions/part-09/', 'reference-solutions/part-10/', 'reference-solutions/part-11/'];
test('reference source packages keep all local dependency links inside their copy', () => {
  for (const dir of directories.slice(1)) {
    const base = new URL('../../' + dir, import.meta.url);
    const manifest = read(dir + 'package.json');
    for (const version of Object.values({...manifest.dependencies, ...manifest.devDependencies})) {
      if (version.startsWith('file:')) assert.ok(new URL(version.slice(5), base).href.startsWith(base.href), dir + ' has an outward file dependency');
    }
    for (const entry of Object.values(read(dir + 'package-lock.json').packages)) {
      if (entry.link) assert.ok(new URL(entry.resolved, base).href.startsWith(base.href), dir + ' has an outward locked link');
    }
  }
});
for (const dir of directories) {
  test((dir || 'root') + ' advertises only Node versions supported by locked dependencies', () => {
    const declared = read(dir + 'package.json').engines?.node;
    assert.equal(typeof declared, 'string', 'Declare the supported Node range');
    const packages = read(dir + 'package-lock.json').packages;
    for (const [name, entry] of Object.entries(packages)) {
      const accepted = entry.engines?.node;
      if (name && accepted) assert.ok(semver.subset(declared, accepted), name + ' requires ' + accepted + ', advertised ' + declared);
    }
  });
}
