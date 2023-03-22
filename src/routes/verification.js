const { EMAIL_TOKEN_SECRET } = require("./../config");

const express = require("express");
const jwt = require("jsonwebtoken");

const {VerifyPendingAccount} = require("./../Modules/Database");
const { SendVerifyEmail } = require("../Services/EmailService");
const { GenerateTempAccessToken } = require("../Modules/Tokens");

const router = express.Router();

router.get("/email/:token", async (req, res) => {
	const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	const token = req.params.token;
	if (!token){
		return res.status(403).json({message: "Invalid token"});
	}
	jwt.verify(token, EMAIL_TOKEN_SECRET, async (err, decoded) => {
		if (err){
			if (err.name == "TokenExpiredError"){
				SendVerifyEmail(decoded.email);
				return res.status(403).json({message: "Verify link expired, please check your mailbox for a new verification link"});
			}
			return res.wstatus(500).json({message: "Internal server error"});
		}
		const TempAccessToken = await GenerateTempAccessToken(decoded.Email);
		return res.status(200).json({
			message: "Successfully verified your email",
			TempToken: TempAccessToken,
			Token_Type: "Bearer",
		});
	});
});

module.exports = router;
