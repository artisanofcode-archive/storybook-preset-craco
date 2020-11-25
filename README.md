# Craco preset for Storybook

One-line [craco](https://github.com/gsoft-inc/craco) configuration for Storybook.

This preset is designed to use alongside [`@storybook/react`](https://github.com/storybookjs/storybook/tree/master/app/react).

## Basic usage

First, install this preset to your project.

```sh
# Yarn
yarn add -D storybook-preset-craco

# npm
npm install -D storybook-preset-craco
```

Once installed, add this preset to the appropriate file:

- `./.storybook/main.js`

  ```js
  module.exports = {
    addons: ["storybook-preset-craco"],
  };
  ```

## Advanced usage

### Usage with Docs

When working with Storybook Docs, simply add the following config to your `main.js` file.

```js
module.exports = {
  addons: [
    "storybook-preset-craco",
    {
      name: "@storybook/addon-docs",
      options: {
        configureJSX: true,
      },
    },
  ],
};
```

### Custom `craco.config.js`

In most cases, this preset will look for your `craco.config.js` in the current working directory.

If you are using a non standard project layout then you can provide it in `cracoConfigFile`.

```js
module.exports = {
  addons: [
    {
      name: "storybook-preset-craco",
      options: {
        cracoConfigFile: "../craco.config.js",
      },
    },
  ],
};
```
