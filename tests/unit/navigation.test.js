import test from 'node:test';
import assert from 'node:assert/strict';
import {legacyCatalogueTarget} from '../../src/navigation.js';
test('RP211 legacy Catalogue targets preserve paths/query while department journeys remain available',()=>{
 for(const [pathname,hash,expected] of [['/','#catalogue','/shop?category=Women'],['/catalogue','','/shop?category=Women'],['/catalogue/products/RP-W01','','/shop/products/RP-W01?category=Women'],['/shop/catalogue','','/shop?category=Women']])assert.equal(legacyCatalogueTarget({pathname,hash,search:'?category=Women'}),expected);
 assert.equal(legacyCatalogueTarget({pathname:'/',hash:'#women'}),null);assert.equal(legacyCatalogueTarget({pathname:'/shop'}),null);
});
