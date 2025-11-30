module.exports = {
  apps: [
    {
      name: 'client-proofing-api',
      script: 'dist/main.js',
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
