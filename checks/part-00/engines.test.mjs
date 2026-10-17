// Authoring-only: intentionally not included in the learner Vitest glob.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import semver from 'semver';
const read = relative => JSON.parse(readFileSync(new URL('../../' + relative, import.meta.url), 'utf8'));
for (const dir of ['', 'reference-solutions/part-00/', 'reference-solutions/part-01/', 'reference-solutions/part-02/', 'reference-solutions/part-03/']) {
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
