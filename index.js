const {
  createWebpackDevConfig,
  createWebpackProdConfig,
} = require("@craco/craco");

const { logger } = require("@storybook/node-logger");

const { resolve, relative, dirname, join } = require("path");

const {
  mergePlugins,
} = require("@storybook/preset-create-react-app/dist/helpers/mergePlugins");
const {
  processCraConfig,
} = require("@storybook/preset-create-react-app/dist/helpers/processCraConfig");
const {
  getModulePath,
} = require("@storybook/preset-create-react-app/dist/helpers/getModulePath");

const CWD = process.cwd();

const babelDefault = () => ({
  presets: [],
  plugins: [],
});

const incompatiblePresets = [
  "@storybook/preset-scss",
  "@storybook/preset-typescript",
  "@storybook/preset-create-react-app",
];

const checkPresets = (options) => {
  let presetsList = options.presetsList || [];

  presetsList.forEach((preset) => {
    const presetName = typeof preset === "string" ? preset : preset.name;
    if (incompatiblePresets.includes(presetName)) {
      logger.warn(
        `\`${presetName}\` may not be compatible with \`storybook-preset-craco\``
      );
    }
  });
};

const webpack = (webpackConfig = {}, options) => {
  const createWebpackConfig =
    webpackConfig.mode === "production"
      ? createWebpackProdConfig
      : createWebpackDevConfig;

  checkPresets(options);

  const cracoConfigFile =
    options.cracoConfigFile || resolve(CWD, "craco.config.js");

  const cracoConfig = require(cracoConfigFile);

  logger.info(
    `=> Loading Craco configuration from \`${relative(CWD, cracoConfigFile)}\``
  );

  const scriptsPackageName = cracoConfig.reactScriptsVersion || "react-scripts";

  const scriptsPath = dirname(
    require.resolve(`${scriptsPackageName}/package.json`)
  );

  logger.info(`=> Using react-scripts from \`${relative(CWD, scriptsPath)}\``);

  const cracoWebpackConfig = createWebpackConfig(cracoConfig);

  const resolveLoader = {
    modules: ["node_modules", join(scriptsPath, "node_modules")],
  };

  // Remove existing rules related to JavaScript and TypeScript.
  logger.info(`=> Removing existing JavaScript and TypeScript rules.`);
  const filteredRules =
    webpackConfig.module &&
    webpackConfig.module.rules.filter(
      ({ test }) =>
        !(
          test instanceof RegExp &&
          ((test && test.test(".js")) || test.test(".ts"))
        )
    );

  // Select the relevent craco rules and add the Storybook config directory.
  logger.info(`=> Modifying craco rules.`);

  const craRules = processCraConfig(cracoWebpackConfig, options);

  // CRA uses the `ModuleScopePlugin` to limit suppot to the `src` directory.
  // Here, we select the plugin and modify its configuration to include Storybook config directory.
  const plugins = cracoWebpackConfig.resolve.plugins.map((plugin) => {
    if (plugin.appSrcs) {
      // Mutate the plugin directly as opposed to recreating it.
      // eslint-disable-next-line no-param-reassign
      plugin.appSrcs = [...plugin.appSrcs, resolve(options.configDir)];
    }
    return plugin;
  });

  // Return the new config.
  return {
    ...webpackConfig,
    module: {
      ...webpackConfig.module,
      rules: [...(filteredRules || []), ...craRules],
    },
    plugins: mergePlugins(
      ...(webpackConfig.plugins || []),
      ...cracoWebpackConfig.plugins
    ),
    resolve: {
      ...webpackConfig.resolve,
      alias: {...webpackConfig.resolve.alias, ...cracoWebpackConfig.resolve.alias},
      extensions: cracoWebpackConfig.resolve.extensions,
      modules: [
        ...((webpackConfig.resolve && webpackConfig.resolve.modules) || []),
        ...((cracoWebpackConfig.resolve && cracoWebpackConfig.resolve.modules) || []),
        join(scriptsPath, "node_modules"),
        ...getModulePath(CWD),
      ],
      plugins: plugins,
    },
    resolveLoader,
  };
};

const webpackFinal = (webpackConfig = {}, options) => {
  logger.info(`=> Removing storybook default rules.`);

  // these are suppreseed by storybook when @storybook/preset-create-react-app is present.
  const rules = webpackConfig.module.rules.filter(
    (rule) =>
      !(
        rule.test instanceof RegExp &&
        (rule.test.test(".css") ||
          rule.test.test(".svg") ||
          rule.test.test(".mp4"))
      )
  );

  return {
    ...webpackConfig,
    module: {
      ...webpackConfig.module,
      rules: rules,
    },
  };
};

const managerWebpack = (webpackConfig = {}, options) => {
  const cracoConfigFile =
    options.cracoConfigFile || resolve(CWD, "craco.config.js");

  const cracoConfig = require(cracoConfigFile);

  const scriptsPackageName = cracoConfig.reactScriptsVersion || "react-scripts";

  const scriptsPath = dirname(
    require.resolve(`${scriptsPackageName}/package.json`)
  );

  const resolveLoader = {
    modules: ["node_modules", join(scriptsPath, "node_modules")],
  };

  return {
    ...webpackConfig,
    resolveLoader,
  };
};

module.exports = {
  babelDefault,
  webpack,
  webpackFinal,
  managerWebpack,
};
