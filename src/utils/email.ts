import { createTransport } from "nodemailer";
import { renderFile } from "pug";
import { convert } from "html-to-text";
import type { UserDocument } from "../models/User.ts";

class Email {
    private to: string;

    private firstName: string;

    private url: string;

    private from: string;

    constructor(user: UserDocument, url: string) {
        this.to = user.email;
        this.firstName = user.name.split(" ")[0]!;
        this.url = url;
        this.from = `Omar Mohamed ${process.env.EMAIL_FROM}`;
    }


    newTransport() {
        if (process.env.NODE_ENV === "production") {
            return createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.EMAIL_USERNAME_SENDGRID,
                    pass: process.env.EMAIL_PASSWORD_SENDGRID
                }
            });

        }
        // use mailtrailer to test 
        return createTransport({
            host: process.env.EMAIL_HOST_MAILTRAP,
            port: process.env.EMAIL_PORT_MAILTRAP,
            auth: {
                user: process.env.EMAIL_USERNAME_MAILTRAP,
                pass: process.env.EMAIL_PASSWORD_MAILTRAP
            }
        });
    }

    async send(template: string, subject: string) {

        // render html based on a pug template

        const html = renderFile(`${import.meta.dirname}/../views/emails/${template}.pug`, {
            subject,
            url: this.url,
            firstName: this.firstName
        });


        // define email options 

        const emailOption = {
            from: this.from,
            to: this.to,
            subject: subject,
            html,
            text: convert(html)
        };

        // create a transport and send email
        await this.newTransport().sendMail(emailOption);

    }

    async sendSayWelcome() {
        await this.send("welcome", "Welcome to the natours app for new adventure ?!");
    }

    async sendResetPassword() {
        await this.send("resetPassword", "Reset your Natours password");
    }


}

export default Email;