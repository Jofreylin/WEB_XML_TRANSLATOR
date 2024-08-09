import { Component } from '@angular/core';
import * as xmljs from 'xml-js';
import { create } from 'xmlbuilder2';

@Component({
  selector: 'app-unifier',
  templateUrl: './unifier.component.html',
  styleUrl: './unifier.component.css'
})
export class UnifierComponent {

  xmlInput1: string | ArrayBuffer | null = null;
  xmlInput2: string | ArrayBuffer | null = null;
  xmlOutput: string | ArrayBuffer | null = null;

  constructor() {


    const xmlString1 = `
    <?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en" datatype="plaintext" original="ng2.template">
    <body>
      <trans-unit id="1060999950293472159" datatype="html">
      <source>Holding Years <x id="START_TAG_SPAN" ctype="x-span" equiv-text="&lt;span class=&quot;text-danger&quot;&gt;"/>*<x id="CLOSE_TAG_SPAN" ctype="x-span" equiv-text="&lt;/span&gt;"/></source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/pages/calculator/calculator.component.html</context>
          <context context-type="linenumber">24,25</context>
        </context-group>
          </trans-unit>
    </body>
  </file>
</xliff>
    `;



  }

  onFileChange(event: any, fileType: number) {


    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {

      if (fileType === 1) {
        this.xmlInput1 = reader.result;
      } else if (fileType === 2) {
        this.xmlInput2 = reader.result;
      }

    };

    reader.readAsText(file);
  }

  doJob() {
    this.xmlOutput = this.copyTargetFromOtherFile(this.xmlInput1 as string, this.xmlInput2 as string);
  }

  private copySourceToTarget(xmlString: string): string {
    const options = { compact: true, spaces: 2 };
    const parsedXml = xmljs.xml2js(xmlString, options) as any;
    const transUnits = parsedXml.xliff.file.body['trans-unit'];

    for (const transUnit of transUnits) {
      const source = transUnit.source;
      let target = transUnit.target;

      if (source) {
        if (!target) {
          transUnit.target = source;
        }

      }
    }

    const newXmlString = xmljs.js2xml(parsedXml, options);
    return newXmlString;
  }

  private copyTargetFromOtherFile(xmlString1: string, xmlString2: string): string {
    const file1_parsedXml = create(xmlString1).toObject() as any;
    const file2_parsedXml = create(xmlString2).toObject() as any;

    const sourceToTargetMap: { [key: string]: any } = {};

    try {

      // Step 2: Automate the Verification and Update Process
      const transUnits = file1_parsedXml.xliff.file.body['trans-unit'];

      if (Array.isArray(transUnits)) {
        transUnits.forEach((unit: any) => {
          if (unit.source && unit.target) {
            sourceToTargetMap[JSON.stringify(unit.source)] = unit.target;
          }
        });
      } else {
        if (transUnits.source && transUnits.target) {
          sourceToTargetMap[JSON.stringify(transUnits.source)] = transUnits.target;
        }
      }

      const transUnitsTa = file2_parsedXml.xliff.file.body['trans-unit'];

      if (Array.isArray(transUnitsTa)) {
        transUnitsTa.forEach((unit: any) => {

          if (unit.source && sourceToTargetMap[JSON.stringify(unit.source)]) {
            unit.target = sourceToTargetMap[JSON.stringify(unit.source)];
          } else if (unit.source && !sourceToTargetMap[JSON.stringify(unit.source)]) {
            const source = unit.source;
            unit.target = source;
          }

        });
      } else {
        if (transUnitsTa.source && sourceToTargetMap[JSON.stringify(transUnitsTa.source)]) {
          transUnitsTa.target = sourceToTargetMap[JSON.stringify(transUnitsTa.source)];
        } else if (transUnitsTa.source && !sourceToTargetMap[JSON.stringify(transUnitsTa.source)]) {
          const source = transUnitsTa.source;
          transUnitsTa.target = source;
        }
      }

    } catch (e) {
      console.error('Error processing file:', e);
      alert('Error processing file:');
    }

    // Step 3: Convert the Updated JSON Object Back to XML
    const newXmlString = create(file2_parsedXml).end({ prettyPrint: true });;
    return newXmlString;


  }


  downloadFile() {

    const data: string = this.xmlOutput as string;
    const fileExtension = 'xlf';
    const filename = `unified.${fileExtension}`


    try {
      const blob = new Blob([data], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } finally {
    }

  }

  clearInput() {
    this.xmlInput1 = null;
    this.xmlInput2 = null;
    this.xmlOutput = null;
  }


}
