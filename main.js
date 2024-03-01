import WalletController from "./utils/WalletController";

const walletController = new WalletController();

const connectButton = document.getElementById('connect-wallet');
connectButton.onclick = async () => {
  if(!walletController.walletConnected){
    await walletController.connectWallet();
    if(walletController.walletConnected){
      // Hide the button
      connectButton.disabled = true;
      connectButton.innerText = 'Wallet Connected'

      convertButton.disabled = false;
    }
  }
};

const convertButton = document.getElementById('mint');
convertButton.disabled = true;
convertButton.onclick = async () => {
  if(walletController.walletConnected){
    await walletController.mint();
  }
};

const amountRemaining = document.getElementById('amount-remaining');
walletController.getTokensLeft().then((tokensLeft) => {
  amountRemaining.innerText = tokensLeft + ' / 512';
});

function loop() {
  requestAnimationFrame(loop);

  if(walletController.walletConnected) {
    convertButton.disabled = false;
  }

}

loop();