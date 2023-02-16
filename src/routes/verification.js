const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const jwt = require("jsonwebtoken");

const {VerifyPendingAccount} = require("./../Modules/Database");

const router = express.Router();


router.get("/verify-email/:token", async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let token = req.params.token;
	console.log("Request received!");
	if (!token){
		return res.status(403).json({message: "Invalid token"});
	}
	jwt.verify(token, process.env.JWT_EMAIL_SECRET, (err, decoded) => {
		if (err){
			console.log(err);
			return res.status(500).json({message: "Internal server error"});
		}
		VerifyPendingAccount(decoded.id);
	});
});


module.exports = router;
