var express = require('express');
const formidable = require('formidable');
var router = express.Router();

const mongoose = require('mongoose');
const {PDFDocument,rgb} =require('pdf-lib-plus-encrypt');
const {readFile,writeFile}=require('fs/promises');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const fs=require('fs');
const Patient=require('../models/Patient');


/* GET home page. */
router.post('/', function(req, res, next) {
  let historypdf=false;
  let id =new mongoose.Types.ObjectId();
let form = formidable();
const uploadFolder = `${__dirname}\\img`;
console.log('Upload Folder:');
console.log(uploadFolder);
form.uploadDir=uploadFolder;

var fileName;
form.parse(req,  async (err,fields,files)=>{

  console.log('parse');

  if (err) {
      console.log("Error parsing the files");
      return res.status(400).json({
          status: "Fail",
          message: "There was an error parsing the files",
          error: err,
      });
  }

  if (!files.firma.length) {
    const file =files.firma;
    const type = file.mimetype.split("/").pop();
    const isFileValid = (file) => {
        const validTypes = ["png"];
        if (validTypes.indexOf(type) === -1) {
            return false;
        }
        return true;
    };

    // checks if the file is valid
    const isValid = isFileValid(file);

    // creates a valid name by removing spaces
    fileName = `${id}.${type}`;

    if (!isValid) {
        // throes error if file isn't valid
        return res.status(400).json({
            status: "Fail",
            message: "The file type is not a valid type",
        });
    }
    try {
        // renames the file in the directory
        console.log('Renombrando el archivo');
        fs.renameSync(file.filepath, `${uploadFolder}${fileName}`);
    } catch (error) {
        console.log(error);
    }
  let providersGroup=parseInt(fields.providersGroup)==1?'Associate Medical Professionals':'Central Ohio Urology Group';
  let confirmWatchedVideos=parseInt(fields.confirmWatchedVideos)==1 ? true : false;
  let confirmPreviewConsent=parseInt(fields.confirmPreviewConsent)==1 ? true : false;
  let proceedGeneticTesting=parseInt(fields.proceedGeneticTesting)==1 ? true : false;
  let consentGeneticTesting=parseInt(fields.consentGeneticTesting)==1 ? true : false;
  let researchConsent=parseInt(fields.researchConsent)==1 ? true : false;
  let additionalResearchParticipation=parseInt(fields.additionalResearchParticipation)==1 ? true : false;
  let ageDiagnosed;
  if (parseInt(fields.ageDiagnosed)==1) {
    ageDiagnosed='Under 40';
  }
  if (parseInt(fields.ageDiagnosed)==2) {
    ageDiagnosed='40-50';
  }
  if (parseInt(fields.ageDiagnosed)==3) {
    ageDiagnosed='Older than 50';
  }
  let anyoneFamiliDiagnosed;
  if (parseInt(fields.anyoneFamiliDiagnosed)==1) {
    anyoneFamiliDiagnosed='Yes';
  }
  if (parseInt(fields.anyoneFamiliDiagnosed)==2) {
    anyoneFamiliDiagnosed='No';
  }
  if (parseInt(fields.anyoneFamiliDiagnosed)==3) {
    anyoneFamiliDiagnosed='Not Sure';
  }

let ancestries=fields.ancestries.split(',');
let priorGenetic;
switch (parseInt(fields.priorGenetic)) {
  case 1:
  priorGenetic='Yes';
    break;
  case 2:
  priorGenetic='Yes';
    break;
  case 3:
  priorGenetic='Unknown';
    break;
}
let cancerDiagnosed=fields.cancerDiagnosed!=''?fields.cancerDiagnosed.split(','):'';
let familyDiagnosed=fields.familyDiagnosed.split(',');
let grandParents=fields.grandParents!=''?JSON.parse(fields.grandParents):{};
let parents=fields.parents!=''?JSON.parse(fields.parents):{};
let auntUncle=fields.auntUncle!=''?JSON.parse(fields.auntUncle):{};
let siblings =fields.siblings!=''?JSON.parse(fields.siblings):{};
let cousins = fields.cousins!=''?JSON.parse(fields.cousins):{};
let children = fields.children!=''?JSON.parse(fields.children):{};
let nieceNephew = fields.nieceNephew!=''?JSON.parse(fields.nieceNephew):{};
let familyHistory=[grandParents,parents,auntUncle,siblings,cousins,children,nieceNephew];


  const newPatient=Patient({
    _id:id,
    patientName:fields.patientName,
    patientLastName:fields.patientLastName,
    patientEmail:fields.patientEmail,
    patientPhoneNumber:fields.patientPhoneNumber,
    patientDOB:fields.patientDOB,
    providersGroup:providersGroup,
    patientDoctor:fields.patientDoctor,
    confirmWatchedVideos:confirmWatchedVideos,
    videoRate:parseInt(fields.videoRate),
    confirmPreviewConsent:confirmPreviewConsent,
    proceedGeneticTesting:proceedGeneticTesting,
    consentGeneticTesting:consentGeneticTesting,
    researchConsent:researchConsent,
    additionalResearchParticipation:additionalResearchParticipation,
    ancestries:ancestries,
    priorGenetic:priorGenetic,
    cancerDiagnosed:cancerDiagnosed,
    ageDiagnosed:ageDiagnosed,
    anyoneFamiliDiagnosed:anyoneFamiliDiagnosed,
    familyDiagnosed:familyDiagnosed,
    grandParents:grandParents,
    parents:parents,
    auntUncle:auntUncle,
    siblings:siblings,
    cousins:cousins,
    children:children,
    nieceNephew:nieceNephew
  });
  newPatient.save().then((value)=>{
    // if (err) {
    //   console.log('Error Saving in database');
    //   return res.json({err,message:'Something wnet wrogn, please try again'});
    // }
    console.log(value);
    createPDF('pdf/genetic_informed_consent.pdf','pdf/survey_pdf_blanc.pdf',`pdf/geneticInformedConsent${id}.pdf`,proceedGeneticTesting,consentGeneticTesting,researchConsent,additionalResearchParticipation,fields.patientName,fields.patientLastName,fields.patientDOB,familyHistory,fields.patientDoctor,fields.ancestries,priorGenetic,cancerDiagnosed,ageDiagnosed,anyoneFamiliDiagnosed).then(function(){
  // Configurar el transporte de correo electrónico
  let transporter = nodemailer.createTransport({
    service: 'Outlook',
    auth: {
      user: 'jorge.rios.17@outlook.com', // tu dirección de correo electrónico
      pass: 'H4b1bt1.-' // tu contraseña de correo electrónico
    }
  });

  // Configurar los detalles del correo electrónico
  let mailOptions = {
    from: 'jorge.rios.17@outlook.com',
    to: 'rios.a.jorge.luis@gmail.com',
    subject: 'Genetic Informed Consent',
    text: 'Genetic Informed Consent',
    attachments: [
      {
        filename: 'geneticInformedConsent.pdf',
        content: fs.createReadStream(`pdf/geneticInformedConsent${id}.pdf`)
      },
      historypdf?{
        filename:'patientHistoryPDF.pdf',
        content:fs.createReadStream(`pdf/${id}History.pdf`)
      }:
      {

      }
    ]
  };

  // Enviar el correo electrónico
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Correo electrónico enviado: ' + info.response);
    }
  });

    });
    return res.json({err:false,message:'Patient info added to the database'});
  })



 }
});
  async function createPDF(input,input2,output,proceedGeneticTesting,consentGeneticTesting,researchConsent,additionalResearchParticipation,patientName,patientLastName,patientDOB,familyHistory,patientDoctor,patientAncestries,priorGenetic,cancerDiagnosed,ageDiagnosed,anyoneFamiliDiagnosed){
    try {
      // Cargar el Documendo PDF
      const pdfDoc=await PDFDocument.load(await readFile(input));
      const historyForm=await PDFDocument.load(await readFile(input2));
      const survey_pdf_blanc=await PDFDocument.load(await readFile('pdf/surveypdfblanc.pdf'));
      // Modificar el Documento PDF
      const pages = pdfDoc.getPages();
      const pageForm=pages[2];

      const form = pdfDoc.getForm()
      const checkBoxGeneticTestingYes = form.createCheckBox('some.checkBox.GTYes');
      const checkBoxGeneticTestingNo = form.createCheckBox('some.checkBox.GTNo');
      const checkBoxResearchConsentYes=form.createCheckBox('some.checkBox.RCYes');
      const checkBoxResearchConsentNo=form.createCheckBox('some.checkBox.RCNo');
      const checkBoxAdditionalResearchParticipationYes=form.createCheckBox('some.checkBox.ARPYes');
      const checkBoxAdditionalResearchParticipationNo=form.createCheckBox('some.checkBox.ARPNo');
      // Genetic Testing and Release of Information/Payment opcion Si
      if (proceedGeneticTesting) {
        checkBoxGeneticTestingYes.enableReadOnly();
        checkBoxGeneticTestingYes.addToPage(pageForm, {
          x: 35,
          y: 598,
          width: 10,
          height: 10,
        });

        // Seleccionar la opcion Si
        const checkBoxGTYes=form.getCheckBox('some.checkBox.GTYes');
        checkBoxGTYes.check();
      }else{

        // Genetic Testing and Release of Information/Payment opcion No
        checkBoxGeneticTestingNo.enableReadOnly();
        checkBoxGeneticTestingNo.addToPage(pageForm, {
          x: 35,
          y: 578,
          width: 10,
          height: 10,
        });
        // Seleccionar la opcion No
        const checkBoxGTNo=form.getCheckBox('some.checkBox.GTNo');
        checkBoxGTNo.check();
      }
      if (researchConsent) {

        // ResearchConsent Opcion si
        checkBoxResearchConsentYes.enableReadOnly();
        checkBoxResearchConsentYes.addToPage(pageForm,{
          x:35,
          y:487,
          width:10,
          height:10
        });
        // Seleccionar la opcion si
        const checkBoxRCYes=form.getCheckBox('some.checkBox.RCYes');
        checkBoxRCYes.check();
      }else{
        // ResearchConsent Opcion No
        checkBoxResearchConsentNo.enableReadOnly();
        checkBoxResearchConsentNo.addToPage(pageForm,{
          x:35,
          y:469,
          width:10,
          height:10
        });

        // Seleccionar la opcion no
        const checkBoxRCNo=form.getCheckBox('some.checkBox.RCNo');
        checkBoxRCNo.check();
      }

if (additionalResearchParticipation) {
  // Additional Research Participation Yes
  checkBoxAdditionalResearchParticipationYes.enableReadOnly();
  checkBoxAdditionalResearchParticipationYes.addToPage(pageForm,{
    x:35,
    y:325,
    width:10,
    height:10
  });
  // Seleccionar la opcion Si
  const checkBoxARPYes=form.getCheckBox('some.checkBox.ARPYes');
  checkBoxARPYes.check();
}else{
  // Additional Research Participation No
  checkBoxAdditionalResearchParticipationNo.enableReadOnly();
  checkBoxAdditionalResearchParticipationNo.addToPage(pageForm,{
    x:35,
    y:303,
    width:10,
    height:10
  })


  // Seleccionar la opcion No
  const checkBoxARPNo=form.getCheckBox('some.checkBox.ARPNo');
  checkBoxARPNo.check();
}


      // Textfield First Name
      const textFieldName = form.createTextField('text.name');
      textFieldName.setText(patientName);
      textFieldName.enableReadOnly();
      textFieldName.addToPage(pageForm,{
        x:35,
        y:240,
        whidth:100,
        height:15,
        borderWidth:0,
      });
      // TextField Last Name
      const textFieldLastName=form.createTextField('text.lastName');
      textFieldLastName.setText(patientLastName);
      textFieldLastName.enableReadOnly();
      textFieldLastName.addToPage(pageForm,{
        x:270,
        y:240,
        width:100,
        height:15,
        borderWidth:0
      });
      // TextFiel Date Of Birth
      const textFieldDOB=form.createTextField('text.dob');
      textFieldDOB.setText(patientDOB);
      textFieldDOB.enableReadOnly();
      textFieldDOB.addToPage(pageForm,{
        x:480,
        y:240,
        width:70,
        height:15,
        borderWidth:0
      });
      // TextField Date
      let today=new Date;
      var opciones = { year: 'numeric', month: 'numeric', day: 'numeric' };
      var formatDate = today.toLocaleDateString('en-US', opciones);
      const textFieldDate=form.createTextField('text.date');
      textFieldDate.setText(formatDate);
      textFieldDate.enableReadOnly();
      textFieldDate.addToPage(pageForm,{
        x:480,
        y:85,
        width:80,
        height:15,
        borderWidth:0
      });
      // Agregar la firma
      const firma=await pdfDoc.embedPng(fs.readFileSync(`${uploadFolder}${fileName}`));
      const firmaDims=firma.scale(0.4);
      pageForm.drawImage(firma,{
        x:120,
        y:65,
        width:firmaDims.width,
        height:firmaDims.height
      });
      fs.unlink(`${uploadFolder}${fileName}`,function(){
        console.log('Archivo Eliminado');
      });
      let relatives=['Grandparents','Parents','Aunt / Uncle','Siblings','Cousins','Children','Niece / Nephew'];
      let textFieldPatient,textFieldPatientDOB,textFieldPatientDoctor,textFieldPatientAncestries,textFieldPatientPrior,textFieldPatientTypeCancer,textFieldPatientAgeDiagnosed,textFieldPatientAnyoneFamilyDiagnosed,textFieldRelative,textFieldWho,textFieldSide,textFieldageDiagnose,textFieldAnyoneFamilyDiagnosed,textFieldDiedForCancer,textFieldAgeDeathCancer;
      let _who,specify,side,_type,age_diagnosed,died_for_cancer,age_death_cancer,anyone_family_diagnosed;
      let _historyFormPages=[];
      console.log(familyHistory);
      // const [blancPage]=await historyForm.copyPages(survey_pdf_blanc,[0]);
      let remove=[];
      let historyFormPages=historyForm.getPages();
      if(familyHistory.length>0){
      familyHistory.map(function(relative,index){
        console.log(relative);
        if (relative.who != 0) {
          let pageFormHistory=historyFormPages[index];
          _who=relatives[index];
          pageFormHistory.moveTo(85,90);
          pageFormHistory.drawText(formatDate,{size:12})

          pageFormHistory.moveTo(45,605);
          pageFormHistory.drawText(`${patientName} ${patientLastName}`,{size:12})
          pageFormHistory.moveTo(190,605);
          pageFormHistory.drawText(patientDOB,{size:12});
          pageFormHistory.moveTo(300,605);
          pageFormHistory.drawText(patientDoctor,{size:12});
          pageFormHistory.moveTo(450,605);
          pageFormHistory.drawText(patientAncestries,{size:12});
          pageFormHistory.moveTo(45,545);
          pageFormHistory.drawText(priorGenetic,{size:12});
          pageFormHistory.moveTo(190,545);
          pageFormHistory.drawText(cancerDiagnosed.toString(),{size:12});
          pageFormHistory.moveTo(300,545);
          pageFormHistory.drawText(ageDiagnosed,{size:12});
          pageFormHistory.moveTo(450,545);
          pageFormHistory.drawText(anyoneFamiliDiagnosed,{size:12});

          pageFormHistory.moveTo(45,475);
          pageFormHistory.drawText(_who,{size:12});
          switch (index) {

            case 0:
              if (relative.who==1) {
                specify='Grandmother';
              }else{
                specify='GrandParent';
              }
              break;
            case 1:
              if (relative.who==1) {
                specify='Mom';
              }else{
                specify='Dad';
              }
              break;
            case 2:
              if (relative.who==1) {
                specify='Aunt';
              }else{
                specify='Uncle';
              }
              break;
            case 3:
              if (relative.who==1) {
                specify='Brother';
              }else{
                specify='Sister';
              }
              break;
            case 4:
            specify=''
              break;
            case 5:
            specify=''
              break;
              case 6:
              if (relative.who==1) {
                specify='Niece';
              }else{
                specify='Nephew';
              }
              break;
            default:

          }
          pageFormHistory.moveTo(200,475);
          pageFormHistory.drawText(specify,{size:12});

          side='N/A';
          if (relative.side==1) {
            side='Mother\'s side';
          }else if (relative.side==2) {
            side='Father\'s side';
          }
          pageFormHistory.moveTo(320,475);
          pageFormHistory.drawText(side,{size:12});

          switch (relative.type) {
            case '1':
              _type='Breast cancer';
              break;
            case '2':
              _type='Colon cancer';
              break;
            case '3':
              _type='Gastric cancer';
              break;
            case '4':
              _type='Melanoma (Skin) cancer';
              break;
            case '5':
              _type='Pancreatic cancer';
              break;
            case '6':
              _type='Peritonial cancer';
              break;
            case '7':
              _type='Prostate cancer';
              break;
            case '8':
              _type='Rectal cancer';
              break;
            default:
            _type='';
          }
          if (relative.otherType!=''){
            _type=relative.otherType;
          }
          pageFormHistory.moveTo(450,475);
          pageFormHistory.drawText(_type,{size:12});

          switch (relative.ageDiagnosed) {
            case '1':
              age_diagnosed='Under 40';
              break;
            case '2':
              age_diagnosed='40-50';
              break;
            case '3':
              age_diagnosed='Older 50';
              break;
            default:
            age_diagnosed='';
          }
          pageFormHistory.moveTo(45,410);
          pageFormHistory.drawText(age_diagnosed,{size:12});

          switch (relative.diedForCancer) {
            case '1':
              died_for_cancer='Yes';
              break;
            case '2':
              died_for_cancer='No';
              age_death_cancer='N/A';
              break;
            case '3':
              died_for_cancer='Not Sure';
              age_death_cancer='N/A';
              break;
            default:
            died_for_cancer='';
          }
          pageFormHistory.moveTo(200,410);
          pageFormHistory.drawText(died_for_cancer,{size:12});

          switch (relative.ageDeathCancer) {
            case '1':
              age_death_cancer='Less than 50';
              break;
            case '2':
              age_death_cancer='50-70';
              break;
            case '3':
              age_death_cancer='Over 70';
              break;
            default:
            age_death_cancer='N/A';

          }
          pageFormHistory.moveTo(320,410);
          pageFormHistory.drawText(age_death_cancer,{size:12});

          switch (relative.anyoneFamilyDiagnosed) {
            case '1':
              anyone_family_diagnosed='Yes';
              break;
            case '2':
              anyone_family_diagnosed='No';
              break;
            default:
            anyone_family_diagnosed='';
          }
          pageFormHistory.moveTo(450,410);
          pageFormHistory.drawText(anyone_family_diagnosed,{size:12});
        }else{
          remove.push(index);
        }
      });
      remove.reverse();
      remove.forEach((pageIndex, i) => {
        historyForm.removePage(pageIndex);
      });
      historypdf=true;
    }

      // _historyFormPages.forEach((pagina, i) => {
      //   historyForm.insertPage(i,pagina);
      // });
      // Encryptando el documento
      let password ='1351Barclay!';
      pdfDoc.encrypt({
        userPassword: password,
        ownerPassword: password,
        permissions: {
          print: 'highResolution',
          copy: false,
          modify: false,
          annotate: false,
          formFill: false,
          accessibility: false,
          extract: false,
          assemble: false,
          printHighRes: true,
        },
      });
      historyForm.encrypt({
        userPassword: password,
        ownerPassword: password,
        permissions: {
          print: 'highResolution',
          copy: false,
          modify: false,
          annotate: false,
          formFill: false,
          accessibility: false,
          extract: false,
          assemble: false,
          printHighRes: true,
        },
      });
      // Guardar el documento
      const pdfBytes=await pdfDoc.save();
      const historyFormBytes=await historyForm.save();
      await writeFile(output,pdfBytes);
      await writeFile(`pdf/${id}History.pdf`,historyFormBytes);
    } catch (e) {
      console.log('Error generating PDF');
      console.log(e);
      return res.json({error:true,e})
    } finally {

    }
  }
});

module.exports = router;
