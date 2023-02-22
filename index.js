const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js")
const qrcode = require("qrcode-terminal")
const axios = require("axios")
const imageToBase64 = require('image-to-base64');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const client = new Client({
    authStrategy: new LocalAuth(),
    ffmpegPath: '/usr/bin/ffmpeg',
    puppeteer: {
        executablePath: '/usr/bin/google-chrome-stable'
    }
});


client.on("qr", qr => {
    qrcode.generate(qr, { small: true })
});

client.on("ready", () => {
    console.log("O Chika Chat está pronta!")
});

client.on("message_create", msg => {
    const command = msg.body.split(" ")[0];
    const sender = msg.from.includes("5517996529815") ? msg.to : msg.from
    if (command === "/sticker" || command === "/8ball") msg.reply("Por favor, utilize .comando no lugar de /comando")
    if (command === ".help") help(msg, sender)
    if (command === ".sticker") generateSticker(msg, sender)
    if (command === ".8ball") eightBallMsg(msg)
    if (command === ".roll") rollDice(msg)
});

client.initialize();

const trasnformTo64 = (pathName) => {
    return new Promise((resolve, reject) => {
        imageToBase64(pathName)
            .then(
                (response) => {
                    resolve(response)
                }
            )
            .catch(
                (error) => {
                    reject(error)
                }
            )
    })
}
const addTextToImage = (pathName, customMessage) => {
    return new Promise((resolve, reject) => {
        try {
            loadImage(__dirname + "/" + pathName).then((image) => {
                const canvas = createCanvas(image.width, image.height);
                const context = canvas.getContext('2d');

                context.drawImage(image, 0, 0, image.width, image.height);

                const fontSize = 100;
                const fontFamily = 'Arial';
                const fontColor = 'red';

                context.font = `${fontSize}px ${fontFamily}`;
                context.fillStyle = fontColor;
                context.textTransform = 'uppercase'

                const text = customMessage;
                const textWidth = context.measureText(text).width
                const textHeight = parseInt(context.font)
                const x = (image.width - textWidth) / 2;
                const y = (image.height - textHeight) / 2;

                context.fillText(text, x, y);

                const outputFilePath = path.join(__dirname, `ImageResponse.png`);
                const out = fs.createWriteStream(outputFilePath);
                const stream = canvas.createPNGStream();
                stream.pipe(out);

                out.on('finish', () => {
                    fs.stat(outputFilePath, (err, stats) => {
                        if (err) return
                        resolve({ path: outputFilePath, size: stats.size })
                    })
                });
            });
        } catch (error) {
            reject(error)
        }
    })
}

const downloadImage = (mssg) => {
    if (mssg.hasMedia) {
        return new Promise(async (resolve, reject) => {
            try {
                const imageData = await mssg.downloadMedia()

                const mimeType = imageData.mimetype.split('/')[1];
                const extension = mimeType === 'jpeg' ? 'jpg' : mimeType;

                const imageBuffer = Buffer.from(imageData.data, 'base64');
                fs.writeFileSync(`image.${extension}`, imageBuffer, (error) => {
                    if (error) {
                        console.error(error);
                    }
                });
                resolve(`image.${extension}`)
            } catch (e) {
                mssg.reply('😔 Algo deu errado!')
                reject()
            }
        })
    }
}

const help = async (msg, sender) => {
    await client.sendMessage(sender, `Os comandos disponíveis são: 🤖

    🖼️
    • [foto] .sticker -> Transforma uma imagem enviada em sticker! ( *NOVO:* agora funciona com gif's)
    • [foto] .sticker texto -> Transforma uma imagem enviada em sticker com o texto personalizado!
    • .sticker [link] -> Transforma a imagem do link em sticker! (não faz stickers animados)

    🎱
    • .8ball [pergunta] -> Responde uma pergunta de sim ou não. Descubra sua sorte!
    
    🎲
    • .roll [número] -> Roda um dado do número de faces escolhido. (Em branco ou inválido rodará um D6)
    
    💭
    Mais comandos em breve!`)
}

const generateSticker = async (msg, sender) => {
    if (msg.hasMedia) {
        try {
            const imageFromSender = await downloadImage(msg)
            const customMessage = msg.body.split('.sticker')[1]
            const { path, size } = await addTextToImage(imageFromSender, customMessage.length > 0 ? customMessage : '')
            const inBase64 = await trasnformTo64(path)
            const response = new MessageMedia()
            response.mimetype = "image/png"
            response.data = inBase64
            response.filesize = size
            await client.sendMessage(sender, response, { sendMediaAsSticker: true })
        } catch (e) {
            msg.reply("❌ Não foi possível gerar um sticker com essa mídia.")
        }
    } else {
        try {
            const url = msg.body.substring(msg.body.indexOf(" ")).trim()
            const data = await MessageMedia.fromUrl(url)
            await client.sendMessage(sender, data, { sendMediaAsSticker: true })
        } catch (e) {
            msg.reply("❌ Não foi possível gerar um sticker com esse link.")
        }
    }
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
    msg.reply(`A bola 8 mágica diz... ${eightBallMsg}`)
}

const rollDice = async (msg) => {
    let numFaceDice = msg.body.substring(msg.body.indexOf(" ")).trim()
    if (!Number.isInteger(parseInt(numFaceDice))) numFaceDice = 6
    let rollResult = Math.ceil(Math.random() * parseInt(numFaceDice));
    msg.reply(`🎲 ${rollResult} rolado em um D${parseInt(numFaceDice)}`)
}