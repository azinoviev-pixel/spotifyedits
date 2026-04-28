const config = {
  testDir: "./tests-lt",
  testMatch: "**/lt_*.cjs",
  timeout: 180_000,
  expect: { timeout: 15_000 },
  workers: 3,
  reporter: [["line"]],
  projects: [{ name: "lambdatest" }],
};
module.exports = config;
