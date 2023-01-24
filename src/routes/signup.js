const express = require("express")
const bcrypt = require("bcrypt")

const { IsValidEmail, IsValidString, IsValidPassword } = require("../Modules/Validate")
const {CreatePendingAccount, FindAccountByEmail} = require("../Modules/Database")
const { Signup } = require("../Modules/Account")
const {timingSafeEqual} = require("crypto")

const router = express.Router()

const SaltRounds = 14

async function Signup(email, password, ip){
    if (!(IsValidString(email) && IsValidString(password) && IsValidString(conf_password))){
        return {status: 400, data: "Email or password or confirm passowrd cannot be null or empty!"}
    }
    if (!IsValidEmail(email)){
        return {status: 400, data: "Invalid email!"}
    }
    if ((password.length !== conf_password.length) || !(IsValidPassword(password) && IsValidPassword(conf_password))){
        return {status: 418, data: "Sus...I think you're a teapot!"}
    }
    if (!timingSafeEqual(Buffer.from(password), Buffer.from(conf_password))){
        return {status: 400, data: "Password and Confirm password mismatch!"}
    }
    if (await FindAccountByEmail(email)){
        return {status: 400, data: "Given email has been registered to an account. Sign in instead!"} 
    }
    try{
        let hashed = await bcrypt.hash(password, SaltRounds)
        let status = await CreatePendingAccount(email, hashed)
        if (!status){
            return {status: 500, data: "Internal Server Error"}
        }
        
        return {status: 200, data: "Please verify your account!"}
    }catch(error){
        console.log(error)
        return {status: 500, data: "Unexpected error occured! Please try again later"}
    }
}

router.post("/", async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
    let email = req.body.email
    let password = req.body.password
    let conf_password = req.body.conf_password
    Signup(email, password, conf_password, ip).then(({status, data}) => {
        return res.status(status).json({message: data})
    }).catch((error) => {
        console.log(error)
        return res.status(500).json({message: "Internal Server Error!"})
    })
})

module.exports = router