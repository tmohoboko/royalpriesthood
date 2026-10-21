import fs from 'node:fs';
import assert from 'node:assert/strict';
import {products,categories} from '../src/data.js';
assert.equal(products.length,16);
for(const category of ['Men','Women','T-Shirts','Pants','Shoes','Hats']){assert.ok(categories.includes(category));assert.ok(products.some(p=>p.tags.includes(category)));}
for(const item of products){assert.ok(fs.statSync('public'+item.image).size>0);for(const width of [480,960,1600])assert.ok(fs.statSync('public'+item.image.replace('/catalog/','/catalog/web/').replace('.png',`-${width}.webp`)).size>0);}
console.log('PASS: current catalogue, categories, originals and responsive images');
