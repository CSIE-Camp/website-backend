const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = require("./../config")
const jwt = require("jsonwebtoken")

function AuthenticateAccessToken(req, res, next){
    let token = req.headers["authorization"] && req.headers["authorization"].split(" ")[1]
    if (!token){
        return res.status(498).json({message: "Missing token"})
    }
    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err){
            return res.status(403).json({message: "Invalid token!"})
        }
        req.userid = decoded.id
        next()
    })
}

function AuthenticateRefreshToken(req, res, next){
    let token = req.headers["authorization"] && req.headers["authorization"].split(" ")[1]
    if (!token){
        return res.status(498).json({message: "Missing token"})
    }
    jwt.verify(token, REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err){
            return res.status(403).json({message: "Invalid token, contact support if issue persists"})
        }
        console.log(decoded)
        req.refresh_token = token
        req.UserId = decoded.UserId
        req.refresh_token_id = decoded._id
        next()
    })
}

module.exports = {
    AuthenticateAccessToken: AuthenticateAccessToken,
    AuthenticateRefreshToken: AuthenticateRefreshToken
}