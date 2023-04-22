const { ethers } = require("ethers");
const data = require("./config.json");

const provider = new ethers.WebSocketProvider(data.provider);

const amount = data.fundAmount || "0.1";

const getWallets = () => {
  return data.wallets.map(
    (privateKey) => new ethers.Wallet(privateKey, provider)
  );
};

const fundWallets = async (signers) => {
  const fundWallet = new ethers.Wallet(data.fundWallet, provider);

  for (const signer of signers) {
    const address = await signer.getAddress();

    await fundWallet.sendTransaction({
      to: address,
      value: ethers.parseEther(amount),
    });
  }
};

const track = (signers) => {
  provider.on("block", async (blockNumber) => {
    const block = await provider.getBlock(blockNumber, true);
    const txs = block.prefetchedTransactions.filter(
      (tx) => tx.from === data.target
    );

    if (txs.length != 0) {
      for (const tx of txs) {
        for (const signer of signers) {
          await signer.sendTransaction({
            to: tx.to,
            data: tx.data,
            value: tx.value,
          });
        }
      }
    }
  });
};

async function main() {
  const signers = getWallets();
  await fundWallets(signers);

  track(signers);
}

main();
