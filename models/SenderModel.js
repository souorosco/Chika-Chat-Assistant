const ErrorModel = require('./ErrorModel.js')
const moment = require('moment-timezone');
const mongoose = require('mongoose');

const brazilTime = moment.tz(Date.now(), 'America/Sao_Paulo');

class SenderModel {
    constructor() {
        this.errorModel = new ErrorModel()
        this.SERVICE_NAME = 'SENDER MODEL';
        this.OBJECT_NAME = 'Sender Model';
        this.senderSchema = new mongoose.Schema({
            id: {
                type: String,
                required: true
            },
            author: {
                type: String,
                required: true
            },
            content: {
                type: String,
                required: true
            },
            hasMedia: {
                type: Boolean,
                required: true
            },
            media: {
                type: String,
                required: false
            },
            createdAt: {
                type: String,
                default: brazilTime.format('YYYY-MM-DD HH:mm:ss')
            }
        })

    }
    addData(msg, data) {
        return new Promise((resolve, reject) => {
            (async () => {
                try {
                    const SenderData = mongoose.model('SenderData', this.senderSchema)
                    const senderData = new SenderData({
                        id: msg.id.id,
                        author: msg.author,
                        content: msg.body,
                        hasMedia: msg.hasMedia,
                        media: msg.hasMedia && data.data
                    })
                    await senderData.save()
                    resolve(senderData)
                } catch (error) {
                    this.errorModel.addData(error.message, this.SERVICE_NAME)
                    reject({
                        erro: error.message,
                        serviceName: this.SERVICE_NAME
                    })
                }
            })()
        })
    }
}
module.exports = SenderModel