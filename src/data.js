const CATALOG = '/images/catalog/';

const product = (id, name, image, department, tags, tone = 'Black / Gold') => ({
  id,
  name,
  image: `${CATALOG}${image}`,
  department,
  tags,
  tone,
});

export const categories = ['All', 'Women', 'Men', 'T-Shirts', 'Pants', 'Shoes', 'Hats', 'Accessories'];

export const products = [
  product('RP-W01', 'Women\'s Black Statement', '01_Women_Black_Statement.png', 'Women', ['Women', 'T-Shirts', 'Pants', 'Shoes', 'Hats']),
  product('RP-W02', 'Women\'s White Minimal', '02_Women_White_Minimal.png', 'Women', ['Women', 'T-Shirts', 'Pants', 'Shoes'], 'White / Gold'),
  product('RP-W03', 'Women\'s Gold Crest', '03_Women_Gold_Crest.png', 'Women', ['Women', 'T-Shirts', 'Pants', 'Shoes']),
  product('RP-W04', 'Women\'s Weekend', '04_Women_Weekend.png', 'Women', ['Women', 'T-Shirts', 'Pants', 'Shoes', 'Hats']),
  product('RP-M01', 'Men\'s Black Statement', '05_Men_Black_Statement.png', 'Men', ['Men', 'T-Shirts', 'Pants', 'Shoes', 'Hats']),
  product('RP-M02', 'Men\'s White Minimal', '06_Men_White_Minimal.png', 'Men', ['Men', 'T-Shirts', 'Pants', 'Shoes'], 'White / Gold'),
  product('RP-M03', 'Men\'s Gold Crest', '07_Men_Gold_Crest.png', 'Men', ['Men', 'T-Shirts', 'Pants', 'Shoes']),
  product('RP-M04', 'Men\'s Weekend', '08_Men_Weekend.png', 'Men', ['Men', 'T-Shirts', 'Pants', 'Shoes', 'Hats']),
  product('RP-T01', 'Black Signature Tee — Front', '09_Tshirt_Front_Black.png', 'T-Shirts', ['Women', 'Men', 'T-Shirts']),
  product('RP-T02', 'Black Signature Tee — Back', '10_Tshirt_Back_Black.png', 'T-Shirts', ['Women', 'Men', 'T-Shirts']),
  product('RP-T03', 'White Signature Tee — Front', '11_Tshirt_Front_White.png', 'T-Shirts', ['Women', 'Men', 'T-Shirts'], 'White / Black'),
  product('RP-T04', 'White Signature Tee — Back', '12_Tshirt_Back_White.png', 'T-Shirts', ['Women', 'Men', 'T-Shirts'], 'White / Black'),
  product('RP-A01', 'Royal Carry Collection', '15_Bag_Collection.png', 'Accessories', ['Women', 'Men']),
  product('RP-H01', 'Crown Headwear Collection', '16_Cap_Collection.png', 'Hats', ['Women', 'Men', 'Hats'], 'Black / White / Gold'),
  product('RP-M05', 'Men\'s Complete Wardrobe', '17_Bonus_Men_Lookbook.png', 'Men', ['Men', 'T-Shirts', 'Pants', 'Shoes', 'Hats']),
  product('RP-W05', 'Women\'s Complete Wardrobe', '18_Bonus_Women_Lookbook.png', 'Women', ['Women', 'T-Shirts', 'Pants', 'Shoes', 'Hats']),
];

export const stories = {
  women: {
    eyebrow: 'THE WOMEN\'S EDIT',
    title: 'Grace,\nwith presence.',
    body: 'Crisp monochrome styling, relaxed tailoring and the Royal Priesthood mark — designed as a complete wardrobe rather than a single tee.',
    images: [`${CATALOG}01_Women_Black_Statement.png`, `${CATALOG}04_Women_Weekend.png`],
  },
  men: {
    eyebrow: 'THE MEN\'S EDIT',
    title: 'Quiet power.\nClear identity.',
    body: 'Statement graphics meet everyday black, white and gold. Build the look with tees, trousers, footwear, headwear and carry pieces.',
    images: [`${CATALOG}05_Men_Black_Statement.png`, `${CATALOG}08_Men_Weekend.png`],
  },
};

export const craft = [
  { image: `${CATALOG}13_Size_Tag_Detail.png`, title: 'The inside mark', copy: 'A branded size detail that carries the identity beyond the visible graphic.' },
  { image: `${CATALOG}14_Logo_Embroidery_Detail.png`, title: 'Built in thread', copy: 'Embroidery and finishing details bring depth to the black, ivory and crown-gold palette.' },
];
