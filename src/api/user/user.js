const validate = require("./../validate/validate")
const bcrypt = require("bcrypt")

const TestAccount = {
    ["abc@gmail.com"]: "$2a$15$5IdtrBzK0s2Px/oSLvpAxOr/oLPOO1c8WzMlPZVcycE3oOL8Lo17C" //password = admin
}


async function Login(email, password, ip){
    if (email == null || password == null) {
        return {status: false, message: "Email or password cannot be null!"}
    }
    if (email == "" || password == ""){
        return {status: false, message: "Email or password cannot be empty!"}
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
            console.log(`[${ip}] Account: ${email} | Logged in successfully!`)
            return {status: false, message: "Incorrect email or password!"}
        }
        console.log(`[${ip}] Account: ${email} | Logged in successfully!`)
        return {status: true, message: "Logged in successfully"}
    } catch (error){
        return {status: false, message: "An error occured! please try again later!"} 
    }
}
 
async function Signup(email, password, conf_password, ip){
}

module.exports = {
    Login: Login
}