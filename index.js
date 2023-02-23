const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js")
const qrcode = require("qrcode-terminal")
const axios = require("axios")
const ImageService = require("./utils/ImageService.js")

const imageService = new ImageService()

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
    const sender = msg.from.includes("5517996529815") ? msg.to : msg.from //5517996529815 //5517997122611
    if (command === "/sticker" || command === "/8ball") msg.reply("Por favor, utilize .comando no lugar de /comando")
    if (command === ".help") help(msg, sender)
    if (command === ".sticker") generateSticker(msg, sender)
    if (command === ".magic") magic(msg, sender)
    if (command === ".8ball") eightBallMsg(msg)
    if (command === ".roll") rollDice(msg)
});

client.initialize();

const help = async (msg, sender) => {
    await client.sendMessage(sender, `Os comandos disponíveis são: 🤖

    🖼️
    • [foto] .sticker -> Transforma uma imagem enviada em sticker! ( *NOVO:* agora funciona com gif's)
    • [foto] .sticker texto -> Transforma uma imagem enviada em sticker com o texto personalizado!
    • [foto] .magic -> Transforma uma imagem enviada em sticker distorcido!
    • [foto] .magic texto -> Transforma uma imagem enviada em sticker distorcido com o texto personalizado!
    • .sticker [link] -> Transforma a imagem do link em sticker! (não faz stickers animados)

    🎱
    • .8ball [pergunta] -> Responde uma pergunta de sim ou não. Descubra sua sorte!
    
    🎲
    • .roll [número] -> Roda um dado do número de faces escolhido. (Em branco ou inválido rodará um D6)
    
    💭
    Mais comandos em breve!`)
}

const magic = async (msg, sender) => {
    try {
        const customMessage = msg.body.split('.magic')[1]
        const { pathResponse } = await imageService.downloadImage(msg)
        const { path, size } = await imageService.imageManipulation(pathResponse, customMessage.length > 0 ? customMessage : '', true)
        const inBase64 = await imageService.trasnformImageTo64(path)
        const response = new MessageMedia()
        response.mimetype = "image/png"
        response.data = inBase64
        response.filesize = size
        await client.sendMessage(sender, response, { sendMediaAsSticker: true })
    } catch (e) {
        msg.reply("❌ Não foi possível gerar um sticker com essa mídia.")
    }
}


const generateSticker = async (msg, sender) => {
    if (msg.hasMedia) {
        try {
            const customMessage = msg.body.split('.sticker')[1]
            const { pathResponse } = await imageService.downloadImage(msg)
            const { path, size } = await imageService.imageManipulation(pathResponse, customMessage.length > 0 ? customMessage : '', false)
            const inBase64 = await imageService.trasnformImageTo64(path)
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