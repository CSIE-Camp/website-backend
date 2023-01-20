const validate = require("./../validate/validate")
const {timingSafeEqual} = require("crypto")
const bcrypt = require("bcrypt")

const TestAccount = {
    ["abc@gmail.com"]: "$2a$15$5IdtrBzK0s2Px/oSLvpAxOr/oLPOO1c8WzMlPZVcycE3oOL8Lo17C" //password = admin
}

function IsString(string){
    return typeof string == "string"
}

async function FindUser(email){
    
}

async function Signup(email, password, conf_password, ip){
    if (!(IsString(email) && IsString(password) && IsString(conf_password))){
        return {status: false, message: "Email or password cannot be null or empty!"}
    }
    if (!validate.ValidateEmail(email)){
        return {status: false, message: "Invalid email!"}
    }
    if (FindUser(email)){
        return {status: false, message: "Given email has been registered to an account! Log into that account instead!"}
    }
    const sha512regex = /^[a-fA-F0-9]{128}$/gm
    if (password.length != conf_password.length || !(sha512regex.test(password) && sha512regex.test(conf_password)) || !timingSafeEqual(password, conf_password)){
        return {status: false, message: "Invalid password!"}
    }
    
}

async function Login(email, password, ip){
    if (!(IsString(email) && IsString(password))){
        return {status: false, message: "Email or password cannot be null or empty!"}
    }
    if (!validate.ValidateEmail(email)){
        return {status: false, message: "Incorrect email or password!"}
    }
    try{
        const UsrExists = TestAccount[email]
        if (!UsrExists){
            return {status: false, message: `User: ${email} does not exist!`}
        }
        const PassCmp = await bcrypt.compare(password, TestAccount[email])

        if (!PassCmp){
            console.log(`[${ip}] Account: ${email} | Logged in successfully!`) //Remove in prod?
            return {status: false, message: "Incorrect email or password!"}
        }
        console.log(`[${ip}] Account: ${email} | Logged in successfully!`) //Remove in prod?
        return {status: true, message: "Logged in successfully"}
    } catch (error){
        return {status: false, message: "An error occured! please try again later!"} 
    }
}

module.exports = {
    Signup: Signup,
    Login: Login
}