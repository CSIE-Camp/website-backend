const { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRE, RESET_PASSWORD_SECRET } = require("./../config");

const redis = require("redis");
const { randomBytes } = require("crypto");
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");

const { GenerateAccessToken, GenerateRefreshToken, RevokeRefreshToken } = require("./../Modules/Tokens");
const { IsValidEmail, IsValidString, IsValidPassword } = require("../Modules/Validate");

const { SendPasswordResetEmail } = require("./../Services/EmailService");

const { AuthenticateAccessToken, AuthenticateRefreshToken } = require("./../Middleware/AuthenticateToken");
const { FindAccountByEmail, FindPendingAccountByEmail } = require("../Modules/Database");
const { REPL_MODE_SLOPPY } = require("repl");
const RedisClient = redis.createClient();
const router = express.Router();

async function Login(email, password, ip) {
	if (!(IsValidString(email) && IsValidString(password))) {
		return { status: 400, data: { message: "email or password cannot be null or empty!" } };
	}
	if (!IsValidEmail(email)) {
		return { status: 400, data: { message: "Incorrect email or password!" } };
	}
	if (!IsValidPassword(password)) {
		return { status: 418, data: { message: "I like green tea to be honest" } }; //Not a SHA512 string...Skid or Hacker
	}
	if (await FindPendingAccountByEmail(email)) {
		return { status: 403, data: { message: "Please verify your account before proceeding" } };
	}
	let Account = await FindAccountByEmail(email);
	if (!Account) {
		return { status: 400, data: { message: "Account does not exist!" } };
	}
	try {
		let PassedCmp = await bcrypt.compare(password, Account.Password);
		if (!PassedCmp) {
			return { status: 400, data: { message: "Invalid email or password!" } };
		}
		let AccessToken = await GenerateAccessToken(Account.id, ip);
		let RefreshToken = await GenerateRefreshToken(Account.id, ip);
		return { status: 200, data: { AccessToken: AccessToken, RefreshToken: RefreshToken, role: Account.Role } };
	} catch (error) {
		console.log(error);
		return { status: 500, data: { message: "Unexpected error occured! Please try again later" } };
	}
}

//login
router.post("/", async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddressw;
	let email = req.body.email;
	let password = req.body.password;

	Login(email, password, ip).then(({ status, data }) => {
		if (status !== 200) {
			return res.status(status).json({ message: data.message });
		}
		return res.status(status).json({
			message: "Authenticated",
			data: {
				access_token: data.AccessToken,
				refresh_token: data.RefreshToken,
				role_type: data.role,
				token_type: "bearer",
			},
		});
	}).catch((error) => {
		console.log(error);
		return res.status(500).json({ message: "Internal Server Error!" });
	});
});

//refresh access token
router.post("/refresh", AuthenticateRefreshToken, async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let token = await GenerateAccessToken(req.UserId, ip);
	return res.status(200).json({
		message: "Access token generated",
		data: {
			access_token: token,
			token_type: "bearer",
		},
	});
});

//send email for forget password
router.post("/password-reset", async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let email = req.body.email;
	let AccountExists = await FindAccountByEmail(email);
	if (!AccountExists) {
		return res.status(200).json({ message: "Please check your email" });
	}
	let ResetMaiLStatus = await SendPasswordResetEmail(email, AccountExists.id, ip);
	if (!ResetMaiLStatus) {
		return res.status(500).json({ message: "Internal Server Error! Please contact support if issue persists" });
	}
	return res.status(200).json({ message: "Please check your email" });
});

//reset password GET (by clicking link sent to their email)
router.get("/password-reset/:token", async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let token = req.params.token;
	if (!token) {
		return res.status(403).json({ message: "Missing token" });
	}
	jwt.verify(token, RESET_PASSWORD_SECRET, err => {
		if (err) {
			console.log(err);
			return res.status(403).json({ message: "Invalid token" });
		}
		//reset password site?
		return res.status(200).json({
			message: "Reset password confirmed!",
		});
	});
});

//reset password post
router.post("/update-password", async (req, res) => {
	//reset password logic
});

//logout
router.delete("/", AuthenticateRefreshToken, async (req, res) => { //logging out
	let UserId = req.UserId;
	let uuid = req.refresh_token_id;
	console.log(`UserId: ${UserId}\nuuid: ${uuid}`);
	RevokeRefreshToken(UserId, uuid).then(({ status, message }) => {
		if (status) {
			return res.sendStatus(204);
		}
		return res.status(500).json({ message: message });
	});
});

module.exports = router;