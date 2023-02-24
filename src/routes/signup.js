const {HERMES_MAIL_TOKEN, SALTROUNDS} = require("./../config");

const express = require("express");
const bcrypt = require("bcrypt");

const { AuthenticateTempAccessToken } = require("./../Middleware/AuthenticateToken");
const { IsValidEmail, IsValidString, IsValidPassword } = require("../Modules/Validate");
const { CreatePendingAccount, FindAccountByEmail, FindPendingAccountByEmail, CreateAccount } = require("../Modules/Database");
const { timingSafeEqual } = require("crypto");

const { SendVerifyEmail } = require("./../Services/EmailService");
const AuthenticateToken = require("./../Middleware/AuthenticateToken");

const router = express.Router();
router.post("/email", async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let email = req.body.email;
	console.log(req.body);
	if (!(email && IsValidString(email))){
		return res.status(400).json({message: "Invalid email"});
	}
	if (!IsValidEmail(email)){
		return res.status(400).json({message: "Invalid email"});
	}
	if (await FindAccountByEmail(email)){
		return res.status(403).json({message: "Email has been registered to an account, sign in instead!"});
	}
	let MailStatus = await SendVerifyEmail(email);
	if (!MailStatus){
		return res.status(500).json({message: "Internal server error"});
	}
	return res.status(200).json({message: "Please verify your email"});
});

router.post("/password", AuthenticateTempAccessToken, async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let email = req.email;
	console.log(req.body);
	let password = req.body.password;
	if (!(password && IsValidString(password))){
		return res.status(400).json({message: "Password not provided"});
	}
	if (!IsValidPassword(password)){
		return res.status(418).json({message: "Are you a teapot?"});
	}
	try {
		let hashed = await bcrypt.hash(password, SALTROUNDS);
		let status = CreateAccount(email, hashed);
		if (status){
			return res.status(200).json({message: "Account created!"});
		}
		return res.status(500),json({message: "Internal Server Error"});
		//CreateAccount(Email, Password, CreatedAt)
	} catch (error) {
		console.error(error);
		return res.status(500).json({message: "Unexpected error occured! Please try again later!"});
	}
});

module.exports = router;