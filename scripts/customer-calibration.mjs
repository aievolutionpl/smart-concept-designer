import {CUSTOMER_BOUNDARY,CUSTOMER} from '../src/customer-garden.js';
import {mkdir,writeFile} from 'node:fs/promises';
const width=27,depth=48,points=CUSTOMER_BOUNDARY.map(([x,z])=>[x*width/CUSTOMER.width,z*depth/CUSTOMER.depth]);
let area=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];area+=a[0]*b[1]-b[0]*a[1];}
const report={name:'Customer Garden',scale:'estimated',referenceEnvelopeMetres:{width,depth},boundaryAreaSquareMetres:Math.round(Math.abs(area)/2),basis:'User supplied estimate: 45-50 m long, 25-28 m wide, approximately 900-1100 m2. Boundary proportions traced from user sketch and aerial screenshot.',notes:['Building footprints and openings reconstructed visually, not surveyed.','Furniture remains at actual metric dimensions.','Photos are local; no photographs were uploaded to an external service.'],boundary:points};
await mkdir('../assets/customer-garden',{recursive:true});await writeFile('../assets/customer-garden/calibration.json',JSON.stringify(report,null,2));
globalThis.location=new URL('http://127.0.0.1/?project=customer-garden');
const {customerProject}=await import('../src/customer-project.js');
await writeFile('../assets/customer-garden/Customer_Garden.forma.json',JSON.stringify(customerProject,null,2));
console.log(JSON.stringify({area:report.boundaryAreaSquareMetres,width,depth}));
