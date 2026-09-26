export const isPremiumProject=new URLSearchParams(location.search).get('project')==='customer-garden-premium';
export const isCustomerProject=isPremiumProject||new URLSearchParams(location.search).get('project')==='customer-garden';
export const storageKey=isPremiumProject?'forma-customer-garden-premium':isCustomerProject?'forma-customer-garden':'forma-project';
export const customerProject={version:1,name:'Customer Garden',environment:'customer',width:27,depth:48,time:16,grid:false,snap:false,
 layers:{buildings:true,planting:true,boundary:true},
 instances:[
  {id:'customer-sofa',assetId:'nomad-sofa',x:-7.5,z:.8,rotation:180,scale:1},
  {id:'customer-coffee',assetId:'coffee-table',x:-7.5,z:-.55,rotation:0,scale:1},
  {id:'customer-table',assetId:'dining-table',x:8.7,z:-2.1,rotation:0,scale:1},
  {id:'customer-chair-1',assetId:'garden-chair',x:8.7,z:-3.12,rotation:0,scale:1},
  {id:'customer-chair-2',assetId:'garden-chair',x:8.7,z:-1.08,rotation:180,scale:1},
  {id:'customer-chair-3',assetId:'garden-chair',x:7.68,z:-2.1,rotation:90,scale:1},
  {id:'customer-chair-4',assetId:'garden-chair',x:9.72,z:-2.1,rotation:-90,scale:1},
  {id:'customer-pot-1',assetId:'planter',x:-9.05,z:.8,rotation:0,scale:1},
  {id:'customer-pot-2',assetId:'planter',x:6.6,z:-7.5,rotation:0,scale:1}
 ]};
if(isPremiumProject){
 Object.assign(customerProject,{name:'Customer Garden Premium',time:17.5,landscapeVersion:1,weather:{clouds:15,direction:35,lamps:'auto',lampPower:1,quality:'balanced'}});
 customerProject.instances=[
  ['sectional','premium-sectional',-7,.1,180],['table','premium-table',-7,-1,0],
  ['stool-1','premium-stool',-6,-2,0],['stool-2','premium-stool',-7,-2,0],['stool-3','premium-stool',-8,-2,0],
  ['lounger-1','premium-lounger',7.3,-5,0],['lounger-2','premium-lounger',9,-5,0],
  ['sauna','cube-plus',-.8,-13,0],['tub','premium-tub',8.2,-8.9,0],
  ['pot-1','planter',6.3,-5,0],['pot-2','planter',-9.2,-1,0]
 ].map(([id,assetId,x,z,rotation])=>({id:'premium-'+id,assetId,x,z,rotation,scale:1}));
}
