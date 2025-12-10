module.exports = {
  apps: [
    {
      name: "client-proofing-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/home/Kokenstaging/web/clients.chasing.media/client-proofing/frontend",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
