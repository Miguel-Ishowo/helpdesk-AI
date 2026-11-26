const { pathsToModuleNameMapper } = require('ts-jest');
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: { module: 'commonjs', allowJs: true } }] },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@nestjs/typeorm$': '<rootDir>/test-shims/nestjs-typeorm.ts',
    '^@nestjs/jwt$': '<rootDir>/test-shims/nestjs-jwt.ts',
    '^@nestjs/config$': '<rootDir>/test-shims/nestjs-config.ts',
  },
};
