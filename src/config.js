const dotenv = require("dotenv")
dotenv.config();

module.exports = {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_EMAIL_SECRET: process.env.JWT_EMAIL_SECRET,
    PORT: Number(process.env.PORT) || 8080
}