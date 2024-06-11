const { networks, script, opcodes, payments, Psbt } = require('bitcoinjs-lib');
const { witnessStackToScriptWitness } = require('bitcoinjs-lib/src/psbt/psbtutils.js');
const network = networks.regtest;

const locking_script = script.compile([opcodes.OP_ADD, script.number.encode(5), opcodes.OP_EQUAL]);

const p2wsh = payments.p2wsh({ redeem: { output: locking_script, network }, network });
console.log(`Send bitcoin to this smart contract: ${p2wsh.address}`);

const txHash = null; // Replace with the transaction hash

const psbt = new Psbt({ network });
psbt.addInput({
    hash: txHash,
    index: 0,
    witnessUtxo: {
        script: p2wsh.output,
        value: 100_000,
    },
    witnessScript: locking_script,
});
const toAddress = 'bcrt1q6qzr78af963ztaduu7s4srad6llretjt2u2zet'; // Bitcoin Core regtest wallet
const toAmount = 100_000;
const feeAmount = 10_000;

psbt.addOutput({
    address: toAddress,
    value: toAmount - feeAmount,
});

const finalizeInput = (_inputIndex, input) => {
    const redeemPayment = payments.p2wsh({
        redeem: {
            input: script.compile([script.number.encode(1), script.number.encode(4)]),
            output: input.witnessScript,
        },
    });

    const finalScriptWitness = witnessStackToScriptWitness(redeemPayment.witness ?? []);

    return {
        finalScriptSig: Buffer.from(''),
        finalScriptWitness,
    };
};

psbt.finalizeInput(0, finalizeInput);

console.log(`In Bitcoin Core console: sendrawtransaction ${psbt.extractTransaction().toHex()}`);
