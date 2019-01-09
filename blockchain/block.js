const hexToBinary = require('hex-to-binary');
const { GENESIS_DATA, MINE_RATE } = require('../config')
const { cryptoHash } = require('../util');

class Block {
    constructor({ timestamp, lastHash, hash, data, nounce, difficulty }) {
        this.timestamp = timestamp;
        this.lastHash = lastHash;
        this.hash = hash;
        this.data = data;
        this.nounce = nounce;
        this.difficulty = difficulty;
    }
    static genesis() {
        return new this(GENESIS_DATA);
    }

    static mineBlock({ lastBlock, data }) {
        const lastHash = lastBlock.hash;
        let hash, timestamp;
        let { difficulty } = lastBlock;
        let nounce = 0;
        do {
            nounce++;
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty({ originalBlock: lastBlock, timestamp })
            hash = cryptoHash(timestamp, lastHash, data, nounce, difficulty);
        } while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty))
        return new this({ timestamp, lastHash, data, difficulty, nounce, hash });
    }

    static adjustDifficulty({ originalBlock, timestamp }) {
        const { difficulty } = originalBlock;

        if (difficulty < 1) return 1;

        if (timestamp - originalBlock.timestamp > MINE_RATE) return difficulty - 1;

        return difficulty + 1;
    }
}


module.exports = Block;