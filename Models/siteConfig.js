const mongoose = require('mongoose')

const SiteconfigSchema = new mongoose.Schema({
    configName: {
        type: String
    },
    configMeta:{
        type: String,
        default: false,
    },
    configValue: {
        type: String
    }
});

module.exports = mongoose.model('Siteconfig', SiteconfigSchema);