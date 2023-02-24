const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

class ImageService {
    constructor() {
        this.SERVICE_NAME = 'IMAGE SERVICE';
        this.OBJECT_NAME = 'Image Service';
    }

    trasnformImageTo64(pathName) {
        return new Promise((resolve, reject) => {
            try {
                const imageFile = fs.readFileSync(pathName)
                const base64 = Buffer.from(imageFile).toString('base64')
                resolve(base64)
            } catch (error) {
                reject({
                    erro: error.message,
                    serviceName: this.SERVICE_NAME
                })
            }
        })
    }

    imageManipulation(pathName, customMessage, magic) {
        return new Promise((resolve, reject) => {
            try {
                loadImage(pathName).then((image) => {
                    const canvas = createCanvas(image.width, image.height);
                    const context = canvas.getContext('2d');

                    if (magic) {
                        const width = image.width;
                        const height = image.height;
                        const centerX = image.width / 2;
                        const centerY = image.height / 2;

                        const maxDist = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));

                        for (let x = 0; x < width; x++) {
                            for (let y = 0; y < height; y++) {
                                const distX = x - centerX;
                                const distY = y - centerY;
                                const dist = Math.sqrt(distX * distX + distY * distY);

                                if (dist < maxDist) {
                                    const theta = Math.atan2(distY, distX);
                                    const radius = (dist / maxDist) ** 1.5 * maxDist;
                                    const sourceX = centerX + radius * Math.cos(theta);
                                    const sourceY = centerY + radius * Math.sin(theta);

                                    context.drawImage(image, sourceX, sourceY, 1, 1, x, y, 1, 1);
                                }
                            }
                        }
                    } else
                        context.drawImage(image, 0, 0, image.width, image.height);

                    const fontSize = 200;
                    const fontFamily = 'Arial';
                    const fontColor = 'white';

                    context.font = `${fontSize}px ${fontFamily}`;
                    context.fillStyle = fontColor;
                    context.strokeStyle = 'black';
                    context.lineWidth = 2;

                    const text = customMessage;
                    const textWidth = context.measureText(text).width
                    const textHeight = parseInt(context.font)
                    const x = (image.width - textWidth) / 2;
                    const y = (image.height - textHeight);

                    context.fillText(text, x, y);
                    context.strokeText(text, x, y - 2);
                    context.strokeText(text, x, y + 2);
                    context.strokeText(text, x - 2, y);
                    context.strokeText(text, x + 2, y);
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
                reject({
                    erro: error.message,
                    serviceName: this.SERVICE_NAME
                })
            }
        })
    }

    downloadImage(mssg) {
        if (mssg.hasMedia) {
            return new Promise(async (resolve, reject) => {
                try {
                    const imageData = await mssg.downloadMedia()

                    const mimeType = imageData.mimetype.split('/')[1];
                    const extension = mimeType === 'jpeg' ? 'jpg' : mimeType;

                    const imageBuffer = Buffer.from(imageData.data, 'base64');
                    fs.writeFileSync(__dirname + `/image.${extension}`, imageBuffer, (error) => {
                        if (error) {
                            console.error(error);
                        }
                    });
                    resolve({ pathResponse: __dirname + `/image.${extension}`, type: extension })
                } catch (e) {
                    reject({
                        erro: e.message,
                        serviceName: this.SERVICE_NAME
                    })
                }
            })
        }
    }
}
module.exports = ImageService
