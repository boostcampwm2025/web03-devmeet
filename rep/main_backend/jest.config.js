// 경로 설정등 알려주기 위해서 이 부분이 필요하다.
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/test'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  // jest 테스트가 경로를 인식할 수 있게해주는 설정
  moduleNameMapper: {
    '^@error/(.*)$': '<rootDir>/src/0.common/error/$1',
    '^@domain/(.*)$': '<rootDir>/src/1.domain/$1',
    '^@app/(.*)$': '<rootDir>/src/2.application/$1',
    '^@infra/(.*)$': '<rootDir>/src/3-1.infra/$1',
    '^@present/(.*)$': '<rootDir>/src/3-2.presentation/$1',
  },
};
