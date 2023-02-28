const { AuthenticateAccessToken } = require("../Middleware/AuthenticateToken");
const { GetAccountStatus, UpdatePaymentData, FindAccountById, UploadConsentForm } = require("../Modules/Database");

const express = require("express");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { CompareRoles } = require("../Modules/Tokens");

const router = express.Router();

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, "..", "Uploads", "ConsentForms"));
	},
	filename: (req, file, cb) => {
		let img = crypto.randomBytes(16).toString("hex") + path.extname(file.originalname);
		req.formpath = `${path.join(__dirname, "..", "Uploads", "ConsentForms")}/${img}`;
		cb(null, img);
	},
});

const upload = multer({
	storage: storage,
	fileFilter: (req, file, cb) => {
		if (file.mimetype !== "application/pdf") {
			cb(null, false);
			return cb(new Error("Only PDF files are accepted!"));
		}
		cb(null, true);
	},
	limits: {
		fileSize: 1024 * 1024 * 2,
	},
});

router.get("/", AuthenticateAccessToken, async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let AccountId = req.userid;
	let AccountRole = req.role;
    let NewToken = await CompareRoles(AccountId, AccountRole, ip);
    let ReturnData = {};
	if (NewToken){
        ReturnData.tokens.access_token = NewToken;
        ReturnData.tokens.token_type = "Bearer";
    }
	ReturnData.Data = await GetAccountStatus(AccountId);
	return res.status(200).json(ReturnData);
});

router.post("/apply", AuthenticateAccessToken, async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let AccountId = req.userid;
	let AccountRole = req.role;
    let NewToken = await CompareRoles(AccountId, AccountRole, ip);
    let ReturnData = {};
	let Apply = res.body.apply;
    if (NewToken){
        ReturnData.tokens.access_token = NewToken;
        ReturnData.tokens.token_type = "Bearer";
    }
	if (!Apply || typeof Apply !== "boolean"){
		ReturnData.message = "Not enough argument";
		return res.status(400).json(ReturnData);
	}
	await ApplyToCamp(AccountId, Apply);
	ReturnData.message = "success";
	return res.status(200).json(ReturnData);
});

function RemoveFile(PathName){
	fs.unlink(PathName, (err) => {
		if (err){
			console.error(err);
		}
	});
}

router.post("/complete-test", AuthenticateAccessToken, async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let AccountId = req.userid;
	let AccountRole = req.role;
	let NewToken = await CompareRoles(AccountId, AccountRole, ip);
    let ReturnData = {};
    if (NewToken){
        ReturnData.tokens.access_token = NewToken;
        ReturnData.tokens.token_type = "Bearer";
    }
	let CompletedTest = req.body.CompletedTest || false;
	if (!CompletedTest){
		ReturnData.message = "Test not completed!";
		return res.status(400).json(ReturnData);
	}
	await CompleteTest(AccountId);
	ReturnData.message = "success!";
	return res.status(200).json(ReturnData);
});

router.post("/upload", AuthenticateAccessToken, upload.single("ConsentForm"), async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let AccountId = req.userid;
	let AccountRole = req.role;
	let FilePath = req.formpath;
    let NewToken = await CompareRoles(AccountId, AccountRole, ip);
    let ReturnData = {};
    if (NewToken){
        ReturnData.tokens.access_token = NewToken;
        ReturnData.tokens.token_type = "Bearer";
    }
	let Account = await FindAccountById(AccountId);
	if (Account.Status !== "ACCEPTED" || Account.Status !== "WAITLIST_ACCEPTED"){
		RemoveFile(formpath);
		ReturnData.message = "Not accepted";
		return res.status(400).json(ReturnData);
	}
	await UploadConsentForm(AccountId, FilePath);
	ReturnData.message = "Uploaded!";
	return res.status(200).json(ReturnData);
});

router.post("/confirm-payment", AuthenticateAccessToken, async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let AccountId = req.userid;
	let AccountRole = req.role;
	let PaymentData = req.body.PaymentData || null;
    let NewToken = await CompareRoles(AccountId, AccountRole, ip);
    let ReturnData = {};
    if (NewToken){
        ReturnData.tokens.access_token = NewToken;
        ReturnData.tokens.token_type = "Bearer";
    }
	if (!PaymentData){
		ReturnData.message = "Missing PaymentData";
		return res.status(400).json(ReturnData);
	}
	const Required = ["TransferDate", "AccountName", "Account_Last5Digits"];
	let Keys = Object.keys(PaymentData);
	if (Keys.length < Required.length){
		ReturnData.message = "Not enough data";
		return res.status(400).json(ReturnData);
	}
	let HasAll = true;
	for (let i = 0; i < Keys.length; i++){
		if (Required.indexOf(Keys[i]) === -1){
			HasAll = false;
			return;	
		}
	}
	if (!HasAll){
		ReturnData.message = "Missing PaymentData";
		return res.status(400).json(ReturnData);
	}
	let Status = await UpdatePaymentData(AccountId, PaymentData);
	ReturnData.message = Status ? "success" : "Not accepted!";
	return res.status(200).json(ReturnData);
});

return router;