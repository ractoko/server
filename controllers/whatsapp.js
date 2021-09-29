require('dotenv').config();
const { Client } = require('whatsapp-web.js');
const fs = require('fs');
const SESSION_FILE_PATH = `${process.cwd()}/session.json`;
const ora = require('ora');
const chalk = require('chalk');
const qrcode = require('qrcode-terminal');
const qr = require('qr-image');
const flow = require('../flow/steps.json');
const messages = require('../flow/messages.json');
const { json } = require('body-parser');
const { search } = require('../app');
let client;
let sessionData;

const withSession = () => {
    const spinner = ora(`Cargando ${chalk.yellow('Validando session con Whatsapp...')}`);
    sessionData = require(SESSION_FILE_PATH);
    spinner.start();
    client = new Client({
        session: sessionData,
        puppeteer: {
            args: [
                '--no-sandbox'
            ],
        }
    });

    client.on('ready', () => {
        console.log('Client is ready!');
        spinner.stop();
        connectionReady();

    });



    client.on('auth_failure', () => {
        spinner.stop();
        fs.unlinkSync(SESSION_FILE_PATH);
        console.log('** Error de autentificacion vuelve a generar el QRCODE (Debes Borrar el archivo session.json) **');
        withOutSession();
    })


    client.initialize();
}

/**
 * Generamos un QRCODE para iniciar sesion
 */
const withOutSession = () => {

    console.log(`${chalk.greenBright('🔴🔴 No tenemos session guardada, espera que se generar el QR CODE 🔴🔴')}`);

    client = new Client({
        puppeteer: {
            args: [
                '--no-sandbox'
            ],
        }
    });
    client.on('qr', qr => {
        qrcode.generate(qr, { small: true });
        generateImage(qr)
    });

    client.on('ready', () => {
        console.log('Client is ready!');
        connectionReady();
    });

    client.on('auth_failure', () => {
        fs.unlinkSync(SESSION_FILE_PATH);
        console.log('** Error de autentificacion vuelve a generar el QRCODE **');
        withOutSession();
    });


    client.on('authenticated', (session) => {
        // Guardamos credenciales de de session para usar luego
        sessionData = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
            if (err) {
                console.log(err);
            }
        });
    });

    client.initialize();
}

const generateImage = (base64) => {
    let qr_svg = qr.image(base64, { type: 'svg', margin: 4 });
    qr_svg.pipe(require('fs').createWriteStream('qr-code.svg'));
}

const qrLogin = (req, res) => {
    res.writeHead(200, { 'content-type': 'image/svg+xml' });
    fs.createReadStream(`./qr-code.svg`).pipe(res);
}

const connectionReady = () => {

    /** Aqui escuchamos todos los mensajes que entran */
    client.on('message', async msg => {
        let { body } = msg
        const { from, to } = msg;
        body = body.toLowerCase();
        console.log(body);
        if( from == '5218441221035@c.us'){
            if (flow.STEP_1.includes(body)) {
                /*** Aqui damos la bienvenida*/    
                console.log('STEP1', body);    
                sendMessage(from, messages.STEP_1.join(''))
                return
            }
            if (flow.STEP_2.includes(body)) {
                /*** Hipotecario */    
                console.log('STEP2', body);    
                sendMessage(from, messages.STEP_2.join(''))
                return
            }
            if (flow.STEP_3.includes(body)) {
                /*** Automotriz */    
                console.log('STEP3', body);    
                sendMessage(from, messages.STEP_3.join(''))
                return
            }
            if (flow.STEP_ASESOR.includes(body)) {
                /*** Asesor */    
                console.log('Asesor', body);    
                sendMessage(from, messages.STEP_ASESOR.join(''))
                return
            }
        }
        
    });
};

const sendMessage = (number = null, text = null) => new Promise((resolve, reject) => {
    number = number.toString().replace('@c.us', '');
    number = `${number}@c.us`
    const message = text;
    const msg = client.sendMessage(number, message);
    console.log(`${chalk.red('⚡⚡⚡ Enviando mensajes....')}`);
    resolve(msg);
});

const getChats = () => new Promise((resolve, reject) => {
    const chats = client.getChats();
    console.log(`${chalk.red('⚡⚡⚡ Obteniendo chats....')}`);
    resolve(chats);
});

const getChatById = (id) => new Promise((resolve, reject) => {
    const chat = client.getChatById(`${id}@c.us`);
    console.log(`${chalk.red('⚡⚡⚡ Obteniendo chat....')}`);
    resolve(chat);
});

const sendApi = (req, res) =>{
    console.log(req.body);
    const { number, text } = req.body;
    console.log(number);
    sendMessage(number,text);
    res.send({status : "Enviado"});
}

const getChatsApi = async (req, res) =>{
    console.log(await getChats());
    res.send({status : "Get Chats"});
}

const getChatByIdApi = async (req, res) =>{
    const chatId = req.body;
    const chat = await getChatById(chatId);
    console.log(JSON.stringify(chat));
    const msgs = await chat.fetchMessages();
    console.log(msgs);
    res.send(JSON.stringify(msgs));
}

(fs.existsSync(SESSION_FILE_PATH)) ? withSession() : withOutSession();

module.exports = {
    withOutSession,
    withSession,
    sendApi,
    qrLogin,
    getChatsApi,
    getChatByIdApi
  };