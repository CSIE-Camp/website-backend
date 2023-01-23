const PhoneRegex = /\(??(0\d{1,2}?)\)??(\s*?|-??)(\d{3,4}(\s*?|-??)\d{3,4})/
const IDRegex = /^[A-Z][1,2]\d{8}$/
const NARCRegex = /^[A-Z][8,9]\d{8}$/
const OARCRegex = /^[A-Z]{2}\d{8}$/
const EmailRegex =  /.+@.+\..+/

function Zip(a1, a2, f) {
    const length = Math.min(a1.length, a2.length);
    const result = [];
    for (let i = 0; i < length; i++)
        result[i] = f(a1[i], a2[i]);
    return result;
}
function Add(a, b) {
    return a + b;
}
function Multiply(a, b) {
    return a * b;
}

function VerifyIntermediate(input) {
    const intRadix = 10;

    const TAIWAN_ID_LOCALE_CODE_LIST = [1,10,19,28,37,46,55,64,39,73,82,2,11,20,48,29,38,47,56,65,74,83,21,3,12,30]
    const RESIDENT_CERTIFICATE_NUMBER_LIST = [0,1,2,3,4,5,6,7,4,8,9,0,1,2,5,3,4,5,6,7,8,9,2,0,1,3]
    const getCharOrder = (s, i) => s.charCodeAt(i) - 'A'.charCodeAt(0)
    const firstDigit = TAIWAN_ID_LOCALE_CODE_LIST[getCharOrder(input, 0)]
    const secondDigit = isNaN(parseInt(input[1], intRadix))
        ? RESIDENT_CERTIFICATE_NUMBER_LIST[getCharOrder(input, 1)]
        : parseInt(input[1], intRadix)
    const rest = input
        .substring(2)   
        .split('')
        .map(n => parseInt(n, intRadix))
    const idInDigits = [firstDigit, secondDigit, ...rest]
    const ID_COEFFICIENTS = [1, 8, 7, 6, 5, 4, 3, 2, 1, 1]
    const sum = Zip(idInDigits, ID_COEFFICIENTS, Multiply).reduce(Add, 0)
    return sum % 10 === 0
}


function ValidateID(id){
    return IDRegex.test(id) && VerifyIntermediate(id) && typeof id == "string"
}

function ValidateARC(arc){
    return (NARCRegex.test(arc) || OARCRegex.test(arc)) && VerifyIntermediate(arc) && typeof arc == "string"
}


function ValidateEmail(email){
    return EmailRegex.test(email) && typeof email == "string"
}

function ValidateNumber(number){
    return PhoneRegex.test(number) && typeof number == "string"
}

function ValidatePassword(password){
    
}

module.exports = {
    ValidateNumber: ValidateNumber,
    ValidateEmail: ValidateEmail,
    ValidateARC: ValidateARC,
    ValidateID: ValidateID
}