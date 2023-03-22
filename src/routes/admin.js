const { Log, GetAccountId, FindProfile, AdminViewAllProfile, AdminViewProfile, FindAccountById, ConfirmPaymentStatus, UpdateAccountRoles, GetLogs, ChangeApplicationStatus, GetCampStatus, UpdateCampStatus, FindDataByName} = require("../Modules/Database");
const { ValidateRoles } = require("./../Modules/Validate");
const { AuthenticateAccessToken } = require("../Middleware/AuthenticateToken");

const express = require("express");
const { GenerateAccessToken, CompareRoles} = require("../Modules/Tokens");
const router = express.Router();

async function CheckPermissions({AccountId, CurrentRole, RequiredLevel, LogMessage}){
    if (ValidateRoles(CurrentRole, RequiredLevel)){
        return [true, null];
    }
    const Account = await FindAccountById(AccountId);
    if (ValidateRoles(Account.Role, RequiredLevel)){
        return [true, Account.Role];
    }
    if (LogMessage){
        await Log(AccountId, AccountRole, LogMessage);
    }
    return [false];
}

//view profile of given AccountId, STAFF+
router.get("/view-profile/:id", AuthenticateAccessToken, async (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const AccountId = req.userid;
    const AccountRole = req.role;
    const TargetAccount = req.params.id;
    const ReturnData = {};
    const ReturnMessage = CheckPermissions({
        Accountid: AccountId, 
        CurrentRole: AccountRole, 
        RequiredLevel: 1, 
        LogMessage: `Attempted to access profile ${TargetAccount !== "null" ? TargetAccount : "of all users"} with insufficient privileges from [${ip}]`,
    });
    if (!ReturnMessage[0]){
        return res.status(401).json({message: "Insufficient privileges"});
    }
    if (ReturnMessage[1]){
        ReturnData.token = {};
        ReturnData.token.access_token = await GenerateAccessToken(AccountId, ReturnMessage[1], ip);;
        ReturnData.token.token_type = "Bearer";
    }    
    if (TargetAccount !== "null"){
        ReturnData.ProfileData = await AdminViewProfile(TargetAccount, AccountId, AccountRole);
        return res.status(200).json(ReturnData);
    }
    ReturnData.ProfileData = await AdminViewAllProfile(AccountId, AccountRole);
    return res.status(200).json(ReturnData);
});

//Changes the status of given AccountId, ADMIN / DEVELOPER only
router.post("/confirm-status", AuthenticateAccessToken, async (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const AccountId = req.userid;
    const AccountRole = req.role;
    const TargetAccount = req.body.TargetAccount || "";
    const NewStatus = req.body.NewStatus || "";
    const ReturnData = {};
    const ReturnMessage = CheckPermissions({
        AccountId: AccountId, 
        CurrentRole: AccountRole, 
        RequiredLevel: 2, 
        LogMessage: `Attempted to edit application status with insufficient privileges from [${ip}]`,
    });
    if (!ReturnMessage[0]){
        return res.status(401).json({message: "Insufficient privileges"});
    }
    if (ReturnMessage[1]){
        ReturnData.token = {};
        ReturnData.token.access_token = await GenerateAccessToken(AccountId, ReturnMessage[1], ip);;
        ReturnData.token.token_type = "Bearer";
    }  
    const Status = await ChangeApplicationStatus(AccountId, AccountRole, TargetAccount, NewStatus, ip);
    if (!Status[0]){
        ReturnData.message = Status[1];
        return res.status(400).json(ReturnData);
    }
    ReturnData.message = Status[1];
    return res.status(200).json(ReturnData);
});

//confirm payment of given AccountId
router.post("/confirm-payment", AuthenticateAccessToken, async (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const AccountId = req.userid;
    const AccountRole = req.role;
    const TargetAccount = req.body.TargetAccount || "";
    const ReturnData = {};
    const ReturnMessage = CheckPermissions({
        AccountId: AccountId,
        CurrentRole: AccountRole,
        RequiredLevel: 2, 
        LogMessage: `Attempted to confirm the payment status of accounts with insufficient privileges from [${ip}]`,
    });
    if (!ReturnMessage[0]){
        return res.status(401).json({message: "Insufficient privileges"});
    }
    if (ReturnMessage[1]){
        ReturnData.token = {};
        ReturnData.token.access_token = await GenerateAccessToken(AccountId, ReturnMessage[1], ip);;
        ReturnData.token.token_type = "Bearer";
    }
    if (!(TargetAccount)){
        await Log(AccountId, AccountRole, `Attempted to edit payment status without enough arguments from [${ip}}]`);
        ReturnData.message = "Not enough arguments";
        return res.status(403).json(ReturnData);
    }
    const Status = await ConfirmPaymentStatus(AccountId, AccountRole, TargetAccount, ip);
    ReturnData.message = Status[1];
    if (!Status[0]){
        return res.status(400).json(ReturnData);
    }
    return res.status(200).json(ReturnData);
});

