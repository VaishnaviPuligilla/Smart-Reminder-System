import OtpGenerator from 'otp-generator';

export const generateOTP = () => {
  return OtpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
    digits: true
  });
};
