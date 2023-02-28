const { AuthenticateAccessToken } = require("./../Middleware/AuthenticateToken");
const { FindProfile, UpdateProfile, GetCampStatus } = require("./../Modules/Database");
const { ValidateDocuments, IsValidNumber, IsValidFacebookUrl, IsValidBloodType } = require("./../Modules/Validate");

const express = require("express");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, "..", "Uploads", "Images"));
	},
	filename: (req, file, cb) => {
		let img = crypto.randomBytes(16).toString("hex") + path.extname(file.originalname);
		req.imagepath = `${path.join(__dirname, "..", "Uploads", "Images")}/${img}`;
		cb(null, img);
	},
});

const upload = multer({
	storage: storage,
	fileFilter: (req, file, cb) => {
		if (file.mimetype !== "image/jpg" && file.mimetype !== "image/jpeg" && file.mimetype != "image/png") {
			cb(null, false);
			return cb(new Error("Only PNG, JPG and JPEG files are accepted!"));
		}
		cb(null, true);
	},
	limits: {
		fileSize: 1024 * 1024 * 2,
	},
});

router.get("/", AuthenticateAccessToken, async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let UserId = req.userid;
	let profile = await FindProfile(UserId);
	return res.status(200).json({ success: true, profile });
});

async function RemoveImage(Path){
	fs.unlink(Path, (err)=> {
		if (err) {
			console.log(err);
		}
		return;
	});
}

router.post("/update", AuthenticateAccessToken, upload.single("selfPicture"), async (req, res) => {
	let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	let Profile = req.body;
	Profile.ImagePath = req.imagepath;
	let AccountId = req.userid;
	let Flags = {};
	let CampStatus = await GetCampStatus();
	if (!CampStatus.AllowRegistration){
		RemoveImage(Profile.ImagePath);
		return res.status(403).json({message: "Registration has not started"});
	}
	let CurrentTimeStamp = Date.now();
	let DeadlineTimeStamp = Number(CampStatus.Apply_Deadline_TimeStamp);
	if (CurrentTimeStamp > DeadlineTimeStamp){
		RemoveImage(Profile.ImagePath);
		return res.status(403).json({message: `You're ${CurrentTimeStamp - DeadlineTimeStamp} seconds late :<`});
	}
	if (Profile.id || Profile.AccountId) {
		if (Profile.ImagePath){
			RemoveImage(Profile.ImagePath);
		}
		return res.status(403).json({ message: "Well...at least you tried" });
	}
	if (Profile.personalId){
		let DocType = ValidateDocuments(Profile.personalId);
		Profile.personalId = DocType;
		if (DocType.split("|")[0] === "Unknown"){
			Flags.personalId = "無效的台灣身份證明文件";
		}
	}
	if (Profile.phoneNumber || Profile.parentPhoneNumber){
		if (Profile.phoneNumber && !IsValidNumber(Profile.phoneNumber)){
			delete(Profile.phoneNumber);
			Flags.phoneNumber = "無效的台灣電話號碼";
		}
		if (Profile.parentPhoneNumber && !IsValidNumber(Profile.parentPhoneNumber)){
			delete(Profile.parentPhoneNumber);
			Flags.parentPhoneNumber = "無效的台灣電話號碼!";
		}
	}
	if (Profile.bloodType){
		let BloodType = IsValidBloodType(Profile.bloodType);
		if (!BloodType){
			delete(Profile.bloodType);
			Flags.bloodType = "無效的血型";
		} else {
			Profile.bloodType = BloodType;
		}
	}
	if (Profile.fbLink){
		if (!IsValidFacebookUrl(Profile.fbLink)){
			delete(Profile.fbLink);
		}
	}
	if (Profile.foodType){
		if (Profile.foodType !== "1" && Profile.foodType !== "2"){
			delete(Profile.foodType);
			Flags.foodType = "沒有此選項";
		} else {
			Profile.foodType = Profile.foodType === "1" ? "葷食" : "素食";
		}
	}
	if (Profile.travelHistory){
		if (Profile.travelHistory !== "1" && Profile.travelHistory !== "2"){
			delete(Profile.travelHistory);
			Flags.travelHistory = "沒有此選項";
		} else {
			Profile.travelHistory = Profile.travelHistory === "1" ? true : false;
		}
	}
	if (Profile.gender){
		if (Profile.gender !== "1" && Profile.gender !== "2"){
			delete(Profile.gender);
			Flags.gender = "沒有此選項";
		} else {
			Profile.gender = Profile.gender === "1" ? "Male" : "Female";
		}
	}
	if (Profile.clothesSize){
		let Size = Number(Profile.clothesSize);
		if (Size < 1 || Size > 5){
			delete(Profile.clothesSize);
			Flags.clothesSize = "沒有此選項";
		} else {
			const AvailableSizes = ["XS", "S", "M", "L", "XL"];
			Profile.clothesSize = AvailableSizes[Size - 1];
		}
	}
	let Status = await UpdateProfile(AccountId, Profile);
	return res.status(200).json({ StoredData: Status, InvalidData: Flags});
});

module.exports = router;