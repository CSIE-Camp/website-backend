const dotenv = require("dotenv")
dotenv.config()

const jwt = require("jsonwebtoken")
const mailer = require("nodemailer")

async function SendVerifyEmail(email, id){
    let token = jwt.sign({
        id: id
    }, process.env.JWT_EMAIL_SECRET, {algorithm: "HS512", expiresIn: "15m"})
    //send token to given email
    //dunno why but even the test account doesnt want to work 
}

module.exports = {
    SendVerifyEmail: SendVerifyEmail
}