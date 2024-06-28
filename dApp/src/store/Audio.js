import store from "./index";

export const Sounds = {
    OPEN_MODAL: "OPEN_MODAL",
    CLOSE_MODAL: "CLOSE_MODAL",
    CHOICE: "CHOICE",
    POP_CLICK: "POP_CLICK",
    NAVIGATE: "NAVIGATE",
    DRAWER: "DRAWER",
    DISMISS: "DISMISS",
    REMOVE: "REMOVE",
    RESET: "RESET",
    ADD: "ADD",
    VIEW: "VIEW",
    WELCOME: "WELCOME",
    REVEAL: "REVEAL",
    PURCHASE: "PURCHASE",
    MELD_SUCCESS: "MELD_SUCCESS",
    CLAIM: "CLAIM",
    NEW_LISTING: "NEW_LISTING",
    ROYAL_FLUSH: "ROYAL_FLUSH",
    CHECK: "CHECK",
    DROPDOWN: "DROPDOWN",
    SHUFFLE: "SHUFFLE",
    FLIP_ALL: "FLIP_ALL",
    ADD_TO_COLLECTION: "ADD_TO_COLLECTION",
    CARD_FLIP_1: "CARD_FLIP_1",
    CARD_FLIP_2: "CARD_FLIP_2",
    CARD_FLIP_3: "CARD_FLIP_3",
    RUMBLE: "RUMBLE",
    GROWL: "GROWL",
};

const SoundFiles = {
    [Sounds.OPEN_MODAL]: "/sounds/openmodal.wav",
    [Sounds.CLOSE_MODAL]: "/sounds/closemodal.wav",
    [Sounds.CHOICE]: "/sounds/choice.wav",
    [Sounds.POP_CLICK]: "/sounds/popclick.wav",
    [Sounds.NAVIGATE]: "/sounds/navmenuclick.wav",
    [Sounds.DRAWER]: "/sounds/drawerslide.wav",
    [Sounds.DISMISS]: "/sounds/dismiss.wav",
    [Sounds.REMOVE]: "/sounds/remove.wav",
    [Sounds.RESET]: "/sounds/reset.wav",
    [Sounds.ADD]: "/sounds/add.wav",
    [Sounds.VIEW]: "/sounds/view.wav",
    [Sounds.WELCOME]: "/sounds/welcome.wav",
    [Sounds.REVEAL]: "/sounds/reveal.wav",
    [Sounds.PURCHASE]: "/sounds/purchase.wav",
    [Sounds.MELD_SUCCESS]: "/sounds/meldsuccess.wav",
    [Sounds.CLAIM]: "/sounds/claim.wav",
    [Sounds.NEW_LISTING]: "/sounds/newlisting.wav",
    [Sounds.ROYAL_FLUSH]: "/sounds/royalflush.wav",
    [Sounds.CHECK]: "/sounds/check.wav",
    [Sounds.DROPDOWN]: "/sounds/dropdown.wav",
    [Sounds.SHUFFLE]: "/sounds/cardshuffle.wav",
    [Sounds.FLIP_ALL]: "/sounds/flipall.wav",
    [Sounds.ADD_TO_COLLECTION]: "/sounds/addtocollection.wav",
    [Sounds.CARD_FLIP_1]: "/sounds/cardflip1.wav",
    [Sounds.CARD_FLIP_2]: "/sounds/cardflip2.wav",
    [Sounds.CARD_FLIP_3]: "/sounds/cardflip3.wav",
    [Sounds.RUMBLE]: "/sounds/rumble.wav",
    [Sounds.GROWL]: "/sounds/growl.wav",
}

export const playSound = (sound, options) => {
    const file = SoundFiles[sound] || false;
    if (store.state.audioEnabled && file) {
        var audio = new Audio(file);
        if (Boolean(options)) {
            Object.keys(options).forEach(key => {
                audio[key] = options[key];
            });
        }
        audio.play();
    }
    return audio;
}

export const playRandom = (sounds) => {
    const allSounds = [...sounds];
    const randomIndex = Math.floor(Math.random() * allSounds.length);
    playSound(allSounds[randomIndex]);
}
