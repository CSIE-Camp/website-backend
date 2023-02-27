const {} = require("./../config");

const { GetAccountId, FindProfile, AdminViewAllProfile, AdminViewProfile, UpdateAccountStatus } = require("../Modules/Database");
const { ValidateRoles } = require("./../Modules/Validate");
const { AuthenticateAccessToken } = require("../Middleware/AuthenticateToken");

const express = require("express");
const router = express.Router();

router.get("/view-profile/:id", AuthenticateAccessToken, async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let AccountId = req.userid;
    let AccountRole = req.role;
    let TargetAccount = req.params.id;
    if (!ValidateRoles(AccountRole, 1)){
        await Log(AccountId, AccountRole, `Attempted to access profile ${TargetAccount !== "null" ? TargetAccount : "of all users"} with insufficient privileges from [${ip}]`);
        return res.status(401).json({message: "Insufficient privileges"});
    }
    if (TargetAccount !== "null"){
        return res.status(200).json(await AdminViewProfile(TargetAccount, {AccountId, AccountRole}));
    }
    return res.status(200).json(await AdminViewAllProfile(AccountId, AccountRole));
});

router.post("/update-profile/", AuthenticateAccessToken, async (req, res) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let AccountId = req.userid;
    let AccountRole = req.role;
    let TargetAccount = req.body.TargetAccount;
    let ApplicationStatus = req.body.ApplicationStatus;
    let PaymentStaus = req.body.PaymentStatus;
    if (!ValidateRoles(AccountRole, 1)){
        await Log(AccountId, AccountRole, `Attempted to approve or deny the application of ${TargetAccount} with insufficient privilegs from [${ip}]`);
        return res.status(401).json({message: "Insufficient privileges"});
    }
    if (TargetAccount === "null"){
        await Log(AccountId, AccountRole, `Attempted to approve or deny the application of ${TargetAccount} with insufficient privilegs from [${ip}]`);
        return res.status(418).json({message: "We don't need that many teapots"});
    }
    if (!(ApplicationStatus && PaymentStaus && (ApplicationStatus === "true" || ApplicationStatus == "false") && (PaymentStaus === "true" || PaymentStaus === "false"))){
        await Log(AccountId, AccountRole, `Attempted to temper with the application of ${TargetAccount} without enough or tempered arguments from [${ip}]`);
        return res.status(418).json({message: "Not enough arguments or tempered arguments"});
    }
    ApplicationStatus = ApplicationStatus === "true" ? true : false;
    PaymentStaus = PaymentStaus === "true" ? true : false;
    return res.status(200).json({message: "Successfully updated account status"});
});

module.exports = router;
