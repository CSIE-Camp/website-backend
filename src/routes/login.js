const { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRE, RESET_PASSWORD_SECRET, REFRESH_TOKEN_SECRET, SALTROUNDS} = require("./../config");

const redis = require("redis");
const { randomBytes } = require("crypto");
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");

const { GenerateAccessToken, GenerateRefreshToken, RevokeRefreshToken, GenerateTempAccessToken } = require("./../Modules/Tokens");
const { IsValidEmail, IsValidString, IsValidPassword } = require("../Modules/Validate");

const { SendPasswordResetEmail } = require("./../Services/EmailService");

const { AuthenticateAccessToken, AuthenticateRefreshToken, AuthenticateTempAccessToken } = require("./../Middleware/AuthenticateToken");
const { FindAccountByEmail, FindPendingAccountByEmail, GetAccountId, UpdateAccountPassword, GetAccountStatus} = require("../Modules/Database");
const router = express.Router();

//login
router.post("/", async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddressw;
	let email = req.body.email;
	let password = req.body.password;
	if (!(IsValidString(email) && IsValidString(password))) {
		return res.status(400).json({ message: "email or password cannot be null or empty!" });
	}
	if (!IsValidEmail(email)) {
		return res.status(400).json({ message: "Incorrect email or password!" });
	}
	if (!IsValidPassword(password)) {
		return res.status(418).json({ message: "I like green tea to be honest" }); //Not a SHA512 string...Skid or Hacker
	}
	if (!await FindAccountByEmail(email)) {
		return res.status(403).json({ message: "Account does not exist!" });
	}
	try {
		let Account = await FindAccountByEmail(email);
		let AccountId = Account.id;
		if (!await bcrypt.compare(password, Account.Password)) {
			return res.status(400),json({ message: "Invalid email or password!" });
		}
		let AccessToken = await GenerateAccessToken(AccountId, Account.Role, ip);
		let RefreshToken = await GenerateRefreshToken(AccountId, ip);
		let ReturnData = {
			token: {},
			Account: {},
		};
		ReturnData.token.access_token = AccessToken;
		ReturnData.token.refresh_token = RefreshToken;
		ReturnData.token.token_type = "Bearer";
		ReturnData.Account.Role = Account.Role;
		ReturnData.Account.Status = await GetAccountStatus(AccountId);
		return res.status(200).json(ReturnData);
	} catch (error) {
		console.log(error);
		return res.status(500).json({ message: "Unexpected error occured! Please try again later" });
	}
});

//refresh access token
router.post("/refresh", AuthenticateRefreshToken, async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	return res.status(200).json({
		message: "Access token generated",
		data: {
			access_token: token,
			token_type: "bearer",
		},
	});
});

//send email for forget password
router.post("/password/reset", async (req, res) => {
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
router.get("/password/reset/:token", async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let token = req.params.token;
	if (!token) {
		return res.status(403).json({ message: "Missing token" });
	}
	jwt.verify(token, RESET_PASSWORD_SECRET, async (err, decoded) => {
		if (err) {
			console.log(err);
			return res.status(403).json({ message: "Invalid token" });
		}
		//reset password site?
		let TempToken = await GenerateTempAccessToken(decoded.Email);
		return res.status(200).json({
			message: "Reset password confirmed!",
			temp_token: TempToken,
			token_type: "Bearer",
		});
	});
});

//reset password post
router.post("/password/update", AuthenticateTempAccessToken, async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let NewPassword = req.body.password;
	let Email = req.email;
	if (!(NewPassword && IsValidString(NewPassword))){
		return res.status(400).json({message: "Invalid password or null"});
	}
	if (!IsValidPassword(NewPassword)){
		return res.status(418).json({message: "TEAPOT!!!"});
	}
	try{
		let AccountId = await GetAccountId(Email);
		if (!AccountId){
			return res.status(500).json({message: "Internal server error"});
		}
		let hashed = bcrypt.hash(NewPassword, SALTROUNDS);
		let Status = await UpdateAccountPassword(AccountId, hashed);
		if (!Status){
			return res.status(500).json({message: "Internal server error"});
		}
		RefreshAllRefreshTokens(AccountId);
		return res.status(200).json({message: "Password successfully changed. Please log in again!"});
	} catch(error){
		
	}
});

//logout
router.delete("/", AuthenticateAccessToken, async (req, res) => { //logging out
	let UserId = req.userid;
	let RefreshToken = req.body.refresh_token;
	if (!RefreshToken){
		return res.status(400).json({message: "Refresh token cannot be null"});
	}
	jwt.verify(RefreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
		if (err){
			return res.status(403).json({message: "Invalid token"});
		}
		if (decoded.UserId !== UserId){
			console.log(`Someone forged a token ${UserId}, ${decoded.UserId}, ${ip}`);
			return res.status(401).json({message: "Invalid token"});
		}
		let TokenId = decoded._id;
		let {status, message} = await RevokeRefreshToken(UserId, TokenId);
		if (!status){
			return res.status(400).json({message: message});
		}
		return res.sendStatus(200);
	});
});

module.exports = router;