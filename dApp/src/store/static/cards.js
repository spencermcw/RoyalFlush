export const suits = {
    CLUBS: "CLUBS",
    DIAMONDS: "DIAMONDS",
    HEARTS: "HEARTS",
    SPADES: "SPADES",
    WILD: "WILD"
}

export const values = {
    TEN: "TEN",
    JACK: "JACK",
    QUEEN: "QUEEN",
    KING: "KING",
    ACE: "ACE",
    WILD: "WILD"
}

export const allCards = [{
    value: values.TEN,
    suit: suits.CLUBS,
    classes: "bi-suit-club-fill",
    tokenId: 0,
}, {
    value: values.JACK,
    suit: suits.CLUBS,
    classes: "bi-suit-club-fill",
    tokenId: 1,
}, {
    value: values.QUEEN,
    suit: suits.CLUBS,
    classes: "bi-suit-club-fill",
    tokenId: 2,
}, {
    value: values.KING,
    suit: suits.CLUBS,
    classes: "bi-suit-club-fill",
    tokenId: 3,
}, {
    value: values.ACE,
    suit: suits.CLUBS,
    classes: "bi-suit-club-fill",
    tokenId: 4,
},
// DIAMONDS
{
    value: values.TEN,
    suit: suits.DIAMONDS,
    classes: "bi-suit-diamond-fill text-red",
    tokenId: 5,
}, {
    value: values.JACK,
    suit: suits.DIAMONDS,
    classes: "bi-suit-diamond-fill text-red",
    tokenId: 6,
}, {
    value: values.QUEEN,
    suit: suits.DIAMONDS,
    classes: "bi-suit-diamond-fill text-red",
    tokenId: 7,
}, {
    value: values.KING,
    suit: suits.DIAMONDS,
    classes: "bi-suit-diamond-fill text-red",
    tokenId: 8,
}, {
    value: values.ACE,
    suit: suits.DIAMONDS,
    classes: "bi-suit-diamond-fill text-red",
    tokenId: 9,
},
// HEARTS
{
    value: values.TEN,
    suit: suits.HEARTS,
    classes: "bi-suit-heart-fill text-red",
    tokenId: 10,
}, {
    value: values.JACK,
    suit: suits.HEARTS,
    classes: "bi-suit-heart-fill text-red",
    tokenId: 11,
}, {
    value: values.QUEEN,
    suit: suits.HEARTS,
    classes: "bi-suit-heart-fill text-red",
    tokenId: 12,
}, {
    value: values.KING,
    suit: suits.HEARTS,
    classes: "bi-suit-heart-fill text-red",
    tokenId: 13,
}, {
    value: values.ACE,
    suit: suits.HEARTS,
    classes: "bi-suit-heart-fill text-red",
    tokenId: 14,
},
// SPADES
{
    value: values.TEN,
    suit: suits.SPADES,
    classes: "bi-suit-spade-fill",
    tokenId: 15,
}, {
    value: values.JACK,
    suit: suits.SPADES,
    classes: "bi-suit-spade-fill",
    tokenId: 16,
}, {
    value: values.QUEEN,
    suit: suits.SPADES,
    classes: "bi-suit-spade-fill",
    tokenId: 17,
}, {
    value: values.KING,
    suit: suits.SPADES,
    classes: "bi-suit-spade-fill",
    tokenId: 18,
}, {
    value: values.ACE,
    suit: suits.SPADES,
    classes: "bi-suit-spade-fill",
    tokenId: 19,
},
// WILD
{
    value: values.WILD,
    suit: suits.WILD,
    classes: "",
    tokenId: 20,
}]

export const orderBySuit = () => [ ...allCards ].sort((a, b) => a.tokenId - b.tokenId)

export const splitBySuit = () => {
    const cards = [ ...allCards ]
    return [
        cards.slice(0,5),
        cards.slice(5,10),
        cards.slice(10,15),
        cards.slice(15,20),
        cards.slice(20, 21)
    ]
}

export const filterBySuit = (suit) => (allCards.filter(c => c.suit === suit))

export const biClassForSuit = (suit) => ({
        [suits.CLUBS]: "bi-suit-club-fill",
        [suits.DIAMONDS]: "bi-suit-diamond-fill text-red",
        [suits.HEARTS]: "bi-suit-heart-fill text-red",
        [suits.SPADES]: "bi-suit-spade-fill",
        [suits.WILD]: ""
    }[suit])

export const indexForSuit = (suit) => ([
        suits.CLUBS,
        suits.DIAMONDS,
        suits.HEARTS,
        suits.SPADES,
        suits.WILD,
    ].indexOf(suit))

export const suitForIndex = (index) => {
    return Object.values(suits)[index]
}

export const biClassForSuitIndex = (index) => biClassForSuit(suitForIndex(index));

export const cardForId = (id) => allCards.find(card => card.tokenId === Number(id))

