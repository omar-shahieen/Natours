const nodemailer = require("nodemailer");

const sendEmail = async options => {
    // define transporter config
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    // define email options 
    const emailOption = {
        from: "Omar Mohamed <om039919@gmail.com>",
        to: options.email,
        subject: options.subject,
        text: options.message
    }
    // send email
    await transporter.sendMail(emailOption);
}
module.exports = sendEmail