/**
 * Generate the dependency-free deployable static site. Explicit allowlist:
 * no tests, dev-only scripts, hidden game snapshots or repository metadata.
 */
import { mkdir, rm, copyFile, readdir, writeFile, cp } from 'node:fs/promises';
import { join } from 'node:path';

const root=process.cwd();
const output=join(root,'_site');
await rm(output,{recursive:true,force:true});
await mkdir(join(output,'src'),{recursive:true});
const top=['index.html','style.css','favicon.svg','manifest.webmanifest'];
for(const file of top)await copyFile(join(root,file),join(output,file));
const source=(await readdir(join(root,'src'))).filter(name=>name.endsWith('.mjs'));
for(const file of source)await copyFile(join(root,'src',file),join(output,'src',file));
// The four original portrait assets are an explicit trusted static directory.
await cp(join(root,'assets','monsters'),join(output,'assets','monsters'),
  {recursive:true});
await writeFile(join(output,'.nojekyll'),'');
console.log('Packaged Shadow Bearings: '+top.length+' top-level files and '+source.length+' JavaScript modules and four original monster portraits.');
