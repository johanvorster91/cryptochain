const redis = require('redis');
const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
}

class PubSub {
    constructor({ blockchain, transactionPool, wallet, redisUrl }) {

        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.publisher = redis.createClient(redisUrl);
        this.subscriber = redis.createClient(redisUrl);

        this.subscribeToChannels();

        this.subscriber.on('message', (channel, message) => this.handleMessage(channel, message))
    }

    handleMessage(channel, message) {
        console.log(`Message received. Channel: ${channel}. Message:${message}.`)

        const parsedMessage = JSON.parse(message);

        switch (channel) {
            case CHANNELS.BLOCKCHAIN:
                this.blockchain.replaceChain(parsedMessage, true, () => {
                    this.transactionPool.clearBlockchainTransactions({ chain: parsedMessage })
                });
                break;
            case CHANNELS.TRANSACTION:
                if (!this.transactionPool.existingTransaction({
                    inputAddress: this.wallet.publicKey
                })) {
                    this.transactionPool.setTransaction(parsedMessage);
                }
                break;
            default:
                return;
        }

    }

    subscribeToChannels() {
        Object.values(CHANNELS).forEach(channel => {
            this.subscriber.subscribe(channel);
        });;
    }

    publish({ channel, message }) {
        this.subscriber.unsubscribe(channel, () => {
            this.publisher.publish(channel, message, () => {
                this.subscriber.subscribe(channel);
            });
        });
    }

    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        })
    }

    broadcastTransaction(transaction) {
        this.publish({
            channel: CHANNELS.TRANSACTION,
            message: JSON.stringify(transaction)
        })
    }
}
module.exports = PubSub;



//PUBNUM VERSION
// const PubNub = require('pubnub');


// const credentials = {
//     publishKey: 'pub-c-9f3f418f-8ea3-4fb6-b039-dabacfcfd8b6',
//     subscribeKey: 'sub-c-95dfff6a-10fc-11e9-a971-425ad67106f3',
//     secretKey: 'sec-c-ODJlN2ZlZGYtMThhNC00ZTAyLTg4MzktZGM3MGI5ZTk3N2U0'
// }

// const CHANNELS = {
//     TEST: 'TEST'
// }

// class PubSub {
//     constructor() {
//         this.pubnub = new PubNub(credentials);
//         this.pubnub.subscribe({ channels: Object.values(CHANNELS) })
//         this.pubnub.addListener(this.listener())
//     }

//     listener() {
//         return {
//             message: messageObject => {
//                 const { channel, message } = messageObject;
//                 console.log(`Message received. Channel: ${channel}. Message:${message}`)
//             }
//         }
//     }

//     publish({ channel, message }) {
//         this.pubnub.publish({ channel, message })
//     }
// }

// module.exports = PubSub;