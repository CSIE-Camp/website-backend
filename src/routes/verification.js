const { EMAIL_TOKEN_SECRET } = require("./../config");

const express = require("express");
const jwt = require("jsonwebtoken");

const {VerifyPendingAccount} = require("./../Modules/Database");

const router = express.Router();

router.get("/email/:token", async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let token = req.params.token;
	if (!token){
		return res.status(403).json({message: "Invalid token"});
	}
	jwt.verify(token, EMAIL_TOKEN_SECRET, (err, decoded) => {
		if (err){
			console.log(err);
			return res.status(500).json({message: "Internal server error"});
		}
        
		console.log(decoded.UserId);
		VerifyPendingAccount(decoded.UserId); 
		return res.status(200).json({message: "Account verified!"});       
	});
});


module.exports = router;
