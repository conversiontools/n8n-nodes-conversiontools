const { src, dest } = require('gulp');
const path = require('path');

function buildIcons() {
  return src(['nodes/**/*.svg', 'credentials/**/*.svg'], { base: '.' }).pipe(
    dest('dist')
  );
}

exports['build:icons'] = buildIcons;
