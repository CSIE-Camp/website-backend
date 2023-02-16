const dotenv = require("dotenv")
dotenv.config()

const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    secureConnection: true, 
    auth: {
        user: 'Gmail帳號',
        pass: 'Gmail密碼' 
    },
    tls: {
        rejectUnauthorized: false
    }
});


async function SendVerifyEmail(email, id){
    let token = await GenerateEmailToken(id)
    //CLIENT_URL/verification/email/${token}
    console.log(token)
    return true
}

async function SendPasswordResetEmail(email, UserId, ip){
    let token = await GeneratePasswordResetToken(UserId)
    //CLIENT_URL/login/password-reset/${token}
    console.log(token)
    return true
}

module.exports = {
    SendVerifyEmail: SendVerifyEmail,
    SendPasswordResetEmail: SendPasswordResetEmail
}
