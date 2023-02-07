const dotenv = require("dotenv")
dotenv.config()
const express = require('express')
const jwt = require("jsonwebtoken")
const mailer = require("nodemailer")
const router = express.Router()
var transporter = nodemailer.createTransport({
	host:'smtp.mailservice.com',
    secureConnection: true, 
	port:process.env.PORT,
	auth: {
    	user: mail,
    	pass: pass,
  	},
});
   
async function SendVerifyEmail(email, id){
    let token = jwt.sign({
        id: id
    }, process.env.JWT_EMAIL_SECRET, {algorithm: "HS512", expiresIn: "15m"})
    //send token to given email
	var mailOptions = {
    	from: 'gmail帳號', // sender address
    	to: `${email}`, // list of receivers
    	subject: '師大資工營驗證碼', // Subject line
    	text: `您的驗證碼為${token}`, // plain text body
	};
    //dunno why but even the test account doesnt want to work 
	transporter.sendMail(mailOptions)
}

async function SendLoginEmail(email,id){
	router.get('/',async(req,res)=>{
		let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddressw
		var mailOptions = {
			from:'gmail',
			to:`${email}`,
			subject:'師大資工營登入通知',
			text:`您已在 ${ip} 登入了`,
		}
		transporter.sendMail(mailOptions)
	}
}
module.exports = {
    SendVerifyEmail: SendVerifyEmail,
	SendLoginEmail: SendLoginEmail,
}
