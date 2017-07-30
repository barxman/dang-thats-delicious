const nodemailer = require('nodemailer'); 
const pug = require('pug')
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify'); 

const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// transport.sendMail({
//     from: 'Garry barclay <garry.barclay@gmail.com>',
//     to: 'gb@xs4all.nl',
//     subject: 'This is a test',
//     html: 'Hey I <strong>love</strong> email!',
//     text: 'Hey I *love* this'
// })

const generateHTML = (filename, options = {}) => {
    const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options); 
    const inlined = juice(html); // some email clients strip out the head and so css needs to be inlined - juice() does that
    return inlined; 
};


exports.send = async (options) => {

    const html = generateHTML(options.filename, options); 
    const mailOptions = {
        from: 'Garry barclay <garry.barclay@gmail.com>',
        to: options.user.email,
        subject: options.subject,
        html,
        text: htmlToText.fromString(html)
    }

    const sendMail = promisify(transport.sendMail, transport); 
    return sendMail(mailOptions);
};