import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import{createHash}from'node:crypto';
// Rebuild supplied iPhone 18 Pro Max renders; originals are never modified.
// Usage: node scripts/prepare-iphone-18-images.mjs [/path/to/18_pro_max]
const root=process.argv[2] || '/home/wayne/Downloads/18_pro_max';
const out='src/assets/images/iphone/apple-18-pro-max';
const manifest=JSON.parse(await readFile(root+'/manifest-media.json','utf8'));
const sources=[];
await mkdir(out,{recursive:true});
for(const color of ['black','burgundy','silver'])for(const detail of [false,true]){
 const entry=manifest.find(e=>detail?e.path.startsWith(`images/product-page/product-viewer/color_${color}__`)&&e.path.endsWith('large_2x.jpg'):e.path===`images/pro-max-colors/iphone-18-pro-max-finish-select-${color}-202609.png`);
 if(!entry)throw Error('Missing manifest entry '+color);
 const input=await readFile(root+'/'+entry.path);
 const inputHash=createHash('sha256').update(input).digest('hex');
 if(entry.sha256!==inputHash)throw Error('Source checksum mismatch '+entry.path);
 const target=`${out}/${color}${detail?'-detail':''}.webp`;
 let pipeline=sharp(input);
 if(!detail)pipeline=pipeline.trim();
 const result=await pipeline.resize(detail?{width:1600,withoutEnlargement:true}:{height:1400,withoutEnlargement:true}).webp({quality:90}).toBuffer({resolveWithObject:true});
 await writeFile(target,result.data);
 sources.push({...entry,source_directory:root,workspace_path:target,processing:detail?'Resize to 1600px wide, WebP quality 90; supplied shared Pro / Pro Max camera detail. No recoloring.':'Trim transparent margins, resize to 1400px high, WebP quality 90; supplied Pro Max render. No recoloring.',output_width:result.info.width,output_height:result.info.height,output_bytes:result.data.length,output_sha256:createHash('sha256').update(result.data).digest('hex')});
 console.log(target,result.info.width,result.info.height,result.data.length);
}
await writeFile(out+'/sources.json',JSON.stringify(sources,null,2)+'\n');
