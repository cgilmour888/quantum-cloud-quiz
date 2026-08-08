import { defineConfig, loadEnv, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';

const KIB = 1024;
const MIB = 1024 * KIB;

function normalizeBasePath(value: string | undefined): string {
  const candidate = (value ?? '/').trim();

  if (!candidate || candidate === '/') {
    return '/';
  }

  const leading = candidate.startsWith('/')
    ? candidate
    : `/${candidate}`;

  return leading.endsWith('/')
    ? leading
    : `${leading}/`;
}

function qcqBundleBudget(): PluginOption {
  const javascriptBudget = 950 * KIB;
  const cssBudget = 420 * KIB;
  const totalAssetBudget = 3 * MIB;

  return {
    name: 'qcq-bundle-budget',
    apply: 'build',

    generateBundle(_, bundle) {
      let totalBytes = 0;

      for (const [fileName, output] of Object.entries(bundle)) {
        const bytes =
          output.type === 'asset'
            ? typeof output.source === 'string'
              ? Buffer.byteLength(output.source)
              : output.source.byteLength
            : Buffer.byteLength(output.code);

        totalBytes += bytes;

        if (fileName.endsWith('.js') && bytes > javascriptBudget) {
          this.error(
            `QCQ JavaScript bundle budget exceeded by ${fileName}: ${bytes} bytes > ${javascriptBudget}.`,
          );
        }

        if (fileName.endsWith('.css') && bytes > cssBudget) {
          this.error(
            `QCQ CSS bundle budget exceeded by ${fileName}: ${bytes} bytes > ${cssBudget}.`,
          );
        }
      }

      if (totalBytes > totalAssetBudget) {
        this.error(
          `QCQ total emitted-asset budget exceeded: ${totalBytes} bytes > ${totalAssetBudget}.`,
        );
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    appType: 'spa',

    base: normalizeBasePath(env.VITE_PUBLIC_BASE_PATH),

    plugins: [
      react(),
      qcqBundleBudget(),
    ],

    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
    },

    preview: {
      host: '127.0.0.1',
      port: 4173,
      strictPort: true,
    },

    build: {
      target: 'es2022',
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: true,
      cssCodeSplit: true,

      modulePreload: {
        polyfill: false,
      },

      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },


  };
});
