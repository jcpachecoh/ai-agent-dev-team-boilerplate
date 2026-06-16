import type { StorybookConfig } from '@storybook/react-vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  docs: {
    autodocs: 'tag',
  },
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(Array.isArray(config.resolve.alias) ? {} : config.resolve.alias),
      react: resolve(packageRoot, 'node_modules/react'),
      'react-dom': resolve(packageRoot, 'node_modules/react-dom'),
      'react-dom/client': resolve(packageRoot, 'node_modules/react-dom/client'),
      'react/jsx-runtime': resolve(packageRoot, 'node_modules/react/jsx-runtime'),
    };
    config.resolve.dedupe = [...new Set([...(config.resolve.dedupe ?? []), 'react', 'react-dom'])];
    return config;
  },
};

export default config;
