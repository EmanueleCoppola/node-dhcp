import { optsMeta } from "../src/options";

const header = `/**
 * generated by script/generator.ts
 */`;

let code = "";

code += header;
code += "export interface IOptionsTxt {\n";
for (const k of Object.keys(optsMeta)) {
    const value = optsMeta[k];
    const name = value.config || value.attr;
    if (name === "smtpServer")
        continue;
    code += `  ${name}?: _${value.type};\n`;
}
code += "}\n\n";

code += header;
code += "export interface IOptionsId {\n";
for (const k of Object.keys(optsMeta)) {
    const value = optsMeta[k];
    code += `  ${k}?: _${value.type};\n`;
}
code += "}\n\n";

code += header;
code += "export class DHCPOptionsFnc {\n";
for (const k of Object.keys(optsMeta)) {
    const value = optsMeta[k];
    code += `  public ${k}?: ${value.type};\n`;
}
code += "}\n\n";

console.log(code);