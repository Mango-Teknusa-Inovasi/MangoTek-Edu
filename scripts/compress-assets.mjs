import { readdir, readFile, writeFile } from "node:fs/promises";
import { brotliCompressSync, gzipSync, constants } from "node:zlib";
for (const file of await readdir("dist/assets")) {
  if (!/\.(js|css)$/.test(file)) continue;
  const path = "dist/assets/" + file,
    data = await readFile(path);
  await Promise.all([
    writeFile(
      path + ".br",
      brotliCompressSync(data, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 9 },
      }),
    ),
    writeFile(path + ".gz", gzipSync(data, { level: 9 })),
  ]);
}
console.log("Prepared Brotli and gzip assets.");
