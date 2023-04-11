const mongoose = require('mongoose');

const patientSchema=mongoose.Schema({
  patientName:String,
  patientLastName:String,
  patientEmail:String,
  patientPhoneNumber:String,
  patientDOB:String,
  providersGroup:String,
  patientDoctor:String,
  confirmWatchedVideos:Boolean,
  videoRate:Number,
  confirmPreviewConsent:Boolean,
  proceedGeneticTesting:Boolean,
  consentGeneticTesting:Boolean,
  researchConsent:Boolean,
  additionalResearchParticipation:Boolean,
  ancestries:[],
  priorGenetic:String,
  cancerDiagnosed:[],
  ageDiagnosed:String,
  anyoneFamiliDiagnosed:String,
  familyDiagnosed:[],
  grandParents:{},
  parents:{},
  auntUncle:{},
  siblings:{},
  cousins:{},
  children:{},
  nieceNephew:{}
});
module.exports=mongoose.model('patient',patientSchema);
