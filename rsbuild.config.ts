import { defineConfig } from '@rsbuild/core';
import { pluginPreact } from '@rsbuild/plugin-preact';

export default defineConfig({
  plugins: [pluginPreact()],
  html: {
    title: 'stickydesign',
    favicon: './public/stick_icon.svg',
  },
});
