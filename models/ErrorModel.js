const moment = require('moment-timezone');
const mongoose = require('mongoose');
const {  v4: uuidv4 } = require('uuid');

const brazilTime = moment.tz(Date.now(), 'America/Sao_Paulo');

class SenderModel {
    constructor() {
        this.SERVICE_NAME = 'ERROR MODEL';
        this.OBJECT_NAME = 'Error Model';
        this.errorSchema = new mongoose.Schema({
            id: {
                type: String,
                required: true
            },
            error: {
                type: String,
                required: true,
            },
            issuer: {
                type: String,
                required: true
            },
            createdAt: {
                type: String,
                default: brazilTime.format('YYYY-MM-DD HH:mm:ss')
            }
        })

    }
    addData(errorMessage, issuerData) {
        return new Promise((resolve, reject) => {
            (async () => {
                try {
                    const ErrorData = mongoose.model('ErrorData', this.errorSchema)
                    const errorData = new ErrorData({
                        id: uuidv4(),
                        issuer: issuerData || 'Undefined issuer',
                        error: errorMessage
                    })
                    await errorData.save()
                    resolve(errorData)
                } catch (error) {
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