const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction } = require("@solana/web3.js");
const bs58 = require("bs58");
const readline = require('readline');
const fs = require('fs');

async function getUserInput(prompt) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => rl.question(prompt, answer => {
        rl.close();
        resolve(answer);
    }));
}

async function readSecretKeyFromFile(filePath) {
    return new Promise((resolve, reject) => {
        const secretKeys = [];
        const rl = readline.createInterface({
            input: fs.createReadStream(filePath),
            crlfDelay: Infinity
        });

        rl.on('line', (line) => {
            secretKeys.push(line.trim());
        });

        rl.on('close', () => {
            resolve(secretKeys);
        });

        rl.on('error', (err) => {
            reject(err);
        });
    });
}

async function main() {
    const RPC = await getUserInput("Masukkan URL RPC: ");
    const numTransactions = parseInt(await getUserInput("total transaction per wallet ? : "), 10);
    const programIdInput = await getUserInput("Masukkan memo: ");

    const walletFilePath = 'wallet.txt';
    const secretKeys = await readSecretKeyFromFile(walletFilePath);

    const SOLANA_CONNECTION = new Connection(RPC);

    async function logMemo(message, i) {
        const keypair = Keypair.fromSecretKey(bs58.decode(secretKeys[i]));

        for (let j = 0; j < numTransactions; j++) {
            let tx = new Transaction();
            await tx.add(
                new TransactionInstruction({
                    keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: true }],
                    data: Buffer.from(message, "utf-8"),
                    programId: new PublicKey(programIdInput),
                })
            );
            let result = await sendAndConfirmTransaction(SOLANA_CONNECTION, tx, [keypair]);
            console.log("Transaction Completed:", `https://solscan.io/tx/${result}`);
        }
    }

    const tick = await getUserInput("Masukkan tick: ");

    for (let i = 0; i < secretKeys.length; i++) {
        await logMemo(tick, i);
    }
}

main().catch(err => console.error(err));
