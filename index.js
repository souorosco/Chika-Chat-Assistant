console.log("O Chika Chat: Started.");

const { Client, MessageMedia, RemoteAuth } = require("whatsapp-web.js");
const ImageService = require("./utils/ImageService.js");
const SenderModel = require('./models/SenderModel.js')
const ErrorModel = require("./models/ErrorModel.js")
const { MongoStore } = require('wwebjs-mongo');
const numCPUs = require('os').cpus().length;
const qrcode = require("qrcode-terminal");
const mongoose = require('mongoose');
const cluster = require('cluster');
require('dotenv').config()

console.log("O Chika Chat: Import OK.");

const imageService = new ImageService()
const senderModel = new SenderModel()
const errorModel = new ErrorModel()

mongoose.connect(process.env.DB_HOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('O Chika Chat: Conectado ao BD.');

    const store = new MongoStore({ mongoose: mongoose });
    const client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 300000
        }),
        ffmpegPath: '/usr/bin/ffmpeg',
        puppeteer: {
            executablePath: '/usr/bin/google-chrome-stable',
            args: ['--no-sandbox', "--disabled-setupid-sandbox"]
        }
    })
    if (cluster.isMaster) {
        for (let i = 0; i < numCPUs / 2; i++) {
            cluster.fork()
        }

        cluster.on('exit', () => {
            cluster.fork();
        });
    } else {
        console.log("O Chika Chat: Instances OK.");

        client.on("qr", qr => {
            qrcode.generate(qr, { small: true });
        });

        console.log("O Chika Chat: QR Code OK.");

        client.on("ready", () => {
            console.log("O Chika Chat is ready!");
        });

        client.on("message_create", async msg => {
            const command = msg.body.split(" ")[0];
            const sender = msg.from.includes("5517997122611") ? msg.to : msg.from; //5517996529815 //5517997122611
            if (command === ".help") help(msg, sender);
            if (command === ".sticker") generateSticker(msg, sender);
            if (command === ".magic") magic(msg, sender);
            if (command === ".8ball") eightBallMsg(msg);
            if (command === ".roll") rollDice(msg);
        });

        client.initialize();
    }

    const help = async (msg, sender) => {
        await client.sendMessage(sender, `Os comandos disponíveis são: 🤖
    
    🖼️
    • [foto] .sticker -> Transforma uma imagem enviada em sticker!
    • [foto] .magic -> Transforma uma imagem enviada em sticker distorcido!
    • [foto] .magic [texto] -> Transforma uma imagem enviada em sticker distorcido com o texto personalizado!
    • .sticker [link] -> Transforma a imagem do link em sticker! (não faz stickers animados)
    
    🎱
    • .8ball [pergunta] -> Responde uma pergunta de sim ou não. Descubra sua sorte!
    
    🎲
    • .roll [número] -> Roda um dado do número de faces escolhido. (Em branco ou inválido rodará um D6)
    
    💭
    Mais comandos em breve!`);
    };

    const magic = async (msg, sender) => {
        try {
            const customMessage = msg.body.split('.magic')[1];
            const imageInBase64 = await imageService.downloadImage(msg);
            const { canvasResponse } = await imageService.imageManipulation(imageInBase64, customMessage.length > 0 ? customMessage : '', true);
            const response = new MessageMedia();
            response.mimetype = "image/png";
            response.data = canvasResponse;
            await senderModel.addData(msg, response)
            await client.sendMessage(sender, response, { sendMediaAsSticker: true });
        } catch (e) {
            msg.reply("❌ Não foi possível gerar um sticker com essa mídia.");
            await errorModel.addData(e, '.magic')
        }
    };

    const generateSticker = async (msg, sender) => {
        if (!isUrl(msg.body.split('.sticker')[1])) {
            if (msg.hasMedia) {
                try {
                    const customMessage = msg.body.split('.sticker')[1];
                    const imageInBase64 = await imageService.downloadImage(msg);
                    const { canvasResponse } = await imageService.imageManipulation(imageInBase64, customMessage.length > 0 ? customMessage : '', false);
                    const response = new MessageMedia();
                    response.mimetype = "image/png";
                    response.data = canvasResponse;
                    await senderModel.addData(msg, response)
                    await client.sendMessage(sender, response, { sendMediaAsSticker: true })
                } catch (e) {
                    await errorModel.addData(e, '.generateSticker')
                    msg.reply("❌ Não foi possível gerar um sticker com essa mídia.");
                }
            }
        }
        else {
            try {
                const url = msg.body.substring(msg.body.indexOf(" ")).trim();
                const data = await MessageMedia.fromUrl(url);
                await senderModel.addData(msg, data)
                await client.sendMessage(sender, data, { sendMediaAsSticker: true });
            } catch (e) {
                await errorModel.addData(e, '.generateSticker_link')
                msg.reply("❌ Não foi possível gerar um sticker com esse link.");
            }
        }
    };


    const isUrl = msg => {
        const pattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w.-]*)*\/?$/;
        return pattern.test(msg);
    }

    const eightBallMsg = async (msg) => {
        let randomNumber = Math.floor(Math.random() * 8);
        let eightBallMsg = "";
        switch (randomNumber) {
            case 0:
                eightBallMsg = "Com certeza!"; // SIM
                break;
            case 1:
                eightBallMsg = "Decididamente, sim!"; // SIM
                break;
            case 2:
                eightBallMsg = "Incerto... Tente de novo." // TALVEZ
                break;
            case 3:
                eightBallMsg = "Não posso prever agora."; // TALVEZ
                break;
            case 4:
                eightBallMsg = "Não conte com isso."; // NÃO
                break;
            case 5:
                eightBallMsg = "Minhas fontes dizem não."; // NÃO
                break;
            case 6:
                eightBallMsg = "A perspectiva não é tão boa."; // NÃO
                break;
            case 7:
                eightBallMsg = "Sinais apontam para sim!"; // SIM
                break;
            default:
                eightBallMsg = "Você está sem sorte."; // NÃO
                break;
        }
        msg.reply(`A bola 8 mágica diz... ${eightBallMsg}`);
    };

    const rollDice = async (msg) => {
        let numFaceDice = msg.body.substring(msg.body.indexOf(" ")).trim();
        if (!Number.isInteger(parseInt(numFaceDice))) numFaceDice = 6;
        let rollResult = Math.ceil(Math.random() * parseInt(numFaceDice));
        msg.reply(`🎲 ${rollResult} rolado em um D${parseInt(numFaceDice)}`);
    };
}).catch((err) => {
    console.log('O Chika Chat: Erro ao conectar no BD.', err);
});

