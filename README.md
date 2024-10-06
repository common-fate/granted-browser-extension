# granted-browser-extension

Source code for the [Granted Chrome browser extension](https://chromewebstore.google.com/detail/granted/cjjieeldgoohbkifkogalkmfpddeafcm).

We plan on migrating the existing [Granted Containers Firefox extension](https://github.com/common-fate/granted-containers) source code to this repository too.

## Building from source

Building from source requires [NodeJS](https://nodejs.org/en/download) and [pnpm](https://pnpm.io/installation) to be installed.

1. Install dependencies: `pnpm install`

2. Build the extension: `cd packages/chrome && pnpm build`

The resulting (unpacked) extension is available at `packages/chrome/.output/chrome-mv3`. You can then load the unpacked extension in Chrome, or similar browsers, by following [this guide](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).
