module.exports = {
  hooks: {
    readPackage(pkg, context) {
      if (pkg.name === 'wouter' && pkg.version === '3.7.1') {
        context.log('Applying patch to wouter@3.7.1');
      }
      return pkg;
    },
  },
};
