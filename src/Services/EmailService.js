const dotenv = require("dotenv")
dotenv.config()


const jwt = require("jsonwebtoken")
const mailer = require("nodemailer")

const { GenerateEmailToken } = require("./../Modules/Tokens")

async function SendVerifyEmail(email, id){
    let token = await GenerateEmailToken(email, id)
    console.log(token)
    return true
}

module.exports = {
    SendVerifyEmail: SendVerifyEmail
}