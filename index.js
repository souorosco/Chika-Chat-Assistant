const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js")
const qrcode = require("qrcode-terminal")
const axios = require("axios")

const client = new Client({
    authStrategy: new LocalAuth()
});


client.on("qr", qr => {
    qrcode.generate(qr, { small: true })
});

client.on("ready", () => {
    console.log("O Chika Chat está pronta!")
});

client.on("message_create", msg => {
    const command = msg.body.split(" ")[0];
    const sender = msg.from.includes("991441213") ? msg.to : msg.from
    if (command === "/sticker" || command === "/8ball") msg.reply("Por favor, utilize .comando no lugar de /comando")
    if (command === ".help") help(msg, sender)
    if (command === ".sticker") generateSticker(msg, sender)
    if (command === ".8ball") eightBallMsg(msg)
    if (command === ".roll") rollDice(msg)
});

client.initialize();

const help = async (msg, sender) => {
    await client.sendMessage(sender, "Commandos disponíveis: \n [foto] .sticker -> Transforma a imagem enviada em sticker. \n .sticker [link] -> Transforma a imagem do link em sticker. \n .8ball [pergunta] -> Responde uma resposta de uma pergunta de sim ou não. \n .roll [número] -> Rola um dado com o número de lados escolhido. Sem número ou com número inválido rolará um D6.")
}

const generateSticker = async (msg, sender) => {
    if (msg.type === "image") {
        try {
            const { data } = await msg.downloadMedia()
            const image = await new MessageMedia("image/jpeg", data, "image.jpg")
            await client.sendMessage(sender, image, { sendMediaAsSticker: true })
        } catch (e) {
            msg.reply("❌ Erro ao processar imagem")
        }
    } else {
        try {
            const url = msg.body.substring(msg.body.indexOf(" ")).trim()
            const { data } = await axios.get(url, { responseType: "arraybuffer" })
            const returnedB64 = Buffer.from(data).toString("base64");
            const image = await new MessageMedia("image/jpeg", returnedB64, "image.jpg")
            await client.sendMessage(sender, image, { sendMediaAsSticker: true })
        } catch (e) {
            msg.reply("❌ Não foi possível gerar um sticker com esse link")
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
            eightBallMsg = "Incerto... tente de novo." // TALVEZ
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