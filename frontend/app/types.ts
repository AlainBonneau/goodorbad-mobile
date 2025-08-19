export type CardType = 'good' | 'bad';


export type Card = {
id: string;
type: CardType;
text: string;
};


export type Session = {
id: string;
name: string;
draws: Card[];
finalPickIndex?: number;
};