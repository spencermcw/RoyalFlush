const deployBase = require("./deployers").deploy

const deploy = async () => {
    console.log("Deploying to Testnet");
    const {
        owner,
        cardCoin,
        baseCards,
        melder,
        deck,
        game,
        marketplace,
        yieldCards
    } = await deployBase();

    // Presale
    await deck.connect(owner).setPresale(false);

    return {
        owner,
        cardCoin,
        baseCards,
        melder,
        deck,
        game,
        marketplace,
        yieldCards
    };
}

module.exports.deploy = deploy