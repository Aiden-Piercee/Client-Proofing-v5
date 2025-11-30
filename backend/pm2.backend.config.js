require("dotenv").config({ path: __dirname + "/.env" });

module.exports = {
  apps: [
    {
      name: "client-proofing-backend",
      script: "dist/main.js",
      cwd: __dirname,
      watch: false,
      env: {
        NODE_ENV: "production",
        ADMIN_USER: process.env.ADMIN_USER,
        ADMIN_PASS: process.env.ADMIN_PASS,
        ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET,
        FRONTEND_URL: process.env.FRONTEND_URL
      }
    }
  ]
};

