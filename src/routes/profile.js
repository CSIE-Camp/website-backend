const express = require("express")
const crypto = require("crypto")
const multer = require("multer")
const path = require("path")
const { resolveSoa } = require("dns")

const router = express.Router()

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "..", "uploads", "images"))
    },
    filename: (req, file, cb) => {
        cb (null, crypto.randomBytes(16).toString("hex") + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== "image/jpg" && file.mimetype !== "image/jpeg" && file.mimetype != "image/png"){
            cb(null, false)
            return cb(new Error("Only PNG, JPG and JPEG files are accepted!"))
        }
        cb(null, true)
    },
    limits: {
        fileSize: 1024 * 1024 * 2
    }
})

router.post("/update", upload.single("image"), (req, res) => {
    console.log(req.file)
    return res.status(200)
})

module.exports = router