const { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRE } = require("./../config")

const redis = require("redis")
const { randomBytes } = require("crypto")
const bcrypt = require("bcrypt")
const express = require("express")
const jwt = require("jsonwebtoken")

const { GenerateAccessToken, GenerateRefreshToken, RevokeRefreshToken, } = require("./../Modules/Tokens")
const { IsValidEmail, IsValidString, IsValidPassword } = require("../Modules/Validate")
const { AuthenticateAccessToken, AuthenticateRefreshToken } = require("./../Middleware/AuthenticateToken")
const { FindAccountByEmail } = require("../Modules/Database")
const { REPL_MODE_SLOPPY } = require("repl")
const { access } = require("fs")

const RedisClient = redis.createClient()
const router = express.Router()

/*
{
  _id: [refreshTokenId],
  value: 'fdb8fdbecf1d03ce5e6125c067733c0d51de209c',
  userId: [userId],
  expires: [some date],
  createdByIp: [some ip],
  createdAt: [some date],
  replacedBy: [anotherRefreshTokenId],
  revokedByIp: [some other ip],
  revokedBy: [some other date],
}
*/

async function Login(email, password, ip) {
    if (!(IsValidString(email) && IsValidString(password))) {
        return { status: 400, data: { message: "email or password cannot be null or empty!" } }
    }
    if (!IsValidEmail(email)) {
        return { status: 400, data: { message: "Incorrect email or password!" } }
    }
    if (!IsValidPassword(password)) {
        return { status: 418, data: { message: "I like green tea to be honest" } } //Not a SHA512 string...Skid or Hacker
    }
    let Account = await FindAccountByEmail(email)
    if (!Account) {
        return { status: 400, data: { message: "Account does not exist!" } }
    }
    try {
        let PassedCmp = await bcrypt.compare(password, Account.Password)
        if (!PassedCmp) {
            return { status: 400, data: { message: "Invalid email or password!" } }
        }
        let AccessToken = await GenerateAccessToken(Account.id, ip)
        let RefreshToken = await GenerateRefreshToken(Account.id, ip)
        return { status: 200, data: { AccessToken: AccessToken, RefreshToken: RefreshToken } }
    } catch (error) {
        console.log(error)
        return { status: 500, data: { message: "Unexpected error occured! Please try again later" } }
    }
}

router.post("/", async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddressw
    let email = req.body.email
    let password = req.body.password

    Login(email, password, ip).then(({ status, data }) => {
        if (status !== 200) {
            return res.status(status).json({ message: data.message })
        }
        return res.status(status).json({
            message: "Authenticated",
            data: {
                access_token: data.AccessToken,
                refresh_token: data.RefreshToken,
                token_type: "bearer",
            }
        })
    }).catch((error) => {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error!" })
    })
})

router.post("/refresh", AuthenticateRefreshToken, async (req, res) => { // to get a new auth token
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
    let token = await GenerateAccessToken(req.UserId,  ip)
    return res.status(200).json({
        message: "Access token generated",
        data: {
            access_token: token,
            token_type: "bearer"
        }
    })
})

router.delete("/", AuthenticateRefreshToken, async (req, res) => { //logging out
    let UserId = req.UserId
    let uuid = req.refresh_token_id
    console.log(`UserId: ${UserId}\nuuid: ${uuid}`)
    RevokeRefreshToken(UserId, uuid).then(({ status, message }) => {
        if (status) {
            return res.status(200).json({ message: message })
        }
        return res.status(500).json({ message: message })
    })
})

module.exports = router