//Updates the role for the given AccountId
router.post("/update-roles", AuthenticateAccessToken, async (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const AccountId = req.userid;
    const AccountRole = req.role;
    const TargetAccount = req.body.TargetAccount;
    const PendingRole = req.body.NewRole;
    const ReturnData = {};
    const ReturnMessage = CheckPermissions({
        AccountId: AccountId,
        CurrentRole: AccountRole,
        RequiredLevel: 2,
        LogMessage: `Attempted to edit roles for ${TargetAccount ? TargetAccount : "unknown account"} with insufficient privileges from [${ip}}]`,
    });
    if (!ReturnMessage[0]){
        return res.status(401).json({message: "Insufficient privileges"});
    }
    if (ReturnMessage[1]){
        ReturnData.token = {};
        ReturnData.token.access_token = await GenerateAccessToken(AccountId, ReturnMessage[1], ip);;
        ReturnData.token.token_type = "Bearer";
    }
    if (!(TargetAccount && PendingRole)){
        await Log(AccountId, AccountRole, `Attempted to edit roles without enough arguments from [${ip}}]`);
        ReturnData.message = "Not enough arguments";
        return res.status(400).json(ReturnData);
    }
    if (TargetAccount === AccountId){
        ReturnData.message = "Cannot change roles for self";
        return res.status(403).json(ReturnData);
    }
    if (!(PendingRole === "STAFF" || PendingRole === "ADMIN" || PendingRole === "PARTICIPANT")){
        ReturnData.message = "Invalid Roles";
        return res.status(403).json(ReturnData);
    }
    const message = await UpdateAccountRoles(AccountId, AccountRole, TargetAccount, PendingRole);
    ReturnData.message = RoleData;
    return res.status(200).json(ReturnData);
});

//view logs of given ID or All
router.get("/view-logs/:TargetAccount", AuthenticateAccessToken, async (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const AccountId = req.userid;
    const AccountRole = req.role;
    const TargetAccount = req.params.TargetAccount;
    const ReturnData = {};
    const ReturnMessage = CheckPermissions({
        AccountId: AccountId,
        CurrentRole: AccountRole,
        RequiredLevel: 2,
    });
    if (!ReturnMessage[0]){
        return res.status(401).json({message: "Insufficient privileges"});
    }
    if (ReturnMessage[1]){
        ReturnData.token = {};
        ReturnData.token.access_token = await GenerateAccessToken(AccountId, ReturnMessage[1], ip);;
        ReturnData.token.token_type = "Bearer";
    }
    ReturnData.Logs = await GetLogs(AccountId, AccountRole, TargetAccount, ip);
    return res.status(200).json(ReturnData);
});

router.get("/get-camp-status", AuthenticateAccessToken, async (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const AccountId = req.userid;
    const ReturnData = {};
    const ReturnMessage = CheckPermissions({
        AccountId: AccountId,
        CurrentRole: AccountRole,
        RequiredLevel: 1,
    });
    if (!ReturnMessage[0]){
        return res.status(401).json({message: "Insufficient privileges"});
    }
    if (ReturnMessage[1]){
        ReturnData.token = {};
        ReturnData.token.access_token = await GenerateAccessToken(AccountId, ReturnMessage[1], ip);;
        ReturnData.token.token_type = "Bearer";
    }
    ReturnData.CampStatus = await GetCampStatus();
    return res.status(200).json(ReturnData);
});

router.post("/edit-camp-status", AuthenticateAccessToken, async (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const AccountId = req.userid;
    const AccountRole = req.role;
    const NewStatus = req.body;
    const ReturnData = {};
    const ReturnMessage = CheckPermissions({
        AccountId: AccountId,
        CurrentRole: AccountRole,
        RequiredLevel: 2,
    });
    if (!ReturnMessage[0]){
        return res.status(401).json({message: "Insufficient privileges"});
    }
    if (ReturnMessage[1]){
        ReturnData.token = {};
        ReturnData.token.access_token = await GenerateAccessToken(AccountId, ReturnMessage[1], ip);;
        ReturnData.token.token_type = "Bearer";
    }
    const Keys = Object.keys(NewStatus);
    const Allowed = ["Apply_Deadline_TimeStamp", "Allow_Registration", "Allow_Status_Lookup"];
    for (let i = 0; i < Keys.length; i++){
        const Index = Allowed.indexOf(Keys[i]); 
        if (Index === -1){
            delete(NewStatus[Keys[i]]);
            continue;
        }
        if (Index === 0){
            if (typeof NewStatus[Keys[i]] !== "string" || !Number(NewStatus[Keys[i]])){
                console.log("Not string");
                delete(NewStatus[Keys[i]]);
                continue;
            }
        }
        if (Index === 1 || Index == 2){
            if (typeof NewStatus[Keys[i]] !== "boolean"){
                delete(NewStatus[Keys[i]]);
                continue;
            }
        }
    }
    NewStatus.LastEditedBy = AccountId;
    const CampStatus = await UpdateCampStatus(AccountId, AccountRole, NewStatus, ip);
    ReturnData.CampStatus = CampStatus;
    return res.status(200).json(ReturnData);
});

router.post("/search", AuthenticateAccessToken, async (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const AccountId = req.userid;
    const AccountRole = req.role;
    const Name = req.body.Name || "";
    const ReturnData = {};
    const ReturnMessage = CheckPermissions({
        AccountId: AccountId,
        CurrentRole: AccountRole,
        RequiredLevel: 1,
    });
    if (!ReturnMessage[0]){
        return res.status(401).json({message: "Insufficient privileges"});
    }
    if (ReturnMessage[1]){
        ReturnData.token = {};
        ReturnData.token.access_token = await GenerateAccessToken(AccountId, ReturnMessage[1], ip);;
        ReturnData.token.token_type = "Bearer";
    }
    ReturnData.TargetAccounts = await FindDataByName(Name, AccountRole);
    return res.status(200).json(ReturnData);
});
module.exports = router;
