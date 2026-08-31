const { pathsToModuleNameMapper } = require('ts-jest/utils')
// @ts-ignore
const { compilerOptions } = require('./tsconfig')

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
  modulePaths: [
      '<rootDir>'
  ],
};