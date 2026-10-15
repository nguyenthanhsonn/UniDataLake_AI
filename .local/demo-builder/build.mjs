import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
const root = 'D:/Caps1/UniDataLake_AI';
const out = `${root}/data/standardization/live-demo`;
await fs.mkdir(out, {recursive:true});
const cases = JSON.parse(await fs.readFile(`${root}/data/standardization/s2/examples.json`, 'utf8'));
const specs = [
 ['01-admissions','admissions-flat',{}],
 ['02-academic','academic-flat',{}],
 ['03-hr','hr-flat',{}],
 ['04-bad-date','academic-flat',{tu:'31/02/2026'}],
 ['05-unknown-id','hr-flat',{id:'999'}],
 ['06-hr-updated','hr-flat',{ten:'Giảng viên giả lập cập nhật'}],
];
for (const [name,id,changes] of specs) {
 const c=cases.find(x=>x.id===id);
 const row={...c.records[0],...changes};
 const values=[Object.keys(row),Object.values(row)];
 const wb=Workbook.create(); const sh=wb.worksheets.add('Data');
 sh.showGridLines=false;
 const range=sh.getRangeByIndexes(0,0,2,values[0].length);
 range.setNumberFormat('@'); range.values=values;
 range.format.font={name:'Arial',size:11};
 range.format.columnWidth=22;
 sh.getRangeByIndexes(0,0,1,values[0].length).format={fill:'#203864',font:{bold:true,color:'#FFFFFF'}};
 if (row.ten) sh.getRange('C1:C2').format.columnWidth=38;
 wb.recalculate();
 await (await SpreadsheetFile.exportXlsx(wb)).save(`${out}/${name}.xlsx`);
 const csv=values.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n';
 await fs.writeFile(`${out}/${name}.csv`,csv,'utf8');
 console.log((await wb.inspect({kind:'region',sheetId:'Data',range:`A1:${String.fromCharCode(64+values[0].length)}2`,maxChars:1200})).ndjson);
 {
  const png=await wb.render({sheetName:'Data',range:'A1:F2',scale:1,format:'png'});
  await fs.writeFile(`${root}/.local/demo-builder/${name}.png`,new Uint8Array(await png.arrayBuffer()));
 }
}
