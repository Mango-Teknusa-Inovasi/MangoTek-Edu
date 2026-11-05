# Third-Party Notices

The root MIT license applies to original MangoTek Edu code. It does not replace the licenses of dependencies or vendored components. Retain their notices when redistributing the application.

## Vendored components

`src/components/react-bits/AnimatedContent.tsx` and `SplitText.tsx` originate from [React Bits](https://github.com/DavidHDev/react-bits). Their license is **MIT plus the Commons Clause**, preserved in [licenses/react-bits.md](licenses/react-bits.md). The project includes adaptations for its animation and accessibility requirements. These files are not offered under an unrestricted MIT-only grant.

## Runtime dependencies and assets

- **GSAP and @gsap/react:** distributed under their respective upstream licenses, including the [GSAP Standard License](https://gsap.com/community/standard-license/). Consult the license files shipped in the installed packages. The project does not relicense GSAP as MIT.
- **Plus Jakarta Sans:** distributed through Fontsource under the SIL Open Font License. The font license is included in its npm package.
- **React, React DOM, Three.js, React Three Fiber, Hono, Vite, Knex, database drivers, and other npm packages:** retain the licenses and copyright notices shipped with their respective packages. Exact resolved versions are recorded in `package-lock.json`.
- **sharp/libvips:** image processing dependencies include their own license and notice requirements. Preserve the package notices and any licenses shipped with platform-specific binaries.

The npm dependency tree contains additional transitive packages. This document highlights material exceptions and attribution; it is not a replacement for each package's license text.

## Project artwork and identity

The supplied parent organization logo and the MangoTek Edu identity identify Mango Teknusa Inovasi and its education portal. Original scene geometry and rendered posters are maintained in this repository. Device screens are conceptual illustrations, not representations of an externally operated product.

No trademark rights or organizational endorsement are granted by the software license. When deploying a derivative service, use your own identity to avoid confusing visitors.
