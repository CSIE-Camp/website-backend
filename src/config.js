const dotenv = require("dotenv")
dotenv.config();

module.exports = {
    DATABASE_URL: process.env.DATABASE_URL,

    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRE: process.env.ACCESS_TOKEN_EXPIRE,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE,
    MAX_REFRESH_TOKENS: process.env.MAX_REFRESH_TOKENS,
    EMAIL_TOKEN_SECRET: process.env.EMAIL_TOKEN_SECRET,
    EMAIL_TOKEN_EXPIRE: process.env.EMAIL_TOKEN_EXPIRE,

    PORT: Number(process.env.PORT) || 8080
}