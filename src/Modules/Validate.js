const IDRegex = /^[A-Z][1,2]\d{8}$/
const NARCRegex = /^[A-Z][8,9]\d{8}$/
const OARCRegex = /^[A-Z]{2}\d{8}$/

function Zip(a1, a2, f) {
	const length = Math.min(a1.length, a2.length)
	const result = []
	for (let i = 0; i < length; i++)
		result[i] = f(a1[i], a2[i])
	return result
}
function Add(a, b) {
	return a + b
}
function Multiply(a, b) {
	return a * b
}

function VerifyIntermediate(input) {
	const intRadix = 10

	const TAIWAN_ID_LOCALE_CODE_LIST = [1, 10, 19, 28, 37, 46, 55, 64, 39, 73, 82, 2, 11, 20, 48, 29, 38, 47, 56, 65, 74, 83, 21, 3, 12, 30]
	const RESIDENT_CERTIFICATE_NUMBER_LIST = [0, 1, 2, 3, 4, 5, 6, 7, 4, 8, 9, 0, 1, 2, 5, 3, 4, 5, 6, 7, 8, 9, 2, 0, 1, 3]
	const getCharOrder = (s, i) => s.charCodeAt(i) - "A".charCodeAt(0)
	const firstDigit = TAIWAN_ID_LOCALE_CODE_LIST[getCharOrder(input, 0)]
	const secondDigit = isNaN(parseInt(input[1], intRadix))
		? RESIDENT_CERTIFICATE_NUMBER_LIST[getCharOrder(input, 1)]
		: parseInt(input[1], intRadix)
	const rest = input
		.substring(2)
		.split("")
		.map(n => parseInt(n, intRadix))
	const idInDigits = [firstDigit, secondDigit, ...rest]
	const ID_COEFFICIENTS = [1, 8, 7, 6, 5, 4, 3, 2, 1, 1]
	const sum = Zip(idInDigits, ID_COEFFICIENTS, Multiply).reduce(Add, 0)
	return sum % 10 === 0
}

function ValidateID(id) {
	return IDRegex.test(id) && VerifyIntermediate(id) && typeof id == "string"
}

function ValidateARC(arc) {
	if (typeof arc !== "string" || !VerifyIntermediate(arc)) {
		return
	}
	if (NARCRegex.test(arc)) {
		return "New_ARC"
	}
	if (OARCRegex.test(arc)) {
		return "Old_ARC"
	}
}

function ValidateDocuments(document) {
	if (ValidateID(document)) {
		return { success: true, doc: `Taiwanese_Id|${document}` }
	}
	let ARCType = ValidateARC(Document)
	if (ARCType) {
		return { success: true, doc: `${ARCType}|${document}` }
	}
	return { success: false, doc: `unidentified|${document}` }
}

const PhoneRegex = /\(??(0\d{1,2}?)\)??(\s*?|-??)(\d{3,4}(\s*?|-??)\d{3,4})/
function IsValidNumber(number) {
	return PhoneRegex.test(number) && typeof number == "string"
}

const EmailRegex = /.+@.+\..+/
function IsValidEmail(email) {
	return EmailRegex.test(email) && typeof email == "string"
}


function IsValidEmail(email) {
	return EmailRegex.test(email) && typeof email == "string"
}

const Sha512Regex = /[0-9a-fA-F]{128}$/
function IsValidPassword(String) {
	return Sha512Regex.test(String) && String.length === 128
}

function IsValidString(String) {
	return typeof String === "string" && String.split(" ").join("") != ""
}

const FacebookRegex = /(?:https?:\/\/)?(?:www\.)?(mbasic.facebook|m\.facebook|facebook|fb)\.(com|me)\/(?:(?:\w\.)*#!\/)?(?:pages\/)?(?:[\w\-\.]*\/)*([\w\-\.]*)/
function IsValidFacebookUrl(url) {
	return FacebookRegex.test(url)
}

const ValidBloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
function IsValidBloodType(bloodtype){
	return ValidBloodTypes.includes(bloodtype.toUpperCase())
}

module.exports = {
	ValidateARC: ValidateARC,
	ValidateID: ValidateID,
	ValidateDocuments: ValidateDocuments,
	IsValidNumber: IsValidNumber,
	IsValidEmail: IsValidEmail,
	IsValidPassword: IsValidPassword,
	IsValidString: IsValidString,
	IsValidFacebookUrl: IsValidFacebookUrl,
	IsValidBloodType: IsValidBloodType
}
