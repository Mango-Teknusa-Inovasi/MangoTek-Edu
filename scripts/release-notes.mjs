import { readFileSync } from 'node:fs';
const tag = process.argv[2];
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (!tag || tag !== `v${pkg.version}` || !/^v\d+\.\d+\.\d+$/.test(tag)) {
  throw new Error('The release tag must be a stable version matching package.json.');
}
const changelog = readFileSync('CHANGELOG.md', 'utf8');
const heading = `## [${pkg.version}]`;
const start = changelog.indexOf(heading);
if (start < 0) throw new Error('Add a changelog section before releasing.');
const end = changelog.indexOf('\n## ', start + heading.length);
const section = changelog.slice(start, end < 0 ? undefined : end).split('\n[')[0];
console.log(section.trim());
