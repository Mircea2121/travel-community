const { globSync } = require("tinyglobby");

// Next ESLint only uses globSync for root directories. fast-glob does not
// implicitly recurse into directory matches; tinyglobby otherwise does.
exports.globSync = (patterns, options = {}) => globSync(patterns, {
  ...options,
  expandDirectories: false,
});
