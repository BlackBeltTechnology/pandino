import terser from "@rollup/plugin-terser";

const formatToExtension = (format) => {
  if (format === 'esm') {
    return 'mjs';
  } else if (format === 'cjs') {
    return 'cjs';
  }
  return 'js';
}

export const generateOutputs = (name, formats = [], options = { keepWebpackIgnore: false }) => {
  const res = [];
  for (const format of formats) {
    res.push({
      sourcemap: true,
      file: `dist/${format}/${name}.min.${formatToExtension(format)}`,
      format,
      plugins: [
        terser(options.keepWebpackIgnore ? {
          format: {
            comments: function (node, comment) {
              const text = comment.value;
              return /webpackIgnore/i.test(text);
            },
          },
        } : {}),
      ],
    });
    res.push({
      file: `dist/${format}/${name}.${formatToExtension(format)}`,
      format,
    });
  }
  return res;
};
