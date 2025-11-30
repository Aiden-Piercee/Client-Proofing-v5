module.exports = {
  apps: [
    {
      name: "client-proofing-backend",
      script: "dist/main.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production"
      },
      env_production: {
        NODE_ENV: "production"
      }
    }
  ]
};
