const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, TEMP_ACCESS_SECRET } = require("./../config");
const jwt = require("jsonwebtoken");

function AuthenticateAccessToken(req, res, next) {
	let token = req.headers.authorization;
	if (!token) {
		return res.status(498).json({ message: "Missing token" });
	}
	token = token.replace("Bearer ", "");
	jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
		if (err) {
			if (err.name === "TokenExpiredError") {
				return res.status(403).json({ message: "Token Expired" });
			}
			return res.status(403).json({ message: "Invalid token!" });
		}
		req.userid = decoded.UserId;
		req.role = decoded.Role;
		next();
	});
}

async function AuthenticateRefreshToken(req, res, next) {
	let token = req.headers.authorization;
	if (!token) {
		return res.status(498).json({ message: "Missing token" });
	}
	token = token.replace("Bearer ", "");
	jwt.verify(token, REFRESH_TOKEN_SECRET, (err, decoded) => {
		if (err) {
			if (err.name === "TokenExpiredError") {
				return res.status(403).json({ message: "Token Expired" });
			}
			return res.status(403).json({ message: "Invalid token!" });
		}
		//const TokenId = decoded._id;
		req.refresh_token = token;
		req.UserId = decoded.UserId;
		req.refresh_token_id = decoded._id;
		next();
	});
}

function AuthenticateTempAccessToken(req, res, next) {
	let token = req.headers.authorization;
	if (!token) {
		return res.status(498).json({ message: "Missing token" });
	}
	token = token.replace("Bearer ", "");
	jwt.verify(token, TEMP_ACCESS_SECRET, (err, decoded) => {
		if (err) {
			if (err.name === "TokenExpiredError") {
				return res.status(403).json({ message: "Token Expired" });
			}
			return res.status(403).json({ message: "Invalid token!" });
		}
		req.email = decoded.Email;
		next();
	});
}

module.exports = {
	AuthenticateAccessToken: AuthenticateAccessToken,
	AuthenticateRefreshToken: AuthenticateRefreshToken,
	AuthenticateTempAccessToken: AuthenticateTempAccessToken,
};