const dotenv = require("dotenv")
dotenv.config()

const jwt = require("jsonwebtoken")
const mailer = require("nodemailer")

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
    	subject: '師大資工營', // Subject line
    	text: `您的驗證碼為${token}`, // plain text body
	};
    //dunno why but even the test account doesnt want to work 
	transporter.sendMail(mailOptions)
}

module.exports = {
    SendVerifyEmail: SendVerifyEmail
}
