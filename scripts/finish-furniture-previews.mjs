import sharp from 'sharp';
for(const id of ['dining-table','garden-chair','coffee-table','planter'])await sharp(`test-results/${id}.png`).webp({quality:88}).toFile(`public/images/${id}.webp`);
console.log('Furniture previews ready');
